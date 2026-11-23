package com.carmovo.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Contenido editable del sitio web (portada, beneficios, aviso, contacto, preguntas frecuentes).
 * Se guarda como un documento JSON con dos copias: borrador (lo que el admin edita)
 * y publicado (lo que ve el público). Solo existe una fila (id = 1).
 */
@Entity
@Table(name = "portal_documento")
public class PortalDocumento {

    @Id
    @Column(name = "id_documento")
    private Long idDocumento = 1L;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String borrador;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String publicado;

    @Column(name = "actualizado_por", length = 120)
    private String actualizadoPor;

    @Column(name = "fecha_borrador")
    private LocalDateTime fechaBorrador;

    @Column(name = "fecha_publicacion")
    private LocalDateTime fechaPublicacion;

    public Long getIdDocumento() { return idDocumento; }
    public void setIdDocumento(Long idDocumento) { this.idDocumento = idDocumento; }
    public String getBorrador() { return borrador; }
    public void setBorrador(String borrador) { this.borrador = borrador; }
    public String getPublicado() { return publicado; }
    public void setPublicado(String publicado) { this.publicado = publicado; }
    public String getActualizadoPor() { return actualizadoPor; }
    public void setActualizadoPor(String actualizadoPor) { this.actualizadoPor = actualizadoPor; }
    public LocalDateTime getFechaBorrador() { return fechaBorrador; }
    public void setFechaBorrador(LocalDateTime fechaBorrador) { this.fechaBorrador = fechaBorrador; }
    public LocalDateTime getFechaPublicacion() { return fechaPublicacion; }
    public void setFechaPublicacion(LocalDateTime fechaPublicacion) { this.fechaPublicacion = fechaPublicacion; }
}
