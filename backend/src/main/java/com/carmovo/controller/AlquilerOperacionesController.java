package com.carmovo.controller;

import com.carmovo.dto.AlquilerDTO;
import com.carmovo.dto.UsuarioDTO;
import com.carmovo.service.AdminContextoSesion;
import com.carmovo.service.AlquilerServicio;
import com.carmovo.service.InspeccionServicio;
import com.carmovo.service.UsuarioServicio;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Entrega, devolución y asignación de chofer (permiso ADMIN_ALQUILERES). */
@RestController
@RequestMapping("/api/v1/admin/alquileres")
public class AlquilerOperacionesController {

    private final InspeccionServicio inspecciones;
    private final AlquilerServicio alquileres;
    private final UsuarioServicio usuarios;

    public AlquilerOperacionesController(InspeccionServicio inspecciones, AlquilerServicio alquileres,
                                         UsuarioServicio usuarios) {
        this.inspecciones = inspecciones;
        this.alquileres = alquileres;
        this.usuarios = usuarios;
    }

    @GetMapping("/{id}/inspecciones")
    public Map<String, Object> detalle(@PathVariable Long id) {
        return inspecciones.detalle(id);
    }

    @PostMapping("/{id}/entrega")
    public Map<String, Object> entregar(@PathVariable Long id, @RequestBody Map<String, String> d) {
        return inspecciones.registrarEntrega(id, entero(d.get("kilometraje")), entero(d.get("combustible")),
                d.get("observaciones"), d.get("danos"), AdminContextoSesion.obtenerActor());
    }

    @PostMapping("/{id}/devolucion")
    public Map<String, Object> devolver(@PathVariable Long id, @RequestBody Map<String, String> d) {
        return inspecciones.registrarDevolucion(id, entero(d.get("kilometraje")), entero(d.get("combustible")),
                d.get("observaciones"), d.get("danos"), decimal(d.get("montoDanos")), fecha(d.get("fechaDevolucion")),
                AdminContextoSesion.obtenerActor());
    }

    /** Conductores activos (para asignar choferes). */
    @GetMapping("/conductores")
    public List<UsuarioDTO> conductores() {
        return usuarios.obtenerTodos().stream()
                .filter(u -> "Conductor".equalsIgnoreCase(u.getNombrePerfil()) && Boolean.TRUE.equals(u.getEstado()))
                .toList();
    }

    @PatchMapping("/{id}/chofer")
    public AlquilerDTO asignarChofer(@PathVariable Long id, @RequestBody Map<String, String> d) {
        Long idConductor;
        try {
            idConductor = Long.valueOf(d.get("idConductor"));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un conductor.");
        }
        return alquileres.asignarConductor(id, idConductor);
    }

    private static Integer entero(String v) {
        try { return v == null || v.isBlank() ? null : Integer.valueOf(v.trim()); }
        catch (NumberFormatException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa números válidos."); }
    }

    private static BigDecimal decimal(String v) {
        try { return v == null || v.isBlank() ? null : new BigDecimal(v.trim()); }
        catch (NumberFormatException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El monto no es válido."); }
    }

    private static LocalDate fecha(String v) {
        try { return v == null || v.isBlank() ? null : LocalDate.parse(v.trim()); }
        catch (RuntimeException e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha no es válida."); }
    }
}
