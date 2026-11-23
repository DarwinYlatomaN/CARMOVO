package com.carmovo.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Imagen subida desde "Portal web". Se guarda en la base de datos para que no se
 * pierda cuando el sistema se vuelve a desplegar en un servidor de internet.
 */
@Entity
@Table(name = "portal_imagenes")
public class PortalImagen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_imagen")
    private Long idImagen;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(name = "tipo_contenido", nullable = false, length = 40)
    private String tipoContenido;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] datos;

    @Column(nullable = false)
    private Long tamano;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @PrePersist
    public void antesDeGuardar() {
        if (fechaRegistro == null) fechaRegistro = LocalDateTime.now();
    }

    public Long getIdImagen() { return idImagen; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getTipoContenido() { return tipoContenido; }
    public void setTipoContenido(String tipoContenido) { this.tipoContenido = tipoContenido; }
    public byte[] getDatos() { return datos; }
    public void setDatos(byte[] datos) { this.datos = datos; }
    public Long getTamano() { return tamano; }
    public void setTamano(Long tamano) { this.tamano = tamano; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
}
