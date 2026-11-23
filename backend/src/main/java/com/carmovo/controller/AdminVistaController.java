
package com.carmovo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminVistaController {

    @GetMapping({"/login", "/login-admin"})
    public String mostrarLogin(Model model) {
        model.addAttribute(
                "tituloPagina",
                "Administración | CARMOVO"
        );

        return "admin/login-admin";
    }

    @GetMapping("/gestion-administradores")
    public String mostrarGestionAdministradores(Model model) {
        model.addAttribute("tituloPagina", "Empleados | CARMOVO");
        return "admin/gestion-administradores";
    }

    /** Misma pantalla de Empleados, filtrada a los choferes de la agencia. */
    @GetMapping("/conductores")
    public String conductores(Model model) {
        model.addAttribute("tituloPagina", "Conductores | CARMOVO");
        model.addAttribute("paginaMenu", "conductores");
        return "admin/gestion-administradores";
    }

    @GetMapping("/roles-permisos")
    public String rolesPermisos(Model model) {
        model.addAttribute("tituloPagina", "Roles y permisos | CARMOVO");
        return "admin/roles-permisos";
    }

    @GetMapping("/mantenimiento")
    public String mantenimiento(Model model) {
        model.addAttribute("tituloPagina", "Mantenimiento | CARMOVO");
        return "admin/mantenimiento";
    }

    @GetMapping("/categorias")
    public String categorias(Model model) {
        model.addAttribute("tituloPagina", "Categorías | CARMOVO");
        return "admin/categorias";
    }

    @GetMapping("/mis-servicios")
    public String misServicios(Model model) {
        model.addAttribute("tituloPagina", "Mis servicios | CARMOVO");
        return "admin/mis-servicios";
    }

    @GetMapping("/portal-web")
    public String portalWeb(Model model) {
        model.addAttribute("tituloPagina", "Portal web | CARMOVO");
        return "admin/portal-web";
    }

    @GetMapping("/tablero")
    public String mostrarTablero(Model model) {
        model.addAttribute(
                "tituloPagina",
                "Tablero Administrativo | CARMOVO"
        );

        return "admin/tablero";
    }

    @GetMapping("/gestion-flota")
    public String mostrarGestionFlota(Model model) {
        model.addAttribute(
                "tituloPagina",
                "Gestión de Flota | CARMOVO"
        );

        return "admin/gestion-flota";
    }

    @GetMapping("/gestion-alquileres")
    public String mostrarGestionAlquileres(Model model) {
        model.addAttribute(
                "tituloPagina",
                "Gestión de Alquileres | CARMOVO"
        );

        return "admin/gestion-alquileres";
    }

    @GetMapping("/gestion-usuarios")
    public String mostrarGestionUsuarios(Model model) {
        model.addAttribute(
                "tituloPagina",
                "Gestión de Usuarios | CARMOVO"
        );

        return "admin/gestion-usuarios";
    }

    @GetMapping("/gestion-pagos")
    public String mostrarGestionPagos(Model model) {
        model.addAttribute(
                "tituloPagina",
                "Pagos e ingresos | CARMOVO"
        );

        return "admin/gestion-pagos";
    }

    @GetMapping("/monitoreo-flota")
    public String mostrarMonitoreoFlota(Model model) {
        model.addAttribute(
                "tituloPagina",
                "Monitoreo de flota | CARMOVO"
        );

        return "admin/monitoreo-flota";
    }

    @GetMapping("/reportes")
    public String mostrarReportes(Model model) {
        model.addAttribute(
                "tituloPagina",
                "Reportes administrativos | CARMOVO"
        );

        return "admin/reportes";
    }

    @GetMapping("/registro-auditoria")
    public String mostrarRegistroAuditoria(Model model) {
        model.addAttribute(
                "tituloPagina",
                "Registro de auditoría | CARMOVO"
        );

        return "admin/registro-auditoria";
    }
}
