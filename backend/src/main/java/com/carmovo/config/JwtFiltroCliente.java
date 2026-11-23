package com.carmovo.config;

import com.carmovo.model.Usuario;
import com.carmovo.repository.UsuarioRepositorio;
import com.carmovo.service.ClienteActual;
import com.carmovo.service.JwtServicio;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Lee "Authorization: Bearer <jwt>" en las rutas del cliente y, si el token es
 * válido y la cuenta sigue activa, autentica la petición con ROLE_CLIENTE.
 *
 * Solo actúa sobre /api/v1/clientes y /api/v1/reservas: el panel administrativo
 * usa sus propias sesiones (AdminAutenticacionInterceptor).
 *
 * No es un @Component a propósito: se registra solo dentro de la cadena de
 * Spring Security (ver SeguridadConfig) para que no se ejecute dos veces.
 */
public class JwtFiltroCliente extends OncePerRequestFilter {

    private final JwtServicio jwtServicio;
    private final UsuarioRepositorio usuarioRepositorio;

    public JwtFiltroCliente(JwtServicio jwtServicio, UsuarioRepositorio usuarioRepositorio) {
        this.jwtServicio = jwtServicio;
        this.usuarioRepositorio = usuarioRepositorio;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String ruta = request.getRequestURI();
        return !(ruta.startsWith("/api/v1/clientes") || ruta.startsWith("/api/v1/reservas"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain cadena) throws ServletException, IOException {
        String cabecera = request.getHeader("Authorization");
        if (cabecera != null && cabecera.startsWith("Bearer ")) {
            jwtServicio.validar(cabecera.substring(7).trim())
                    .filter(datos -> "CLIENTE".equals(datos.rol()))
                    .flatMap(datos -> usuarioRepositorio.findById(datos.idUsuario()))
                    .filter(this::clienteActivo)
                    .ifPresent(usuario -> {
                        var autenticacion = new UsernamePasswordAuthenticationToken(
                                new ClienteActual.Identidad(usuario.getIdUsuario()),
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_CLIENTE"))
                        );
                        SecurityContextHolder.getContext().setAuthentication(autenticacion);
                    });
        }
        cadena.doFilter(request, response);
    }

    /** Una cuenta desactivada pierde el acceso aunque su token no haya vencido. */
    private boolean clienteActivo(Usuario usuario) {
        return Boolean.TRUE.equals(usuario.getEstado())
                && usuario.getPerfil() != null
                && "Cliente".equalsIgnoreCase(usuario.getPerfil().getNombre());
    }
}
