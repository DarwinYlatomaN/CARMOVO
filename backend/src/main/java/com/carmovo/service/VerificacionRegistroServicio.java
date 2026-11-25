package com.carmovo.service;

import com.carmovo.dto.RegistroClienteDTO;
import com.carmovo.model.VerificacionRegistro;
import com.carmovo.repository.VerificacionRegistroRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;

/**
 * Verificación del correo al crear una cuenta desde el sitio web.
 *
 *  1. iniciar(): valida los datos, guarda el registro pendiente y envía un código de 6 dígitos.
 *  2. verificar(): con el código correcto devuelve los datos para crear la cuenta.
 *  3. reenviar(): manda un código nuevo (cada 60 s, máximo 5 por hora).
 *
 * El código vence en 10 minutos y admite 5 intentos. La cuenta no existe hasta verificar.
 */
@Service
public class VerificacionRegistroServicio {

    public static final int MINUTOS_VIGENCIA = 10;
    public static final int SEGUNDOS_REENVIO = 60;
    private static final int MAX_INTENTOS = 5;
    private static final int MAX_ENVIOS_HORA = 5;

    private final VerificacionRegistroRepositorio repositorio;
    private final CorreoServicio correo;
    private final BCryptPasswordEncoder cifrador = new BCryptPasswordEncoder();
    private final SecureRandom aleatorio = new SecureRandom();

    public VerificacionRegistroServicio(VerificacionRegistroRepositorio repositorio, CorreoServicio correo) {
        this.repositorio = repositorio;
        this.correo = correo;
    }

    /** Datos que se devuelven al crear la cuenta tras verificar. */
    public record Pendiente(RegistroClienteDTO registro, String contrasenaHash) {}

    @Transactional
    public Map<String, Object> iniciar(RegistroClienteDTO dto) {
        String correoNormal = normalizar(dto.getCorreo());
        VerificacionRegistro v = repositorio.findByCorreoIgnoreCase(correoNormal).orElseGet(VerificacionRegistro::new);
        LocalDateTime ahora = LocalDateTime.now();
        if (v.getIdVerificacion() != null) {
            controlarReenvio(v, ahora);
        } else {
            v.setEnvios(0);
            v.setFechaCreacion(ahora);
        }
        v.setCorreo(correoNormal);
        v.setDatosRegistro(serializar(dto));
        v.setContrasenaHash(cifrador.encode(dto.getContrasena()));
        String codigo = enviarCodigo(v, ahora, dto.getNombres());
        repositorio.save(v);
        return respuesta(v, codigo);
    }

