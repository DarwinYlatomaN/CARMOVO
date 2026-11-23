package com.carmovo.controller;

import com.carmovo.dto.RolDTO;
import com.carmovo.service.AdminContextoSesion;
import com.carmovo.service.RolesServicio;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

/** API de "Roles y permisos" (solo administrador principal; lo valida el servicio y el interceptor). */
@RestController
@RequestMapping("/api/v1/admin/roles")
public class RolesController {

    private final RolesServicio servicio;

    public RolesController(RolesServicio servicio) {
        this.servicio = servicio;
    }

    private Long actor() {
        return AdminContextoSesion.obtener().orElseThrow().getIdUsuario();
    }

    @GetMapping
    public List<RolDTO> listar() {
        return servicio.listar(actor());
    }

    @GetMapping("/modulos")
    public Map<String, Map<String, String>> modulos() {
        return servicio.catalogo();
    }

    @PostMapping
    public ResponseEntity<RolDTO> crear(@RequestBody Map<String, Object> cuerpo) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(servicio.crear(actor(), texto(cuerpo.get("nombre")), permisos(cuerpo.get("permisos"))));
    }

    @PatchMapping("/{idPerfil}")
    public RolDTO renombrar(@PathVariable Long idPerfil, @RequestBody Map<String, Object> cuerpo) {
        return servicio.renombrar(actor(), idPerfil, texto(cuerpo.get("nombre")));
    }

    @DeleteMapping("/{idPerfil}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idPerfil) {
        servicio.eliminar(actor(), idPerfil);
        return ResponseEntity.noContent().build();
    }

    private static String texto(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    private static Set<String> permisos(Object v) {
        Set<String> r = new java.util.HashSet<>();
        if (v instanceof java.util.Collection<?> c) c.forEach(x -> { if (x != null) r.add(String.valueOf(x)); });
        return r;
    }

    @PutMapping("/{idPerfil}/permisos")
    public RolDTO actualizar(@PathVariable Long idPerfil, @RequestBody Map<String, Set<String>> cuerpo) {
        return servicio.actualizar(actor(), idPerfil, cuerpo == null ? Set.of() : cuerpo.get("permisos"));
    }
}
