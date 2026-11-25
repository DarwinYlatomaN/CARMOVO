package com.carmovo.controller;

import com.carmovo.service.AlquilerServicio;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Buscador del inicio: autos disponibles entre dos fechas (público, sin iniciar sesión). */
@RestController
public class DisponibilidadController {

    private final AlquilerServicio alquileres;

    public DisponibilidadController(AlquilerServicio alquileres) {
        this.alquileres = alquileres;
    }

    @GetMapping("/api/v1/vehiculos/disponibles")
    public List<Map<String, Object>> disponibles(@RequestParam String inicio, @RequestParam String fin) {
        return alquileres.vehiculosDisponibles(fecha(inicio), fecha(fin));
    }

    private static LocalDate fecha(String valor) {
        try {
            return LocalDate.parse(valor);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las fechas no son válidas.");
        }
    }
}
