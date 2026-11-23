package com.carmovo.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** Pruebas del token JWT de los clientes (firma HS256 y vencimiento). */
class JwtServicioTest {

    private static final String SECRETO = "clave-de-prueba-de-al-menos-32-caracteres!!";

    @Test
    @DisplayName("Un token generado se valida y conserva el usuario y el rol")
    void generarYValidar() {
        JwtServicio jwt = new JwtServicio(SECRETO, 60);
        String token = jwt.generar(15L, "CLIENTE");
        JwtServicio.DatosToken datos = jwt.validar(token).orElseThrow();
        assertEquals(Long.valueOf(15L), datos.idUsuario());
        assertEquals("CLIENTE", datos.rol());
    }

    @Test
    @DisplayName("Un token alterado o firmado con otra clave es rechazado")
    void tokenAlterado() {
        JwtServicio jwt = new JwtServicio(SECRETO, 60);
        String token = jwt.generar(15L, "CLIENTE");
        String[] p = token.split("\\.");
        String alterado = p[0] + "." + p[1].substring(0, p[1].length() - 2) + "AA" + "." + p[2];
        assertTrue(jwt.validar(alterado).isEmpty());
        assertTrue(new JwtServicio(SECRETO + "x", 60).validar(token).isEmpty());
        assertTrue(jwt.validar("basura").isEmpty());
        assertTrue(jwt.validar(null).isEmpty());
    }

    @Test
    @DisplayName("Un token vencido es rechazado")
    void vencido() {
        JwtServicio jwt = new JwtServicio(SECRETO, -1);
        assertTrue(jwt.validar(jwt.generar(1L, "CLIENTE")).isEmpty());
    }

    @Test
    @DisplayName("La clave debe tener al menos 32 caracteres")
    void claveCorta() {
        assertThrows(IllegalStateException.class, () -> new JwtServicio("corta", 60));
    }
}
