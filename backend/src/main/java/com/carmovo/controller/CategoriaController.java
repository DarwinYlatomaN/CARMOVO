package com.carmovo.controller;

import com.carmovo.service.CategoriaServicio;
import com.carmovo.service.PortalServicio;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Categorías de vehículos e imágenes de la flota.
 * Público: GET /api/v1/categorias (solo activas).
 * Panel (permiso ADMIN_FLOTA): CRUD en /api/v1/admin/categorias y subida de imágenes
 * en /api/v1/admin/vehiculos/imagen (JPG, PNG o WEBP de hasta 2 MB, guardadas en la base de datos).
 */
@RestController
public class CategoriaController {

    private final CategoriaServicio categorias;
    private final PortalServicio imagenes;

    public CategoriaController(CategoriaServicio categorias, PortalServicio imagenes) {
        this.categorias = categorias;
        this.imagenes = imagenes;
    }

    @GetMapping("/api/v1/categorias")
    public List<Map<String, Object>> publicas() {
        return categorias.listarPublicas();
    }

    @GetMapping("/api/v1/admin/categorias")
    public List<Map<String, Object>> todas() {
        return categorias.listarTodas();
    }

    @PostMapping("/api/v1/admin/categorias")
    public ResponseEntity<Map<String, Object>> crear(@RequestBody Map<String, Object> datos) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categorias.guardar(null, datos));
    }

    @PutMapping("/api/v1/admin/categorias/{id}")
    public Map<String, Object> editar(@PathVariable Long id, @RequestBody Map<String, Object> datos) {
        return categorias.guardar(id, datos);
    }

    @DeleteMapping("/api/v1/admin/categorias/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        categorias.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/api/v1/admin/vehiculos/imagen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> subirImagen(@RequestParam("archivo") MultipartFile archivo) {
        return imagenes.subirImagen(archivo);
    }
}
