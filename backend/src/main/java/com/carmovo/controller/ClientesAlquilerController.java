package com.carmovo.controller;

import com.carmovo.dto.ClienteAlquilerResumenDTO;
import com.carmovo.service.UsuarioServicio;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/** La autorización ADMIN_ALQUILERES se valida en AdminAutenticacionInterceptor. */
@RestController
public class ClientesAlquilerController {

    private final UsuarioServicio usuarios;

    public ClientesAlquilerController(UsuarioServicio usuarios) {
        this.usuarios = usuarios;
    }

    @GetMapping("/api/v1/admin/clientes-alquileres")
    public List<ClienteAlquilerResumenDTO> listarClientesActivos() {
        return usuarios.listarClientesParaAlquileres();
    }
}
