package com.carmovo.dto;

import java.time.LocalDateTime;

public class SesionAdminDTO {

    private String token;
    private Long idUsuario;
    private String nombreCompleto;
    private String correo;
    private String perfil;
    private LocalDateTime expiraEn;
    private boolean principal;
    private java.util.List<String> permisos;
    private String rutaInicio;

    public SesionAdminDTO() {
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getPerfil() {
        return perfil;
    }

    public void setPerfil(String perfil) {
        this.perfil = perfil;
    }

    public boolean isPrincipal() { return principal; }
    public void setPrincipal(boolean principal) { this.principal = principal; }
    public java.util.List<String> getPermisos() { return permisos; }
    public void setPermisos(java.util.List<String> permisos) { this.permisos = permisos; }
    public String getRutaInicio() { return rutaInicio; }
    public void setRutaInicio(String rutaInicio) { this.rutaInicio = rutaInicio; }

    public LocalDateTime getExpiraEn() {
        return expiraEn;
    }

    public void setExpiraEn(LocalDateTime expiraEn) {
        this.expiraEn = expiraEn;
    }
}
