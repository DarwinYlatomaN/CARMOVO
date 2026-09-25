package com.carmovo.modulos.autenticacion;

import com.carmovo.modulos.autenticacion.dto.LoginAdminDTO;
import com.carmovo.modulos.autenticacion.dto.SesionAdminDTO;
import com.carmovo.modulos.usuarios.Usuario;
import com.carmovo.modulos.usuarios.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminSesionServicio {

    private static final int HORAS_SESION = 8;
    private static final String PERFIL_ADMINISTRADOR = "Administrador";

    private final UsuarioRepositorio usuarioRepositorio;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<String, AdminSesion> sesiones = new ConcurrentHashMap<>();

    public AdminSesionServicio(UsuarioRepositorio usuarioRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
    }

    public SesionAdminDTO iniciarSesion(LoginAdminDTO dto) {
        if (dto == null || esVacio(dto.getCorreo()) || esVacio(dto.getContrasena())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Correo y contraseña son obligatorios.");
        }

        String correo = dto.getCorreo().trim().toLowerCase(Locale.ROOT);
        Usuario usuario = usuarioRepositorio.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Correo o contraseña incorrectos."
                ));

        if (!Boolean.TRUE.equals(usuario.getEstado())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario se encuentra inactivo.");
        }

        if (usuario.getPerfil() == null ||
                !PERFIL_ADMINISTRADOR.equalsIgnoreCase(usuario.getPerfil().getNombre())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este usuario no tiene acceso al panel de administración.");
        }

        if (usuario.getContrasena() == null || !usuario.getContrasena().startsWith("$2") ||
                !passwordEncoder.matches(dto.getContrasena(), usuario.getContrasena())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos.");
        }

        limpiarSesionesExpiradas();
        cerrarSesionesDelUsuario(usuario.getIdUsuario());

        String token = generarToken();
        LocalDateTime expiraEn = LocalDateTime.now().plusHours(HORAS_SESION);
        String nombreCompleto = construirNombre(usuario);

        AdminSesion sesion = new AdminSesion(
                token,
                usuario.getIdUsuario(),
                nombreCompleto,
                usuario.getCorreo(),
                usuario.getPerfil().getNombre(),
                expiraEn
        );

        sesiones.put(token, sesion);
        return convertirADto(sesion);
    }

    public AdminSesion validarToken(String token) {
        if (esVacio(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión como administrador.");
        }

        AdminSesion sesion = sesiones.get(token);
        if (sesion == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "La sesión no es válida o ya terminó.");
        }

        if (sesion.estaExpirada()) {
            sesiones.remove(token);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "La sesión del administrador ha expirado.");
        }

        Usuario usuario = usuarioRepositorio.findById(sesion.getIdUsuario())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "El usuario de la sesión ya no existe."));

        if (!Boolean.TRUE.equals(usuario.getEstado()) || usuario.getPerfil() == null ||
                !PERFIL_ADMINISTRADOR.equalsIgnoreCase(usuario.getPerfil().getNombre())) {
            sesiones.remove(token);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario ya no tiene acceso administrativo.");
        }

        return sesion;
    }

    public SesionAdminDTO obtenerSesion(String token) {
        return convertirADto(validarToken(token));
    }

    public void cerrarSesion(String token) {
        if (!esVacio(token)) {
            sesiones.remove(token);
        }
    }

    public String extraerBearer(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }
        String token = authorization.substring(7).trim();
        return token.isEmpty() ? null : token;
    }

    private void limpiarSesionesExpiradas() {
        sesiones.entrySet().removeIf(entrada -> entrada.getValue().estaExpirada());
    }

    private void cerrarSesionesDelUsuario(Long idUsuario) {
        sesiones.entrySet().removeIf(entrada -> entrada.getValue().getIdUsuario().equals(idUsuario));
    }

    private String generarToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private SesionAdminDTO convertirADto(AdminSesion sesion) {
        SesionAdminDTO dto = new SesionAdminDTO();
        dto.setToken(sesion.getToken());
        dto.setIdUsuario(sesion.getIdUsuario());
        dto.setNombreCompleto(sesion.getNombreCompleto());
        dto.setCorreo(sesion.getCorreo());
        dto.setPerfil(sesion.getPerfil());
        dto.setExpiraEn(sesion.getExpiraEn());
        return dto;
    }

    private String construirNombre(Usuario usuario) {
        String nombres = usuario.getNombres() == null ? "" : usuario.getNombres().trim();
        String apellidos = usuario.getApellidos() == null ? "" : usuario.getApellidos().trim();
        String completo = (nombres + " " + apellidos).trim();
        return completo.isBlank() ? usuario.getCorreo() : completo;
    }

    private boolean esVacio(String valor) {
        return valor == null || valor.isBlank();
    }
}
