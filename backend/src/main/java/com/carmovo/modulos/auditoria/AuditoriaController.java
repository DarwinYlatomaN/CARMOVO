package com.carmovo.modulos.auditoria;

import com.carmovo.modulos.auditoria.dto.AuditoriaDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/auditoria")
@CrossOrigin(origins = "*")
public class AuditoriaController {

    private final AuditoriaServicio auditoriaServicio;

    public AuditoriaController(AuditoriaServicio auditoriaServicio) {
        this.auditoriaServicio = auditoriaServicio;
    }

    @GetMapping
    public ResponseEntity<List<AuditoriaDTO>> listarTodos() {
        return ResponseEntity.ok(auditoriaServicio.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditoriaDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(auditoriaServicio.obtenerPorId(id));
    }
}
