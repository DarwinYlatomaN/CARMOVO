package com.carmovo.modulos.alquileres;

import com.carmovo.modulos.alquileres.dto.AlquilerDTO;
import com.carmovo.modulos.alquileres.dto.AlquilerGuardarDTO;
import com.carmovo.modulos.auditoria.AuditoriaServicio;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/alquileres")
@CrossOrigin(origins = "*")
public class AlquilerController {

    private final AlquilerServicio alquilerServicio;
    private final AuditoriaServicio auditoriaServicio;

    public AlquilerController(AlquilerServicio alquilerServicio, AuditoriaServicio auditoriaServicio) {
        this.alquilerServicio = alquilerServicio;
        this.auditoriaServicio = auditoriaServicio;
    }

    @GetMapping
    public ResponseEntity<List<AlquilerDTO>> listarTodos() {
        return ResponseEntity.ok(alquilerServicio.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlquilerDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(alquilerServicio.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<AlquilerDTO> crear(@RequestBody AlquilerGuardarDTO dto) {
        AlquilerDTO alquiler = alquilerServicio.crear(dto);
        auditoriaServicio.registrarSeguro(
                "Alquileres", "CREAR", "Alquiler", alquiler.getIdAlquiler(),
                "Se registró el alquiler #" + alquiler.getIdAlquiler() + " para " + alquiler.getCliente() +
                        " con " + alquiler.getVehiculo() + ", estado " + alquiler.getEstado() + "."
        );
        return new ResponseEntity<>(alquiler, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlquilerDTO> actualizar(@PathVariable Long id, @RequestBody AlquilerGuardarDTO dto) {
        AlquilerDTO anterior = alquilerServicio.obtenerPorId(id);
        AlquilerDTO actualizado = alquilerServicio.actualizar(id, dto);
        auditoriaServicio.registrarSeguro(
                "Alquileres", "ACTUALIZAR", "Alquiler", id,
                "Se actualizó el alquiler #" + id + " de " + actualizado.getCliente() + ". Estado: " +
                        anterior.getEstado() + " → " + actualizado.getEstado() + "."
        );
        return ResponseEntity.ok(actualizado);
    }

    @PatchMapping("/{id}/estado")
    public ResponseEntity<AlquilerDTO> cambiarEstado(@PathVariable Long id, @RequestBody Map<String, String> body) {
        AlquilerDTO anterior = alquilerServicio.obtenerPorId(id);
        AlquilerDTO actualizado = alquilerServicio.cambiarEstado(id, body.get("estado"));
        auditoriaServicio.registrarSeguro(
                "Alquileres", "CAMBIAR_ESTADO", "Alquiler", id,
                "El alquiler #" + id + " cambió de " + anterior.getEstado() + " a " + actualizado.getEstado() +
                        ". La flota se sincronizó automáticamente cuando correspondía."
        );
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        AlquilerDTO alquiler = alquilerServicio.obtenerPorId(id);
        alquilerServicio.eliminar(id);
        auditoriaServicio.registrarSeguro(
                "Alquileres", "ELIMINAR", "Alquiler", id,
                "Se eliminó el alquiler #" + id + " de " + alquiler.getCliente() + " con " + alquiler.getVehiculo() + "."
        );
        return ResponseEntity.noContent().build();
    }
}
