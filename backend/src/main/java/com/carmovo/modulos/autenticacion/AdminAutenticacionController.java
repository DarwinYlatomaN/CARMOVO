package com.carmovo.modulos.autenticacion;

import com.carmovo.modulos.autenticacion.dto.LoginAdminDTO;
import com.carmovo.modulos.autenticacion.dto.SesionAdminDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/autenticacion")
@CrossOrigin(origins = "*")
public class AdminAutenticacionController {

    private final AdminSesionServicio adminSesionServicio;

    public AdminAutenticacionController(AdminSesionServicio adminSesionServicio) {
        this.adminSesionServicio = adminSesionServicio;
    }

    @PostMapping("/login")
    public ResponseEntity<SesionAdminDTO> iniciarSesion(@RequestBody LoginAdminDTO dto) {
        return ResponseEntity.ok(adminSesionServicio.iniciarSesion(dto));
    }

    @GetMapping("/sesion")
    public ResponseEntity<SesionAdminDTO> obtenerSesion(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        String token = adminSesionServicio.extraerBearer(authorization);
        return ResponseEntity.ok(adminSesionServicio.obtenerSesion(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> cerrarSesion(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        String token = adminSesionServicio.extraerBearer(authorization);
        adminSesionServicio.cerrarSesion(token);
        return ResponseEntity.noContent().build();
    }
}
