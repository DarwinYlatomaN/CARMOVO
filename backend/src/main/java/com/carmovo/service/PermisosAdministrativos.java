package com.carmovo.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Catálogo único de páginas asignables a administradores secundarios. */
public final class PermisosAdministrativos {
    public static final String GESTION_ADMINISTRADORES = "ADMIN_ADMINISTRADORES";
    private static final Map<String, String> PAGINAS = new LinkedHashMap<>();
    private static final Map<String, String> RUTAS = new LinkedHashMap<>();

    static {
        agregar("ADMIN_TABLERO", "Tablero administrativo", "/admin/tablero");
        agregar("ADMIN_FLOTA", "Gestión de flota", "/admin/gestion-flota");
        agregar("ADMIN_ALQUILERES", "Gestión de alquileres", "/admin/gestion-alquileres");
        agregar("ADMIN_USUARIOS", "Gestión de usuarios", "/admin/gestion-usuarios");
        agregar("ADMIN_PAGOS", "Pagos e ingresos", "/admin/gestion-pagos");
        agregar("ADMIN_MONITOREO", "Monitoreo de flota", "/admin/monitoreo-flota");
        agregar("ADMIN_REPORTES", "Reportes", "/admin/reportes");
        agregar("ADMIN_AUDITORIA", "Registro de auditoría", "/admin/registro-auditoria");
        agregar("WEB_INICIO", "Sitio: Inicio", "/home");
        agregar("WEB_CATEGORIAS", "Sitio: Categorías", "/categorias");
        agregar("WEB_OFERTAS", "Sitio: Ofertas", "/ofertas");
        agregar("WEB_EXPERIENCIA", "Sitio: Experiencia", "/experiencia");
        agregar("WEB_RESERVAS", "Sitio: Reservas", "/reservas");
        agregar("WEB_SOPORTE", "Sitio: Soporte", "/soporte");
        agregar("WEB_MI_CUENTA", "Sitio: Mi cuenta", "/miCuenta");
    }

    private PermisosAdministrativos() {}

    private static void agregar(String codigo, String nombre, String ruta) {
        PAGINAS.put(codigo, nombre);
        RUTAS.put(codigo, ruta);
    }

    public static Map<String, String> paginas() {
        return java.util.Collections.unmodifiableMap(new LinkedHashMap<>(PAGINAS));
    }

    public static Map<String, String> rutas() {
        return Map.copyOf(RUTAS);
    }

    public static boolean asignable(String codigo) {
        return PAGINAS.containsKey(codigo);
    }

    public static List<String> todosParaPrincipal() {
        return java.util.stream.Stream.concat(PAGINAS.keySet().stream(), java.util.stream.Stream.of(GESTION_ADMINISTRADORES)).toList();
    }

    public static String rutaInicial(boolean principal, Set<String> permisos) {
        if (principal) return "/admin/tablero";
        for (String codigo : RUTAS.keySet()) {
            if (permisos.contains(codigo)) return RUTAS.get(codigo);
        }
        return "/admin/login";
    }

    public static String permisoVistaAdministrativa(String ruta) {
        if ("/admin/gestion-administradores".equals(ruta)) return GESTION_ADMINISTRADORES;
        for (var e : RUTAS.entrySet()) {
            if (e.getKey().startsWith("ADMIN_") && e.getValue().equals(ruta)) return e.getKey();
        }
        return null;
    }

    public static String permisoVistaPublica(String ruta) {
        String rutaNormal = ruta.endsWith(".html") ? ruta.substring(0, ruta.length() - 5) : ruta;
        if ("/".equals(rutaNormal)) rutaNormal = "/home";
        for (var e : RUTAS.entrySet()) {
            if (e.getKey().startsWith("WEB_") && e.getValue().equals(rutaNormal)) return e.getKey();
        }
        return null;
    }

    /** Cada API se protege en servidor, independientemente del menú mostrado. */
    public static String permisoApi(String ruta, String metodo) {
        boolean consulta = "GET".equalsIgnoreCase(metodo) || "HEAD".equalsIgnoreCase(metodo);
        if ("/api/v1/admin/clientes-alquileres".equals(ruta))
            return consulta ? "ADMIN_ALQUILERES" : "__DENEGAR__";
        if (ruta.startsWith("/api/v1/admin/administradores")) return GESTION_ADMINISTRADORES;
        if (ruta.startsWith("/api/v1/admin/usuarios") || ruta.startsWith("/api/v1/admin/perfiles")) return "ADMIN_USUARIOS";
        if (ruta.startsWith("/api/v1/admin/alquileres")) return consulta ? "ADMIN_ALQUILERES|ADMIN_MONITOREO|ADMIN_REPORTES" : "ADMIN_ALQUILERES";
        if (ruta.startsWith("/api/v1/admin/pagos")) return consulta ? "ADMIN_PAGOS|ADMIN_REPORTES" : "ADMIN_PAGOS";
        if (ruta.startsWith("/api/v1/admin/comprobantes")) return "ADMIN_PAGOS|ADMIN_REPORTES";
        if (ruta.startsWith("/api/v1/admin/auditoria")) return "ADMIN_AUDITORIA";
        if (ruta.startsWith("/api/v1/vehiculos") && !consulta) return "ADMIN_FLOTA";
        if (ruta.startsWith("/api/v1/admin/")) return "__DENEGAR__"; // fallo seguro para nuevas APIs
        return null;
    }
}
