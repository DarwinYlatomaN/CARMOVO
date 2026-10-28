package com.carmovo.controller;

import com.carmovo.dto.ComprobanteDTO;
import com.carmovo.service.ComprobanteServicio;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
public class ComprobanteController {

    private final ComprobanteServicio comprobanteServicio;

    public ComprobanteController(ComprobanteServicio comprobanteServicio) {
        this.comprobanteServicio = comprobanteServicio;
    }

    /** Usado por Mi Cuenta: valida que el alquiler sea del usuario. */
    @GetMapping("/api/v1/clientes/{idUsuario}/comprobantes/alquiler/{idAlquiler}")
    public ResponseEntity<ComprobanteDTO> obtenerParaCliente(@PathVariable Long idUsuario,
                                                             @PathVariable Long idAlquiler) {
        return ResponseEntity.ok(comprobanteServicio.obtenerParaCliente(idUsuario, idAlquiler));
    }

    /** Usado por el panel admin (protegido por el interceptor de /api/v1/admin/**). */
    @GetMapping("/api/v1/admin/comprobantes/alquiler/{idAlquiler}")
    public ResponseEntity<ComprobanteDTO> obtenerParaAdmin(@PathVariable Long idAlquiler) {
        return ResponseEntity.ok(comprobanteServicio.obtenerPorAlquiler(idAlquiler));
    }
}
