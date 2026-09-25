package com.carmovo.modulos.auditoria;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria")
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_auditoria")
    private Long idAuditoria;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Column(nullable = false, length = 50)
    private String modulo;

    @Column(nullable = false, length = 50)
    private String accion;

    @Column(nullable = false, length = 60)
    private String entidad;

    @Column(name = "id_entidad")
    private Long idEntidad;

    @Column(nullable = false, length = 120)
    private String actor;

    @Column(nullable = false, length = 700)
    private String detalle;

    public Auditoria() {
    }

    @PrePersist
    public void antesDeGuardar() {
        if (fechaHora == null) {
            fechaHora = LocalDateTime.now();
        }
        if (actor == null || actor.isBlank()) {
            actor = "Panel administrador";
        }
    }

    public Long getIdAuditoria() { return idAuditoria; }
    public void setIdAuditoria(Long idAuditoria) { this.idAuditoria = idAuditoria; }

    public LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(LocalDateTime fechaHora) { this.fechaHora = fechaHora; }

    public String getModulo() { return modulo; }
    public void setModulo(String modulo) { this.modulo = modulo; }

    public String getAccion() { return accion; }
    public void setAccion(String accion) { this.accion = accion; }

    public String getEntidad() { return entidad; }
    public void setEntidad(String entidad) { this.entidad = entidad; }

    public Long getIdEntidad() { return idEntidad; }
    public void setIdEntidad(Long idEntidad) { this.idEntidad = idEntidad; }

    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }

    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
}
