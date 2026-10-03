package com.carmovo.dto;

import java.time.LocalDate;

public class UsuarioDTO {

    private Long idUsuario;
    private String nombres;
    private String apellidos;
    private String correo;
    private String telefono;
    private String documento;
    private LocalDate fechaNacimiento;
    private String domicilio;
    private String departamento;
    private String provincia;
    private String distrito;
    private String numeroLicencia;
    private String categoriaLicencia;
    private LocalDate vencimientoLicencia;
    private Boolean estado;
    private Long idPerfil;
    private String nombrePerfil;

    public UsuarioDTO() {
    }

    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }

    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }

    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getDocumento() { return documento; }
    public void setDocumento(String documento) { this.documento = documento; }

    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }

    public String getDomicilio() { return domicilio; }
    public void setDomicilio(String domicilio) { this.domicilio = domicilio; }

    public String getDepartamento() { return departamento; }
    public void setDepartamento(String departamento) { this.departamento = departamento; }

    public String getProvincia() { return provincia; }
    public void setProvincia(String provincia) { this.provincia = provincia; }

    public String getDistrito() { return distrito; }
    public void setDistrito(String distrito) { this.distrito = distrito; }

    public String getNumeroLicencia() { return numeroLicencia; }
    public void setNumeroLicencia(String numeroLicencia) { this.numeroLicencia = numeroLicencia; }

    public String getCategoriaLicencia() { return categoriaLicencia; }
    public void setCategoriaLicencia(String categoriaLicencia) { this.categoriaLicencia = categoriaLicencia; }

    public LocalDate getVencimientoLicencia() { return vencimientoLicencia; }
    public void setVencimientoLicencia(LocalDate vencimientoLicencia) { this.vencimientoLicencia = vencimientoLicencia; }

    public Boolean getEstado() { return estado; }
    public void setEstado(Boolean estado) { this.estado = estado; }

    public Long getIdPerfil() { return idPerfil; }
    public void setIdPerfil(Long idPerfil) { this.idPerfil = idPerfil; }

    public String getNombrePerfil() { return nombrePerfil; }
    public void setNombrePerfil(String nombrePerfil) { this.nombrePerfil = nombrePerfil; }
}
