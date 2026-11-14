package com.carmovo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseStatus;

/** Vista interna a la que se reenvía el intento de abrir una página prohibida. */
@Controller
public class AccesoDenegadoVistaController {
    @GetMapping("/acceso-denegado")
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public String mostrarAccesoDenegado() {
        return "admin/acceso-denegado";
    }
}
