package com.carmovo.service;

import com.carmovo.model.AceptacionPolitica;
import com.carmovo.repository.AceptacionPoliticaRepositorio;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.Set;

/**
 * Guarda la constancia de aceptación de los términos y la política de privacidad (Ley N.° 29733):
 * quién, en qué momento, desde qué IP y qué versión del documento aceptó.
 * El texto del documento está en static/js/servicios/politicas.js (misma VERSION).
 */
@Service
public class PoliticasServicio {

    public static final String VERSION = "1.0";
    public static final String REGISTRO = "REGISTRO";
    public static final String RESERVA = "RESERVA";
    public static final String EMPLEADO = "EMPLEADO";

    private final AceptacionPoliticaRepositorio repositorio;

    public PoliticasServicio(AceptacionPoliticaRepositorio repositorio) {
        this.repositorio = repositorio;
    }

    /** Lanza 400 si no se marcó la casilla de aceptación. */
    public static void exigir(Boolean acepto) {
        if (!Boolean.TRUE.equals(acepto)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Debes leer y aceptar los Términos y la Política de privacidad para continuar.");
        }
    }

    @Transactional
    public void registrar(Long idUsuario, String contexto, Long idReferencia, String registradoPor) {
        if (idUsuario == null) return;
        AceptacionPolitica a = new AceptacionPolitica();
        a.setIdUsuario(idUsuario);
        a.setContexto(contexto);
        a.setIdReferencia(idReferencia);
        a.setVersion(VERSION);
        a.setIp(ipActual());
        a.setRegistradoPor(registradoPor == null ? null : registradoPor.length() > 120 ? registradoPor.substring(0, 120) : registradoPor);
        repositorio.save(a);
    }

    @Transactional(readOnly = true)
    public boolean acepto(Long idUsuario, String contexto) {
        return idUsuario != null && repositorio.existsByIdUsuarioAndContexto(idUsuario, contexto);
    }

    @Transactional(readOnly = true)
    public Set<Long> usuariosQueAceptaron(String contexto) {
        return new HashSet<>(repositorio.usuariosConAceptacion(contexto));
    }

    private static String ipActual() {
        try {
            if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
                HttpServletRequest req = attrs.getRequest();
                String reenviada = req.getHeader("X-Forwarded-For");
                String ip = reenviada != null && !reenviada.isBlank() ? reenviada.split(",")[0].trim() : req.getRemoteAddr();
                return ip == null ? null : ip.length() > 45 ? ip.substring(0, 45) : ip;
            }
        } catch (RuntimeException ignorado) {
            // sin petición HTTP (tareas programadas): se guarda sin IP
        }
        return null;
    }
}
