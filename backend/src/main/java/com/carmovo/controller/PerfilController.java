package com.carmovo.controller;


import com.carmovo.service.PerfilServicio;
import com.carmovo.dto.PerfilDTO;
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
        // En "Gestión de usuarios" solo se asignan perfiles de cliente;
        // los roles del personal se manejan en "Empleados" y "Roles y permisos".
        return ResponseEntity.ok(perfilServicio.obtenerTodos().stream()
                .filter(p -> !com.carmovo.service.PermisosAdministrativos.esRolPersonal(p.getNombre()))
                .toList());
    }
}
