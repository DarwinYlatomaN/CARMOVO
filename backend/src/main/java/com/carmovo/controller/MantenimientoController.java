package com.carmovo.controller;

import com.carmovo.dto.MantenimientoDTO;
import com.carmovo.service.MantenimientoServicio;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Mantenimiento de la flota (permiso ADMIN_FLOTA, validado por el interceptor). */
@RestController
@RequestMapping("/api/v1/admin/mantenimientos")
public class MantenimientoController {

    private final MantenimientoServicio servicio;

    public MantenimientoController(MantenimientoServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public List<MantenimientoDTO> listar() {
        return servicio.listar();
    }

    @GetMapping("/tipos")
    public List<String> tipos() {
        return MantenimientoServicio.TIPOS;
    }

    @GetMapping("/alertas")
    public List<Map<String, Object>> alertas() {
        return servicio.alertas();
    }

    @PostMapping
    public ResponseEntity<MantenimientoDTO> crear(@RequestBody MantenimientoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(servicio.crear(dto));
    }

    @PostMapping("/{id}/taller")
    public MantenimientoDTO enviarATaller(@PathVariable Long id) {
        return servicio.enviarATaller(id);
    }

    @PostMapping("/{id}/completar")
    public MantenimientoDTO completar(@PathVariable Long id, @RequestBody(required = false) MantenimientoDTO datos) {
        return servicio.completar(id, datos);
    }

    @PostMapping("/{id}/cancelar")
    public MantenimientoDTO cancelar(@PathVariable Long id) {
        return servicio.cancelar(id);
    }
}
