package com.carmovo.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pagos")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pago")
    private Long idPago;

    @Column(name = "id_alquiler", nullable = false, unique = true)
    private Long idAlquiler;

    @Column(nullable = false, length = 20)
    private String estado;

    @Column(length = 120)
    private String referencia;

    @Column(length = 500)
    private String observaciones;

    @Column(name = "fecha_pago")
    private LocalDateTime fechaPago;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    public Pago() {
    }

    @PrePersist
    public void antesDeGuardar() {
        if (fechaRegistro == null) {
            fechaRegistro = LocalDateTime.now();
        }
    }

    public Long getIdPago() { return idPago; }
    public void setIdPago(Long idPago) { this.idPago = idPago; }

    public Long getIdAlquiler() { return idAlquiler; }
    public void setIdAlquiler(Long idAlquiler) { this.idAlquiler = idAlquiler; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; }

    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }

    // ---- Campos agregados (actualización 2026) ----
    @Column(length = 20)
    private String metodo;
    @Column(precision = 10, scale = 2)
    private java.math.BigDecimal monto;
    @Column(length = 160)
    private String detalle;
    @Column(length = 40)
    private String banco;
    @Column(name = "fecha_operacion")
    private LocalDateTime fechaOperacion;
    @Column(name = "tipo_comprobante", length = 10)
    private String tipoComprobante;
    @Column(length = 11)
    private String ruc;
    @Column(name = "razon_social", length = 150)
    private String razonSocial;
    @Column(name = "direccion_fiscal", length = 200)
    private String direccionFiscal;
    @Column(name = "vence_pago")
    private LocalDateTime vencePago;
    @Column(name = "monto_recibido", precision = 10, scale = 2)
    private java.math.BigDecimal montoRecibido;
    @Column(precision = 10, scale = 2)
    private java.math.BigDecimal vuelto;
    @Column(name = "validado_por", length = 120)
    private String validadoPor;
    @Column(name = "fecha_validacion")
    private LocalDateTime fechaValidacion;
    @Column(name = "motivo_rechazo", length = 255)
    private String motivoRechazo;
    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }
    public java.math.BigDecimal getMonto() { return monto; }
    public void setMonto(java.math.BigDecimal monto) { this.monto = monto; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public String getBanco() { return banco; }
    public void setBanco(String banco) { this.banco = banco; }
    public LocalDateTime getFechaOperacion() { return fechaOperacion; }
    public void setFechaOperacion(LocalDateTime fechaOperacion) { this.fechaOperacion = fechaOperacion; }
    public String getTipoComprobante() { return tipoComprobante; }
    public void setTipoComprobante(String tipoComprobante) { this.tipoComprobante = tipoComprobante; }
    public String getRuc() { return ruc; }
    public void setRuc(String ruc) { this.ruc = ruc; }
    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }
    public String getDireccionFiscal() { return direccionFiscal; }
    public void setDireccionFiscal(String direccionFiscal) { this.direccionFiscal = direccionFiscal; }
    public LocalDateTime getVencePago() { return vencePago; }
    public void setVencePago(LocalDateTime vencePago) { this.vencePago = vencePago; }
    public java.math.BigDecimal getMontoRecibido() { return montoRecibido; }
    public void setMontoRecibido(java.math.BigDecimal montoRecibido) { this.montoRecibido = montoRecibido; }
    public java.math.BigDecimal getVuelto() { return vuelto; }
    public void setVuelto(java.math.BigDecimal vuelto) { this.vuelto = vuelto; }
    public String getValidadoPor() { return validadoPor; }
    public void setValidadoPor(String validadoPor) { this.validadoPor = validadoPor; }
    public LocalDateTime getFechaValidacion() { return fechaValidacion; }
    public void setFechaValidacion(LocalDateTime fechaValidacion) { this.fechaValidacion = fechaValidacion; }
    public String getMotivoRechazo() { return motivoRechazo; }
    public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }
}
