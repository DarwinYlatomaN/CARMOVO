
package com.carmovo.controller;

import com.carmovo.service.UsuarioServicio;
import com.carmovo.repository.PerfilRepositorio;
import com.carmovo.service.AlquilerServicio;
import com.carmovo.service.AuditoriaServicio;
import com.carmovo.service.ComprobanteServicio;
import com.carmovo.service.ClienteActual;
import com.carmovo.service.JwtServicio;
import com.carmovo.service.RecuperacionContrasenaServicio;
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
    private final PerfilRepositorio perfilRepositorio;
    private final AuditoriaServicio auditoriaServicio;
    private final AlquilerServicio alquilerServicio;
    private final ComprobanteServicio comprobanteServicio;
    private final JwtServicio jwtServicio;
    private final RecuperacionContrasenaServicio recuperacionServicio;
    private final com.carmovo.repository.PagoRepositorio pagoRepositorio;
    private final com.carmovo.service.PoliticasServicio politicas;

    public UsuarioController(
            UsuarioServicio usuarioServicio,
            AuditoriaServicio auditoriaServicio,
            AlquilerServicio alquilerServicio,
            ComprobanteServicio comprobanteServicio,
            PerfilRepositorio perfilRepositorio
    ,
            JwtServicio jwtServicio,
            RecuperacionContrasenaServicio recuperacionServicio,
            com.carmovo.repository.PagoRepositorio pagoRepositorio,
            com.carmovo.service.PoliticasServicio politicas
    ) {
        this.politicas = politicas;
        this.pagoRepositorio = pagoRepositorio;
        this.usuarioServicio = usuarioServicio;
        this.auditoriaServicio = auditoriaServicio;
        this.alquilerServicio = alquilerServicio;
        this.comprobanteServicio = comprobanteServicio;
        this.perfilRepositorio = perfilRepositorio;
        this.jwtServicio = jwtServicio;
        this.recuperacionServicio = recuperacionServicio;
    }

    @GetMapping("/api/v1/admin/usuarios")
    public ResponseEntity<List<UsuarioDTO>> listarTodos() {
        // Los administradores se gestionan únicamente en el módulo protegido del principal.
        return ResponseEntity.ok(usuarioServicio.obtenerTodos().stream()
                .filter(u -> !esAdministrador(u)).toList());
    }

    @GetMapping("/api/v1/admin/usuarios/{id}")
    public ResponseEntity<UsuarioDTO> obtenerPorId(@PathVariable Long id) {
        UsuarioDTO usuario = usuarioServicio.obtenerPorId(id);
        if (esAdministrador(usuario)) throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Las cuentas del personal se gestionan desde Empleados.");
        return ResponseEntity.ok(usuario);
    }

    @PostMapping("/api/v1/admin/usuarios")
    public ResponseEntity<UsuarioDTO> crear(@Valid @RequestBody UsuarioGuardarDTO dto) {
        impedirPerfilAdministrador(dto);
        UsuarioDTO usuario = usuarioServicio.crearUsuario(dto);
        if ("Cliente".equalsIgnoreCase(usuario.getNombrePerfil())) {
            politicas.registrar(usuario.getIdUsuario(), com.carmovo.service.PoliticasServicio.REGISTRO, null,
                    com.carmovo.service.AdminContextoSesion.obtenerActor());
        }

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
        impedirPerfilAdministrador(dto);
        UsuarioDTO anterior = usuarioServicio.obtenerPorId(id);
        impedirModificarAdministrador(anterior);
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
    public ResponseEntity<Map<String, Object>> eliminar(@PathVariable Long id) {
        UsuarioDTO usuario = usuarioServicio.obtenerPorId(id);
        impedirModificarAdministrador(usuario);
        boolean eliminado = usuarioServicio.eliminarUsuario(id);

        String detalle = eliminado
                ? "Se eliminó el usuario " + nombreUsuario(usuario) + " (" + usuario.getCorreo() + ")."
                : "El usuario " + nombreUsuario(usuario) + " (" + usuario.getCorreo()
                        + ") tiene alquileres registrados: se desactivó en lugar de eliminarse.";
        auditoriaServicio.registrarSeguro("Usuarios", eliminado ? "ELIMINAR" : "DESACTIVAR", "Usuario", id, detalle);

        return ResponseEntity.ok(Map.of(
                "eliminado", eliminado,
                "message", eliminado
                        ? "Usuario eliminado correctamente."
                        : "El usuario tiene alquileres registrados, por eso se desactivó en lugar de eliminarse."));
    }

    @PostMapping("/api/v1/clientes/registro")
    public ResponseEntity<?> registrarCliente(
            @Valid @RequestBody RegistroClienteDTO dto
    ) {
        try {
            UsuarioGuardarDTO datosUsuario = convertirRegistro(dto);

            UsuarioDTO usuario = usuarioServicio.registrarCliente(datosUsuario);
            politicas.registrar(usuario.getIdUsuario(), com.carmovo.service.PoliticasServicio.REGISTRO, null, null);

            auditoriaServicio.registrarSeguro(
                    "Usuarios", "REGISTRO_CLIENTE", "Usuario",
                    usuario.getIdUsuario(),
                    "Se registró el cliente " + nombreUsuario(usuario)
                            + " (" + usuario.getCorreo()
                            + ") desde el sitio público."
            );

            usuario.setToken(jwtServicio.generar(usuario.getIdUsuario(), "CLIENTE"));
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

        UsuarioDTO usuario = usuarioServicio.autenticarCliente(correo, contrasena);
        usuario.setToken(jwtServicio.generar(usuario.getIdUsuario(), "CLIENTE"));
        return ResponseEntity.ok(usuario);
    }

    /** Paso 1 de "Olvidé mi contraseña": responde igual exista o no el correo. */
    @PostMapping("/api/v1/clientes/recuperar/solicitar")
    public ResponseEntity<Map<String, String>> solicitarRecuperacion(@RequestBody Map<String, String> datos) {
        recuperacionServicio.solicitar(datos == null ? null : datos.get("correo"));
        return ResponseEntity.ok(Map.of("message",
                "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."));
    }

    /** Paso 2: cambia la contraseña usando el enlace recibido. */
    @PostMapping("/api/v1/clientes/recuperar/confirmar")
    public ResponseEntity<Map<String, String>> confirmarRecuperacion(@RequestBody Map<String, String> datos) {
        recuperacionServicio.confirmar(
                datos == null ? null : datos.get("token"),
                datos == null ? null : datos.get("contrasena"));
        return ResponseEntity.ok(Map.of("message", "Tu contraseña fue actualizada. Ya puedes iniciar sesión."));
    }

    @GetMapping("/api/v1/clientes/{id}")
    public ResponseEntity<UsuarioDTO> obtenerPerfilCliente(
            @PathVariable Long id
    ) {
        ClienteActual.exigirPropietario(id);
        return ResponseEntity.ok(
                usuarioServicio.obtenerClientePorId(id)
        );
    }

    @PutMapping("/api/v1/clientes/{id}")
    public ResponseEntity<UsuarioDTO> actualizarPerfilCliente(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioGuardarDTO dto
    ) {
        ClienteActual.exigirPropietario(id);
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
        ClienteActual.exigirPropietario(id);
        usuarioServicio.obtenerClientePorId(id);

        Optional<AlquilerDTO> alquiler =
                alquilerServicio.obtenerUltimoPorUsuario(id);
        alquiler.ifPresent(a -> pagoRepositorio.findByIdAlquiler(a.getIdAlquiler()).ifPresent(pago -> {
            a.setEstadoPago(pago.getEstado());
            a.setMotivoRechazoPago(pago.getMotivoRechazo());
        }));

        return alquiler.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /** Historial completo de alquileres del cliente (más reciente primero). */
    @GetMapping("/api/v1/clientes/{id}/alquileres")
    public ResponseEntity<List<AlquilerDTO>> listarAlquileresCliente(
            @PathVariable Long id
    ) {
        ClienteActual.exigirPropietario(id);
        usuarioServicio.obtenerClientePorId(id);

        List<AlquilerDTO> alquileres = alquilerServicio.obtenerPorUsuario(id);
        alquileres.forEach(alquiler -> {
            alquiler.setNumeroComprobante(
                    comprobanteServicio.numeroPorAlquiler(alquiler.getIdAlquiler()).orElse(null));
            pagoRepositorio.findByIdAlquiler(alquiler.getIdAlquiler())
                    .ifPresent(pago -> {
                        alquiler.setEstadoPago(pago.getEstado());
                        alquiler.setMotivoRechazoPago(pago.getMotivoRechazo());
                    });
        });

        return ResponseEntity.ok(alquileres);
    }

    /** El personal (Administrador, Agente, Cajero, Conductor) se gestiona en "Empleados". */
    private boolean esAdministrador(UsuarioDTO dto) {
        return com.carmovo.service.PermisosAdministrativos.esRolPersonal(dto.getNombrePerfil());
    }

    private void impedirModificarAdministrador(UsuarioDTO dto) {
        if (esAdministrador(dto)) throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Las cuentas del personal se gestionan únicamente desde Empleados.");
    }

    private void impedirPerfilAdministrador(UsuarioGuardarDTO dto) {
        if (dto != null && dto.getIdPerfil() != null && perfilRepositorio.findById(dto.getIdPerfil())
                .map(p -> com.carmovo.service.PermisosAdministrativos.esRolPersonal(p.getNombre())).orElse(false)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Los roles del personal se asignan desde Empleados, no desde Gestión de usuarios.");
        }
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
