package com.carmovo.controller;

import com.carmovo.dto.AdministradorSecundarioDTO;
import com.carmovo.dto.AdministradorSecundarioGuardarDTO;
import com.carmovo.service.AdminContextoSesion;
import com.carmovo.service.GestionAdministradoresServicio;
import com.carmovo.service.PermisosAdministrativos;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/administradores")
public class GestionAdministradoresController {
    private final GestionAdministradoresServicio servicio;
    public GestionAdministradoresController(GestionAdministradoresServicio servicio) { this.servicio = servicio; }

    private Long actor() { return AdminContextoSesion.obtener().orElseThrow().getIdUsuario(); }

    @GetMapping("/permisos")
    public Map<String, String> permisosDisponibles() { return PermisosAdministrativos.paginas(); }

    @GetMapping
    public List<AdministradorSecundarioDTO> listar() { return servicio.listar(actor()); }

    @PostMapping
    public ResponseEntity<AdministradorSecundarioDTO> crear(@Valid @RequestBody AdministradorSecundarioGuardarDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(servicio.crear(actor(), dto));
    }

    @PutMapping("/{id}")
    public AdministradorSecundarioDTO actualizar(@PathVariable Long id, @Valid @RequestBody AdministradorSecundarioGuardarDTO dto) {
        return servicio.actualizar(actor(), id, dto);
    }

    @PatchMapping("/{id}/desactivar")
    public AdministradorSecundarioDTO desactivar(@PathVariable Long id) { return servicio.desactivar(actor(), id); }

    @PatchMapping("/{id}/activar")
    public AdministradorSecundarioDTO activar(@PathVariable Long id) { return servicio.cambiarEstado(actor(), id, true); }
}
