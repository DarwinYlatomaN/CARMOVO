
package com.carmovo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class UsuarioGuardarDTO {

    @NotBlank(message = "Los nombres son obligatorios.")
    @Size(
            max = 100,
            message = "Los nombres no pueden superar los 100 caracteres."
    )
    @Pattern(
            regexp = "^(?=(?:[^\\p{L}]*\\p{L}){3})\\p{L}+(?: \\p{L}+)*$",
            message = "Los nombres deben tener al menos 3 letras y contener solo letras y espacios."
    )
    private String nombres;

    @NotBlank(message = "Los apellidos son obligatorios.")
    @Size(
            max = 100,
            message = "Los apellidos no pueden superar los 100 caracteres."
    )
    @Pattern(
            regexp = "^(?=(?:[^\\p{L}]*\\p{L}){3})\\p{L}+(?: \\p{L}+)*$",
            message = "Los apellidos deben tener al menos 3 letras y contener solo letras y espacios."
    )
    private String apellidos;

    @NotBlank(message = "El correo electrónico es obligatorio.")
    @Email(message = "Ingresa un correo electrónico válido.")
    @Size(
            max = 150,
            message = "El correo no puede superar los 150 caracteres."
    )
    private String correo;

    @Size(
            max = 255,
            message = "La contraseña no puede superar los 255 caracteres."
    )
    private String contrasena;

    @Pattern(
            regexp = "^9[0-9]{8}$",
            message = "El celular debe tener exactamente 9 dígitos y comenzar con 9."
    )
    private String telefono;

    @Size(
            max = 20,
            message = "El documento no puede superar los 20 caracteres."
    )
    private String documento;

    @Past(
            message = "La fecha de nacimiento debe ser anterior a hoy."
    )
    private LocalDate fechaNacimiento;

    @Size(
            max = 255,
            message = "El domicilio no puede superar los 255 caracteres."
    )
    private String domicilio;

    @Size(
            max = 100,
            message = "El departamento no puede superar los 100 caracteres."
    )
    private String departamento;

    @Size(
            max = 100,
            message = "La provincia no puede superar los 100 caracteres."
    )
    private String provincia;

    @Size(
            max = 100,
            message = "El distrito no puede superar los 100 caracteres."
    )
    private String distrito;

    @Size(
            max = 50,
            message = "El número de licencia no puede superar los 50 caracteres."
    )
    private String numeroLicencia;

    @Size(
            max = 30,
            message = "La categoría de licencia no puede superar los 30 caracteres."
    )
    private String categoriaLicencia;

    private LocalDate vencimientoLicencia;

    private Boolean estado;

    @Positive(
            message = "El perfil seleccionado debe ser válido."
    )
    private Long idPerfil;

    public UsuarioGuardarDTO() {
    }

    public String getNombres() {
        return nombres;
    }

    public void setNombres(String nombres) {
        this.nombres = nombres;
    }

    public String getApellidos() {
        return apellidos;
    }

    public void setApellidos(String apellidos) {
        this.apellidos = apellidos;
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

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getDocumento() {
        return documento;
    }

    public void setDocumento(String documento) {
        this.documento = documento;
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public String getDomicilio() {
        return domicilio;
    }

    public void setDomicilio(String domicilio) {
        this.domicilio = domicilio;
    }

    public String getDepartamento() {
        return departamento;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public String getProvincia() {
        return provincia;
    }

    public void setProvincia(String provincia) {
        this.provincia = provincia;
    }

    public String getDistrito() {
        return distrito;
    }

    public void setDistrito(String distrito) {
        this.distrito = distrito;
    }

    public String getNumeroLicencia() {
        return numeroLicencia;
    }

    public void setNumeroLicencia(String numeroLicencia) {
        this.numeroLicencia = numeroLicencia;
    }

    public String getCategoriaLicencia() {
        return categoriaLicencia;
    }

    public void setCategoriaLicencia(String categoriaLicencia) {
        this.categoriaLicencia = categoriaLicencia;
    }

    public LocalDate getVencimientoLicencia() {
        return vencimientoLicencia;
    }

    public void setVencimientoLicencia(LocalDate vencimientoLicencia) {
        this.vencimientoLicencia = vencimientoLicencia;
    }

    public Boolean getEstado() {
        return estado;
    }

    public void setEstado(Boolean estado) {
        this.estado = estado;
    }

    public Long getIdPerfil() {
        return idPerfil;
    }

    public void setIdPerfil(Long idPerfil) {
        this.idPerfil = idPerfil;
    }
}
