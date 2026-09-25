package com.carmovo.modulos.roles.dto;

public class PerfilDTO {

    private Long idPerfil;
    private String nombre;

    public PerfilDTO() {
    }

    public PerfilDTO(Long idPerfil, String nombre) {
        this.idPerfil = idPerfil;
        this.nombre = nombre;
    }

    public Long getIdPerfil() {
        return idPerfil;
    }

    public void setIdPerfil(Long idPerfil) {
        this.idPerfil = idPerfil;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
}
