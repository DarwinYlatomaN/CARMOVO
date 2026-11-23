package com.carmovo.dto;

import java.math.BigDecimal;

/** Desglose del precio calculado por el servidor. */
public class CotizacionDTO {
    private long dias;
    private BigDecimal precioDia;
    private BigDecimal tarifaBase;
    private BigDecimal chofer;
    private BigDecimal seguro;
    private BigDecimal igv;
    private BigDecimal total;
    private BigDecimal limiteYape;
    /** Descuento de oferta aplicado (0 si no hay oferta). */
    private int descuento;
    private BigDecimal precioRegular;

    public int getDescuento() { return descuento; }
    public void setDescuento(int descuento) { this.descuento = descuento; }
    public BigDecimal getPrecioRegular() { return precioRegular; }
    public void setPrecioRegular(BigDecimal precioRegular) { this.precioRegular = precioRegular; }

    public long getDias() { return dias; }
    public void setDias(long dias) { this.dias = dias; }
    public BigDecimal getPrecioDia() { return precioDia; }
    public void setPrecioDia(BigDecimal precioDia) { this.precioDia = precioDia; }
    public BigDecimal getTarifaBase() { return tarifaBase; }
    public void setTarifaBase(BigDecimal tarifaBase) { this.tarifaBase = tarifaBase; }
    public BigDecimal getChofer() { return chofer; }
    public void setChofer(BigDecimal chofer) { this.chofer = chofer; }
    public BigDecimal getSeguro() { return seguro; }
    public void setSeguro(BigDecimal seguro) { this.seguro = seguro; }
    public BigDecimal getIgv() { return igv; }
    public void setIgv(BigDecimal igv) { this.igv = igv; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public BigDecimal getLimiteYape() { return limiteYape; }
    public void setLimiteYape(BigDecimal limiteYape) { this.limiteYape = limiteYape; }
}
