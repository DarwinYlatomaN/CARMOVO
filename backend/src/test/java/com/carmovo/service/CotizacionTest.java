package com.carmovo.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/** Pruebas del cálculo del precio: tarifa, chofer, seguro, IGV y ofertas. */
class CotizacionTest {

    private static final LocalDate INICIO = LocalDate.of(2026, 12, 1);

    @Test
    @DisplayName("3 días a S/ 100 sin chofer: (300) + IGV 18% + seguro 120")
    void sinChofer() {
        AlquilerServicio.Cotizacion c = AlquilerServicio.calcular(new BigDecimal("100.00"), INICIO, INICIO.plusDays(3), false);
        assertEquals(3, c.dias());
        assertEquals(new BigDecimal("300.00"), c.tarifaBase());
        assertEquals(new BigDecimal("54.00"), c.igv());
        assertEquals(new BigDecimal("474.00"), c.total());
    }

    @Test
    @DisplayName("Con chofer se suman S/ 80 por día (también afectos a IGV)")
    void conChofer() {
        AlquilerServicio.Cotizacion c = AlquilerServicio.calcular(new BigDecimal("100.00"), INICIO, INICIO.plusDays(2), true);
        assertEquals(new BigDecimal("160.00"), c.chofer());
        assertEquals(new BigDecimal("64.80"), c.igv());
        assertEquals(new BigDecimal("544.80"), c.total());
    }

    @Test
    @DisplayName("Una oferta de 15% baja el precio por día")
    void oferta() {
        AlquilerServicio.Cotizacion c = AlquilerServicio.calcular(new BigDecimal("110.00"), 15, INICIO, INICIO.plusDays(1), false);
        assertEquals(new BigDecimal("93.50"), c.precioDia());
        assertEquals(15, c.descuento());
        assertEquals(new BigDecimal("110.00"), c.precioRegular());
    }

    @Test
    @DisplayName("Mismo día de recojo y devolución cuenta como 1 día")
    void minimoUnDia() {
        assertEquals(1, AlquilerServicio.calcular(new BigDecimal("50.00"), INICIO, INICIO, false).dias());
    }
}
