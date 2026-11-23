package com.carmovo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

public class AdministradorSecundarioGuardarDTO {
    @NotBlank private String nombres;
    @NotBlank private String apellidos;
    @NotBlank @Email private String correo;
    private String contrasena;
    private Boolean estado;
    private Set<String> permisos;

    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public String getContrasena() { return contrasena; }
    public void setContrasena(String contrasena) { this.contrasena = contrasena; }
    public Boolean getEstado() { return estado; }
    public void setEstado(Boolean estado) { this.estado = estado; }
    public Set<String> getPermisos() { return permisos; }
    public void setPermisos(Set<String> permisos) { this.permisos = permisos; }

    /** Rol del empleado (Administrador, Agente de reservas, Cajero o Conductor). */
    private Long idPerfil;
    public Long getIdPerfil() { return idPerfil; }
    public void setIdPerfil(Long idPerfil) { this.idPerfil = idPerfil; }

    // Datos personales y laborales del empleado
    private String documento;
    private String telefono;
    private java.time.LocalDate fechaNacimiento;
    private String domicilio;
    private String distrito;
    private String numeroLicencia;
    private String categoriaLicencia;
    private java.time.LocalDate vencimientoLicencia;
    public String getDocumento() { return documento; }
    public void setDocumento(String v) { this.documento = v; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String v) { this.telefono = v; }
    public java.time.LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(java.time.LocalDate v) { this.fechaNacimiento = v; }
    public String getDomicilio() { return domicilio; }
    public void setDomicilio(String v) { this.domicilio = v; }
    public String getDistrito() { return distrito; }
    public void setDistrito(String v) { this.distrito = v; }
    public String getNumeroLicencia() { return numeroLicencia; }
    public void setNumeroLicencia(String v) { this.numeroLicencia = v; }
    public String getCategoriaLicencia() { return categoriaLicencia; }
    public void setCategoriaLicencia(String v) { this.categoriaLicencia = v; }
    public java.time.LocalDate getVencimientoLicencia() { return vencimientoLicencia; }
    public void setVencimientoLicencia(java.time.LocalDate v) { this.vencimientoLicencia = v; }
    /** Casilla "Acepto los Términos y la Política de privacidad". */
    private Boolean aceptaPoliticas;
    public Boolean getAceptaPoliticas() { return aceptaPoliticas; }
    public void setAceptaPoliticas(Boolean aceptaPoliticas) { this.aceptaPoliticas = aceptaPoliticas; }

}
