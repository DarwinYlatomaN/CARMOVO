package com.carmovo.service;

import com.carmovo.dto.AlquilerDTO;
import com.carmovo.dto.PagoActualizarDTO;
import com.carmovo.dto.PagoDTO;
import com.carmovo.model.CargoAlquiler;
import com.carmovo.model.IntentoPago;
import com.carmovo.model.Pago;
import com.carmovo.repository.CargoAlquilerRepositorio;
import com.carmovo.repository.PagoRepositorio;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Pagos de los alquileres y trabajo del Cajero.
 *
 * Estados del pago:
 *   Pendiente          → efectivo por cobrar en la oficina
 *   En revisión        → Yape, Plin o transferencia con su constancia; falta que el Cajero lo verifique
 *   Pagado             → confirmado; ya tiene boleta o factura
 *   Rechazado          → el Cajero rechazó la operación
 *   Expirado           → el efectivo no se pagó a tiempo
 *   Anulado            → el alquiler se canceló antes de pagar
 *   Reembolso pendiente→ el alquiler se canceló después de pagar
 *   Reembolsado        → el dinero se devolvió y el comprobante se anuló
 */
@Service
public class PagoServicio {

    public static final Set<String> ESTADOS_VALIDOS = Set.of(
            "Pendiente", "En revisión", "Pagado", "Rechazado", "Expirado", "Anulado",
            "Reembolso pendiente", "Reembolsado");

    private static final Map<String, String> NOMBRE_METODO = Map.of(
            "tarjeta", "Tarjeta", "yape", "Yape", "plin", "Plin", "transferencia", "Transferencia", "efectivo", "Efectivo");

    private final PagoRepositorio pagoRepositorio;
    private final AlquilerServicio alquilerServicio;
    private final ComprobanteServicio comprobanteServicio;
    private final CargoAlquilerRepositorio cargos;
    private final AuditoriaServicio auditoria;
    private final NotificacionServicio notificaciones;

    public PagoServicio(PagoRepositorio pagoRepositorio, AlquilerServicio alquilerServicio,
                        ComprobanteServicio comprobanteServicio, CargoAlquilerRepositorio cargos,
                        AuditoriaServicio auditoria, NotificacionServicio notificaciones) {
        this.pagoRepositorio = pagoRepositorio;
        this.alquilerServicio = alquilerServicio;
        this.comprobanteServicio = comprobanteServicio;
        this.cargos = cargos;
        this.auditoria = auditoria;
        this.notificaciones = notificaciones;
    }

    /** Datos de facturación elegidos por el cliente al reservar. */
    public record DatosFacturacion(String tipo, String ruc, String razonSocial, String direccionFiscal) {}

    // ================================================================ consultas

