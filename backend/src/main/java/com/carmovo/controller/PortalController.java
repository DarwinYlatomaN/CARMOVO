package com.carmovo.controller;

import com.carmovo.model.PortalImagen;
import com.carmovo.service.AdminContextoSesion;
import com.carmovo.service.PortalServicio;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Portal web.
 *  - /api/v1/portal/**        → público (lo usa el sitio web).
 *  - /api/v1/admin/portal/**  → administración (permiso ADMIN_PORTAL, validado por el interceptor).
 */
@RestController
public class PortalController {

    private final PortalServicio portal;

    public PortalController(PortalServicio portal) {
        this.portal = portal;
    }

    // ---------------------------------------------------------------- público

    @GetMapping("/api/v1/portal")
    public Map<String, Object> publico() {
        return portal.publico();
    }

    /** Imágenes y videos subidos desde el panel. Admite "Range" para que el video se pueda adelantar. */
    @GetMapping("/api/v1/portal/imagenes/{id}")
    public ResponseEntity<Resource> imagen(@PathVariable Long id) {
        PortalImagen img = portal.imagen(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(img.getTipoContenido()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                .body(new ByteArrayResource(img.getDatos()));
    }

    // ---------------------------------------------------------------- administración

    private String actor() {
        return AdminContextoSesion.obtenerActor();
    }

    @GetMapping("/api/v1/admin/portal")
    public Map<String, Object> editor() {
        return portal.estadoEditor();
    }

    @PutMapping("/api/v1/admin/portal/borrador")
    public Map<String, Object> guardarBorrador(@RequestBody Map<String, String> datos) {
        return portal.guardarBorrador(datos == null ? null : datos.get("contenido"), actor());
    }

    @PostMapping("/api/v1/admin/portal/publicar")
    public Map<String, Object> publicar(@RequestBody(required = false) Map<String, String> datos) {
        return portal.publicar(datos == null ? null : datos.get("resumen"), actor());
    }

    @PostMapping("/api/v1/admin/portal/restaurar-inicial")
    public Map<String, Object> restaurarInicial() {
        return portal.restaurarInicial(actor());
    }

    @PostMapping("/api/v1/admin/portal/descartar")
    public Map<String, Object> descartar() {
        return portal.descartarBorrador();
    }

    @GetMapping("/api/v1/admin/portal/versiones")
    public List<Map<String, Object>> versiones() {
        return portal.historial();
    }

    @PostMapping("/api/v1/admin/portal/versiones/{id}/restaurar")
    public Map<String, Object> restaurar(@PathVariable Long id) {
        return portal.restaurar(id, actor());
    }

    @PostMapping(value = "/api/v1/admin/portal/imagenes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> subirImagen(@RequestParam("archivo") MultipartFile archivo) {
        return portal.subirImagen(archivo);
    }

    @PostMapping(value = "/api/v1/admin/portal/videos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> subirVideo(@RequestParam("archivo") MultipartFile archivo) {
        return portal.subirVideo(archivo);
    }

    @GetMapping("/api/v1/admin/portal/ofertas")
    public List<Map<String, Object>> ofertas() {
        return portal.listarOfertas();
    }

    @PostMapping("/api/v1/admin/portal/ofertas")
    public ResponseEntity<Map<String, Object>> crearOferta(@RequestBody Map<String, Object> datos) {
        return ResponseEntity.status(HttpStatus.CREATED).body(portal.guardarOferta(null, datos, actor()));
    }

    @PutMapping("/api/v1/admin/portal/ofertas/{id}")
    public Map<String, Object> editarOferta(@PathVariable Long id, @RequestBody Map<String, Object> datos) {
        return portal.guardarOferta(id, datos, actor());
    }

    @DeleteMapping("/api/v1/admin/portal/ofertas/{id}")
    public ResponseEntity<Void> eliminarOferta(@PathVariable Long id) {
        portal.eliminarOferta(id);
        return ResponseEntity.noContent().build();
    }
}
