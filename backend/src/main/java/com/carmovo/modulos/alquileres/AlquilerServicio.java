package com.carmovo.modulos.alquileres;

import com.carmovo.modulos.alquileres.dto.AlquilerDTO;
import com.carmovo.modulos.alquileres.dto.AlquilerGuardarDTO;
import com.carmovo.modulos.usuarios.UsuarioServicio;
import com.carmovo.modulos.usuarios.dto.UsuarioDTO;
import com.carmovo.modulos.vehiculos.VehiculoServicio;
import com.carmovo.modulos.vehiculos.dto.VehiculoDTO;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
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

    private final AlquilerRepositorio alquilerRepositorio;
    private final UsuarioServicio usuarioServicio;
    private final VehiculoServicio vehiculoServicio;

    public AlquilerServicio(
            AlquilerRepositorio alquilerRepositorio,
            UsuarioServicio usuarioServicio,
            VehiculoServicio vehiculoServicio
    ) {
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

    @Transactional
    public AlquilerDTO crear(AlquilerGuardarDTO dto) {
        validar(dto, null);

        UsuarioDTO usuario = usuarioServicio.obtenerPorId(dto.getIdUsuario());
        VehiculoDTO vehiculo = vehiculoServicio.obtenerPorId(dto.getIdVehiculo());
        validarCliente(usuario);

        String estado = normalizarEstado(dto.getEstado());
        validarDisponibilidad(dto.getIdVehiculo(), dto.getFechaInicio(), dto.getFechaFin(), null, estado);

        Alquiler alquiler = new Alquiler();
        mapear(alquiler, dto, estado, vehiculo);
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

        validarDisponibilidad(dto.getIdVehiculo(), dto.getFechaInicio(), dto.getFechaFin(), id, estadoNuevo);
        mapear(alquiler, dto, estadoNuevo, vehiculo);
        Alquiler actualizado = alquilerRepositorio.save(alquiler);

        if (!vehiculoAnteriorId.equals(dto.getIdVehiculo())) {
            try {
                VehiculoDTO anterior = vehiculoServicio.obtenerPorId(vehiculoAnteriorId);
                liberarVehiculoSiCorresponde(anterior, estadoAnterior);
            } catch (RuntimeException ignored) {
                // Si el vehículo anterior ya no existe, no interrumpimos la actualización del alquiler.
            }
        }

        sincronizarEstadoVehiculo(vehiculo, estadoNuevo);
        return convertirADto(actualizado);
    }

    @Transactional
    public AlquilerDTO cambiarEstado(Long id, String estadoSolicitado) {
        Alquiler alquiler = buscarAlquiler(id);
        String estado = normalizarEstado(estadoSolicitado);
        VehiculoDTO vehiculo = vehiculoServicio.obtenerPorId(alquiler.getIdVehiculo());

        if (ESTADOS_QUE_BLOQUEAN.contains(estado)) {
            validarDisponibilidad(
                    alquiler.getIdVehiculo(),
                    alquiler.getFechaInicio(),
                    alquiler.getFechaFin(),
                    alquiler.getIdAlquiler(),
                    estado
            );
        }

        alquiler.setEstado(estado);
        Alquiler actualizado = alquilerRepositorio.save(alquiler);
        sincronizarEstadoVehiculo(vehiculo, estado);
        return convertirADto(actualizado);
    }

    @Transactional
    public void eliminar(Long id) {
        Alquiler alquiler = buscarAlquiler(id);
        if (!"Pendiente".equals(alquiler.getEstado()) && !"Cancelado".equals(alquiler.getEstado())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Solo se pueden eliminar alquileres pendientes o cancelados."
            );
        }

        VehiculoDTO vehiculo = vehiculoServicio.obtenerPorId(alquiler.getIdVehiculo());
        alquilerRepositorio.delete(alquiler);
        liberarVehiculoSiCorresponde(vehiculo, alquiler.getEstado());
    }

    private void validar(AlquilerGuardarDTO dto, Long idActual) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del alquiler son obligatorios.");
        }
        if (dto.getIdUsuario() == null || dto.getIdVehiculo() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes seleccionar un cliente y un vehículo.");
        }
        if (dto.getFechaInicio() == null || dto.getFechaFin() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las fechas de inicio y fin son obligatorias.");
        }
        if (dto.getFechaFin().isBefore(dto.getFechaInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de fin no puede ser anterior a la fecha de inicio.");
        }
        if (esVacio(dto.getLugarRecogida()) || esVacio(dto.getLugarEntrega())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los lugares de recogida y entrega son obligatorios.");
        }
        normalizarEstado(dto.getEstado());
    }

    private void validarCliente(UsuarioDTO usuario) {
        if (usuario.getEstado() == null || !usuario.getEstado()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El cliente seleccionado está inactivo.");
        }
        if (usuario.getNombrePerfil() != null && !"cliente".equals(normalizar(usuario.getNombrePerfil()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El alquiler debe estar asociado a un usuario con perfil Cliente.");
        }
    }

    private void validarDisponibilidad(
            Long idVehiculo,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            Long idActual,
            String estado
    ) {
        if (!ESTADOS_QUE_BLOQUEAN.contains(estado)) return;

        boolean conflicto = alquilerRepositorio
                .buscarConflictos(idVehiculo, fechaInicio, fechaFin, ESTADOS_QUE_BLOQUEAN)
                .stream()
                .anyMatch(item -> idActual == null || !item.getIdAlquiler().equals(idActual));

        if (conflicto) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "El vehículo ya tiene un alquiler activo que se cruza con las fechas seleccionadas."
            );
        }
    }

    private void mapear(Alquiler alquiler, AlquilerGuardarDTO dto, String estado, VehiculoDTO vehiculo) {
        alquiler.setIdUsuario(dto.getIdUsuario());
        alquiler.setIdVehiculo(dto.getIdVehiculo());
        alquiler.setFechaInicio(dto.getFechaInicio());
        alquiler.setFechaFin(dto.getFechaFin());
        alquiler.setLugarRecogida(dto.getLugarRecogida().trim());
        alquiler.setLugarEntrega(dto.getLugarEntrega().trim());
        alquiler.setMetodoPago(limpiarOpcional(dto.getMetodoPago()));
        alquiler.setEstado(estado);
        alquiler.setObservaciones(limpiarOpcional(dto.getObservaciones()));
        alquiler.setTotal(calcularTotal(vehiculo.getPrecioDia(), dto.getFechaInicio(), dto.getFechaFin()));
    }

    private BigDecimal calcularTotal(BigDecimal precioDia, LocalDate inicio, LocalDate fin) {
        long dias = Math.max(1, ChronoUnit.DAYS.between(inicio, fin));
        BigDecimal tarifaBase = precioDia.multiply(BigDecimal.valueOf(dias));
        BigDecimal impuestos = tarifaBase.multiply(IGV);
        return tarifaBase.add(SEGURO_FIJO).add(impuestos).setScale(2, RoundingMode.HALF_UP);
    }

    private void sincronizarEstadoVehiculo(VehiculoDTO vehiculo, String estadoAlquiler) {
        String nuevoEstado = switch (estadoAlquiler) {
            case "Confirmado" -> "Reservado";
            case "En curso" -> "Alquilado";
            case "Finalizado", "Cancelado" -> "Disponible";
            default -> vehiculo.getEstado();
        };

        if (nuevoEstado != null && !nuevoEstado.equalsIgnoreCase(vehiculo.getEstado())) {
            vehiculo.setEstado(nuevoEstado);
            vehiculoServicio.actualizarVehiculo(vehiculo.getIdVehiculo(), vehiculo);
        }
    }

    private void liberarVehiculoSiCorresponde(VehiculoDTO vehiculo, String estadoAlquiler) {
        if ("Confirmado".equals(estadoAlquiler) || "En curso".equals(estadoAlquiler)) {
            vehiculo.setEstado("Disponible");
            vehiculoServicio.actualizarVehiculo(vehiculo.getIdVehiculo(), vehiculo);
        }
    }

    private AlquilerDTO convertirADto(Alquiler alquiler) {
        UsuarioDTO usuario = usuarioServicio.obtenerPorId(alquiler.getIdUsuario());
        VehiculoDTO vehiculo = vehiculoServicio.obtenerPorId(alquiler.getIdVehiculo());

        AlquilerDTO dto = new AlquilerDTO();
        dto.setIdAlquiler(alquiler.getIdAlquiler());
        dto.setIdUsuario(alquiler.getIdUsuario());
        dto.setCliente((usuario.getNombres() + " " + usuario.getApellidos()).trim());
        dto.setCorreoCliente(usuario.getCorreo());
        dto.setIdVehiculo(alquiler.getIdVehiculo());
        dto.setVehiculo((vehiculo.getMarca() + " " + vehiculo.getModelo()).trim());
        dto.setCategoriaVehiculo(vehiculo.getCategoria());
        dto.setFechaInicio(alquiler.getFechaInicio());
        dto.setFechaFin(alquiler.getFechaFin());
        dto.setDias(Math.max(1, ChronoUnit.DAYS.between(alquiler.getFechaInicio(), alquiler.getFechaFin())));
        dto.setLugarRecogida(alquiler.getLugarRecogida());
        dto.setLugarEntrega(alquiler.getLugarEntrega());
        dto.setMetodoPago(alquiler.getMetodoPago());
        dto.setEstado(alquiler.getEstado());
        dto.setTotal(alquiler.getTotal());
        dto.setObservaciones(alquiler.getObservaciones());
        dto.setFechaRegistro(alquiler.getFechaRegistro());
        return dto;
    }

    private Alquiler buscarAlquiler(Long id) {
        return alquilerRepositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alquiler no encontrado con ID: " + id));
    }

    private String normalizarEstado(String estado) {
        String valor = esVacio(estado) ? "Pendiente" : estado.trim();
        return ESTADOS_VALIDOS.stream()
                .filter(permitido -> permitido.equalsIgnoreCase(valor))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de alquiler no válido."));
    }

    private boolean esVacio(String valor) {
        return valor == null || valor.isBlank();
    }

    private String limpiarOpcional(String valor) {
        return esVacio(valor) ? null : valor.trim();
    }

    private String normalizar(String valor) {
        return valor == null ? "" : valor.trim().toLowerCase(Locale.ROOT);
    }
}