    @Transactional(readOnly = true)
    public List<PagoDTO> obtenerTodos() {
        Map<Long, Pago> pagosPorAlquiler = pagoRepositorio.findAll().stream()
                .collect(Collectors.toMap(Pago::getIdAlquiler, Function.identity(), (a, b) -> a));
        Map<Long, BigDecimal> pendientes = cargos.findByEstado("PENDIENTE").stream()
                .collect(Collectors.groupingBy(CargoAlquiler::getIdAlquiler,
                        Collectors.reducing(BigDecimal.ZERO, CargoAlquiler::getMonto, BigDecimal::add)));

        return alquilerServicio.obtenerTodos().stream()
                .sorted(Comparator.comparing(AlquilerDTO::getIdAlquiler).reversed())
                .map(alquiler -> {
                    PagoDTO dto = convertirADto(alquiler, pagosPorAlquiler.get(alquiler.getIdAlquiler()));
                    dto.setCargosPendientes(pendientes.getOrDefault(alquiler.getIdAlquiler(), BigDecimal.ZERO));
                    return dto;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public PagoDTO obtenerPorAlquiler(Long idAlquiler) {
        AlquilerDTO alquiler = alquilerServicio.obtenerPorId(idAlquiler);
        Pago pago = pagoRepositorio.findByIdAlquiler(idAlquiler).orElse(null);
        PagoDTO dto = convertirADto(alquiler, pago);
        dto.setCargosPendientes(totalCargosPendientes(idAlquiler));
        return dto;
    }

    @Transactional(readOnly = true)
    public Optional<String> estadoDelPago(Long idAlquiler) {
        return pagoRepositorio.findByIdAlquiler(idAlquiler).map(Pago::getEstado);
    }

    // ================================================================ desde la reserva

    /** Registra el pago de una reserva web según el resultado de la pasarela. */
    @Transactional
    public PagoDTO registrarDesdeReserva(AlquilerDTO alquiler, IntentoPago intento, DatosFacturacion facturacion) {
        Pago pago = pagoRepositorio.findByIdAlquiler(alquiler.getIdAlquiler()).orElseGet(() -> {
            Pago nuevo = new Pago();
            nuevo.setIdAlquiler(alquiler.getIdAlquiler());
            return nuevo;
        });

        pago.setMetodo(NOMBRE_METODO.getOrDefault(intento.getMetodo(), intento.getMetodo()));
        pago.setMonto(intento.getMonto());
        pago.setReferencia(intento.getReferencia());
        pago.setDetalle(intento.getDetalle());
        pago.setBanco(intento.getBanco());
        pago.setFechaOperacion(intento.getFechaOperacion());
        pago.setTipoComprobante(facturacion.tipo());
        pago.setRuc(facturacion.ruc());
        pago.setRazonSocial(facturacion.razonSocial());
        pago.setDireccionFiscal(facturacion.direccionFiscal());

        String estadoIntento = intento.getEstado();
        switch (estadoIntento) {
            case "APROBADO" -> {
                // La tarjeta fue autorizada por la pasarela, pero caja la valida antes de emitir el comprobante.
                pago.setEstado("En revisión");
                if (pago.getFechaOperacion() == null) pago.setFechaOperacion(LocalDateTime.now());
                pago.setObservaciones("Cargo con tarjeta autorizado por la pasarela (" + intento.getReferencia()
                        + "). Pendiente de validación del Cajero. Intento " + intento.getCodigo() + ".");
            }
            case "EN_REVISION" -> {
                pago.setEstado("En revisión");
                pago.setObservaciones("Operación " + pago.getMetodo() + " reportada por el cliente. Pendiente de validación del Cajero.");
            }
            case "PENDIENTE" -> {
                pago.setEstado("Pendiente");
                pago.setVencePago(PasarelaServicio.vencimientoEfectivo(alquiler.getFechaInicio()));
                pago.setObservaciones("Pago en efectivo en oficina. Código " + intento.getCodigo() + ".");
            }
            default -> throw new ResponseStatusException(HttpStatus.CONFLICT, "El pago no está aprobado.");
        }

        Pago guardado = pagoRepositorio.save(pago);
        if ("Pagado".equals(guardado.getEstado())) {
            comprobanteServicio.emitir(alquiler, guardado);
        }
        return convertirADto(alquiler, guardado);
    }

    // ================================================================ acciones del Cajero

    /** Tarjeta, Yape, Plin o transferencia en revisión → Pagado. Confirma el alquiler y emite el comprobante. */
    @Transactional
    public PagoDTO aprobar(Long idAlquiler, String actor) {
        Pago pago = exigirEstado(idAlquiler, "En revisión");
        pago.setEstado("Pagado");
        pago.setFechaPago(LocalDateTime.now());
        pago.setValidadoPor(actor);
        pago.setFechaValidacion(LocalDateTime.now());
        Pago guardado = pagoRepositorio.save(pago);
        AlquilerDTO alquiler = confirmarAlquiler(idAlquiler);
        comprobanteServicio.emitir(alquiler, guardado);
        auditoria.registrarSeguro("Pagos", "APROBAR_PAGO", "Pago", guardado.getIdPago(),
                "Se aprobó el pago " + guardado.getMetodo() + " (op. " + guardado.getReferencia() + ") del alquiler #" + idAlquiler + ".");
        notificaciones.pagoConfirmado(alquiler, guardado);
        return obtenerPorAlquiler(idAlquiler);
    }

    /** Pago en revisión o efectivo pendiente → Rechazado. El alquiler se cancela y el auto queda libre. */
    @Transactional
    public PagoDTO rechazar(Long idAlquiler, String motivo, String actor) {
        if (motivo == null || motivo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indica el motivo del rechazo.");
        }
        Pago pago = pagoRepositorio.findByIdAlquiler(idAlquiler)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El alquiler no tiene pago registrado."));
        if (!"En revisión".equals(pago.getEstado()) && !"Pendiente".equals(pago.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se rechazan pagos pendientes o en revisión.");
        }
        pago.setEstado("Rechazado");
        pago.setMotivoRechazo(motivo.trim().length() > 255 ? motivo.trim().substring(0, 255) : motivo.trim());
        pago.setValidadoPor(actor);
        pago.setFechaValidacion(LocalDateTime.now());
        pagoRepositorio.save(pago);
        alquilerServicio.cambiarEstado(idAlquiler, "Cancelado");
        auditoria.registrarSeguro("Pagos", "RECHAZAR_PAGO", "Pago", pago.getIdPago(),
                "Se rechazó el pago del alquiler #" + idAlquiler + ". Motivo: " + pago.getMotivoRechazo());
        notificaciones.pagoRechazado(alquilerServicio.obtenerPorId(idAlquiler), pago);
        return obtenerPorAlquiler(idAlquiler);
    }

    /** Efectivo pendiente → Pagado. Calcula el vuelto y emite el comprobante. */
    @Transactional
    public PagoDTO registrarEfectivo(Long idAlquiler, BigDecimal montoRecibido, String actor) {
        Pago pago = exigirEstado(idAlquiler, "Pendiente");
        if (!"Efectivo".equalsIgnoreCase(pago.getMetodo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este pago no es en efectivo.");
        }
        BigDecimal monto = pago.getMonto();
        if (montoRecibido == null || montoRecibido.compareTo(monto) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El monto recibido debe ser al menos S/ " + monto.setScale(2, RoundingMode.HALF_UP) + ".");
        }
        pago.setMontoRecibido(montoRecibido.setScale(2, RoundingMode.HALF_UP));
        pago.setVuelto(montoRecibido.subtract(monto).setScale(2, RoundingMode.HALF_UP));
        pago.setEstado("Pagado");
        pago.setFechaPago(LocalDateTime.now());
        pago.setValidadoPor(actor);
        pago.setFechaValidacion(LocalDateTime.now());
        pago.setReferencia(pago.getReferencia() == null ? "EF-" + idAlquiler : pago.getReferencia());
        Pago guardado = pagoRepositorio.save(pago);
        AlquilerDTO alquiler = confirmarAlquiler(idAlquiler);
        comprobanteServicio.emitir(alquiler, guardado);
        auditoria.registrarSeguro("Pagos", "COBRAR_EFECTIVO", "Pago", guardado.getIdPago(),
                "Cobro en efectivo del alquiler #" + idAlquiler + ": recibido S/ " + guardado.getMontoRecibido()
                        + ", vuelto S/ " + guardado.getVuelto() + ".");
        notificaciones.pagoConfirmado(alquiler, guardado);
        return obtenerPorAlquiler(idAlquiler);
    }

    /** Reembolso pendiente → Reembolsado. Anula el comprobante. */
    @Transactional
    public PagoDTO reembolsar(Long idAlquiler, String actor) {
        Pago pago = exigirEstado(idAlquiler, "Reembolso pendiente");
        pago.setEstado("Reembolsado");
        pago.setValidadoPor(actor);
        pago.setFechaValidacion(LocalDateTime.now());
        pagoRepositorio.save(pago);
        comprobanteServicio.anular(idAlquiler, "Reembolso por cancelación del alquiler.");
        auditoria.registrarSeguro("Pagos", "REEMBOLSAR", "Pago", pago.getIdPago(),
                "Se reembolsó el pago del alquiler #" + idAlquiler + " y se anuló su comprobante.");
        return obtenerPorAlquiler(idAlquiler);
    }

    /** Marca como cobrados los cargos adicionales (tardanza, combustible, daños). */
    @Transactional
    public PagoDTO cobrarCargos(Long idAlquiler, String metodo, String actor) {
        List<CargoAlquiler> pendientes = cargos.findByIdAlquilerOrderByFechaRegistroAsc(idAlquiler).stream()
                .filter(c -> "PENDIENTE".equals(c.getEstado())).toList();
        if (pendientes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El alquiler no tiene cargos pendientes.");
        }
        String m = metodo == null || metodo.isBlank() ? "Efectivo" : metodo.trim();
        BigDecimal total = BigDecimal.ZERO;
        for (CargoAlquiler c : pendientes) {
            c.setEstado("COBRADO");
            c.setMetodoCobro(m);
            c.setFechaCobro(LocalDateTime.now());
            cargos.save(c);
            total = total.add(c.getMonto());
        }
        auditoria.registrarSeguro("Pagos", "COBRAR_CARGOS", "Alquiler", idAlquiler,
                "Se cobraron cargos adicionales por S/ " + total.setScale(2, RoundingMode.HALF_UP) + " (" + m + ").");
        return obtenerPorAlquiler(idAlquiler);
    }

    /** Edición manual (solo administración): mantiene la compatibilidad con la versión anterior. */
    @Transactional
    public PagoDTO actualizarPago(Long idAlquiler, PagoActualizarDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del pago son obligatorios.");
        }
        AlquilerDTO alquiler = alquilerServicio.obtenerPorId(idAlquiler);
        String estado = normalizarEstado(dto.getEstado());
        if ("Pagado".equals(estado) && esVacio(alquiler.getMetodoPago())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El alquiler debe tener un método de pago antes de marcarse como pagado.");
        }
        Pago pago = pagoRepositorio.findByIdAlquiler(idAlquiler).orElseGet(() -> {
            Pago nuevo = new Pago();
            nuevo.setIdAlquiler(idAlquiler);
            nuevo.setEstado("Pendiente");
            nuevo.setMetodo(alquiler.getMetodoPago());
            nuevo.setMonto(alquiler.getTotal());
            nuevo.setTipoComprobante("BOLETA");
            return nuevo;
        });
        String estadoAnterior = pago.getEstado();
        pago.setEstado(estado);
        if (dto.getReferencia() != null) pago.setReferencia(limpiarOpcional(dto.getReferencia()));
        pago.setObservaciones(limpiarOpcional(dto.getObservaciones()));
        if (pago.getMonto() == null) pago.setMonto(alquiler.getTotal());
        if (pago.getMetodo() == null) pago.setMetodo(alquiler.getMetodoPago());
        if ("Pagado".equals(estado)) {
            if (!"Pagado".equals(estadoAnterior) || pago.getFechaPago() == null) pago.setFechaPago(LocalDateTime.now());
        } else if (!"Reembolso pendiente".equals(estado) && !"Reembolsado".equals(estado)) {
            pago.setFechaPago(null);
        }
        Pago guardado = pagoRepositorio.save(pago);
        if ("Pagado".equals(estado)) comprobanteServicio.emitir(alquiler, guardado);
        if ("Reembolsado".equals(estado)) comprobanteServicio.anular(idAlquiler, "Reembolso registrado manualmente.");
        return obtenerPorAlquiler(idAlquiler);
    }

    // ================================================================ automático

    /** Cuando se cancela un alquiler: si ya estaba pagado → reembolso pendiente; si no → anulado. */
    @EventListener
    @Transactional
    public void alCancelarAlquiler(AlquilerCanceladoEvento evento) {
        pagoRepositorio.findByIdAlquiler(evento.idAlquiler()).ifPresent(pago -> {
            if ("Pagado".equals(pago.getEstado())) {
                pago.setEstado("Reembolso pendiente");
                pago.setObservaciones(evento.motivo() + " El Cajero debe registrar el reembolso.");
                pagoRepositorio.save(pago);
            } else if ("Pendiente".equals(pago.getEstado()) || "En revisión".equals(pago.getEstado())) {
                pago.setEstado("Anulado");
                pago.setObservaciones(evento.motivo());
                pagoRepositorio.save(pago);
            }
        });
    }

    /** Cada 15 minutos: el efectivo no pagado a tiempo vence y la reserva se cancela. */
    @Scheduled(fixedDelay = 900_000, initialDelay = 90_000)
    @Transactional
    public void vencerEfectivoNoPagado() {
        LocalDateTime ahora = LocalDateTime.now();
        for (Pago pago : pagoRepositorio.findByEstadoAndMetodoIgnoreCase("Pendiente", "Efectivo")) {
            if (pago.getVencePago() != null && pago.getVencePago().isBefore(ahora)) {
                pago.setEstado("Expirado");
                pago.setObservaciones("No se pagó en la oficina antes de las " + pago.getVencePago().toLocalTime() + " del día de recojo.");
                pagoRepositorio.save(pago);
                try {
                    alquilerServicio.cambiarEstado(pago.getIdAlquiler(), "Cancelado");
                } catch (RuntimeException e) {
                    // Si el alquiler ya no existe o ya estaba cerrado, el pago igual queda expirado.
                }
                auditoria.registrarSeguro("Pagos", "EXPIRAR_EFECTIVO", "Pago", pago.getIdPago(),
                        "El pago en efectivo del alquiler #" + pago.getIdAlquiler() + " venció y la reserva se canceló.");
            }
        }
    }

    // ================================================================ auxiliares

    private AlquilerDTO confirmarAlquiler(Long idAlquiler) {
        AlquilerDTO alquiler = alquilerServicio.obtenerPorId(idAlquiler);
        if ("Pendiente".equals(alquiler.getEstado())) {
            alquiler = alquilerServicio.cambiarEstado(idAlquiler, "Confirmado");
        }
        return alquiler;
    }

    private Pago exigirEstado(Long idAlquiler, String estado) {
        Pago pago = pagoRepositorio.findByIdAlquiler(idAlquiler)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El alquiler no tiene pago registrado."));
        if (!estado.equals(pago.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El pago está \"" + pago.getEstado() + "\"; esta acción solo aplica a pagos \"" + estado + "\".");
        }
        return pago;
    }

    private BigDecimal totalCargosPendientes(Long idAlquiler) {
        return cargos.findByIdAlquilerOrderByFechaRegistroAsc(idAlquiler).stream()
                .filter(c -> "PENDIENTE".equals(c.getEstado()))
                .map(CargoAlquiler::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private PagoDTO convertirADto(AlquilerDTO alquiler, Pago pago) {
        PagoDTO dto = new PagoDTO();
        dto.setIdPago(pago == null ? null : pago.getIdPago());
        dto.setIdAlquiler(alquiler.getIdAlquiler());
        dto.setIdUsuario(alquiler.getIdUsuario());
        dto.setCliente(alquiler.getCliente());
        dto.setCorreoCliente(alquiler.getCorreoCliente());
        dto.setIdVehiculo(alquiler.getIdVehiculo());
        dto.setVehiculo(alquiler.getVehiculo());
        dto.setMetodoPago(pago != null && pago.getMetodo() != null ? pago.getMetodo() : alquiler.getMetodoPago());
        dto.setMonto(alquiler.getTotal());
        dto.setEstadoAlquiler(alquiler.getEstado());
        dto.setEstadoPago(pago == null ? "Pendiente" : pago.getEstado());
        dto.setFechaInicio(alquiler.getFechaInicio());
        dto.setFechaFin(alquiler.getFechaFin());
        dto.setLugarRecogida(alquiler.getLugarRecogida());
        dto.setConChofer(alquiler.isConChofer());
        if (pago != null) {
            dto.setFechaOperacion(pago.getFechaOperacion());
            dto.setFechaValidacion(pago.getFechaValidacion());
            dto.setReferencia(pago.getReferencia());
            dto.setObservaciones(pago.getObservaciones());
            dto.setFechaPago(pago.getFechaPago());
            dto.setFechaRegistro(pago.getFechaRegistro());
            dto.setMontoPagado(pago.getMonto());
            dto.setDetalle(pago.getDetalle());
            dto.setBanco(pago.getBanco());
            dto.setTipoComprobante(pago.getTipoComprobante());
            dto.setRuc(pago.getRuc());
            dto.setRazonSocial(pago.getRazonSocial());
            dto.setVencePago(pago.getVencePago());
            dto.setMontoRecibido(pago.getMontoRecibido());
            dto.setVuelto(pago.getVuelto());
            dto.setValidadoPor(pago.getValidadoPor());
            dto.setMotivoRechazo(pago.getMotivoRechazo());
        }
        comprobanteServicio.buscarPorAlquiler(alquiler.getIdAlquiler()).ifPresent(c -> {
            dto.setNumeroComprobante(c.getNumero());
            dto.setEstadoComprobante(c.getEstado());
            if (dto.getTipoComprobante() == null) dto.setTipoComprobante(c.getTipo());
        });
        return dto;
    }

    private String normalizarEstado(String estado) {
        String valor = esVacio(estado) ? "Pendiente" : estado.trim();
        return ESTADOS_VALIDOS.stream()
                .filter(permitido -> permitido.equalsIgnoreCase(valor))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de pago no válido."));
    }

    private String limpiarOpcional(String valor) {
        return esVacio(valor) ? null : valor.trim();
    }

    private boolean esVacio(String valor) {
        return valor == null || valor.isBlank();
    }
}