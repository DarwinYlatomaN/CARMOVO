package com.carmovo.controller;


import com.carmovo.service.AdminSesionServicio;
import com.carmovo.dto.LoginAdminDTO;
import com.carmovo.dto.SesionAdminDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import jakarta.servlet.http.HttpServletRequest;
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
    public ResponseEntity<SesionAdminDTO> iniciarSesion(@RequestBody LoginAdminDTO dto, HttpServletRequest request) {
        SesionAdminDTO sesion = adminSesionServicio.iniciarSesion(dto);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie(sesion.getToken(), request.isSecure(), 8 * 60 * 60).toString())
                .body(sesion);
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
            @RequestHeader(value = "Authorization", required = false) String authorization,
            HttpServletRequest request
    ) {
        String token = adminSesionServicio.extraerBearer(authorization);
        adminSesionServicio.cerrarSesion(token);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie("", request.isSecure(), 0).toString())
                .build();
    }

    private ResponseCookie cookie(String valor, boolean secure, long segundos) {
        return ResponseCookie.from("CARMOVO_ADMIN", valor)
                .httpOnly(true).secure(secure).sameSite("Lax")
                .path("/").maxAge(segundos).build();
    }
}
