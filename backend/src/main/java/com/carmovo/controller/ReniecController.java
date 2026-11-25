package com.carmovo.controller;

import com.carmovo.service.ConsultaDniServicio;
import com.carmovo.service.ConsultaRucServicio;
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
    private final ConsultaRucServicio ruc;

    public ReniecController(ConsultaDniServicio servicio, ConsultaRucServicio ruc) {
        this.servicio = servicio;
        this.ruc = ruc;
    }

    @GetMapping("/api/v1/admin/reniec/{dni}")
    public Map<String, Object> consultarDni(@PathVariable String dni) {
        return servicio.consultar(dni);
    }

    /** Consulta de RUC (SUNAT) para la factura. Solo para clientes con sesión (reserva). */
    @GetMapping("/api/v1/reservas/ruc/{numero}")
    public Map<String, Object> consultarRuc(@PathVariable String numero) {
        return ruc.consultar(numero);
    }
}