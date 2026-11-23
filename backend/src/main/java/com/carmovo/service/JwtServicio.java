package com.carmovo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Emite y valida tokens JWT (HS256) para los clientes del sitio público.
 *
 * Se implementa con las clases criptográficas estándar de Java (HMAC-SHA256),
 * sin librerías externas. El token contiene:
 *   sub = id del usuario, rol = CLIENTE, iat = emitido, exp = vence.
 *
 * La clave secreta se configura con la variable de entorno CARMOVO_JWT_SECRETO
 * (mínimo 32 caracteres). Si cambia la clave, todas las sesiones se invalidan.
 */
@Service
public class JwtServicio {

    private static final String ALGORITMO = "HmacSHA256";
    private static final String CABECERA = base64("{\"alg\":\"HS256\",\"typ\":\"JWT\"}"
            .getBytes(StandardCharsets.UTF_8));
    private static final Pattern SUB = Pattern.compile("\"sub\":\"(\\d+)\"");
    private static final Pattern ROL = Pattern.compile("\"rol\":\"([A-Z_]+)\"");
    private static final Pattern EXP = Pattern.compile("\"exp\":(\\d+)");

    private final byte[] clave;
    private final long minutosVigencia;

    public JwtServicio(
            @Value("${carmovo.jwt.secreto}") String secreto,
            @Value("${carmovo.jwt.minutos:480}") long minutosVigencia
    ) {
        if (secreto == null || secreto.length() < 32) {
            throw new IllegalStateException(
                    "La clave carmovo.jwt.secreto (CARMOVO_JWT_SECRETO) debe tener al menos 32 caracteres.");
        }
        this.clave = secreto.getBytes(StandardCharsets.UTF_8);
        this.minutosVigencia = minutosVigencia;
    }

    /** Datos del cliente contenidos en un token válido. */
    public record DatosToken(Long idUsuario, String rol, Instant expira) {}

    public String generar(Long idUsuario, String rol) {
        long ahora = Instant.now().getEpochSecond();
        long vence = ahora + minutosVigencia * 60;
        String carga = "{\"sub\":\"" + idUsuario + "\",\"rol\":\"" + rol
                + "\",\"iat\":" + ahora + ",\"exp\":" + vence + "}";
        String cuerpo = CABECERA + "." + base64(carga.getBytes(StandardCharsets.UTF_8));
        return cuerpo + "." + firmar(cuerpo);
    }

    /** Devuelve los datos si la firma es correcta y el token no venció. */
    public Optional<DatosToken> validar(String token) {
        if (token == null) return Optional.empty();
        String[] partes = token.split("\\.");
        if (partes.length != 3 || !CABECERA.equals(partes[0])) return Optional.empty();

        String esperada = firmar(partes[0] + "." + partes[1]);
        if (!MessageDigest.isEqual(
                esperada.getBytes(StandardCharsets.US_ASCII),
                partes[2].getBytes(StandardCharsets.US_ASCII))) {
            return Optional.empty();
        }

        String carga;
        try {
            carga = new String(Base64.getUrlDecoder().decode(partes[1]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }

        Matcher sub = SUB.matcher(carga);
        Matcher rol = ROL.matcher(carga);
        Matcher exp = EXP.matcher(carga);
        if (!sub.find() || !rol.find() || !exp.find()) return Optional.empty();

        Instant expira = Instant.ofEpochSecond(Long.parseLong(exp.group(1)));
        if (Instant.now().isAfter(expira)) return Optional.empty();

        return Optional.of(new DatosToken(Long.valueOf(sub.group(1)), rol.group(1), expira));
    }

    private String firmar(String contenido) {
        try {
            Mac mac = Mac.getInstance(ALGORITMO);
            mac.init(new SecretKeySpec(clave, ALGORITMO));
            return base64(mac.doFinal(contenido.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo firmar el token.", e);
        }
    }

    private static String base64(byte[] datos) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(datos);
    }
}
