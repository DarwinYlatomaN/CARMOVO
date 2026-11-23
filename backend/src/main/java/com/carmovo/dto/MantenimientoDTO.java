package com.carmovo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class MantenimientoDTO {
    private Long idMantenimiento;
    private Long idVehiculo;
    private String vehiculo;
    private String placa;
    private String tipo;
    private String descripcion;
    private LocalDate fechaProgramada;
    private Integer kilometraje;
    private String estado;
    private BigDecimal costo;
    private String taller;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    /** Solo al completar SOAT o revisión técnica: nueva fecha de vencimiento del documento. */
    private LocalDate nuevoVencimiento;

    public Long getIdMantenimiento() { return idMantenimiento; }
    public void setIdMantenimiento(Long v) { this.idMantenimiento = v; }
    public Long getIdVehiculo() { return idVehiculo; }
    public void setIdVehiculo(Long v) { this.idVehiculo = v; }
    public String getVehiculo() { return vehiculo; }
    public void setVehiculo(String v) { this.vehiculo = v; }
    public String getPlaca() { return placa; }
    public void setPlaca(String v) { this.placa = v; }
    public String getTipo() { return tipo; }
    public void setTipo(String v) { this.tipo = v; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String v) { this.descripcion = v; }
    public LocalDate getFechaProgramada() { return fechaProgramada; }
    public void setFechaProgramada(LocalDate v) { this.fechaProgramada = v; }
    public Integer getKilometraje() { return kilometraje; }
    public void setKilometraje(Integer v) { this.kilometraje = v; }
    public String getEstado() { return estado; }
    public void setEstado(String v) { this.estado = v; }
    public BigDecimal getCosto() { return costo; }
    public void setCosto(BigDecimal v) { this.costo = v; }
    public String getTaller() { return taller; }
    public void setTaller(String v) { this.taller = v; }
    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDateTime v) { this.fechaInicio = v; }
    public LocalDateTime getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDateTime v) { this.fechaFin = v; }
    public LocalDate getNuevoVencimiento() { return nuevoVencimiento; }
    public void setNuevoVencimiento(LocalDate v) { this.nuevoVencimiento = v; }
}
