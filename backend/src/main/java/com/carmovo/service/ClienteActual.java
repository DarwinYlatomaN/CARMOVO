package com.carmovo.service;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

/**
 * Acceso al cliente autenticado con JWT en la petición actual.
 * Los controladores usan SIEMPRE este id, nunca el que envía el navegador.
 */
public final class ClienteActual {

    /** Identidad que el filtro JWT coloca en el contexto de Spring Security. */
    public record Identidad(Long idUsuario) {}

    private ClienteActual() {}

    public static Long id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Identidad identidad)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Debes iniciar sesión.");
        }
        return identidad.idUsuario();
    }

    /** Impide que un cliente lea o modifique datos de otro cliente. */
    public static void exigirPropietario(Long idSolicitado) {
        if (!Objects.equals(id(), idSolicitado)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "No tienes permiso para acceder a los datos de otro cliente.");
        }
    }
}
