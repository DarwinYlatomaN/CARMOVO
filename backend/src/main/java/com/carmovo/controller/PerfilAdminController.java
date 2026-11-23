package com.carmovo.controller;

import com.carmovo.service.AdminContextoSesion;
import com.carmovo.service.PerfilAdminServicio;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/** "Mi perfil" de quien inició sesión en el panel (cualquier rol del personal). */
@RestController
@RequestMapping("/api/v1/admin/perfil")
public class PerfilAdminController {

    private final PerfilAdminServicio servicio;

    public PerfilAdminController(PerfilAdminServicio servicio) {
        this.servicio = servicio;
    }

    private Long yo() {
        return AdminContextoSesion.obtener().orElseThrow().getIdUsuario();
    }

    @GetMapping
    public Map<String, Object> obtener() {
        return servicio.obtener(yo());
    }

    @PutMapping
    public Map<String, Object> actualizar(@RequestBody Map<String, String> datos) {
        return servicio.actualizar(yo(), datos == null ? Map.of() : datos);
    }

    @PutMapping("/contrasena")
    public ResponseEntity<Void> cambiarContrasena(@RequestBody Map<String, String> datos) {
        servicio.cambiarContrasena(yo(), datos == null ? Map.of() : datos);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> cambiarFoto(@RequestParam("archivo") MultipartFile archivo) {
        return servicio.cambiarFoto(yo(), archivo);
    }

    @DeleteMapping("/foto")
    public Map<String, Object> quitarFoto() {
        return servicio.quitarFoto(yo());
    }
}
