
package com.carmovo.service;

import com.carmovo.model.Alquiler;
import com.carmovo.repository.AlquilerRepositorio;
import com.carmovo.dto.AlquilerDTO;
import com.carmovo.dto.AlquilerGuardarDTO;
import com.carmovo.dto.UsuarioDTO;
import com.carmovo.dto.VehiculoDTO;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Service
public class AlquilerServicio {

    private static final Set<String> ESTADOS_VALIDOS = Set.of(
            "Pendiente", "Confirmado", "En curso", "Finalizado", "Cancelado"
    );

    private static final List<String> ESTADOS_QUE_BLOQUEAN = List.of(
            "Pendiente", "Confirmado", "En curso"
    );

    private static final BigDecimal SEGURO_FIJO = new BigDecimal("120.00");
    private static final BigDecimal IGV = new BigDecimal("0.18");
    /** Costo del servicio con chofer por día. */
    public static final BigDecimal CHOFER_DIA = new BigDecimal("80.00");
    /** Estados del vehículo que impiden alquilarlo. */
    private static final Set<String> ESTADOS_NO_ALQUILABLES = Set.of("mantenimiento", "inactivo", "fuera de servicio");

    /** Desglose del precio de un alquiler (calculado siempre por el servidor). */
    public record Cotizacion(long dias, BigDecimal precioDia, BigDecimal tarifaBase, BigDecimal chofer,
                             BigDecimal seguro, BigDecimal igv, BigDecimal total,
                             int descuento, BigDecimal precioRegular) {}

    private final AlquilerRepositorio alquilerRepositorio;
    private final UsuarioServicio usuarioServicio;
    private final VehiculoServicio vehiculoServicio;
    private final ApplicationEventPublisher eventos;

    private final com.carmovo.repository.PortalOfertaRepositorio ofertas;

    public AlquilerServicio(
            AlquilerRepositorio alquilerRepositorio,
            UsuarioServicio usuarioServicio,
            VehiculoServicio vehiculoServicio,
            ApplicationEventPublisher eventos,
            com.carmovo.repository.PortalOfertaRepositorio ofertas
    ) {
        this.eventos = eventos;
        this.ofertas = ofertas;
        this.alquilerRepositorio = alquilerRepositorio;
        this.usuarioServicio = usuarioServicio;
        this.vehiculoServicio = vehiculoServicio;
    }

    @Transactional(readOnly = true)
    public List<AlquilerDTO> obtenerTodos() {
        return alquilerRepositorio.findAll().stream()
                .map(this::convertirADto)
                .toList();
    }

    @Transactional(readOnly = true)
    public AlquilerDTO obtenerPorId(Long id) {
        return convertirADto(buscarAlquiler(id));
    }

    @Transactional(readOnly = true)
    public Optional<AlquilerDTO> obtenerUltimoPorUsuario(Long idUsuario) {
        return alquilerRepositorio
                .findFirstByIdUsuarioOrderByFechaRegistroDesc(idUsuario)
                .map(this::convertirADto);
    }

    @Transactional(readOnly = true)
    public List<AlquilerDTO> obtenerPorUsuario(Long idUsuario) {
        return alquilerRepositorio
                .findByIdUsuarioOrderByFechaRegistroDesc(idUsuario)
                .stream()
                .map(this::convertirADto)
                .toList();
    }

    /**
     * Calcula el precio de un alquiler y verifica que el vehículo se pueda alquilar en esas fechas.
     * Lo usa la pasarela de pago para cobrar exactamente lo que el servidor calcula.
     */
    @Transactional(readOnly = true)
    public Cotizacion cotizar(Long idVehiculo, LocalDate inicio, LocalDate fin, boolean conChofer) {
        if (idVehiculo == null || inicio == null || fin == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona el vehículo y las fechas.");
        }
        if (fin.isBefore(inicio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha de entrega no puede ser anterior a la fecha de recogida.");
        }
        if (inicio.isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de recogida no puede estar en el pasado.");
        }
        VehiculoDTO vehiculo = vehiculoServicio.obtenerPorId(idVehiculo);
        validarVehiculoAlquilable(vehiculo, fin);
        validarDisponibilidad(idVehiculo, inicio, fin, null, "Pendiente");
        if (conChofer && buscarChoferLibre(vehiculo.getCategoria(), inicio, fin, null).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, SIN_CHOFER);
        }
        return calcular(vehiculo.getPrecioDia(), descuentoVigente(idVehiculo, inicio), inicio, fin, conChofer);
    }

