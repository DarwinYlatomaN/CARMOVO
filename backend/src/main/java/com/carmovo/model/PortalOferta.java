package com.carmovo.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Oferta del sitio web: descuento sobre un vehículo dentro de un rango de fechas. */
@Entity
@Table(name = "portal_ofertas")
public class PortalOferta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_oferta")
    private Long idOferta;

    @Column(nullable = false, length = 80)
    private String titulo;
    @Column(length = 160)
    private String subtitulo;
    @Column(name = "id_vehiculo", nullable = false)
    private Long idVehiculo;
    @Column(nullable = false)
    private Integer descuento;
    @Column(nullable = false)
    private LocalDate inicio;
    @Column(nullable = false)
    private LocalDate fin;
    @Column(nullable = false)
    private boolean visible;
    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @PrePersist
    public void antesDeGuardar() {
        if (fechaRegistro == null) fechaRegistro = LocalDateTime.now();
    }

    public Long getIdOferta() { return idOferta; }
    public void setIdOferta(Long idOferta) { this.idOferta = idOferta; }
    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }
    public String getSubtitulo() { return subtitulo; }
    public void setSubtitulo(String subtitulo) { this.subtitulo = subtitulo; }
    public Long getIdVehiculo() { return idVehiculo; }
    public void setIdVehiculo(Long idVehiculo) { this.idVehiculo = idVehiculo; }
    public Integer getDescuento() { return descuento; }
    public void setDescuento(Integer descuento) { this.descuento = descuento; }
    public LocalDate getInicio() { return inicio; }
    public void setInicio(LocalDate inicio) { this.inicio = inicio; }
    public LocalDate getFin() { return fin; }
    public void setFin(LocalDate fin) { this.fin = fin; }
    public boolean isVisible() { return visible; }
    public void setVisible(boolean visible) { this.visible = visible; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}
