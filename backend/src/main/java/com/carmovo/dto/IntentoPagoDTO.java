package com.carmovo.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Estado de un intento de pago, tal como lo ve la pasarela del sitio web. */
public class IntentoPagoDTO {
    private String codigo;
    private String metodo;
    private String estado;
    private BigDecimal monto;
    private String referencia;
    private String detalle;
    private String motivo;
    private String tipoTarjeta;
    private int intentosRestantes;
    private LocalDateTime expira;
    private LocalDateTime vencePago;
    private CotizacionDTO cotizacion;

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public String getTipoTarjeta() { return tipoTarjeta; }
    public void setTipoTarjeta(String tipoTarjeta) { this.tipoTarjeta = tipoTarjeta; }
    public int getIntentosRestantes() { return intentosRestantes; }
    public void setIntentosRestantes(int intentosRestantes) { this.intentosRestantes = intentosRestantes; }
    public LocalDateTime getExpira() { return expira; }
    public void setExpira(LocalDateTime expira) { this.expira = expira; }
    public LocalDateTime getVencePago() { return vencePago; }
    public void setVencePago(LocalDateTime vencePago) { this.vencePago = vencePago; }
    public CotizacionDTO getCotizacion() { return cotizacion; }
    public void setCotizacion(CotizacionDTO cotizacion) { this.cotizacion = cotizacion; }
}
