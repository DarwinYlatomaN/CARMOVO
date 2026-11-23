package com.carmovo.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Registro de entrega (salida) o devolución (llegada) del vehículo. Combustible en octavos (0 a 8). */
@Entity
@Table(name = "alquiler_inspecciones")
public class InspeccionAlquiler {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_inspeccion")
    private Long idInspeccion;

    @Column(name = "id_alquiler", nullable = false)
    private Long idAlquiler;
    @Column(nullable = false, length = 12)
    private String tipo;
    @Column(nullable = false)
    private Integer kilometraje;
    @Column(nullable = false)
    private Integer combustible;
    @Column(length = 500)
    private String observaciones;
    @Column(length = 500)
    private String danos;
    @Column(name = "registrado_por", length = 120)
    private String registradoPor;
    @Column(nullable = false)
    private LocalDateTime fecha;

    @PrePersist
    public void antesDeGuardar() {
        if (fecha == null) fecha = LocalDateTime.now();
    }

    public Long getIdInspeccion() { return idInspeccion; }
    public void setIdInspeccion(Long idInspeccion) { this.idInspeccion = idInspeccion; }
    public Long getIdAlquiler() { return idAlquiler; }
    public void setIdAlquiler(Long idAlquiler) { this.idAlquiler = idAlquiler; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public Integer getKilometraje() { return kilometraje; }
    public void setKilometraje(Integer kilometraje) { this.kilometraje = kilometraje; }
    public Integer getCombustible() { return combustible; }
    public void setCombustible(Integer combustible) { this.combustible = combustible; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getDanos() { return danos; }
    public void setDanos(String danos) { this.danos = danos; }
    public String getRegistradoPor() { return registradoPor; }
    public void setRegistradoPor(String registradoPor) { this.registradoPor = registradoPor; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
