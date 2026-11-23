package com.carmovo.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/** Pruebas de las reglas de documentos: DNI, RUC, placa, celular y licencia de conducir. */
class ValidadorDocumentosTest {

    private static final LocalDate INICIO = LocalDate.of(2026, 12, 1);
    private static final LocalDate FIN = LocalDate.of(2026, 12, 5);

    @Test
    @DisplayName("DNI: exactamente 8 dígitos")
    void dni() {
        assertTrue(ValidadorDocumentos.dniValido("12345678"));
        assertFalse(ValidadorDocumentos.dniValido("1234567"));
        assertFalse(ValidadorDocumentos.dniValido("12345678A"));
        assertFalse(ValidadorDocumentos.dniValido(null));
    }

    @Test
    @DisplayName("RUC: dígito verificador módulo 11 y prefijo válido")
    void ruc() {
        assertTrue(ValidadorDocumentos.rucValido("20601234565"));
        assertFalse(ValidadorDocumentos.rucValido("20601234566"), "dígito verificador incorrecto");
        assertFalse(ValidadorDocumentos.rucValido("30601234565"), "prefijo no permitido");
        assertFalse(ValidadorDocumentos.rucValido("2060123456"), "solo 10 dígitos");
    }

    @Test
    @DisplayName("Placa: normaliza a formato ABC-123")
    void placa() {
        assertEquals("ABC-123", ValidadorDocumentos.normalizarPlaca("abc123"));
        assertEquals("A1B-234", ValidadorDocumentos.normalizarPlaca(" a1b-234 "));
        assertNull(ValidadorDocumentos.normalizarPlaca("AB-1234"));
    }

    @Test
    @DisplayName("Celular peruano: 9 dígitos empezando en 9")
    void celular() {
        assertTrue(ValidadorDocumentos.celularValido("987 654 321"));
        assertFalse(ValidadorDocumentos.celularValido("887654321"));
    }

    @Test
    @DisplayName("Conductor menor de 21 años es rechazado")
    void edadMinima() {
        String error = ValidadorDocumentos.validarConductor(INICIO.minusYears(20), "A-I", FIN.plusYears(1), "Sedanes", INICIO, FIN);
        assertNotNull(error);
        assertTrue(error.contains("21"));
    }

    @Test
    @DisplayName("Licencia que vence durante el alquiler es rechazada")
    void licenciaVencida() {
        assertNotNull(ValidadorDocumentos.validarConductor(INICIO.minusYears(30), "A-I", FIN.minusDays(1), "Sedanes", INICIO, FIN));
        assertNull(ValidadorDocumentos.validarConductor(INICIO.minusYears(30), "A-I", FIN, "Sedanes", INICIO, FIN));
    }

    @Test
    @DisplayName("Furgonetas exigen licencia A-IIb o superior")
    void categoriaFurgoneta() {
        assertNotNull(ValidadorDocumentos.validarConductor(INICIO.minusYears(30), "A-I", FIN.plusYears(1), "Furgonetas", INICIO, FIN));
        assertNull(ValidadorDocumentos.validarConductor(INICIO.minusYears(30), "A-IIb", FIN.plusYears(1), "Furgonetas", INICIO, FIN));
        assertNull(ValidadorDocumentos.validarConductor(INICIO.minusYears(30), "A-IIIc", FIN.plusYears(1), "Furgonetas", INICIO, FIN));
    }

    @Test
    @DisplayName("Categorías se aceptan escritas de varias formas")
    void normalizarCategoria() {
        assertEquals("A-I", ValidadorDocumentos.normalizarCategoria("a1"));
        assertEquals("A-IIB", ValidadorDocumentos.normalizarCategoria("A-IIb"));
        assertNull(ValidadorDocumentos.normalizarCategoria("B-IIa"));
        assertEquals("A-IIb", ValidadorDocumentos.mostrarCategoria("A-IIB"));
    }

    @Test
    @DisplayName("Con chofer de la agencia el titular solo debe ser mayor de edad")
    void titularConChofer() {
        assertNull(ValidadorDocumentos.validarTitularConChofer(INICIO.minusYears(19), INICIO));
        assertNotNull(ValidadorDocumentos.validarTitularConChofer(INICIO.minusYears(17), INICIO));
        assertNotNull(ValidadorDocumentos.validarTitularConChofer(null, INICIO));
    }
}
