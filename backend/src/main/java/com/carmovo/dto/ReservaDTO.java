package com.carmovo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ReservaDTO {
    private Long idUsuario;
    private Long vehiculoId;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;

    // Se conservan por compatibilidad con el frontend anterior.
    // El backend ya no confía en estos valores para calcular el alquiler.
    private Integer dias;
    private BigDecimal total;

    private String lugarRecogida;
    private String lugarEntrega;
    private String metodoPago;
    private String referenciaPago;
    private String tokenPago;
    private ConductorDTO conductor;

    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }

    public Long getVehiculoId() { return vehiculoId; }
    public void setVehiculoId(Long vehiculoId) { this.vehiculoId = vehiculoId; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public Integer getDias() { return dias; }
    public void setDias(Integer dias) { this.dias = dias; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public String getLugarRecogida() { return lugarRecogida; }
    public void setLugarRecogida(String lugarRecogida) { this.lugarRecogida = lugarRecogida; }

    public String getLugarEntrega() { return lugarEntrega; }
    public void setLugarEntrega(String lugarEntrega) { this.lugarEntrega = lugarEntrega; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public String getReferenciaPago() { return referenciaPago; }
    public void setReferenciaPago(String referenciaPago) { this.referenciaPago = referenciaPago; }

    public String getTokenPago() { return tokenPago; }
    public void setTokenPago(String tokenPago) { this.tokenPago = tokenPago; }

    public ConductorDTO getConductor() { return conductor; }
    public void setConductor(ConductorDTO conductor) { this.conductor = conductor; }

    public static class ConductorDTO {
        private String nombre;
        private String apellidos;
        private String dni;
        private String correo;
        private String telefono;
        private LocalDate fechaNacimiento;
        private String licencia;
        private String categoriaLicencia;
        private LocalDate vencimientoLicencia;
        private String domicilio;
        private String departamento;
        private String provincia;
        private String distrito;

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }

        public String getApellidos() { return apellidos; }
        public void setApellidos(String apellidos) { this.apellidos = apellidos; }

        public String getDni() { return dni; }
        public void setDni(String dni) { this.dni = dni; }

        public String getCorreo() { return correo; }
        public void setCorreo(String correo) { this.correo = correo; }

        public String getTelefono() { return telefono; }
        public void setTelefono(String telefono) { this.telefono = telefono; }

        public LocalDate getFechaNacimiento() { return fechaNacimiento; }
        public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }

        public String getLicencia() { return licencia; }
        public void setLicencia(String licencia) { this.licencia = licencia; }

        public String getCategoriaLicencia() { return categoriaLicencia; }
        public void setCategoriaLicencia(String categoriaLicencia) { this.categoriaLicencia = categoriaLicencia; }

        public LocalDate getVencimientoLicencia() { return vencimientoLicencia; }
        public void setVencimientoLicencia(LocalDate vencimientoLicencia) { this.vencimientoLicencia = vencimientoLicencia; }

        public String getDomicilio() { return domicilio; }
        public void setDomicilio(String domicilio) { this.domicilio = domicilio; }

        public String getDepartamento() { return departamento; }
        public void setDepartamento(String departamento) { this.departamento = departamento; }

        public String getProvincia() { return provincia; }
        public void setProvincia(String provincia) { this.provincia = provincia; }

        public String getDistrito() { return distrito; }
        public void setDistrito(String distrito) { this.distrito = distrito; }
    }
}