    /**
     * Descuento (%) de la oferta del Portal web que aplica al vehículo.
     * Aplica cuando la fecha de recogida cae dentro de la vigencia de una oferta visible.
     * Si hay varias, se usa la de mayor descuento.
     */
    @Transactional(readOnly = true)
    public int descuentoVigente(Long idVehiculo, LocalDate inicio) {
        if (ofertas == null || idVehiculo == null || inicio == null) return 0;
        return ofertas.findByIdVehiculoAndVisibleTrueAndInicioLessThanEqualAndFinGreaterThanEqual(idVehiculo, inicio, inicio)
                .stream().mapToInt(o -> o.getDescuento() == null ? 0 : o.getDescuento()).max().orElse(0);
    }

    public static Cotizacion calcular(BigDecimal precioDia, LocalDate inicio, LocalDate fin, boolean conChofer) {
        return calcular(precioDia, 0, inicio, fin, conChofer);
    }

    public static Cotizacion calcular(BigDecimal precioRegular, int descuento, LocalDate inicio, LocalDate fin, boolean conChofer) {
        int pct = Math.max(0, Math.min(70, descuento));
        BigDecimal precioDia = precioRegular.multiply(BigDecimal.valueOf(100 - pct))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        long dias = Math.max(1, ChronoUnit.DAYS.between(inicio, fin));
        BigDecimal base = precioDia.multiply(BigDecimal.valueOf(dias)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal chofer = conChofer
                ? CHOFER_DIA.multiply(BigDecimal.valueOf(dias)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2);
        BigDecimal igv = base.add(chofer).multiply(IGV).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = base.add(chofer).add(SEGURO_FIJO).add(igv).setScale(2, RoundingMode.HALF_UP);
        return new Cotizacion(dias, precioDia, base, chofer, SEGURO_FIJO, igv, total, pct, precioRegular);
    }

    /** Un vehículo en taller, inactivo o con SOAT / revisión técnica vencidos no se alquila. */
    private void validarVehiculoAlquilable(VehiculoDTO vehiculo, LocalDate fin) {
        String estado = vehiculo.getEstado() == null ? "" : vehiculo.getEstado().trim().toLowerCase(Locale.ROOT);
        if (ESTADOS_NO_ALQUILABLES.contains(estado)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este vehículo no está disponible por el momento (" + vehiculo.getEstado() + ").");
        }
        if (vehiculo.getVencimientoSoat() != null && vehiculo.getVencimientoSoat().isBefore(fin)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este vehículo no está disponible para esas fechas (SOAT por renovar).");
        }
        if (vehiculo.getVencimientoRevision() != null && vehiculo.getVencimientoRevision().isBefore(fin)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este vehículo no está disponible para esas fechas (revisión técnica por renovar).");
        }
    }

    @Transactional
    public AlquilerDTO crear(AlquilerGuardarDTO dto) {
        validar(dto, null);

        UsuarioDTO usuario = usuarioServicio.obtenerPorId(dto.getIdUsuario());
        VehiculoDTO vehiculo = vehiculoServicio.obtenerPorId(dto.getIdVehiculo());

        validarCliente(usuario);

        String estado = normalizarEstado(dto.getEstado());

        if (ESTADOS_QUE_BLOQUEAN.contains(estado)) {
            validarVehiculoAlquilable(vehiculo, dto.getFechaFin());
        }

        validarDisponibilidad(
                dto.getIdVehiculo(),
                dto.getFechaInicio(),
                dto.getFechaFin(),
                null,
                estado
        );

        Alquiler alquiler = new Alquiler();
        mapear(alquiler, dto, estado, vehiculo);
        asignarChoferAutomatico(alquiler, vehiculo, null);

        Alquiler guardado = alquilerRepositorio.save(alquiler);

        sincronizarEstadoVehiculo(vehiculo, estado);

        return convertirADto(guardado);
    }

    @Transactional
    public AlquilerDTO actualizar(Long id, AlquilerGuardarDTO dto) {
        Alquiler alquiler = buscarAlquiler(id);

        validar(dto, id);

        UsuarioDTO usuario = usuarioServicio.obtenerPorId(dto.getIdUsuario());
        VehiculoDTO vehiculo = vehiculoServicio.obtenerPorId(dto.getIdVehiculo());

        validarCliente(usuario);

        String estadoAnterior = alquiler.getEstado();
        Long vehiculoAnteriorId = alquiler.getIdVehiculo();
        String estadoNuevo = normalizarEstado(dto.getEstado());

        validarDisponibilidad(
                dto.getIdVehiculo(),
                dto.getFechaInicio(),
                dto.getFechaFin(),
                id,
                estadoNuevo
        );

        mapear(alquiler, dto, estadoNuevo, vehiculo);
        asignarChoferAutomatico(alquiler, vehiculo, id);

        Alquiler actualizado = alquilerRepositorio.save(alquiler);

        if (!vehiculoAnteriorId.equals(dto.getIdVehiculo())) {
            try {
                VehiculoDTO anterior =
                        vehiculoServicio.obtenerPorId(vehiculoAnteriorId);

                liberarVehiculoSiCorresponde(anterior, estadoAnterior);

            } catch (RuntimeException ignored) {
                // Conservamos el comportamiento existente:
                // no interrumpir si el vehículo anterior ya no existe.
            }
        }

        sincronizarEstadoVehiculo(vehiculo, estadoNuevo);

        if ("Cancelado".equals(estadoNuevo) && !"Cancelado".equals(estadoAnterior)) {
            eventos.publishEvent(new AlquilerCanceladoEvento(id, "Alquiler cancelado desde el panel."));
        }

        return convertirADto(actualizado);
    }

    @Transactional
    public AlquilerDTO cambiarEstado(Long id, String estadoSolicitado) {
        Alquiler alquiler = buscarAlquiler(id);

        String estado = normalizarEstado(estadoSolicitado);

        VehiculoDTO vehiculo =
                vehiculoServicio.obtenerPorId(alquiler.getIdVehiculo());

        if (ESTADOS_QUE_BLOQUEAN.contains(estado)) {
            validarDisponibilidad(
                    alquiler.getIdVehiculo(),
                    alquiler.getFechaInicio(),
                    alquiler.getFechaFin(),
                    alquiler.getIdAlquiler(),
                    estado
            );
        }

        String estadoAnterior = alquiler.getEstado();
        alquiler.setEstado(estado);
        Alquiler actualizado = alquilerRepositorio.save(alquiler);
        sincronizarEstadoVehiculo(vehiculo, estado);

        if ("Cancelado".equals(estado) && !"Cancelado".equals(estadoAnterior)) {
            eventos.publishEvent(new AlquilerCanceladoEvento(id, "Alquiler cancelado."));
        }

        return convertirADto(actualizado);
    }

    // ================================================================
    // Servicio con chofer
    // ================================================================

    /** El agente asigna (o cambia) el conductor de un alquiler con chofer. */
    @Transactional
    public AlquilerDTO asignarConductor(Long idAlquiler, Long idConductor) {
        Alquiler alquiler = buscarAlquiler(idAlquiler);
        if (!alquiler.isConChofer()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este alquiler no incluye servicio con chofer.");
        }
        if ("Cancelado".equals(alquiler.getEstado()) || "Finalizado".equals(alquiler.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No se puede asignar chofer a un alquiler " + alquiler.getEstado().toLowerCase(Locale.ROOT) + ".");
        }
        if (idConductor == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un conductor.");
        }
        UsuarioDTO conductor = usuarioServicio.obtenerPorId(idConductor);
        if (!"conductor".equals(normalizar(conductor.getNombrePerfil())) || !Boolean.TRUE.equals(conductor.getEstado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un conductor activo.");
        }
        String requerida = ValidadorDocumentos.categoriaRequerida(
                vehiculoServicio.obtenerPorId(alquiler.getIdVehiculo()).getCategoria());
        if (!choferHabilitado(conductor, requerida, alquiler.getFechaFin())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La licencia de ese conductor no está vigente hasta el fin del alquiler o no es de la categoría que pide el vehículo.");
        }
        boolean ocupado = choferOcupado(idConductor, alquiler.getFechaInicio(), alquiler.getFechaFin(), idAlquiler);
        if (ocupado) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese conductor ya tiene otro servicio en esas fechas.");
        }
        alquiler.setIdConductor(idConductor);
        alquiler.setEstadoServicio("ASIGNADO");
        return convertirADto(alquilerRepositorio.save(alquiler));
    }

    static final String SIN_CHOFER =
            "No hay choferes de la agencia disponibles para esas fechas. Elige otras fechas o quita el servicio con chofer.";

    /**
     * Chofer de la agencia libre para ese vehículo y fechas: activo, con licencia vigente hasta el último día,
     * de la categoría que pide el vehículo y sin otro servicio que se cruce. Se elige al que tiene menos servicios.
     */
    @Transactional(readOnly = true)
    public Optional<UsuarioDTO> buscarChoferLibre(String categoriaVehiculo, LocalDate inicio, LocalDate fin, Long idAlquilerActual) {
        String requerida = ValidadorDocumentos.categoriaRequerida(categoriaVehiculo);
        return usuarioServicio.obtenerTodos().stream()
                .filter(u -> "conductor".equals(normalizar(u.getNombrePerfil())) && Boolean.TRUE.equals(u.getEstado()))
                .filter(u -> choferHabilitado(u, requerida, fin))
                .filter(u -> !choferOcupado(u.getIdUsuario(), inicio, fin, idAlquilerActual))
                .min(Comparator.comparingLong(u -> serviciosActivos(u.getIdUsuario())));
    }

    private static boolean choferHabilitado(UsuarioDTO u, String categoriaRequerida, LocalDate fin) {
        return u.getVencimientoLicencia() != null && !u.getVencimientoLicencia().isBefore(fin)
                && u.getCategoriaLicencia() != null && !u.getCategoriaLicencia().isBlank()
                && ValidadorDocumentos.categoriaSuficiente(u.getCategoriaLicencia(), categoriaRequerida);
    }

    private boolean choferOcupado(Long idConductor, LocalDate inicio, LocalDate fin, Long idAlquilerActual) {
        return alquilerRepositorio.findByIdConductorOrderByFechaInicioAsc(idConductor).stream()
                .filter(a -> idAlquilerActual == null || !a.getIdAlquiler().equals(idAlquilerActual))
                .filter(a -> ESTADOS_QUE_BLOQUEAN.contains(a.getEstado()))
                .anyMatch(a -> !a.getFechaFin().isBefore(inicio) && !a.getFechaInicio().isAfter(fin));
    }

    private long serviciosActivos(Long idConductor) {
        return alquilerRepositorio.findByIdConductorOrderByFechaInicioAsc(idConductor).stream()
                .filter(a -> ESTADOS_QUE_BLOQUEAN.contains(a.getEstado()))
                .count();
    }

    /** Un alquiler con chofer activo sin conductor recibe uno libre; si no hay ninguno, no se registra. */
    private void asignarChoferAutomatico(Alquiler alquiler, VehiculoDTO vehiculo, Long idAlquilerActual) {
        if (!alquiler.isConChofer() || alquiler.getIdConductor() != null
                || !ESTADOS_QUE_BLOQUEAN.contains(alquiler.getEstado())) {
            return;
        }
        UsuarioDTO chofer = buscarChoferLibre(vehiculo.getCategoria(), alquiler.getFechaInicio(),
                alquiler.getFechaFin(), idAlquilerActual)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, SIN_CHOFER));
        alquiler.setIdConductor(chofer.getIdUsuario());
        alquiler.setEstadoServicio("ASIGNADO");
    }

