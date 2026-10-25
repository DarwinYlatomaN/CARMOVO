
package com.carmovo.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class AlquilerGuardarDTO {

    @NotNull(message = "Debes seleccionar un usuario.")
    @Positive(message = "El usuario seleccionado no es válido.")
    private Long idUsuario;

    @NotNull(message = "Debes seleccionar un vehículo.")
    @Positive(message = "El vehículo seleccionado no es válido.")
    private Long idVehiculo;

    @NotNull(message = "La fecha de inicio es obligatoria.")
    private LocalDate fechaInicio;

    @NotNull(message = "La fecha de finalización es obligatoria.")
    private LocalDate fechaFin;

    @NotBlank(message = "El lugar de recogida es obligatorio.")
    @Size(max = 150, message = "El lugar de recogida no puede superar los 150 caracteres.")
    private String lugarRecogida;

    @NotBlank(message = "El lugar de entrega es obligatorio.")
    @Size(max = 150, message = "El lugar de entrega no puede superar los 150 caracteres.")
    private String lugarEntrega;

    @NotBlank(message = "Debes seleccionar un método de pago.")
    private String metodoPago;

    @NotBlank(message = "Debes seleccionar un estado para el alquiler.")
    private String estado;

    private String observaciones;

    public Long getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario) {
        this.idUsuario = idUsuario;
    }

    public Long getIdVehiculo() {
        return idVehiculo;
    }

    public void setIdVehiculo(Long idVehiculo) {
        this.idVehiculo = idVehiculo;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public String getLugarRecogida() {
        return lugarRecogida;
    }

    public void setLugarRecogida(String lugarRecogida) {
        this.lugarRecogida = lugarRecogida;
    }

    public String getLugarEntrega() {
        return lugarEntrega;
    }

    public void setLugarEntrega(String lugarEntrega) {
        this.lugarEntrega = lugarEntrega;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    @AssertTrue(message = "La fecha de finalización no puede ser anterior a la fecha de inicio.")
    public boolean isFechasValidas() {
        if (fechaInicio == null || fechaFin == null) {
            return true;
        }

        return !fechaFin.isBefore(fechaInicio);
    }

    @AssertTrue(message = "Las observaciones no pueden superar las 200 palabras.")
    public boolean isObservacionesValidas() {
        if (observaciones == null || observaciones.isBlank()) {
            return true;
        }

        String texto = observaciones.trim();
        String[] palabras = texto.split("\\s+");

        return palabras.length <= 200;
    }
}
