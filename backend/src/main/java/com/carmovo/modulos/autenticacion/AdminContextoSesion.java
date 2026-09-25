package com.carmovo.modulos.autenticacion;

import java.util.Optional;

public final class AdminContextoSesion {

    private static final ThreadLocal<AdminSesion> SESION_ACTUAL = new ThreadLocal<>();

    private AdminContextoSesion() {
    }

    public static void establecer(AdminSesion sesion) {
        SESION_ACTUAL.set(sesion);
    }

    public static Optional<AdminSesion> obtener() {
        return Optional.ofNullable(SESION_ACTUAL.get());
    }

    public static String obtenerActor() {
        return obtener().map(AdminSesion::getCorreo).orElse("Panel administrador");
    }

    public static void limpiar() {
        SESION_ACTUAL.remove();
    }
}
