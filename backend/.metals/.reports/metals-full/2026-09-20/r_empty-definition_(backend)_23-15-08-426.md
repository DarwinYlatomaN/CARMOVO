error id: file:///C:/CARMOVO_PROY/CARMOVO/backend/src/main/java/com/carmovo/modulos/vehiculos/VehiculoController.java:org/springframework/web/bind/annotation/RestController#
file:///C:/CARMOVO_PROY/CARMOVO/backend/src/main/java/com/carmovo/modulos/vehiculos/VehiculoController.java
empty definition using pc, found symbol in pc: 
found definition using semanticdb; symbol org/springframework/web/bind/annotation/RestController#
empty definition using fallback
non-local guesses:

offset: 346
uri: file:///C:/CARMOVO_PROY/CARMOVO/backend/src/main/java/com/carmovo/modulos/vehiculos/VehiculoController.java
text:
```scala
package com.carmovo.modulos.vehiculos;

import com.carmovo.modulos.vehiculos.dto.VehiculoDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

@RestController@@
@RequestMapping("/api/v1/vehiculos")
@CrossOrigin(origins = "*")
public class VehiculoController {

    private final VehiculoServicio vehiculoServicio;

    public VehiculoController(VehiculoServicio vehiculoServicio) {
        this.vehiculoServicio = vehiculoServicio;
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
        return new ResponseEntity<>(nuevoVehiculo, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehiculoDTO> actualizar(@PathVariable Long id, @RequestBody VehiculoDTO dto) {
        return ResponseEntity.ok(vehiculoServicio.actualizarVehiculo(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        vehiculoServicio.eliminarVehiculo(id);
        return ResponseEntity.noContent().build();
    }
}
```


#### Short summary: 

empty definition using pc, found symbol in pc: 