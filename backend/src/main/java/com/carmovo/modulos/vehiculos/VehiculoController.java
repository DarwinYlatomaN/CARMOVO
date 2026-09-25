package com.carmovo.modulos.vehiculos;

import com.carmovo.modulos.auditoria.AuditoriaServicio;
import com.carmovo.modulos.vehiculos.dto.VehiculoDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehiculos")
@CrossOrigin(origins = "*")
public class VehiculoController {

    private final VehiculoServicio vehiculoServicio;
    private final AuditoriaServicio auditoriaServicio;

    public VehiculoController(VehiculoServicio vehiculoServicio, AuditoriaServicio auditoriaServicio) {
        this.vehiculoServicio = vehiculoServicio;
        this.auditoriaServicio = auditoriaServicio;
    }

    @GetMapping
    public ResponseEntity<List<VehiculoDTO>> listarTodos() {
        return ResponseEntity.ok(vehiculoServicio.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehiculoDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(vehiculoServicio.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<VehiculoDTO> crear(@RequestBody VehiculoDTO dto) {
        VehiculoDTO nuevoVehiculo = vehiculoServicio.crearVehiculo(dto);
        auditoriaServicio.registrarSeguro(
                "Flota", "CREAR", "Vehículo", nuevoVehiculo.getIdVehiculo(),
                "Se registró el vehículo " + nombreVehiculo(nuevoVehiculo) + " con estado " + nuevoVehiculo.getEstado() + "."
        );
        return new ResponseEntity<>(nuevoVehiculo, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehiculoDTO> actualizar(@PathVariable Long id, @RequestBody VehiculoDTO dto) {
        VehiculoDTO anterior = vehiculoServicio.obtenerPorId(id);
        VehiculoDTO actualizado = vehiculoServicio.actualizarVehiculo(id, dto);
        auditoriaServicio.registrarSeguro(
                "Flota", "ACTUALIZAR", "Vehículo", id,
                "Se actualizó " + nombreVehiculo(actualizado) + ". Estado: " + anterior.getEstado() + " → " + actualizado.getEstado() + "."
        );
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        VehiculoDTO vehiculo = vehiculoServicio.obtenerPorId(id);
        vehiculoServicio.eliminarVehiculo(id);
        auditoriaServicio.registrarSeguro(
                "Flota", "ELIMINAR", "Vehículo", id,
                "Se eliminó el vehículo " + nombreVehiculo(vehiculo) + "."
        );
        return ResponseEntity.noContent().build();
    }

    private String nombreVehiculo(VehiculoDTO vehiculo) {
        return ((vehiculo.getMarca() == null ? "" : vehiculo.getMarca()) + " " +
                (vehiculo.getModelo() == null ? "" : vehiculo.getModelo())).trim();
    }
}
