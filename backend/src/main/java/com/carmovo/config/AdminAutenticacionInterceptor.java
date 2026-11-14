package com.carmovo.config;

import com.carmovo.model.AdminSesion;
import com.carmovo.service.AdminContextoSesion;
import com.carmovo.service.AdminSesionServicio;
import com.carmovo.service.AdministradorAccesoServicio;
import com.carmovo.service.PermisosAdministrativos;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/** Autorización real en el servidor: ocultar menús no reemplaza este interceptor. */
@Component
public class AdminAutenticacionInterceptor implements HandlerInterceptor {
    private final AdminSesionServicio sesiones;
    private final AdministradorAccesoServicio accesos;

    public AdminAutenticacionInterceptor(AdminSesionServicio sesiones, AdministradorAccesoServicio accesos) {
        this.sesiones = sesiones; this.accesos = accesos;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws IOException {
        AdminContextoSesion.limpiar();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String ruta = request.getRequestURI();
        String metodo = request.getMethod();
        if (ruta.startsWith("/api/v1/admin/autenticacion/")) return true;
        boolean apiAdmin = ruta.startsWith("/api/v1/admin/") ||
                (ruta.startsWith("/api/v1/vehiculos") && !("GET".equalsIgnoreCase(metodo) || "HEAD".equalsIgnoreCase(metodo)));
        boolean vistaAdmin = ruta.startsWith("/admin/") &&
                !ruta.equals("/admin/login") && !ruta.equals("/admin/login-admin");
        boolean vistaPublica = ("GET".equalsIgnoreCase(metodo) || "HEAD".equalsIgnoreCase(metodo)) &&
                PermisosAdministrativos.permisoVistaPublica(ruta) != null;

        if (!apiAdmin && !vistaAdmin && !vistaPublica) return true;

        // Las APIs administrativas requieren siempre Authorization: Bearer; las cookies NO autorizan modificaciones.
        String token = apiAdmin ? sesiones.extraerBearer(request.getHeader("Authorization")) : cookie(request);
        if (vistaPublica && (token == null || token.isBlank())) return true;
        if (vistaAdmin && (token == null || token.isBlank())) {
            response.sendRedirect("/admin/login"); return false;
        }
        try {
            AdminSesion sesion = sesiones.validarToken(token);
            if (apiAdmin) {
                String permiso = PermisosAdministrativos.permisoApi(ruta, metodo);
                if (permiso != null) accesos.exigir(sesion.getIdUsuario(), permiso);
            } else if (vistaAdmin) {
                String permiso = PermisosAdministrativos.permisoVistaAdministrativa(ruta);
                if (permiso == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
                accesos.exigir(sesion.getIdUsuario(), permiso);
            } else if (vistaPublica) {
                // Solo se aplican restricciones a usuarios administradores autenticados.
                // Los visitantes y clientes del sitio público conservan su acceso habitual.
                accesos.exigir(sesion.getIdUsuario(), PermisosAdministrativos.permisoVistaPublica(ruta));
            }
            AdminContextoSesion.establecer(sesion);
            return true;
        } catch (ResponseStatusException error) {
            if (vistaAdmin && error.getStatusCode().value() == 401) {
                response.sendRedirect("/admin/login"); return false;
            }
            if (vistaPublica && error.getStatusCode().value() == 401) {
                // Token de navegación caducado: la web pública continúa siendo pública.
                return true;
            }
            String mensaje = error.getReason() == null ? "Acceso no autorizado." : error.getReason();
            respuestaError(request, response, error.getStatusCode().value(), mensaje, apiAdmin);
            return false;
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        AdminContextoSesion.limpiar();
    }

    private String cookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) if ("CARMOVO_ADMIN".equals(c.getName())) return c.getValue();
        return null;
    }

    private void respuestaError(HttpServletRequest request, HttpServletResponse response,
                               int estado, String mensaje, boolean json) throws IOException {
        response.setStatus(estado);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader("Cache-Control", "no-store");
        if (json) {
            response.setContentType("application/json");
            String seguro = mensaje.replace("\\", "\\\\").replace("\"", "\\\"")
                    .replace("\n", " ").replace("\r", " ");
            response.getWriter().write("{\"status\":" + estado + ",\"error\":\"" + seguro + "\",\"message\":\"" + seguro + "\"}");
        } else if (estado == 403) {
            // Conserva el HTTP 403 y renderiza Thymeleaf en vez de una página sin estilo.
            try {
                request.getRequestDispatcher("/acceso-denegado").forward(request, response);
            } catch (jakarta.servlet.ServletException e) {
                throw new IOException("No se pudo mostrar la página de acceso denegado.", e);
            }
        } else {
            response.sendError(estado);
        }
    }
}
