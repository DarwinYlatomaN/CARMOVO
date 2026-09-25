package com.carmovo.modulos.usuarios;

import com.carmovo.modulos.auditoria.AuditoriaServicio;
import com.carmovo.modulos.usuarios.dto.UsuarioDTO;
import com.carmovo.modulos.usuarios.dto.UsuarioGuardarDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioServicio usuarioServicio;
    private final AuditoriaServicio auditoriaServicio;

    public UsuarioController(UsuarioServicio usuarioServicio, AuditoriaServicio auditoriaServicio) {
        this.usuarioServicio = usuarioServicio;
        this.auditoriaServicio = auditoriaServicio;
    }

    @GetMapping
    public ResponseEntity<List<UsuarioDTO>> listarTodos() {
        return ResponseEntity.ok(usuarioServicio.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioServicio.obtenerPorId(id));
    }

    @PostMapping
    public ResponseEntity<UsuarioDTO> crear(@RequestBody UsuarioGuardarDTO dto) {
        UsuarioDTO usuario = usuarioServicio.crearUsuario(dto);
        auditoriaServicio.registrarSeguro(
                "Usuarios", "CREAR", "Usuario", usuario.getIdUsuario(),
                "Se registró el usuario " + nombreUsuario(usuario) + " (" + usuario.getCorreo() + ") con perfil " + usuario.getNombrePerfil() + "."
        );
        return new ResponseEntity<>(usuario, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> actualizar(@PathVariable Long id, @RequestBody UsuarioGuardarDTO dto) {
        UsuarioDTO anterior = usuarioServicio.obtenerPorId(id);
        UsuarioDTO actualizado = usuarioServicio.actualizarUsuario(id, dto);
        auditoriaServicio.registrarSeguro(
                "Usuarios", "ACTUALIZAR", "Usuario", id,
                "Se actualizó el usuario " + nombreUsuario(actualizado) + " (" + actualizado.getCorreo() + "). Perfil: " +
                        anterior.getNombrePerfil() + " → " + actualizado.getNombrePerfil() + "; estado: " +
                        estadoUsuario(anterior) + " → " + estadoUsuario(actualizado) + "."
        );
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        UsuarioDTO usuario = usuarioServicio.obtenerPorId(id);
        usuarioServicio.eliminarUsuario(id);
        auditoriaServicio.registrarSeguro(
                "Usuarios", "ELIMINAR", "Usuario", id,
                "Se eliminó el usuario " + nombreUsuario(usuario) + " (" + usuario.getCorreo() + ")."
        );
        return ResponseEntity.noContent().build();
    }

    private String nombreUsuario(UsuarioDTO usuario) {
        return ((usuario.getNombres() == null ? "" : usuario.getNombres()) + " " +
                (usuario.getApellidos() == null ? "" : usuario.getApellidos())).trim();
    }

    private String estadoUsuario(UsuarioDTO usuario) {
        return Boolean.TRUE.equals(usuario.getEstado()) ? "Activo" : "Inactivo";
    }
}
