package com.carmovo.modulos.autenticacion;

import java.time.LocalDateTime;

public class AdminSesion {

    private final String token;
    private final Long idUsuario;
    private final String nombreCompleto;
    private final String correo;
    private final String perfil;
    private final LocalDateTime expiraEn;

    public AdminSesion(
            String token,
            Long idUsuario,
            String nombreCompleto,
            String correo,
            String perfil,
            LocalDateTime expiraEn
    ) {
        this.token = token;
        this.idUsuario = idUsuario;
        this.nombreCompleto = nombreCompleto;
        this.correo = correo;
        this.perfil = perfil;
        this.expiraEn = expiraEn;
    }

    public String getToken() {
        return token;
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public String getCorreo() {
        return correo;
    }

    public String getPerfil() {
        return perfil;
    }

    public LocalDateTime getExpiraEn() {
        return expiraEn;
    }

    public boolean estaExpirada() {
        return LocalDateTime.now().isAfter(expiraEn);
    }
}
