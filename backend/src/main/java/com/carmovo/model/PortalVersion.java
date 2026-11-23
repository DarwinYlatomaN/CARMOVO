package com.carmovo.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Versión publicada del contenido del portal (para el historial y restaurar). */
@Entity
@Table(name = "portal_versiones")
public class PortalVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_version")
    private Long idVersion;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String contenido;
    @Column(length = 120)
    private String autor;
    @Column(length = 255)
    private String resumen;
    @Column(nullable = false)
    private LocalDateTime fecha;

    @PrePersist
    public void antesDeGuardar() {
        if (fecha == null) fecha = LocalDateTime.now();
    }

    public Long getIdVersion() { return idVersion; }
    public void setIdVersion(Long idVersion) { this.idVersion = idVersion; }
    public String getContenido() { return contenido; }
    public void setContenido(String contenido) { this.contenido = contenido; }
    public String getAutor() { return autor; }
    public void setAutor(String autor) { this.autor = autor; }
    public String getResumen() { return resumen; }
    public void setResumen(String resumen) { this.resumen = resumen; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
