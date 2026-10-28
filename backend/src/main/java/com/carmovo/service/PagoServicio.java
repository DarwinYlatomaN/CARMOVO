package com.carmovo.service;


import com.carmovo.model.Pago;
import com.carmovo.repository.PagoRepositorio;
import com.carmovo.service.AlquilerServicio;
import com.carmovo.dto.AlquilerDTO;
import com.carmovo.dto.PagoActualizarDTO;
import com.carmovo.dto.PagoDTO;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PagoServicio {

    private static final Set<String> ESTADOS_VALIDOS = Set.of(
            "Pendiente", "En revisión", "Pagado", "Rechazado"
    );

    private final PagoRepositorio pagoRepositorio;
    private final AlquilerServicio alquilerServicio;
    private final ComprobanteServicio comprobanteServicio;

    public PagoServicio(PagoRepositorio pagoRepositorio, AlquilerServicio alquilerServicio,
                        ComprobanteServicio comprobanteServicio) {
        this.pagoRepositorio = pagoRepositorio;
        this.alquilerServicio = alquilerServicio;
        this.comprobanteServicio = comprobanteServicio;
    }

    @Transactional(readOnly = true)
    public List<PagoDTO> obtenerTodos() {
        Map<Long, Pago> pagosPorAlquiler = pagoRepositorio.findAll().stream()
                .collect(Collectors.toMap(Pago::getIdAlquiler, Function.identity()));

        return alquilerServicio.obtenerTodos().stream()
                .sorted(Comparator.comparing(AlquilerDTO::getIdAlquiler).reversed())
                .map(alquiler -> convertirADto(alquiler, pagosPorAlquiler.get(alquiler.getIdAlquiler())))
                .toList();
    }

    @Transactional(readOnly = true)
    public PagoDTO obtenerPorAlquiler(Long idAlquiler) {
        AlquilerDTO alquiler = alquilerServicio.obtenerPorId(idAlquiler);
        Pago pago = pagoRepositorio.findByIdAlquiler(idAlquiler).orElse(null);
        return convertirADto(alquiler, pago);
    }


    @Transactional
    public PagoDTO registrarDesdeReserva(
            Long idAlquiler,
            String metodoPago,
            String referencia,
            String tokenPago,
            String detallePago
    ) {
        if (idAlquiler == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El alquiler es obligatorio para registrar el pago.");
        }

        String metodo = esVacio(metodoPago) ? "" : metodoPago.trim().toLowerCase(Locale.ROOT);
        if (!Set.of("tarjeta", "paypal", "yape", "plin").contains(metodo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Método de pago no válido para la reserva.");
        }
        if (esVacio(tokenPago) || !tokenPago.startsWith("SIM-")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se recibió la confirmación de la pasarela de pago.");
        }
        if ("SIM-RECHAZADO".equals(tokenPago)) {
            // La reserva es @Transactional: el alquiler creado se revierte.
            throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Pago rechazado por la pasarela simulada.");
        }
        if (esVacio(referencia)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La pasarela no devolvió un número de operación.");
        }

        AlquilerDTO alquiler = alquilerServicio.obtenerPorId(idAlquiler);

        Pago pago = pagoRepositorio.findByIdAlquiler(idAlquiler).orElseGet(() -> {
            Pago nuevo = new Pago();
            nuevo.setIdAlquiler(idAlquiler);
            return nuevo;
        });

        pago.setEstado("Pagado");
        pago.setReferencia(referencia.trim());
        pago.setObservaciones("Pago aprobado en pasarela simulada (" + metodoPago.trim() + ")."
                + (esVacio(detallePago) ? "" : " " + detallePago.trim()));
        pago.setFechaPago(LocalDateTime.now());

        Pago guardado = pagoRepositorio.save(pago);
        comprobanteServicio.emitir(alquiler, guardado, detallePago);
        return convertirADto(alquiler, guardado);
    }

    @Transactional
    public PagoDTO actualizarPago(Long idAlquiler, PagoActualizarDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del pago son obligatorios.");
        }

        AlquilerDTO alquiler = alquilerServicio.obtenerPorId(idAlquiler);
        String estado = normalizarEstado(dto.getEstado());

        if ("Pagado".equals(estado) && esVacio(alquiler.getMetodoPago())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El alquiler debe tener un método de pago antes de marcarse como pagado."
            );
        }

        Pago pago = pagoRepositorio.findByIdAlquiler(idAlquiler).orElseGet(() -> {
            Pago nuevo = new Pago();
            nuevo.setIdAlquiler(idAlquiler);
            nuevo.setEstado("Pendiente");
            return nuevo;
        });

        String estadoAnterior = pago.getEstado();
        pago.setEstado(estado);
        pago.setReferencia(limpiarOpcional(dto.getReferencia()));
        pago.setObservaciones(limpiarOpcional(dto.getObservaciones()));

        if ("Pagado".equals(estado)) {
            if (!"Pagado".equals(estadoAnterior) || pago.getFechaPago() == null) {
                pago.setFechaPago(LocalDateTime.now());
            }
        } else {
            pago.setFechaPago(null);
        }

        Pago guardado = pagoRepositorio.save(pago);
        if ("Pagado".equals(estado)) {
            comprobanteServicio.emitir(alquiler, guardado, null);
        }
        return convertirADto(alquiler, guardado);
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
        dto.setMetodoPago(alquiler.getMetodoPago());
        dto.setMonto(alquiler.getTotal());
        dto.setEstadoAlquiler(alquiler.getEstado());
        dto.setEstadoPago(pago == null ? "Pendiente" : pago.getEstado());
        dto.setReferencia(pago == null ? null : pago.getReferencia());
        dto.setObservaciones(pago == null ? null : pago.getObservaciones());
        dto.setFechaPago(pago == null ? null : pago.getFechaPago());
        dto.setFechaRegistro(pago == null ? null : pago.getFechaRegistro());
        dto.setNumeroComprobante(comprobanteServicio.numeroPorAlquiler(alquiler.getIdAlquiler()).orElse(null));
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
