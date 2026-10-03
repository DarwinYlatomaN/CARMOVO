package com.carmovo.controller;


import com.carmovo.dto.ReservaDTO;
import com.carmovo.service.ReservaServicio;
import com.carmovo.dto.AlquilerDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/v1/reservas")
public class ReservaController {

    private final ReservaServicio reservaServicio;

    public ReservaController(ReservaServicio reservaServicio) {
        this.reservaServicio = reservaServicio;
    }

    @PostMapping
    public ResponseEntity<?> crearReserva(@RequestBody ReservaDTO reservaDTO) {
        try {
            AlquilerDTO alquiler = reservaServicio.procesarReserva(reservaDTO);
            return ResponseEntity.ok(alquiler);
        } catch (ResponseStatusException e) {
            String mensaje = e.getReason() == null ? "No se pudo procesar la reserva." : e.getReason();
            return ResponseEntity.status(e.getStatusCode()).body(mensaje);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("No se pudo procesar la reserva: " + e.getMessage());
        }
    }
}