    @Transactional(readOnly = true)
    public List<AlquilerDTO> serviciosDelConductor(Long idConductor) {
        return alquilerRepositorio.findByIdConductorOrderByFechaInicioAsc(idConductor).stream()
                .filter(a -> !"Cancelado".equals(a.getEstado()))
                .map(this::convertirADto)
                .toList();
    }

    /** El conductor avanza su servicio: ASIGNADO → INICIADO → ENTREGADO → FINALIZADO. */
    @Transactional
    public AlquilerDTO avanzarServicio(Long idAlquiler, Long idConductor, String nuevoEstado) {
        Alquiler alquiler = buscarAlquiler(idAlquiler);
        if (!idConductor.equals(alquiler.getIdConductor())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este servicio no está asignado a ti.");
        }
        List<String> orden = List.of("ASIGNADO", "INICIADO", "ENTREGADO", "FINALIZADO");
        String actual = alquiler.getEstadoServicio() == null ? "ASIGNADO" : alquiler.getEstadoServicio();
        String solicitado = nuevoEstado == null ? "" : nuevoEstado.trim().toUpperCase(Locale.ROOT);
        if (orden.indexOf(solicitado) != orden.indexOf(actual) + 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ese paso no corresponde al estado actual del servicio.");
        }
        if ("INICIADO".equals(solicitado) && !"Confirmado".equals(alquiler.getEstado()) && !"En curso".equals(alquiler.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El alquiler todavía no está confirmado.");
        }
        alquiler.setEstadoServicio(solicitado);
        return convertirADto(alquilerRepositorio.save(alquiler));
    }

    /** Usado por la entrega y devolución del vehículo. */
    @Transactional(readOnly = true)
    public Alquiler buscarEntidad(Long id) {
        return buscarAlquiler(id);
    }

    /** Guarda cambios de estado hechos por la entrega/devolución y sincroniza el vehículo. */
    @Transactional
    public AlquilerDTO cambiarEstadoInterno(Long id, String estado) {
        return cambiarEstado(id, estado);
    }

    @Transactional
    public void eliminar(Long id) {
        Alquiler alquiler = buscarAlquiler(id);

        if (
                !"Pendiente".equals(alquiler.getEstado()) &&
                        !"Cancelado".equals(alquiler.getEstado())
        ) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Solo se pueden eliminar alquileres pendientes o cancelados."
            );
        }

