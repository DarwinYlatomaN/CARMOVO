package com.carmovo.controller;


import com.carmovo.model.Pago;
import com.carmovo.service.PagoServicio;
import com.carmovo.service.AuditoriaServicio;
import com.carmovo.dto.PagoActualizarDTO;
import com.carmovo.dto.PagoDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/pagos")
@CrossOrigin(origins = "*")
public class PagoController {

    private final PagoServicio pagoServicio;
    private final AuditoriaServicio auditoriaServicio;
    private final com.carmovo.service.PasarelaServicio pasarela;

    public PagoController(PagoServicio pagoServicio, AuditoriaServicio auditoriaServicio,
                          com.carmovo.service.PasarelaServicio pasarela) {
        this.pasarela = pasarela;
        this.pagoServicio = pagoServicio;
        this.auditoriaServicio = auditoriaServicio;
    }

    @GetMapping
    public ResponseEntity<List<PagoDTO>> listarTodos() {
        return ResponseEntity.ok(pagoServicio.obtenerTodos());
    }

    @GetMapping("/{idAlquiler}")
    public ResponseEntity<PagoDTO> obtenerPorAlquiler(@PathVariable Long idAlquiler) {
        return ResponseEntity.ok(pagoServicio.obtenerPorAlquiler(idAlquiler));
    }

    @PatchMapping("/{idAlquiler}")
    public ResponseEntity<PagoDTO> actualizarPago(
            @PathVariable Long idAlquiler,
            @RequestBody PagoActualizarDTO dto
    ) {
        PagoDTO anterior = pagoServicio.obtenerPorAlquiler(idAlquiler);
        PagoDTO actualizado = pagoServicio.actualizarPago(idAlquiler, dto);
        auditoriaServicio.registrarSeguro(
                "Pagos", "ACTUALIZAR_PAGO", "Pago", actualizado.getIdPago(),
                "El pago del alquiler #" + idAlquiler + " cambió de " + anterior.getEstadoPago() + " a " +
                        actualizado.getEstadoPago() + ". Método: " + valor(actualizado.getMetodoPago()) +
                        "; referencia: " + valor(actualizado.getReferencia()) + "."
        );
        return ResponseEntity.ok(actualizado);
    }

    private String valor(String texto) {
        return texto == null || texto.isBlank() ? "—" : texto;
    }

    // ================================================================ acciones del Cajero

    private String actor() {
        return com.carmovo.service.AdminContextoSesion.obtenerActor();
    }

    /** Foto o captura del pago que subió el cliente (Yape, Plin o transferencia). */
    @GetMapping("/{idAlquiler}/constancia")
    public ResponseEntity<org.springframework.core.io.Resource> constancia(@PathVariable Long idAlquiler) {
        com.carmovo.model.ConstanciaPago c = pasarela.constanciaDeAlquiler(idAlquiler);
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(c.getTipoContenido()))
                .header("Cache-Control", "private, no-store")
                .header("Content-Disposition", "inline; filename=\"constancia-alquiler-" + idAlquiler
                        + ("application/pdf".equals(c.getTipoContenido()) ? ".pdf" : "") + "\"")
                .body(new org.springframework.core.io.ByteArrayResource(c.getDatos()));
    }

    /** Yape, Plin o transferencia en revisión → Pagado (emite el comprobante). */
    @PostMapping("/{idAlquiler}/aprobar")
    public PagoDTO aprobar(@PathVariable Long idAlquiler) {
        return pagoServicio.aprobar(idAlquiler, actor());
    }

    /** Rechaza un pago pendiente o en revisión (cancela la reserva). */
    @PostMapping("/{idAlquiler}/rechazar")
    public PagoDTO rechazar(@PathVariable Long idAlquiler, @RequestBody java.util.Map<String, String> datos) {
        return pagoServicio.rechazar(idAlquiler, datos == null ? null : datos.get("motivo"), actor());
    }

    /** Cobro en efectivo en la oficina: registra lo recibido y calcula el vuelto. */
    @PostMapping("/{idAlquiler}/efectivo")
    public PagoDTO cobrarEfectivo(@PathVariable Long idAlquiler, @RequestBody java.util.Map<String, String> datos) {
        java.math.BigDecimal recibido;
        try {
            recibido = new java.math.BigDecimal(datos.get("montoRecibido"));
        } catch (RuntimeException e) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa el monto recibido.");
        }
        return pagoServicio.registrarEfectivo(idAlquiler, recibido, actor());
    }

    @PostMapping("/{idAlquiler}/reembolsar")
    public PagoDTO reembolsar(@PathVariable Long idAlquiler) {
        return pagoServicio.reembolsar(idAlquiler, actor());
    }

    @PostMapping("/{idAlquiler}/cargos/cobrar")
    public PagoDTO cobrarCargos(@PathVariable Long idAlquiler, @RequestBody(required = false) java.util.Map<String, String> datos) {
        return pagoServicio.cobrarCargos(idAlquiler, datos == null ? null : datos.get("metodo"), actor());
    }
}
