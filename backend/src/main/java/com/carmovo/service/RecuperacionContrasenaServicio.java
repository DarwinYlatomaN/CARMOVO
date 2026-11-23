package com.carmovo.service;

import com.carmovo.model.RestablecimientoContrasena;
import com.carmovo.model.Usuario;
import com.carmovo.repository.RestablecimientoContrasenaRepositorio;
import com.carmovo.repository.UsuarioRepositorio;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

/**
 * Recuperación de contraseña de clientes:
 *  1. solicitar(correo): crea un enlace de un solo uso válido 30 minutos y lo envía por correo.
 *  2. confirmar(token, nueva): valida el enlace y cambia la contraseña.
 *
 * Por seguridad, solicitar() responde lo mismo exista o no el correo
 * (así nadie puede averiguar qué correos están registrados).
 */
@Service
public class RecuperacionContrasenaServicio {

    private static final int MINUTOS_VIGENCIA = 30;

    private final UsuarioRepositorio usuarios;
    private final RestablecimientoContrasenaRepositorio restablecimientos;
    private final CorreoServicio correo;
    private final AuditoriaServicio auditoria;
    private final String urlPublica;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final SecureRandom aleatorio = new SecureRandom();

    public RecuperacionContrasenaServicio(UsuarioRepositorio usuarios,
                                          RestablecimientoContrasenaRepositorio restablecimientos,
                                          CorreoServicio correo,
                                          AuditoriaServicio auditoria,
                                          @Value("${carmovo.url-publica:http://localhost:8080}") String urlPublica) {
        this.usuarios = usuarios;
        this.restablecimientos = restablecimientos;
        this.correo = correo;
        this.auditoria = auditoria;
        this.urlPublica = urlPublica.endsWith("/") ? urlPublica.substring(0, urlPublica.length() - 1) : urlPublica;
    }

    @Transactional
    public void solicitar(String correoIngresado) {
        if (correoIngresado == null || correoIngresado.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa tu correo electrónico.");
        }
        String correoNormal = correoIngresado.trim().toLowerCase(Locale.ROOT);
        usuarios.findByCorreoIgnoreCase(correoNormal)
                .filter(u -> Boolean.TRUE.equals(u.getEstado()))
                .filter(u -> u.getPerfil() != null && "Cliente".equalsIgnoreCase(u.getPerfil().getNombre()))
                .ifPresent(this::crearYEnviar);
    }

    private void crearYEnviar(Usuario usuario) {
        restablecimientos.invalidarPendientes(usuario.getIdUsuario());

        byte[] bytes = new byte[32];
        aleatorio.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RestablecimientoContrasena r = new RestablecimientoContrasena();
        r.setIdUsuario(usuario.getIdUsuario());
        r.setTokenHash(sha256(token));
        r.setExpira(LocalDateTime.now().plusMinutes(MINUTOS_VIGENCIA));
        r.setUsado(false);
        restablecimientos.save(r);

        String enlace = urlPublica + "/recuperar-password?token=" + token;
        correo.enviar(usuario.getCorreo(), "Restablece tu contraseña de CARMOVO",
                "Hola " + usuario.getNombres() + ",\n\n"
                        + "Recibimos una solicitud para cambiar tu contraseña.\n"
                        + "Abre este enlace (vence en " + MINUTOS_VIGENCIA + " minutos):\n\n"
                        + enlace + "\n\n"
                        + "Si no fuiste tú, ignora este mensaje: tu contraseña no cambiará.");

        auditoria.registrarSeguro("Usuarios", "SOLICITAR_RECUPERACION", "Usuario", usuario.getIdUsuario(),
                "Se envió un enlace de recuperación de contraseña a " + usuario.getCorreo() + ".");
    }

    @Transactional
    public void confirmar(String token, String nuevaContrasena) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El enlace no es válido.");
        }
        if (nuevaContrasena == null || nuevaContrasena.length() < 8 || nuevaContrasena.length() > 72) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La contraseña debe tener entre 8 y 72 caracteres.");
        }

        RestablecimientoContrasena r = restablecimientos.findByTokenHash(sha256(token.trim()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "El enlace no es válido. Solicita uno nuevo."));
        if (r.isUsado()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este enlace ya fue usado. Solicita uno nuevo.");
        }
        if (LocalDateTime.now().isAfter(r.getExpira())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El enlace venció. Solicita uno nuevo.");
        }

        Usuario usuario = usuarios.findById(r.getIdUsuario())
                .filter(u -> Boolean.TRUE.equals(u.getEstado()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cuenta no está disponible."));

        usuario.setContrasena(encoder.encode(nuevaContrasena));
        usuarios.save(usuario);
        r.setUsado(true);
        restablecimientos.save(r);

        auditoria.registrarSeguro("Usuarios", "RESTABLECER_CONTRASENA", "Usuario", usuario.getIdUsuario(),
                "El cliente " + usuario.getCorreo() + " restableció su contraseña con un enlace de recuperación.");
    }

    private static String sha256(String texto) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(texto.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
