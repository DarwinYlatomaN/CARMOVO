
package com.carmovo.controller;

import com.carmovo.service.UsuarioServicio;
import com.carmovo.service.AlquilerServicio;
import com.carmovo.service.AuditoriaServicio;
import com.carmovo.service.ComprobanteServicio;
import com.carmovo.dto.AlquilerDTO;
import com.carmovo.dto.UsuarioDTO;
import com.carmovo.dto.UsuarioGuardarDTO;
import com.carmovo.dto.RegistroClienteDTO;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioServicio usuarioServicio;
    private final AuditoriaServicio auditoriaServicio;
    private final AlquilerServicio alquilerServicio;
    private final ComprobanteServicio comprobanteServicio;

    public UsuarioController(
            UsuarioServicio usuarioServicio,
            AuditoriaServicio auditoriaServicio,
            AlquilerServicio alquilerServicio,
            ComprobanteServicio comprobanteServicio
    ) {
        this.usuarioServicio = usuarioServicio;
        this.auditoriaServicio = auditoriaServicio;
        this.alquilerServicio = alquilerServicio;
        this.comprobanteServicio = comprobanteServicio;
    }

    @GetMapping("/api/v1/admin/usuarios")
    public ResponseEntity<List<UsuarioDTO>> listarTodos() {
        return ResponseEntity.ok(usuarioServicio.obtenerTodos());
    }

    @GetMapping("/api/v1/admin/usuarios/{id}")
    public ResponseEntity<UsuarioDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(usuarioServicio.obtenerPorId(id));
    }

    @PostMapping("/api/v1/admin/usuarios")
    public ResponseEntity<UsuarioDTO> crear(@Valid @RequestBody UsuarioGuardarDTO dto) {
        UsuarioDTO usuario = usuarioServicio.crearUsuario(dto);

        auditoriaServicio.registrarSeguro(
                "Usuarios", "CREAR", "Usuario", usuario.getIdUsuario(),
                "Se registró el usuario " + nombreUsuario(usuario)
                        + " (" + usuario.getCorreo() + ") con perfil "
                        + usuario.getNombrePerfil() + "."
        );

        return new ResponseEntity<>(usuario, HttpStatus.CREATED);
    }

    @PutMapping("/api/v1/admin/usuarios/{id}")
    public ResponseEntity<UsuarioDTO> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioGuardarDTO dto
    ) {
        UsuarioDTO anterior = usuarioServicio.obtenerPorId(id);
        UsuarioDTO actualizado = usuarioServicio.actualizarUsuario(id, dto);

        auditoriaServicio.registrarSeguro(
                "Usuarios", "ACTUALIZAR", "Usuario", id,
                "Se actualizó el usuario " + nombreUsuario(actualizado)
                        + " (" + actualizado.getCorreo() + "). Perfil: "
                        + anterior.getNombrePerfil() + " \u2192 "
                        + actualizado.getNombrePerfil() + "; estado: "
                        + estadoUsuario(anterior) + " \u2192 "
                        + estadoUsuario(actualizado) + "."
        );

        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/api/v1/admin/usuarios/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        UsuarioDTO usuario = usuarioServicio.obtenerPorId(id);
        usuarioServicio.eliminarUsuario(id);

        auditoriaServicio.registrarSeguro(
                "Usuarios", "ELIMINAR", "Usuario", id,
                "Se eliminó el usuario " + nombreUsuario(usuario)
                        + " (" + usuario.getCorreo() + ")."
        );

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/clientes/registro")
    public ResponseEntity<?> registrarCliente(
            @Valid @RequestBody RegistroClienteDTO dto
    ) {
        try {
            UsuarioGuardarDTO datosUsuario = convertirRegistro(dto);

            UsuarioDTO usuario = usuarioServicio.registrarCliente(datosUsuario);

            auditoriaServicio.registrarSeguro(
                    "Usuarios", "REGISTRO_CLIENTE", "Usuario",
                    usuario.getIdUsuario(),
                    "Se registró el cliente " + nombreUsuario(usuario)
                            + " (" + usuario.getCorreo()
                            + ") desde el sitio público."
            );

            return new ResponseEntity<>(usuario, HttpStatus.CREATED);

        } catch (ResponseStatusException ex) {
            String mensaje = ex.getReason() == null
                    ? "No se pudo completar el registro."
                    : ex.getReason();

            return ResponseEntity
                    .status(ex.getStatusCode())
                    .body(Map.of("message", mensaje));
        }
    }

    @PostMapping("/api/v1/clientes/login")
    public ResponseEntity<UsuarioDTO> iniciarSesionCliente(
            @RequestBody Map<String, String> credenciales
    ) {
        String correo = credenciales == null
                ? null
                : credenciales.get("correo");

        String contrasena = credenciales == null
                ? null
                : credenciales.get("contrasena");

        return ResponseEntity.ok(
                usuarioServicio.autenticarCliente(correo, contrasena)
        );
    }

    @GetMapping("/api/v1/clientes/{id}")
    public ResponseEntity<UsuarioDTO> obtenerPerfilCliente(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                usuarioServicio.obtenerClientePorId(id)
        );
    }

    @PutMapping("/api/v1/clientes/{id}")
    public ResponseEntity<UsuarioDTO> actualizarPerfilCliente(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioGuardarDTO dto
    ) {
        UsuarioDTO actualizado =
                usuarioServicio.actualizarPerfilCliente(id, dto);

        auditoriaServicio.registrarSeguro(
                "Usuarios", "ACTUALIZAR_PERFIL_CLIENTE", "Usuario", id,
                "El cliente " + nombreUsuario(actualizado)
                        + " actualiz\u00f3 los datos de su perfil desde el sitio p\u00fablico."
        );

        return ResponseEntity.ok(actualizado);
    }

    @GetMapping("/api/v1/clientes/{id}/alquileres/ultimo")
    public ResponseEntity<AlquilerDTO> obtenerUltimoAlquilerCliente(
            @PathVariable Long id
    ) {
        usuarioServicio.obtenerClientePorId(id);

        Optional<AlquilerDTO> alquiler =
                alquilerServicio.obtenerUltimoPorUsuario(id);

        return alquiler.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /** Historial completo de alquileres del cliente (más reciente primero). */
    @GetMapping("/api/v1/clientes/{id}/alquileres")
    public ResponseEntity<List<AlquilerDTO>> listarAlquileresCliente(
            @PathVariable Long id
    ) {
        usuarioServicio.obtenerClientePorId(id);

        List<AlquilerDTO> alquileres = alquilerServicio.obtenerPorUsuario(id);
        alquileres.forEach(alquiler -> alquiler.setNumeroComprobante(
                comprobanteServicio.numeroPorAlquiler(alquiler.getIdAlquiler()).orElse(null)
        ));

        return ResponseEntity.ok(alquileres);
    }

    private UsuarioGuardarDTO convertirRegistro(
            RegistroClienteDTO registro
    ) {
        UsuarioGuardarDTO dto = new UsuarioGuardarDTO();

        dto.setNombres(registro.getNombres());
        dto.setApellidos(registro.getApellidos());
        dto.setCorreo(registro.getCorreo());
        dto.setContrasena(registro.getContrasena());
        dto.setTelefono(registro.getTelefono());
        dto.setDocumento(registro.getDocumento());
        dto.setFechaNacimiento(registro.getFechaNacimiento());
        dto.setDomicilio(registro.getDomicilio());
        dto.setDepartamento(registro.getDepartamento());
        dto.setProvincia(registro.getProvincia());
        dto.setDistrito(registro.getDistrito());
        dto.setNumeroLicencia(registro.getNumeroLicencia());
        dto.setCategoriaLicencia(registro.getCategoriaLicencia());
        dto.setVencimientoLicencia(registro.getVencimientoLicencia());

        return dto;
    }

    private String nombreUsuario(UsuarioDTO usuario) {
        return (
                (usuario.getNombres() == null
                        ? ""
                        : usuario.getNombres())
                        + " "
                        + (usuario.getApellidos() == null
                        ? ""
                        : usuario.getApellidos())
        ).trim();
    }

    private String estadoUsuario(UsuarioDTO usuario) {
        return Boolean.TRUE.equals(usuario.getEstado())
                ? "Activo"
                : "Inactivo";
    }
}
