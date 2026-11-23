package com.carmovo.service;

import com.carmovo.model.Usuario;
import com.carmovo.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * "Mi perfil" del personal (menú de la esquina superior derecha del panel):
 * ver y actualizar sus datos, poner una foto y cambiar su contraseña.
 * Cada persona solo modifica su propia cuenta (el id sale de la sesión, no del navegador).
 */
@Service
public class PerfilAdminServicio {

    private static final String PATRON_NOMBRE = "^[\\p{L}][\\p{L} '.\\-]{1,99}$";

    private final UsuarioRepositorio usuarios;
    private final PortalServicio imagenes;
    private final AuditoriaServicio auditoria;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public PerfilAdminServicio(UsuarioRepositorio usuarios, PortalServicio imagenes, AuditoriaServicio auditoria) {
        this.usuarios = usuarios;
        this.imagenes = imagenes;
        this.auditoria = auditoria;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obtener(Long idUsuario) {
        return aMapa(buscar(idUsuario));
    }

    @Transactional
    public Map<String, Object> actualizar(Long idUsuario, Map<String, String> datos) {
        Usuario u = buscar(idUsuario);
        String nombres = limpiar(datos.get("nombres"));
        String apellidos = limpiar(datos.get("apellidos"));
        if (!nombres.matches(PATRON_NOMBRE)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe tus nombres (solo letras, mínimo 2).");
        }
        if (!apellidos.matches(PATRON_NOMBRE)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe tus apellidos (solo letras, mínimo 2).");
        }
        String telefono = limpiar(datos.get("telefono")).replaceAll("\\s", "");
        if (!telefono.isEmpty()) {
            if (!ValidadorDocumentos.celularValido(telefono)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El celular debe tener 9 dígitos y empezar con 9.");
            }
            if (usuarios.existsByTelefonoAndIdUsuarioNot(telefono, idUsuario)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese celular ya está registrado en otra cuenta.");
            }
        }
        u.setNombres(nombres);
        u.setApellidos(apellidos);
        u.setTelefono(telefono.isEmpty() ? null : telefono);
        usuarios.save(u);
        auditoria.registrarSeguro("Mi perfil", "ACTUALIZAR_PERFIL", "Usuario", idUsuario,
                u.getCorreo() + " actualizó sus datos personales.");
        return aMapa(u);
    }

    @Transactional
    public void cambiarContrasena(Long idUsuario, Map<String, String> datos) {
        Usuario u = buscar(idUsuario);
        String actual = datos.getOrDefault("actual", "");
        String nueva = datos.getOrDefault("nueva", "");
        String confirmacion = datos.getOrDefault("confirmacion", "");
        if (actual == null || u.getContrasena() == null || !encoder.matches(actual, u.getContrasena())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña actual no es correcta.");
        }
        if (nueva == null || nueva.length() < 8 || nueva.length() > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe tener entre 8 y 72 caracteres.");
        }
        if (!nueva.matches(".*\\p{L}.*") || !nueva.matches(".*\\d.*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe tener al menos una letra y un número.");
        }
        if (!nueva.equals(confirmacion)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La confirmación no coincide con la nueva contraseña.");
        }
        if (encoder.matches(nueva, u.getContrasena())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La nueva contraseña debe ser distinta de la actual.");
        }
        u.setContrasena(encoder.encode(nueva));
        usuarios.save(u);
        auditoria.registrarSeguro("Mi perfil", "CAMBIAR_CONTRASENA", "Usuario", idUsuario,
                u.getCorreo() + " cambió su contraseña.");
    }

    @Transactional
    public Map<String, Object> cambiarFoto(Long idUsuario, MultipartFile archivo) {
        Usuario u = buscar(idUsuario);
        imagenes.cambiarFotoPerfil(idUsuario, archivo);
        return aMapa(u);
    }

    @Transactional
    public Map<String, Object> quitarFoto(Long idUsuario) {
        Usuario u = buscar(idUsuario);
        imagenes.quitarFotoPerfil(idUsuario);
        return aMapa(u);
    }

    private Usuario buscar(Long idUsuario) {
        return usuarios.findById(idUsuario).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "La cuenta no existe."));
    }

    private Map<String, Object> aMapa(Usuario u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("idUsuario", u.getIdUsuario());
        m.put("nombres", u.getNombres());
        m.put("apellidos", u.getApellidos());
        m.put("nombreCompleto", (u.getNombres() + " " + u.getApellidos()).trim());
        m.put("correo", u.getCorreo());
        m.put("telefono", u.getTelefono());
        m.put("perfil", u.getPerfil() == null ? null : u.getPerfil().getNombre());
        m.put("foto", imagenes.fotoPerfil(u.getIdUsuario()));
        return m;
    }

    private static String limpiar(String v) {
        return v == null ? "" : v.trim().replaceAll("\\s+", " ");
    }
}
