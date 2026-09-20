package com.carmovo.controlador;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestControlador {

    @GetMapping("/api/test")
    public String probarConexion() {
        return "Hola desde el backend de Carmovo El servidor está funcionando perfectamente";
    }
}