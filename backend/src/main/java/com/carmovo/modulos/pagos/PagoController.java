package com.carmovo.modulos.pagos;

import com.carmovo.modulos.auditoria.AuditoriaServicio;
import com.carmovo.modulos.pagos.dto.PagoActualizarDTO;
import com.carmovo.modulos.pagos.dto.PagoDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/pagos")
@CrossOrigin(origins = "*")
public class PagoController {

    private final PagoServicio pagoServicio;
    private final AuditoriaServicio auditoriaServicio;

    public PagoController(PagoServicio pagoServicio, AuditoriaServicio auditoriaServicio) {
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
}
