package com.carmovo.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ComprobanteDTO {
    private Long idComprobante;
    private Long idAlquiler;
    private String numero;
    private String codigoVerificacion;
    private String metodoPago;
    private String detalleMetodo;
    private String referencia;
    private BigDecimal subtotal;
    private BigDecimal igv;
    private BigDecimal total;
    private LocalDateTime fechaEmision;
    private String cliente;
    private String documento;
    private String correo;
    private String vehiculo;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Long dias;
    private String lugarRecogida;
    private String lugarEntrega;
    private String estadoAlquiler;

    public Long getIdComprobante() { return idComprobante; }
    public void setIdComprobante(Long v) { this.idComprobante = v; }
    public Long getIdAlquiler() { return idAlquiler; }
    public void setIdAlquiler(Long v) { this.idAlquiler = v; }
    public String getNumero() { return numero; }
    public void setNumero(String v) { this.numero = v; }
    public String getCodigoVerificacion() { return codigoVerificacion; }
    public void setCodigoVerificacion(String v) { this.codigoVerificacion = v; }
    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String v) { this.metodoPago = v; }
    public String getDetalleMetodo() { return detalleMetodo; }
    public void setDetalleMetodo(String v) { this.detalleMetodo = v; }
    public String getReferencia() { return referencia; }
    public void setReferencia(String v) { this.referencia = v; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal v) { this.subtotal = v; }
    public BigDecimal getIgv() { return igv; }
    public void setIgv(BigDecimal v) { this.igv = v; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal v) { this.total = v; }
    public LocalDateTime getFechaEmision() { return fechaEmision; }
    public void setFechaEmision(LocalDateTime v) { this.fechaEmision = v; }
    public String getCliente() { return cliente; }
    public void setCliente(String v) { this.cliente = v; }
    public String getDocumento() { return documento; }
    public void setDocumento(String v) { this.documento = v; }
    public String getCorreo() { return correo; }
    public void setCorreo(String v) { this.correo = v; }
    public String getVehiculo() { return vehiculo; }
    public void setVehiculo(String v) { this.vehiculo = v; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate v) { this.fechaInicio = v; }
    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate v) { this.fechaFin = v; }
    public Long getDias() { return dias; }
    public void setDias(Long v) { this.dias = v; }
    public String getLugarRecogida() { return lugarRecogida; }
    public void setLugarRecogida(String v) { this.lugarRecogida = v; }
    public String getLugarEntrega() { return lugarEntrega; }
    public void setLugarEntrega(String v) { this.lugarEntrega = v; }
    public String getEstadoAlquiler() { return estadoAlquiler; }
    public void setEstadoAlquiler(String v) { this.estadoAlquiler = v; }

    // ---- Campos agregados (actualización 2026) ----
    private String tipo;
    private String serie;
    private Integer correlativo;
    private String documentoCliente;
    private String nombreCliente;
    private String direccionCliente;
    private String estado;
    private String motivoAnulacion;
    private java.math.BigDecimal montoRecibido;
    private java.math.BigDecimal vuelto;
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getSerie() { return serie; }
    public void setSerie(String serie) { this.serie = serie; }
    public Integer getCorrelativo() { return correlativo; }
    public void setCorrelativo(Integer correlativo) { this.correlativo = correlativo; }
    public String getDocumentoCliente() { return documentoCliente; }
    public void setDocumentoCliente(String documentoCliente) { this.documentoCliente = documentoCliente; }
    public String getNombreCliente() { return nombreCliente; }
    public void setNombreCliente(String nombreCliente) { this.nombreCliente = nombreCliente; }
    public String getDireccionCliente() { return direccionCliente; }
    public void setDireccionCliente(String direccionCliente) { this.direccionCliente = direccionCliente; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getMotivoAnulacion() { return motivoAnulacion; }
    public void setMotivoAnulacion(String motivoAnulacion) { this.motivoAnulacion = motivoAnulacion; }
    public java.math.BigDecimal getMontoRecibido() { return montoRecibido; }
    public void setMontoRecibido(java.math.BigDecimal montoRecibido) { this.montoRecibido = montoRecibido; }
    public java.math.BigDecimal getVuelto() { return vuelto; }
    public void setVuelto(java.math.BigDecimal vuelto) { this.vuelto = vuelto; }
}
