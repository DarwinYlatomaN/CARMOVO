package com.carmovo.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Mantenimiento de un vehículo (preventivo, correctivo, SOAT, revisión técnica...). */
@Entity
@Table(name = "mantenimientos")
public class Mantenimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_mantenimiento")
    private Long idMantenimiento;

    @Column(name = "id_vehiculo", nullable = false)
    private Long idVehiculo;
    @Column(nullable = false, length = 40)
    private String tipo;
    @Column(length = 500)
    private String descripcion;
    @Column(name = "fecha_programada", nullable = false)
    private LocalDate fechaProgramada;
    private Integer kilometraje;
    @Column(nullable = false, length = 20)
    private String estado;
    @Column(precision = 10, scale = 2)
    private BigDecimal costo;
    @Column(length = 120)
    private String taller;
    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;
    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;
    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @PrePersist
    public void antesDeGuardar() {
        if (fechaRegistro == null) fechaRegistro = LocalDateTime.now();
    }

    public Long getIdMantenimiento() { return idMantenimiento; }
    public void setIdMantenimiento(Long idMantenimiento) { this.idMantenimiento = idMantenimiento; }
    public Long getIdVehiculo() { return idVehiculo; }
    public void setIdVehiculo(Long idVehiculo) { this.idVehiculo = idVehiculo; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public LocalDate getFechaProgramada() { return fechaProgramada; }
    public void setFechaProgramada(LocalDate fechaProgramada) { this.fechaProgramada = fechaProgramada; }
    public Integer getKilometraje() { return kilometraje; }
    public void setKilometraje(Integer kilometraje) { this.kilometraje = kilometraje; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public BigDecimal getCosto() { return costo; }
    public void setCosto(BigDecimal costo) { this.costo = costo; }
    public String getTaller() { return taller; }
    public void setTaller(String taller) { this.taller = taller; }
    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDateTime fechaInicio) { this.fechaInicio = fechaInicio; }
    public LocalDateTime getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDateTime fechaFin) { this.fechaFin = fechaFin; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}
