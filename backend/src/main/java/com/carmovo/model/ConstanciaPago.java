package com.carmovo.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Foto o captura (o PDF) del pago que sube el cliente al pagar con Yape, Plin o transferencia. */
@Entity
@Table(name = "constancias_pago")
public class ConstanciaPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_constancia")
    private Long idConstancia;

    @Column(name = "id_intento", nullable = false, unique = true)
    private Long idIntento;

    @Column(name = "nombre_archivo", nullable = false, length = 150)
    private String nombreArchivo;

    @Column(name = "tipo_contenido", nullable = false, length = 40)
    private String tipoContenido;

    @Column(nullable = false)
    private Long tamano;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] datos;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @PrePersist
    @PreUpdate
    void alGuardar() {
        fechaRegistro = LocalDateTime.now();
    }

    public Long getIdConstancia() { return idConstancia; }
    public Long getIdIntento() { return idIntento; }
    public void setIdIntento(Long idIntento) { this.idIntento = idIntento; }
    public String getNombreArchivo() { return nombreArchivo; }
    public void setNombreArchivo(String nombreArchivo) { this.nombreArchivo = nombreArchivo; }
    public String getTipoContenido() { return tipoContenido; }
    public void setTipoContenido(String tipoContenido) { this.tipoContenido = tipoContenido; }
    public Long getTamano() { return tamano; }
    public void setTamano(Long tamano) { this.tamano = tamano; }
    public byte[] getDatos() { return datos; }
    public void setDatos(byte[] datos) { this.datos = datos; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
}
