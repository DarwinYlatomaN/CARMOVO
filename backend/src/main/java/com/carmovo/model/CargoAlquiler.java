package com.carmovo.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Cargo adicional de un alquiler: devolución tardía, combustible faltante o daños. */
@Entity
@Table(name = "alquiler_cargos")
public class CargoAlquiler {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cargo")
    private Long idCargo;

    @Column(name = "id_alquiler", nullable = false)
    private Long idAlquiler;
    @Column(nullable = false, length = 40)
    private String concepto;
    @Column(length = 255)
    private String detalle;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;
    @Column(nullable = false, length = 15)
    private String estado;
    @Column(name = "metodo_cobro", length = 20)
    private String metodoCobro;
    @Column(name = "fecha_cobro")
    private LocalDateTime fechaCobro;
    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @PrePersist
    public void antesDeGuardar() {
        if (fechaRegistro == null) fechaRegistro = LocalDateTime.now();
    }

    public Long getIdCargo() { return idCargo; }
    public void setIdCargo(Long idCargo) { this.idCargo = idCargo; }
    public Long getIdAlquiler() { return idAlquiler; }
    public void setIdAlquiler(Long idAlquiler) { this.idAlquiler = idAlquiler; }
    public String getConcepto() { return concepto; }
    public void setConcepto(String concepto) { this.concepto = concepto; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getMetodoCobro() { return metodoCobro; }
    public void setMetodoCobro(String metodoCobro) { this.metodoCobro = metodoCobro; }
    public LocalDateTime getFechaCobro() { return fechaCobro; }
    public void setFechaCobro(LocalDateTime fechaCobro) { this.fechaCobro = fechaCobro; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}
