package com.carmovo.modulos.reservas;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ReservaDTO {
    private Long vehiculoId;
    private Integer dias;
    private String lugarRecogida;
    private String lugarEntrega;
    private String metodoPago;
    private String tokenPago;
    private BigDecimal total;
    private ConductorDTO conductor;

    public Long getVehiculoId() { return vehiculoId; }
    public void setVehiculoId(Long vehiculoId) { this.vehiculoId = vehiculoId; }
    public Integer getDias() { return dias; }
    public void setDias(Integer dias) { this.dias = dias; }
    public String getLugarRecogida() { return lugarRecogida; }
    public void setLugarRecogida(String lugarRecogida) { this.lugarRecogida = lugarRecogida; }
    public String getLugarEntrega() { return lugarEntrega; }
    public void setLugarEntrega(String lugarEntrega) { this.lugarEntrega = lugarEntrega; }
    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
    public String getTokenPago() { return tokenPago; }
    public void setTokenPago(String tokenPago) { this.tokenPago = tokenPago; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public ConductorDTO getConductor() { return conductor; }
    public void setConductor(ConductorDTO conductor) { this.conductor = conductor; }

    // Clase interna para mapear el objeto "conductor" del JSON
    public static class ConductorDTO {
        private String nombre;
        private String apellidos;
        private String dni;
        private String correo;
        private String telefono;
        private String licencia;
        private String categoriaLicencia;
        private LocalDate vencimientoLicencia;
        private String domicilio;


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
        public String getLicencia() { return licencia; }
        public void setLicencia(String licencia) { this.licencia = licencia; }
        public String getCategoriaLicencia() { return categoriaLicencia; }
        public void setCategoriaLicencia(String categoriaLicencia) { this.categoriaLicencia = categoriaLicencia; }
        public LocalDate getVencimientoLicencia() { return vencimientoLicencia; }
        public void setVencimientoLicencia(LocalDate vencimientoLicencia) { this.vencimientoLicencia = vencimientoLicencia; }
        public String getDomicilio() { return domicilio; }
        public void setDomicilio(String domicilio) { this.domicilio = domicilio; }
    }
}