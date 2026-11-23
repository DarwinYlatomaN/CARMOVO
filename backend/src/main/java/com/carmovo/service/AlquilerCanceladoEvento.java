package com.carmovo.service;

/**
 * Se publica cuando un alquiler pasa a "Cancelado".
 * PagoServicio lo escucha para pasar el pago a "Reembolso pendiente" (si ya estaba pagado)
 * o "Anulado" (si todavía no se había pagado), sin que AlquilerServicio dependa de PagoServicio.
 */
public record AlquilerCanceladoEvento(Long idAlquiler, String motivo) {}