    @Transactional
    public Map<String, Object> reenviar(String correoIngresado) {
        VerificacionRegistro v = buscar(correoIngresado);
        LocalDateTime ahora = LocalDateTime.now();
        controlarReenvio(v, ahora);
        String codigo = enviarCodigo(v, ahora, deserializar(v.getDatosRegistro()).getNombres());
        repositorio.save(v);
        return respuesta(v, codigo);
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public Pendiente verificar(String correoIngresado, String codigo) {
        VerificacionRegistro v = buscar(correoIngresado);
        if (v.getExpira().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "El código venció. Pide uno nuevo con \"Reenviar código\".");
        }
        if (v.getIntentos() >= MAX_INTENTOS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Superaste los intentos permitidos. Pide un código nuevo con \"Reenviar código\".");
        }
        String limpio = codigo == null ? "" : codigo.replaceAll("\\D", "");
        if (limpio.length() != 6 || !sha256(limpio).equals(v.getCodigoHash())) {
            v.setIntentos(v.getIntentos() + 1);
            repositorio.save(v);
            int quedan = MAX_INTENTOS - v.getIntentos();
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, quedan > 0
                    ? "El código no es correcto. Te quedan " + quedan + " intento(s)."
                    : "El código no es correcto. Pide un código nuevo con \"Reenviar código\".");
        }
        return new Pendiente(deserializar(v.getDatosRegistro()), v.getContrasenaHash());
    }

    /** Se llama cuando la cuenta ya se creó. */
    @Transactional
    public void completar(String correoIngresado) {
        repositorio.findByCorreoIgnoreCase(normalizar(correoIngresado)).ifPresent(repositorio::delete);
    }

    /** Cada hora se borran los registros que nadie terminó de verificar. */
    @Scheduled(fixedDelay = 3_600_000, initialDelay = 300_000)
    @Transactional
    public void limpiarVencidas() {
        repositorio.borrarVencidas(LocalDateTime.now().minusDays(1));
    }

    // ------------------------------------------------------------------ apoyo

    private VerificacionRegistro buscar(String correoIngresado) {
        return repositorio.findByCorreoIgnoreCase(normalizar(correoIngresado))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No hay un registro pendiente para ese correo. Vuelve a llenar el formulario."));
    }

    private void controlarReenvio(VerificacionRegistro v, LocalDateTime ahora) {
        long segundos = Duration.between(v.getUltimoEnvio(), ahora).getSeconds();
        if (segundos < SEGUNDOS_REENVIO) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Espera " + (SEGUNDOS_REENVIO - segundos) + " segundos para pedir otro código.");
        }
        if (Duration.between(v.getUltimoEnvio(), ahora).toMinutes() >= 60) {
            v.setEnvios(0);
        }
        if (v.getEnvios() >= MAX_ENVIOS_HORA) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Pediste demasiados códigos. Intenta de nuevo en una hora.");
        }
    }

    private String enviarCodigo(VerificacionRegistro v, LocalDateTime ahora, String nombres) {
        String codigo = String.format("%06d", aleatorio.nextInt(1_000_000));
        v.setCodigoHash(sha256(codigo));
        v.setIntentos(0);
        v.setEnvios(v.getEnvios() + 1);
        v.setUltimoEnvio(ahora);
        v.setExpira(ahora.plusMinutes(MINUTOS_VIGENCIA));
        String nombre = nombres == null || nombres.isBlank() ? "" : " " + nombres.trim().split("\\s+")[0];
        correo.enviar(v.getCorreo(), "Tu código de verificación CARMOVO: " + codigo,
                "Hola" + nombre + ",\n\n"
                        + "Usa este código para verificar tu correo y terminar de crear tu cuenta en CARMOVO:\n\n"
                        + "        " + codigo + "\n\n"
                        + "Vence en " + MINUTOS_VIGENCIA + " minutos. Si no fuiste tú, ignora este mensaje.\n\n"
                        + "Nunca te pediremos este código por teléfono ni WhatsApp.\n\n"
                        + "Equipo CARMOVO");
        return codigo;
    }

    private Map<String, Object> respuesta(VerificacionRegistro v, String codigo) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("verificacionPendiente", true);
        r.put("correo", v.getCorreo());
        r.put("correoOculto", ocultar(v.getCorreo()));
        r.put("segundosVigencia", MINUTOS_VIGENCIA * 60);
        r.put("segundosReenvio", SEGUNDOS_REENVIO);
        // Sin servidor de correo configurado (modo prueba), el código se muestra en la terminal.
        r.put("correoReal", correo.habilitado());
        return r;
    }

    private static String ocultar(String correo) {
        int arroba = correo.indexOf('@');
        if (arroba <= 3) return correo.charAt(0) + "•••" + correo.substring(Math.max(arroba, 0));
        return correo.substring(0, 3) + "•".repeat(Math.min(arroba - 3, 7)) + correo.substring(arroba);
    }

    private static String normalizar(String correo) {
        return correo == null ? "" : correo.trim().toLowerCase(Locale.ROOT);
    }

    private static String sha256(String texto) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    // Los datos se guardan como texto clave=valor (sin la contraseña).
    private static String serializar(RegistroClienteDTO d) {
        Properties p = new Properties();
        poner(p, "nombres", d.getNombres());
        poner(p, "apellidos", d.getApellidos());
        poner(p, "correo", d.getCorreo());
        poner(p, "telefono", d.getTelefono());
        poner(p, "documento", d.getDocumento());
        poner(p, "fechaNacimiento", d.getFechaNacimiento() == null ? null : d.getFechaNacimiento().toString());
        poner(p, "domicilio", d.getDomicilio());
        poner(p, "departamento", d.getDepartamento());
        poner(p, "provincia", d.getProvincia());
        poner(p, "distrito", d.getDistrito());
        poner(p, "numeroLicencia", d.getNumeroLicencia());
        poner(p, "categoriaLicencia", d.getCategoriaLicencia());
        poner(p, "vencimientoLicencia", d.getVencimientoLicencia() == null ? null : d.getVencimientoLicencia().toString());
        StringWriter w = new StringWriter();
        try {
            p.store(w, null);
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
        return w.toString();
    }

    private static RegistroClienteDTO deserializar(String texto) {
        Properties p = new Properties();
        try {
            p.load(new StringReader(texto));
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
        RegistroClienteDTO d = new RegistroClienteDTO();
        d.setNombres(p.getProperty("nombres"));
        d.setApellidos(p.getProperty("apellidos"));
        d.setCorreo(p.getProperty("correo"));
        d.setTelefono(p.getProperty("telefono"));
        d.setDocumento(p.getProperty("documento"));
        d.setFechaNacimiento(fecha(p.getProperty("fechaNacimiento")));
        d.setDomicilio(p.getProperty("domicilio"));
        d.setDepartamento(p.getProperty("departamento"));
        d.setProvincia(p.getProperty("provincia"));
        d.setDistrito(p.getProperty("distrito"));
        d.setNumeroLicencia(p.getProperty("numeroLicencia"));
        d.setCategoriaLicencia(p.getProperty("categoriaLicencia"));
        d.setVencimientoLicencia(fecha(p.getProperty("vencimientoLicencia")));
        return d;
    }

    private static void poner(Properties p, String clave, String valor) {
        if (valor != null) p.setProperty(clave, valor);
    }

    private static LocalDate fecha(String v) {
        return v == null || v.isBlank() ? null : LocalDate.parse(v);
    }
}