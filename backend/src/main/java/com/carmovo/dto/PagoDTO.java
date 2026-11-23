package com.carmovo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PagoDTO {
    private Long idPago;
    private Long idAlquiler;
    private Long idUsuario;
    private String cliente;
    private String correoCliente;
    private Long idVehiculo;
    private String vehiculo;
    private String metodoPago;
    private BigDecimal monto;
    private String estadoAlquiler;
    private String estadoPago;
    private String referencia;
    private String observaciones;
    private LocalDateTime fechaPago;
    private LocalDateTime fechaRegistro;
    private String numeroComprobante;

    public String getNumeroComprobante() { return numeroComprobante; }
    public void setNumeroComprobante(String numeroComprobante) { this.numeroComprobante = numeroComprobante; }

    public Long getIdPago() { return idPago; }
    public void setIdPago(Long idPago) { this.idPago = idPago; }

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

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }

    public String getEstadoAlquiler() { return estadoAlquiler; }
    public void setEstadoAlquiler(String estadoAlquiler) { this.estadoAlquiler = estadoAlquiler; }

    public String getEstadoPago() { return estadoPago; }
    public void setEstadoPago(String estadoPago) { this.estadoPago = estadoPago; }

    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; }

    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }

    // ---- Campos agregados (actualización 2026) ----
    private java.math.BigDecimal montoPagado;
    private String detalle;
    private String banco;
    private String tipoComprobante;
    private String ruc;
    private String razonSocial;
    private java.time.LocalDateTime vencePago;
    private java.math.BigDecimal montoRecibido;
    private java.math.BigDecimal vuelto;
    private String validadoPor;
    private String motivoRechazo;
    private String estadoComprobante;
    private java.math.BigDecimal cargosPendientes;
    public java.math.BigDecimal getMontoPagado() { return montoPagado; }
    public void setMontoPagado(java.math.BigDecimal montoPagado) { this.montoPagado = montoPagado; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public String getBanco() { return banco; }
    public void setBanco(String banco) { this.banco = banco; }
    public String getTipoComprobante() { return tipoComprobante; }
    public void setTipoComprobante(String tipoComprobante) { this.tipoComprobante = tipoComprobante; }
    public String getRuc() { return ruc; }
    public void setRuc(String ruc) { this.ruc = ruc; }
    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }
    public java.time.LocalDateTime getVencePago() { return vencePago; }
    public void setVencePago(java.time.LocalDateTime vencePago) { this.vencePago = vencePago; }
    public java.math.BigDecimal getMontoRecibido() { return montoRecibido; }
    public void setMontoRecibido(java.math.BigDecimal montoRecibido) { this.montoRecibido = montoRecibido; }
    public java.math.BigDecimal getVuelto() { return vuelto; }
    public void setVuelto(java.math.BigDecimal vuelto) { this.vuelto = vuelto; }
    public String getValidadoPor() { return validadoPor; }
    public void setValidadoPor(String validadoPor) { this.validadoPor = validadoPor; }
    public String getMotivoRechazo() { return motivoRechazo; }
    public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }
    public String getEstadoComprobante() { return estadoComprobante; }
    public void setEstadoComprobante(String estadoComprobante) { this.estadoComprobante = estadoComprobante; }
    public java.math.BigDecimal getCargosPendientes() { return cargosPendientes; }
    public void setCargosPendientes(java.math.BigDecimal cargosPendientes) { this.cargosPendientes = cargosPendientes; }

    // Datos para verificar la operación en caja
    private java.time.LocalDateTime fechaOperacion;
    private java.time.LocalDateTime fechaValidacion;
    private java.time.LocalDate fechaInicio;
    private java.time.LocalDate fechaFin;
    private String lugarRecogida;
    private boolean conChofer;
    public java.time.LocalDateTime getFechaOperacion() { return fechaOperacion; }
    public void setFechaOperacion(java.time.LocalDateTime v) { this.fechaOperacion = v; }
    public java.time.LocalDateTime getFechaValidacion() { return fechaValidacion; }
    public void setFechaValidacion(java.time.LocalDateTime v) { this.fechaValidacion = v; }
    public java.time.LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(java.time.LocalDate v) { this.fechaInicio = v; }
    public java.time.LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(java.time.LocalDate v) { this.fechaFin = v; }
    public String getLugarRecogida() { return lugarRecogida; }
    public void setLugarRecogida(String v) { this.lugarRecogida = v; }
    public boolean isConChofer() { return conChofer; }
    public void setConChofer(boolean v) { this.conChofer = v; }
}
