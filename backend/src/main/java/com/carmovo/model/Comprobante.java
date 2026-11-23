package com.carmovo.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "comprobantes")
public class Comprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_comprobante")
    private Long idComprobante;

    @Column(name = "id_alquiler", nullable = false, unique = true)
    private Long idAlquiler;

    @Column(name = "id_pago", nullable = false)
    private Long idPago;

    @Column(nullable = false, unique = true, length = 20)
    private String numero;

    @Column(name = "codigo_verificacion", nullable = false, length = 20)
    private String codigoVerificacion;

    @Column(name = "metodo_pago", nullable = false, length = 20)
    private String metodoPago;

    @Column(name = "detalle_metodo", length = 120)
    private String detalleMetodo;

    @Column(length = 120)
    private String referencia;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal igv;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDateTime fechaEmision;

    @PrePersist
    public void antesDeGuardar() {
        if (fechaEmision == null) {
            fechaEmision = LocalDateTime.now();
        }
    }

    public Long getIdComprobante() { return idComprobante; }
    public void setIdComprobante(Long idComprobante) { this.idComprobante = idComprobante; }
    public Long getIdAlquiler() { return idAlquiler; }
    public void setIdAlquiler(Long idAlquiler) { this.idAlquiler = idAlquiler; }
    public Long getIdPago() { return idPago; }
    public void setIdPago(Long idPago) { this.idPago = idPago; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getCodigoVerificacion() { return codigoVerificacion; }
    public void setCodigoVerificacion(String codigoVerificacion) { this.codigoVerificacion = codigoVerificacion; }
    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }
    public String getDetalleMetodo() { return detalleMetodo; }
    public void setDetalleMetodo(String detalleMetodo) { this.detalleMetodo = detalleMetodo; }
    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getIgv() { return igv; }
    public void setIgv(BigDecimal igv) { this.igv = igv; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public LocalDateTime getFechaEmision() { return fechaEmision; }
    public void setFechaEmision(LocalDateTime fechaEmision) { this.fechaEmision = fechaEmision; }

    // ---- Campos agregados (actualización 2026) ----
    @Column(nullable = false, length = 10)
    private String tipo = "BOLETA";
    @Column(nullable = false, length = 4)
    private String serie = "B001";
    private Integer correlativo;
    @Column(name = "documento_cliente", length = 11)
    private String documentoCliente;
    @Column(name = "nombre_cliente", length = 150)
    private String nombreCliente;
    @Column(name = "direccion_cliente", length = 200)
    private String direccionCliente;
    @Column(nullable = false, length = 15)
    private String estado = "EMITIDO";
    @Column(name = "fecha_anulacion")
    private LocalDateTime fechaAnulacion;
    @Column(name = "motivo_anulacion", length = 255)
    private String motivoAnulacion;
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
    public LocalDateTime getFechaAnulacion() { return fechaAnulacion; }
    public void setFechaAnulacion(LocalDateTime fechaAnulacion) { this.fechaAnulacion = fechaAnulacion; }
    public String getMotivoAnulacion() { return motivoAnulacion; }
    public void setMotivoAnulacion(String motivoAnulacion) { this.motivoAnulacion = motivoAnulacion; }
}
