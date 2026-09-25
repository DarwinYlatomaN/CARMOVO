package com.carmovo.modulos.pagos.dto;

public class PagoActualizarDTO {
    private String estado;
    private String referencia;
    private String observaciones;

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
