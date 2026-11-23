package com.carmovo.controller;

import com.carmovo.service.ConsultaDniServicio;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Consulta de DNI (RENIEC) para completar nombres y apellidos.
 * Solo para el personal del panel: así nadie de afuera gasta el cupo del token.
 */
@RestController
public class ReniecController {

    private final ConsultaDniServicio servicio;

    public ReniecController(ConsultaDniServicio servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/api/v1/admin/reniec/{dni}")
    public Map<String, Object> consultarDni(@PathVariable String dni) {
        return servicio.consultar(dni);
    }
}
