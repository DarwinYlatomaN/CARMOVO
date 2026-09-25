package com.carmovo.modulos.alquileres.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class AlquilerDTO {
    private Long idAlquiler;
    private Long idUsuario;
    private String cliente;
    private String correoCliente;
    private Long idVehiculo;
    private String vehiculo;
    private String categoriaVehiculo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Long dias;
    private String lugarRecogida;
    private String lugarEntrega;
    private String metodoPago;
    private String estado;
    private BigDecimal total;
    private String observaciones;
    private LocalDateTime fechaRegistro;

    public Long getIdAlquiler() { return idAlquiler; }
    public void setIdAlquiler(Long idAlquiler) { this.idAlquiler = idAlquiler; }

    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }

    public String getCliente() { return cliente; }
    public void setCliente(String cliente) { this.cliente = cliente; }

    public String getCorreoCliente() { return correoCliente; }
    public void setCorreoCliente(String correoCliente) { this.correoCliente = correoCliente; }

    public Long getIdVehiculo() { return idVehiculo; }
    public void setIdVehiculo(Long idVehiculo) { this.idVehiculo = idVehiculo; }

    public String getVehiculo() { return vehiculo; }
    public void setVehiculo(String vehiculo) { this.vehiculo = vehiculo; }

    public String getCategoriaVehiculo() { return categoriaVehiculo; }
    public void setCategoriaVehiculo(String categoriaVehiculo) { this.categoriaVehiculo = categoriaVehiculo; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public Long getDias() { return dias; }
    public void setDias(Long dias) { this.dias = dias; }

    public String getLugarRecogida() { return lugarRecogida; }
    public void setLugarRecogida(String lugarRecogida) { this.lugarRecogida = lugarRecogida; }

    public String getLugarEntrega() { return lugarEntrega; }
    public void setLugarEntrega(String lugarEntrega) { this.lugarEntrega = lugarEntrega; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}
