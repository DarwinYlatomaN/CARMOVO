package com.carmovo.modulos.autenticacion.dto;

public class LoginAdminDTO {

    private String correo;
    private String contrasena;

    public LoginAdminDTO() {
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getContrasena() {
        return contrasena;
    }

    public void setContrasena(String contrasena) {
        this.contrasena = contrasena;
    }
}
