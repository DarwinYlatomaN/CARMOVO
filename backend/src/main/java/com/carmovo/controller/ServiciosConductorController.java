package com.carmovo.controller;

import com.carmovo.dto.AlquilerDTO;
import com.carmovo.service.AdminContextoSesion;
import com.carmovo.service.AlquilerServicio;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** "Mis servicios" del Conductor (permiso ADMIN_SERVICIOS). Solo ve y mueve lo asignado a él. */
@RestController
@RequestMapping("/api/v1/admin/servicios")
public class ServiciosConductorController {

    private final AlquilerServicio alquileres;

    public ServiciosConductorController(AlquilerServicio alquileres) {
        this.alquileres = alquileres;
    }

    private Long conductor() {
        return AdminContextoSesion.obtener().orElseThrow().getIdUsuario();
    }

    @GetMapping("/mios")
    public List<AlquilerDTO> misServicios() {
        return alquileres.serviciosDelConductor(conductor());
    }

    @PatchMapping("/{id}/estado")
    public AlquilerDTO avanzar(@PathVariable Long id, @RequestBody Map<String, String> datos) {
        return alquileres.avanzarServicio(id, conductor(), datos == null ? null : datos.get("estado"));
    }
}
