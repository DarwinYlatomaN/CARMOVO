package com.carmovo.modulos.autenticacion;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class AdminAutenticacionInterceptor implements HandlerInterceptor {

    private final AdminSesionServicio adminSesionServicio;

    public AdminAutenticacionInterceptor(AdminSesionServicio adminSesionServicio) {
        this.adminSesionServicio = adminSesionServicio;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String ruta = request.getRequestURI();
        if (!requiereAdministrador(ruta, request.getMethod())) {
            return true;
        }

        String token = adminSesionServicio.extraerBearer(request.getHeader("Authorization"));

        try {
            AdminSesion sesion = adminSesionServicio.validarToken(token);
            AdminContextoSesion.establecer(sesion);
            return true;
        } catch (ResponseStatusException error) {
            int estado = error.getStatusCode().value();
            String mensaje = error.getReason() == null ? "Acceso administrativo no autorizado." : error.getReason();
            escribirError(response, estado, mensaje);
            return false;
        }
    }

    @Override
    public void afterCompletion(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler,
            Exception ex
    ) {
        AdminContextoSesion.limpiar();
    }

    private boolean requiereAdministrador(String ruta, String metodo) {
        if (ruta.startsWith("/api/v1/admin/autenticacion/")) {
            return false;
        }

        if (ruta.startsWith("/api/v1/admin/")) {
            return true;
        }

        return ruta.startsWith("/api/v1/vehiculos") && !"GET".equalsIgnoreCase(metodo);
    }

    private void escribirError(HttpServletResponse response, int estado, String mensaje) throws IOException {
        response.setStatus(estado);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"status\":" + estado + ",\"error\":\"" + escaparJson(mensaje) + "\"}"
        );
    }

    private String escaparJson(String texto) {
        return texto.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
