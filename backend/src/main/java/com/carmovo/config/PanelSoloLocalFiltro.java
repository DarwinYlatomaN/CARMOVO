package com.carmovo.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Locale;
import java.util.Set;

/**
 * Publicar solo el sitio web: con CARMOVO_PANEL_SOLO_LOCAL=true el panel de administración
 * (/admin y /api/v1/admin) solo responde en la misma computadora (http://localhost:8080).
 * Quien entra por un enlace público (túnel de VS Code, IP de la red, hosting) ve únicamente
 * la web de clientes; para el panel recibe "no disponible".
 */
@Component
public class PanelSoloLocalFiltro extends OncePerRequestFilter {

    private static final Set<String> LOCALES = Set.of("localhost", "127.0.0.1", "0:0:0:0:0:0:0:1", "::1", "[::1]");
    private static final String[] CABECERAS_PROXY = {"X-Forwarded-For", "X-Forwarded-Host", "Forwarded", "X-Original-Host"};

    private final boolean soloLocal;

    public PanelSoloLocalFiltro(@Value("${carmovo.panel.solo-local:false}") boolean soloLocal) {
        this.soloLocal = soloLocal;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!soloLocal) return true;
        String ruta = request.getRequestURI().substring(request.getContextPath().length());
        return !(ruta.equals("/admin") || ruta.startsWith("/admin/") || ruta.startsWith("/api/v1/admin"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (esLocal(request)) {
            chain.doFilter(request, response);
            return;
        }
        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
        if (request.getRequestURI().startsWith(request.getContextPath() + "/api/")) {
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"No disponible.\"}");
        } else {
            response.setContentType("text/html;charset=UTF-8");
            response.getWriter().write("""
                    <!doctype html><html lang="es"><head><meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1"><title>No disponible | CARMOVO</title></head>
                    <body style="font-family:system-ui,sans-serif;background:#F5FAF6;color:#263B30;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px">
                    <main style="text-align:center;max-width:420px"><h1 style="font-size:1.4rem">Página no disponible</h1>
                    <p style="color:#526B5D">Esta dirección no existe en el sitio de CARMOVO.</p>
                    <p><a href="/home" style="color:#2E7D52;font-weight:700">Ir al inicio</a></p></main></body></html>
                    """);
        }
    }

    /** Local = misma computadora, sin pasar por un túnel ni proxy. */
    private static boolean esLocal(HttpServletRequest request) {
        for (String cabecera : CABECERAS_PROXY) {
            if (request.getHeader(cabecera) != null) return false;
        }
        String host = request.getHeader("Host");
        String nombreHost = host == null ? "" : host.replaceFirst(":\\d+$", "").toLowerCase(Locale.ROOT);
        return LOCALES.contains(request.getRemoteAddr())
                && LOCALES.contains(String.valueOf(request.getServerName()).toLowerCase(Locale.ROOT))
                && LOCALES.contains(nombreHost);
    }
}
