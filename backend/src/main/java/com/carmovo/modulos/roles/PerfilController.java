package com.carmovo.modulos.roles;

import com.carmovo.modulos.roles.dto.PerfilDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/perfiles")
@CrossOrigin(origins = "*")
public class PerfilController {

    private final PerfilServicio perfilServicio;

    public PerfilController(PerfilServicio perfilServicio) {
        this.perfilServicio = perfilServicio;
    }

    @GetMapping
    public ResponseEntity<List<PerfilDTO>> listarTodos() {
        return ResponseEntity.ok(perfilServicio.obtenerTodos());
    }
}
