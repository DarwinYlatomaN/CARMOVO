package com.carmovo.service;

import com.carmovo.dto.AlquilerDTO;
import com.carmovo.dto.ComprobanteDTO;
import com.carmovo.model.Comprobante;
import com.carmovo.model.Pago;
import com.carmovo.repository.ComprobanteRepositorio;
import com.carmovo.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class ComprobanteServicio {

    private static final BigDecimal FACTOR_IGV = new BigDecimal("1.18");

    private final ComprobanteRepositorio comprobanteRepositorio;
    private final AlquilerServicio alquilerServicio;
    private final UsuarioRepositorio usuarioRepositorio;

    public ComprobanteServicio(ComprobanteRepositorio comprobanteRepositorio,
                               AlquilerServicio alquilerServicio,
                               UsuarioRepositorio usuarioRepositorio) {
        this.comprobanteRepositorio = comprobanteRepositorio;
        this.alquilerServicio = alquilerServicio;
        this.usuarioRepositorio = usuarioRepositorio;
    }

    /** Emite el comprobante del alquiler. Si ya existe, lo devuelve (idempotente). */
    @Transactional
    public ComprobanteDTO emitir(AlquilerDTO alquiler, Pago pago, String detalleMetodo) {
        Optional<Comprobante> existente = comprobanteRepositorio.findByIdAlquiler(alquiler.getIdAlquiler());
        if (existente.isPresent()) {
            return convertir(existente.get(), alquiler);
        }

        BigDecimal total = alquiler.getTotal() == null ? BigDecimal.ZERO : alquiler.getTotal();
        BigDecimal subtotal = total.divide(FACTOR_IGV, 2, RoundingMode.HALF_UP);

        Comprobante c = new Comprobante();
        c.setIdAlquiler(alquiler.getIdAlquiler());
        c.setIdPago(pago.getIdPago());
        c.setNumero("TMP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        c.setCodigoVerificacion(generarCodigo());
        c.setMetodoPago(alquiler.getMetodoPago() == null ? "—" : alquiler.getMetodoPago());
        c.setDetalleMetodo(limpiar(detalleMetodo));
        c.setReferencia(pago.getReferencia());
        c.setTotal(total.setScale(2, RoundingMode.HALF_UP));
        c.setSubtotal(subtotal);
        c.setIgv(c.getTotal().subtract(subtotal));

        Comprobante guardado = comprobanteRepositorio.save(c);
        // Correlativo basado en el ID: nunca se repite.
        guardado.setNumero(String.format("CMV-B001-%06d", guardado.getIdComprobante()));
        guardado = comprobanteRepositorio.save(guardado);
        return convertir(guardado, alquiler);
    }

    @Transactional(readOnly = true)
    public Optional<String> numeroPorAlquiler(Long idAlquiler) {
        return comprobanteRepositorio.findByIdAlquiler(idAlquiler).map(Comprobante::getNumero);
    }

    @Transactional(readOnly = true)
    public ComprobanteDTO obtenerPorAlquiler(Long idAlquiler) {
        Comprobante c = comprobanteRepositorio.findByIdAlquiler(idAlquiler)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "El alquiler aún no tiene comprobante."));
        return convertir(c, alquilerServicio.obtenerPorId(idAlquiler));
    }

    @Transactional(readOnly = true)
    public ComprobanteDTO obtenerParaCliente(Long idUsuario, Long idAlquiler) {
        AlquilerDTO alquiler = alquilerServicio.obtenerPorId(idAlquiler);
        if (!Objects.equals(alquiler.getIdUsuario(), idUsuario)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El comprobante no pertenece a este usuario.");
        }
        return obtenerPorAlquiler(idAlquiler);
    }

    private ComprobanteDTO convertir(Comprobante c, AlquilerDTO a) {
        ComprobanteDTO dto = new ComprobanteDTO();
        dto.setIdComprobante(c.getIdComprobante());
        dto.setIdAlquiler(c.getIdAlquiler());
        dto.setNumero(c.getNumero());
        dto.setCodigoVerificacion(c.getCodigoVerificacion());
        dto.setMetodoPago(c.getMetodoPago());
        dto.setDetalleMetodo(c.getDetalleMetodo());
        dto.setReferencia(c.getReferencia());
        dto.setSubtotal(c.getSubtotal());
        dto.setIgv(c.getIgv());
        dto.setTotal(c.getTotal());
        dto.setFechaEmision(c.getFechaEmision());
        dto.setCliente(a.getCliente());
        dto.setCorreo(a.getCorreoCliente());
        dto.setVehiculo(a.getVehiculo());
        dto.setFechaInicio(a.getFechaInicio());
        dto.setFechaFin(a.getFechaFin());
        dto.setDias(a.getDias());
        dto.setLugarRecogida(a.getLugarRecogida());
        dto.setLugarEntrega(a.getLugarEntrega());
        dto.setEstadoAlquiler(a.getEstado());
        if (a.getIdUsuario() != null) {
            usuarioRepositorio.findById(a.getIdUsuario())
                    .ifPresent(u -> dto.setDocumento(u.getDocumento()));
        }
        return dto;
    }

    private String generarCodigo() {
        String h = UUID.randomUUID().toString().replace("-", "").toUpperCase().substring(0, 12);
        return h.substring(0, 4) + "-" + h.substring(4, 8) + "-" + h.substring(8, 12);
    }

    private String limpiar(String v) {
        if (v == null || v.isBlank()) return null;
        String t = v.trim();
        return t.length() > 120 ? t.substring(0, 120) : t;
    }
}
