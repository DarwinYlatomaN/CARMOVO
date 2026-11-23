package com.carmovo.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Categoría de vehículos (Económicos, SUVs...). La crea el administrador desde el panel. */
@Entity
@Table(name = "categorias")
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_categoria")
    private Long idCategoria;

    @Column(nullable = false, unique = true, length = 50)
    private String nombre;

    @Column(length = 255)
    private String descripcion;

    @Column(length = 255)
    private String imagen;

    @Column(nullable = false)
    private Integer orden = 0;

    @Column(nullable = false)
    private boolean activa = true;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @PrePersist
    void alCrear() {
        if (fechaRegistro == null) fechaRegistro = LocalDateTime.now();
        if (orden == null) orden = 0;
    }

    public Long getIdCategoria() { return idCategoria; }
    public void setIdCategoria(Long idCategoria) { this.idCategoria = idCategoria; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getImagen() { return imagen; }
    public void setImagen(String imagen) { this.imagen = imagen; }
    public Integer getOrden() { return orden; }
    public void setOrden(Integer orden) { this.orden = orden; }
    public boolean isActiva() { return activa; }
    public void setActiva(boolean activa) { this.activa = activa; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}
