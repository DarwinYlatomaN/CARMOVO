package com.carmovo.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.YearMonth;

import static org.junit.jupiter.api.Assertions.*;

/** Pruebas de la pasarela simulada (tarjetas y Yape de prueba). */
class SimuladorPasarelaTest {

    private static final YearMonth HOY = YearMonth.of(2026, 11);

    @Test
    @DisplayName("Algoritmo de Luhn y marca de la tarjeta")
    void luhnYMarca() {
        assertTrue(SimuladorPasarela.luhn("4111111111111111"));
        assertFalse(SimuladorPasarela.luhn("4111111111111112"));
        assertEquals("VISA", SimuladorPasarela.marca("4111111111111111"));
        assertEquals("MASTERCARD", SimuladorPasarela.marca("5555555555554444"));
        assertEquals("AMEX", SimuladorPasarela.marca("378282246310005"));
    }

    @Test
    @DisplayName("Tarjeta de prueba aprobada")
    void aprobada() {
        assertTrue(SimuladorPasarela.autorizarTarjeta("4111111111111111", 12, 2030, "123", HOY).aprobado());
    }

    @Test
    @DisplayName("Tarjetas de prueba rechazadas con su motivo")
    void rechazos() {
        assertEquals("51", SimuladorPasarela.autorizarTarjeta("4000000000000002", 12, 2030, "123", HOY).codigo());
        assertEquals("62", SimuladorPasarela.autorizarTarjeta("4000000000000069", 12, 2030, "123", HOY).codigo());
        assertEquals("N7", SimuladorPasarela.autorizarTarjeta("4000000000000127", 12, 2030, "123", HOY).codigo());
        assertTrue(SimuladorPasarela.falla3ds("4000000000003220"));
    }

    @Test
    @DisplayName("Tarjeta vencida y CVV de largo incorrecto")
    void vencidaYCvv() {
        assertEquals("54", SimuladorPasarela.autorizarTarjeta("4111111111111111", 10, 2026, "123", HOY).codigo());
        assertEquals("N7", SimuladorPasarela.autorizarTarjeta("378282246310005", 12, 2030, "123", HOY).codigo(),
                "AMEX pide 4 dígitos de CVV");
    }

    @Test
    @DisplayName("Yape: códigos de prueba")
    void yape() {
        assertTrue(SimuladorPasarela.aprobarYape("123456").aprobado());
        assertFalse(SimuladorPasarela.aprobarYape("000000").aprobado());
        assertEquals("YP3", SimuladorPasarela.aprobarYape("111111").codigo());
        assertFalse(SimuladorPasarela.aprobarYape("12ab").aprobado());
    }
}
