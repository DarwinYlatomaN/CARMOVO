package com.carmovo.modulos.reservas;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservas")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_reserva")
    private Long idReserva;

    @Column(name = "id_vehiculo", nullable = false)
    private Long idVehiculo;

    @Column(nullable = false)
    private Integer dias;

    @Column(name = "lugar_recogida", nullable = false)
    private String lugarRecogida;

    @Column(name = "lugar_entrega", nullable = false)
    private String lugarEntrega;

    @Column(name = "metodo_pago", nullable = false)
    private String metodoPago;

    @Column(name = "token_pago")
    private String tokenPago;

    @Column(nullable = false)
    private BigDecimal total;

    // Datos del conductor
    @Column(name = "conductor_nombre") private String conductorNombre;
    @Column(name = "conductor_apellidos") private String conductorApellidos;
    @Column(name = "conductor_dni") private String conductorDni;
    @Column(name = "conductor_correo") private String conductorCorreo;
    @Column(name = "conductor_telefono") private String conductorTelefono;
    @Column(name = "conductor_licencia") private String conductorLicencia;
    @Column(name = "conductor_categoria_licencia") private String conductorCategoriaLicencia;
    @Column(name = "conductor_vencimiento_licencia") private LocalDate conductorVencimientoLicencia;
    @Column(name = "conductor_domicilio") private String conductorDomicilio;

    @Column(name = "estado_reserva") 
    private String estadoReserva = "Procesando";

    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;


    public Long getIdVehiculo() { return idVehiculo; }
    public void setIdVehiculo(Long idVehiculo) { this.idVehiculo = idVehiculo; }
    
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
    
    public String getConductorNombre() { return conductorNombre; }
    public void setConductorNombre(String conductorNombre) { this.conductorNombre = conductorNombre; }
    
    public String getConductorApellidos() { return conductorApellidos; }
    public void setConductorApellidos(String conductorApellidos) { this.conductorApellidos = conductorApellidos; }
    
    public String getConductorDni() { return conductorDni; }
    public void setConductorDni(String conductorDni) { this.conductorDni = conductorDni; }
    
    public String getConductorCorreo() { return conductorCorreo; }
    public void setConductorCorreo(String conductorCorreo) { this.conductorCorreo = conductorCorreo; }
    
    public String getConductorTelefono() { return conductorTelefono; }
    public void setConductorTelefono(String conductorTelefono) { this.conductorTelefono = conductorTelefono; }
    
    public String getConductorLicencia() { return conductorLicencia; }
    public void setConductorLicencia(String conductorLicencia) { this.conductorLicencia = conductorLicencia; }
    
    public String getConductorCategoriaLicencia() { return conductorCategoriaLicencia; }
    public void setConductorCategoriaLicencia(String conductorCategoriaLicencia) { this.conductorCategoriaLicencia = conductorCategoriaLicencia; }
    
    public LocalDate getConductorVencimientoLicencia() { return conductorVencimientoLicencia; }
    public void setConductorVencimientoLicencia(LocalDate conductorVencimientoLicencia) { this.conductorVencimientoLicencia = conductorVencimientoLicencia; }
    
    public String getConductorDomicilio() { return conductorDomicilio; }
    public void setConductorDomicilio(String conductorDomicilio) { this.conductorDomicilio = conductorDomicilio; }
    
    public String getEstadoReserva() { return estadoReserva; }
    public void setEstadoReserva(String estadoReserva) { this.estadoReserva = estadoReserva; }
}