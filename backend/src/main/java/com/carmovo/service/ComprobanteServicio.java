package com.carmovo.service;

import com.carmovo.dto.AlquilerDTO;
import com.carmovo.dto.ComprobanteDTO;
import com.carmovo.model.Comprobante;
import com.carmovo.model.Pago;
import com.carmovo.repository.ComprobanteRepositorio;
import com.carmovo.repository.PagoRepositorio;
import com.carmovo.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Emisión de comprobantes: BOLETA (serie B001, cliente con DNI) o FACTURA (serie F001, empresa con RUC).
 *
 * Se emite UNA sola vez por alquiler, cuando el pago queda confirmado:
 *  - Tarjeta y Yape: al instante.
 *  - Plin: cuando el Cajero aprueba la operación.
 *  - Efectivo: cuando el Cajero registra el dinero recibido.
 * Un comprobante emitido no cambia de tipo; si hay un error se ANULA (por ejemplo, al reembolsar).
 */
@Service
public class ComprobanteServicio {

    private static final BigDecimal FACTOR_IGV = new BigDecimal("1.18");

    private final ComprobanteRepositorio comprobanteRepositorio;
    private final AlquilerServicio alquilerServicio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final PagoRepositorio pagoRepositorio;

    public ComprobanteServicio(ComprobanteRepositorio comprobanteRepositorio,
                               AlquilerServicio alquilerServicio,
                               UsuarioRepositorio usuarioRepositorio,
                               PagoRepositorio pagoRepositorio) {
        this.comprobanteRepositorio = comprobanteRepositorio;
        this.alquilerServicio = alquilerServicio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.pagoRepositorio = pagoRepositorio;
    }

    /** Emite el comprobante del alquiler. Si ya existe, lo devuelve (no duplica). */
    @Transactional
    public synchronized ComprobanteDTO emitir(AlquilerDTO alquiler, Pago pago) {
        Optional<Comprobante> existente = comprobanteRepositorio.findByIdAlquiler(alquiler.getIdAlquiler());
        if (existente.isPresent()) {
            return convertir(existente.get(), alquiler, pago);
        }

        boolean factura = "FACTURA".equalsIgnoreCase(pago.getTipoComprobante());
        String serie = factura ? "F001" : "B001";
        int correlativo = comprobanteRepositorio.ultimoCorrelativo(serie) + 1;

        BigDecimal total = pago.getMonto() != null ? pago.getMonto()
                : (alquiler.getTotal() == null ? BigDecimal.ZERO : alquiler.getTotal());
        total = total.setScale(2, RoundingMode.HALF_UP);
        BigDecimal subtotal = total.divide(FACTOR_IGV, 2, RoundingMode.HALF_UP);

        Comprobante c = new Comprobante();
        c.setIdAlquiler(alquiler.getIdAlquiler());
        c.setIdPago(pago.getIdPago());
        c.setTipo(factura ? "FACTURA" : "BOLETA");
        c.setSerie(serie);
        c.setCorrelativo(correlativo);
        c.setNumero(serie + "-" + String.format("%06d", correlativo));
        c.setCodigoVerificacion(generarCodigo());
        c.setMetodoPago(pago.getMetodo() != null ? pago.getMetodo()
                : (alquiler.getMetodoPago() == null ? "—" : alquiler.getMetodoPago()));
        c.setDetalleMetodo(recortar(pago.getDetalle(), 120));
        c.setReferencia(pago.getReferencia());
        c.setTotal(total);
        c.setSubtotal(subtotal);
        c.setIgv(total.subtract(subtotal));
        c.setEstado("EMITIDO");

        if (factura) {
            c.setDocumentoCliente(pago.getRuc());
            c.setNombreCliente(recortar(pago.getRazonSocial(), 150));
            c.setDireccionCliente(recortar(pago.getDireccionFiscal(), 200));
        } else {
            c.setNombreCliente(recortar(alquiler.getCliente(), 150));
            usuarioRepositorio.findById(alquiler.getIdUsuario()).ifPresent(u -> {
                c.setDocumentoCliente(u.getDocumento());
                c.setDireccionCliente(recortar(u.getDomicilio(), 200));
            });
        }

        return convertir(comprobanteRepositorio.save(c), alquiler, pago);
    }