        VehiculoDTO vehiculo =
                vehiculoServicio.obtenerPorId(alquiler.getIdVehiculo());

        String estadoAnterior = alquiler.getEstado();

        alquilerRepositorio.delete(alquiler);
        alquilerRepositorio.flush();

        liberarVehiculoSiCorresponde(vehiculo, estadoAnterior);
    }

    private void validar(AlquilerGuardarDTO dto, Long idActual) {
        if (dto == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los datos del alquiler son obligatorios."
            );
        }

        if (dto.getIdUsuario() == null || dto.getIdVehiculo() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Debes seleccionar un cliente y un vehículo."
            );
        }

        if (dto.getFechaInicio() == null || dto.getFechaFin() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Las fechas de inicio y fin son obligatorias."
            );
        }

        if (dto.getFechaFin().isBefore(dto.getFechaInicio())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La fecha de fin no puede ser anterior a la fecha de inicio."
            );
        }

        if (
                esVacio(dto.getLugarRecogida()) ||
                        esVacio(dto.getLugarEntrega())
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Los lugares de recogida y entrega son obligatorios."
            );
        }

        normalizarEstado(dto.getEstado());
    }

    private void validarCliente(UsuarioDTO usuario) {
        if (usuario.getEstado() == null || !usuario.getEstado()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El cliente seleccionado está inactivo."
            );
        }

        if (
                usuario.getNombrePerfil() != null &&
                        !"cliente".equals(normalizar(usuario.getNombrePerfil()))
        ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El alquiler debe estar asociado a un usuario con perfil Cliente."
            );
        }
    }

    private void validarDisponibilidad(
            Long idVehiculo,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            Long idActual,
            String estado
    ) {
        if (!ESTADOS_QUE_BLOQUEAN.contains(estado)) {
            return;
        }

        boolean conflicto = alquilerRepositorio
                .buscarConflictos(
                        idVehiculo,
                        fechaInicio,
                        fechaFin,
                        ESTADOS_QUE_BLOQUEAN
                )
                .stream()
                .anyMatch(
                        item -> idActual == null ||
                                !item.getIdAlquiler().equals(idActual)
                );

        if (conflicto) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El vehículo ya tiene un alquiler activo que se cruza con las fechas seleccionadas."
            );
        }
    }

    private void mapear(
            Alquiler alquiler,
            AlquilerGuardarDTO dto,
            String estado,
            VehiculoDTO vehiculo
    ) {
        alquiler.setIdUsuario(dto.getIdUsuario());
        alquiler.setIdVehiculo(dto.getIdVehiculo());
        alquiler.setFechaInicio(dto.getFechaInicio());
        alquiler.setFechaFin(dto.getFechaFin());
        alquiler.setLugarRecogida(dto.getLugarRecogida().trim());
        alquiler.setLugarEntrega(dto.getLugarEntrega().trim());
        alquiler.setMetodoPago(limpiarOpcional(dto.getMetodoPago()));
        alquiler.setEstado(estado);
        alquiler.setObservaciones(limpiarOpcional(dto.getObservaciones()));

        alquiler.setConChofer(Boolean.TRUE.equals(dto.getConChofer()));
        if (!alquiler.isConChofer()) {
            alquiler.setIdConductor(null);
            alquiler.setEstadoServicio(null);
        }
        alquiler.setTotal(
                calcular(
                        vehiculo.getPrecioDia(),
                        descuentoVigente(vehiculo.getIdVehiculo(), dto.getFechaInicio()),
                        dto.getFechaInicio(),
                        dto.getFechaFin(),
                        alquiler.isConChofer()
                ).total()
        );
    }

    private void sincronizarEstadoVehiculo(
            VehiculoDTO vehiculo,
            String estadoAlquiler
    ) {
        if (
                "Finalizado".equals(estadoAlquiler) ||
                        "Cancelado".equals(estadoAlquiler)
        ) {
            liberarVehiculoSiCorresponde(vehiculo, estadoAlquiler);
            return;
        }

        String nuevoEstado = switch (estadoAlquiler) {
            case "Confirmado" -> "Reservado";
            case "En curso" -> "Alquilado";
            default -> vehiculo.getEstado();
        };

        if (
                nuevoEstado != null &&
                        !nuevoEstado.equalsIgnoreCase(vehiculo.getEstado())
        ) {
            vehiculo.setEstado(nuevoEstado);

            vehiculoServicio.actualizarVehiculo(
                    vehiculo.getIdVehiculo(),
                    vehiculo
            );
        }
    }

    private void liberarVehiculoSiCorresponde(
            VehiculoDTO vehiculo,
            String estadoAlquiler
    ) {
        if (
                !"Confirmado".equals(estadoAlquiler) &&
                        !"En curso".equals(estadoAlquiler) &&
                        !"Finalizado".equals(estadoAlquiler) &&
                        !"Cancelado".equals(estadoAlquiler)
        ) {
            return;
        }

        List<Alquiler> alquileresBloqueantes =
                alquilerRepositorio.findAll()
                        .stream()
                        .filter(
                                alquiler ->
                                        vehiculo.getIdVehiculo().equals(
                                                alquiler.getIdVehiculo()
                                        )
                        )
                        .filter(
                                alquiler ->
                                        ESTADOS_QUE_BLOQUEAN.contains(
                                                alquiler.getEstado()
                                        )
                        )
                        .toList();

        String nuevoEstado;

        boolean tieneAlquilerEnCurso = alquileresBloqueantes
                .stream()
                .anyMatch(
                        alquiler -> "En curso".equals(alquiler.getEstado())
                );

        boolean tieneReservaConfirmada = alquileresBloqueantes
                .stream()
                .anyMatch(
                        alquiler -> "Confirmado".equals(alquiler.getEstado())
                );

        if (tieneAlquilerEnCurso) {
            nuevoEstado = "Alquilado";

        } else if (tieneReservaConfirmada) {
            nuevoEstado = "Reservado";

        } else if (alquileresBloqueantes.isEmpty()) {
            nuevoEstado = "Disponible";

        } else {
            // Un alquiler pendiente no cambia por sí solo
            // el estado general del vehículo.
            return;
        }

        if (!nuevoEstado.equalsIgnoreCase(vehiculo.getEstado())) {
            vehiculo.setEstado(nuevoEstado);

            vehiculoServicio.actualizarVehiculo(
                    vehiculo.getIdVehiculo(),
                    vehiculo
            );
        }
    }

    private AlquilerDTO convertirADto(Alquiler alquiler) {
        UsuarioDTO usuario =
                usuarioServicio.obtenerPorId(alquiler.getIdUsuario());

        VehiculoDTO vehiculo =
                vehiculoServicio.obtenerPorId(alquiler.getIdVehiculo());

        AlquilerDTO dto = new AlquilerDTO();

        dto.setIdAlquiler(alquiler.getIdAlquiler());
        dto.setIdUsuario(alquiler.getIdUsuario());

        dto.setCliente(
                (usuario.getNombres() + " " + usuario.getApellidos()).trim()
        );

        dto.setCorreoCliente(usuario.getCorreo());
        dto.setIdVehiculo(alquiler.getIdVehiculo());

        dto.setVehiculo(
                (vehiculo.getMarca() + " " + vehiculo.getModelo()).trim()
        );

        dto.setCategoriaVehiculo(vehiculo.getCategoria());
        dto.setFechaInicio(alquiler.getFechaInicio());
        dto.setFechaFin(alquiler.getFechaFin());

        dto.setDias(
                Math.max(
                        1,
                        ChronoUnit.DAYS.between(
                                alquiler.getFechaInicio(),
                                alquiler.getFechaFin()
                        )
                )
        );

        dto.setLugarRecogida(alquiler.getLugarRecogida());
        dto.setLugarEntrega(alquiler.getLugarEntrega());
        dto.setMetodoPago(alquiler.getMetodoPago());
        dto.setEstado(alquiler.getEstado());
        dto.setTotal(alquiler.getTotal());
        dto.setObservaciones(alquiler.getObservaciones());
        dto.setFechaRegistro(alquiler.getFechaRegistro());
        dto.setConChofer(alquiler.isConChofer());
        dto.setIdConductor(alquiler.getIdConductor());
        dto.setEstadoServicio(alquiler.getEstadoServicio());
        dto.setTelefonoCliente(usuario.getTelefono());
        dto.setPlaca(vehiculo.getPlaca());
        if (alquiler.getIdConductor() != null) {
            try {
                UsuarioDTO chofer = usuarioServicio.obtenerPorId(alquiler.getIdConductor());
                dto.setConductor((chofer.getNombres() + " " + chofer.getApellidos()).trim());
            } catch (RuntimeException ignorado) {
                dto.setConductor("—");
            }
        }

        return dto;
    }

    private Alquiler buscarAlquiler(Long id) {
        return alquilerRepositorio.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Alquiler no encontrado con ID: " + id
                        )
                );
    }

    private String normalizarEstado(String estado) {
        String valor = esVacio(estado)
                ? "Pendiente"
                : estado.trim();

        return ESTADOS_VALIDOS.stream()
                .filter(
                        permitido -> permitido.equalsIgnoreCase(valor)
                )
                .findFirst()
                .orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Estado de alquiler no válido."
                        )
                );
    }

    private boolean esVacio(String valor) {
        return valor == null || valor.isBlank();
    }

    private String limpiarOpcional(String valor) {
        return esVacio(valor) ? null : valor.trim();
    }

    private String normalizar(String valor) {
        return valor == null
                ? ""
                : valor.trim().toLowerCase(Locale.ROOT);
    }
}
