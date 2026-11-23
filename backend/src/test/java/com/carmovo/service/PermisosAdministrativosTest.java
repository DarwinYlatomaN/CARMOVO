package com.carmovo.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Pruebas del mapa de permisos por módulo del panel. */
class PermisosAdministrativosTest {

    @Test
    @DisplayName("Los roles del personal se reconocen; Cliente no entra al panel")
    void roles() {
        assertTrue(PermisosAdministrativos.esRolPersonal("Cajero"));
        assertTrue(PermisosAdministrativos.esRolPersonal("Conductor"));
        assertTrue(PermisosAdministrativos.esRolPersonal("Agente de reservas"));
        assertTrue(PermisosAdministrativos.esRolPersonal("Administrador"));
        assertFalse(PermisosAdministrativos.esRolPersonal("Cliente"));
    }

    @Test
    @DisplayName("Un rol creado por el administrador también es del personal, pero no es de fábrica")
    void rolesNuevos() {
        assertTrue(PermisosAdministrativos.esRolPersonal("Supervisor"));
        assertFalse(PermisosAdministrativos.esRolDeFabrica("Supervisor"));
        assertTrue(PermisosAdministrativos.esRolDeFabrica("Cajero"));
        assertTrue(PermisosAdministrativos.esRolDeFabrica("Cliente"));
        assertFalse(PermisosAdministrativos.esRolPersonal(""));
    }

    @Test
    @DisplayName("Cada API administrativa exige el permiso de su módulo")
    void permisosApi() {
        assertEquals("ADMIN_PAGOS", PermisosAdministrativos.permisoApi("/api/v1/admin/pagos/5/aprobar", "POST"));
        assertEquals("ADMIN_ALQUILERES", PermisosAdministrativos.permisoApi("/api/v1/admin/alquileres/5/entrega", "POST"));
        assertEquals("ADMIN_FLOTA", PermisosAdministrativos.permisoApi("/api/v1/admin/mantenimientos", "POST"));
        assertEquals("ADMIN_SERVICIOS", PermisosAdministrativos.permisoApi("/api/v1/admin/servicios/mios", "GET"));
        assertEquals("ADMIN_PORTAL", PermisosAdministrativos.permisoApi("/api/v1/admin/portal/publicar", "POST"));
        assertEquals("ADMIN_ADMINISTRADORES", PermisosAdministrativos.permisoApi("/api/v1/admin/roles/2", "PUT"));
    }

    @Test
    @DisplayName("Una API administrativa nueva sin regla se deniega (fallo seguro)")
    void falloSeguro() {
        assertEquals("__DENEGAR__", PermisosAdministrativos.permisoApi("/api/v1/admin/modulo-nuevo", "GET"));
    }

    @Test
    @DisplayName("Modificar la flota exige ADMIN_FLOTA; consultarla es público")
    void flota() {
        assertEquals("ADMIN_FLOTA", PermisosAdministrativos.permisoApi("/api/v1/vehiculos/3", "PUT"));
        assertNull(PermisosAdministrativos.permisoApi("/api/v1/vehiculos", "GET"));
    }
}