    /** Anula el comprobante (reembolso o error). Conserva el número para el historial. */
    @Transactional
    public void anular(Long idAlquiler, String motivo) {
        comprobanteRepositorio.findByIdAlquiler(idAlquiler).ifPresent(c -> {
            if (!"ANULADO".equals(c.getEstado())) {
                c.setEstado("ANULADO");
                c.setFechaAnulacion(LocalDateTime.now());
                c.setMotivoAnulacion(recortar(motivo, 255));
                comprobanteRepositorio.save(c);
            }
        });
    }

    @Transactional(readOnly = true)
    public Optional<String> numeroPorAlquiler(Long idAlquiler) {
        return comprobanteRepositorio.findByIdAlquiler(idAlquiler).map(Comprobante::getNumero);
    }

    @Transactional(readOnly = true)
    public Optional<Comprobante> buscarPorAlquiler(Long idAlquiler) {
        return comprobanteRepositorio.findByIdAlquiler(idAlquiler);
    }

    @Transactional(readOnly = true)
    public ComprobanteDTO obtenerPorAlquiler(Long idAlquiler) {
        Comprobante c = comprobanteRepositorio.findByIdAlquiler(idAlquiler)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "El alquiler aún no tiene comprobante."));
        return convertir(c, alquilerServicio.obtenerPorId(idAlquiler), pagoRepositorio.findByIdAlquiler(idAlquiler).orElse(null));
    }

    @Transactional(readOnly = true)
    public ComprobanteDTO obtenerParaCliente(Long idUsuario, Long idAlquiler) {
        AlquilerDTO alquiler = alquilerServicio.obtenerPorId(idAlquiler);
        if (!Objects.equals(alquiler.getIdUsuario(), idUsuario)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El comprobante no pertenece a este usuario.");
        }
        return obtenerPorAlquiler(idAlquiler);
    }

    /** "Mis comprobantes" del cliente (más reciente primero). */
    @Transactional(readOnly = true)
    public List<ComprobanteDTO> listarDelCliente(Long idUsuario) {
        return alquilerServicio.obtenerPorUsuario(idUsuario).stream()
                .map(a -> comprobanteRepositorio.findByIdAlquiler(a.getIdAlquiler())
                        .map(c -> convertir(c, a, pagoRepositorio.findByIdAlquiler(a.getIdAlquiler()).orElse(null)))
                        .orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    private ComprobanteDTO convertir(Comprobante c, AlquilerDTO a, Pago pago) {
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
        dto.setTipo(c.getTipo());
        dto.setSerie(c.getSerie());
        dto.setCorrelativo(c.getCorrelativo());
        dto.setDocumentoCliente(c.getDocumentoCliente());
        dto.setNombreCliente(c.getNombreCliente());
        dto.setDireccionCliente(c.getDireccionCliente());
        dto.setEstado(c.getEstado());
        dto.setMotivoAnulacion(c.getMotivoAnulacion());
        dto.setCliente(a.getCliente());
        dto.setCorreo(a.getCorreoCliente());
        dto.setVehiculo(a.getVehiculo());
        dto.setFechaInicio(a.getFechaInicio());
        dto.setFechaFin(a.getFechaFin());
        dto.setDias(a.getDias());
        dto.setLugarRecogida(a.getLugarRecogida());
        dto.setLugarEntrega(a.getLugarEntrega());
        dto.setEstadoAlquiler(a.getEstado());
        // Compatibilidad con la vista anterior: "documento" = DNI o RUC del comprobante.
        dto.setDocumento(c.getDocumentoCliente());
        if (pago != null) {
            dto.setMontoRecibido(pago.getMontoRecibido());
            dto.setVuelto(pago.getVuelto());
        }
        return dto;
    }

    private String generarCodigo() {
        String h = UUID.randomUUID().toString().replace("-", "").toUpperCase().substring(0, 12);
        return h.substring(0, 4) + "-" + h.substring(4, 8) + "-" + h.substring(8, 12);
    }

    private static String recortar(String v, int max) {
        if (v == null || v.isBlank()) return null;
        String t = v.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }
}
