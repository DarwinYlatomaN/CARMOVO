package com.carmovo.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** Solicitud de cambio de contraseña. Solo se guarda el hash del token, nunca el token. */
@Entity
@Table(name = "restablecimientos_contrasena")
public class RestablecimientoContrasena {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_restablecimiento")
    private Long idRestablecimiento;

    @Column(name = "id_usuario", nullable = false)
    private Long idUsuario;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private LocalDateTime expira;

    @Column(nullable = false)
    private boolean usado;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @PrePersist
    public void antesDeGuardar() {
        if (fechaRegistro == null) fechaRegistro = LocalDateTime.now();
    }

    public Long getIdRestablecimiento() { return idRestablecimiento; }
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    public LocalDateTime getExpira() { return expira; }
    public void setExpira(LocalDateTime expira) { this.expira = expira; }
    public boolean isUsado() { return usado; }
    public void setUsado(boolean usado) { this.usado = usado; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
}
