package com.carmovo.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Constancia de que una persona leyó y aceptó los términos y la política de privacidad.
 * contexto: REGISTRO (cliente crea su cuenta), RESERVA (cliente reserva) o EMPLEADO (alta de personal).
 */
@Entity
@Table(name = "aceptaciones_politicas")
public class AceptacionPolitica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_aceptacion")
    private Long idAceptacion;

    @Column(name = "id_usuario", nullable = false)
    private Long idUsuario;

    @Column(nullable = false, length = 20)
    private String contexto;

    /** Alquiler de la reserva (contexto RESERVA). */
    @Column(name = "id_referencia")
    private Long idReferencia;

    @Column(nullable = false, length = 10)
    private String version;

    @Column(length = 45)
    private String ip;

    /** Quién registró la aceptación (en EMPLEADO es el administrador que dio de alta). */
    @Column(name = "registrado_por", length = 120)
    private String registradoPor;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @PrePersist
    void alCrear() {
        if (fecha == null) fecha = LocalDateTime.now();
    }

    public Long getIdAceptacion() { return idAceptacion; }
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    public String getContexto() { return contexto; }
    public void setContexto(String contexto) { this.contexto = contexto; }
    public Long getIdReferencia() { return idReferencia; }
    public void setIdReferencia(Long idReferencia) { this.idReferencia = idReferencia; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
    public String getRegistradoPor() { return registradoPor; }
    public void setRegistradoPor(String registradoPor) { this.registradoPor = registradoPor; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}
