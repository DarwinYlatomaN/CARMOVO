package com.carmovo.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Intento de pago en la pasarela simulada. Nunca guarda el número completo de tarjeta ni el CVV. */
@Entity
@Table(name = "intentos_pago")
public class IntentoPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_intento")
    private Long idIntento;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;
    @Column(name = "id_usuario", nullable = false)
    private Long idUsuario;
    @Column(name = "id_vehiculo", nullable = false)
    private Long idVehiculo;
    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;
    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;
    @Column(name = "con_chofer", nullable = false)
    private boolean conChofer;
    @Column(nullable = false, length = 20)
    private String metodo;
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;
    @Column(nullable = false, length = 20)
    private String estado;
    @Column(length = 60)
    private String referencia;
    @Column(length = 160)
    private String detalle;
    @Column(length = 40)
    private String banco;
    @Column(name = "fecha_operacion")
    private LocalDateTime fechaOperacion;
    @Column(length = 255)
    private String motivo;
    @Column(name = "intentos_fallidos", nullable = false)
    private int intentosFallidos;
    @Column(nullable = false)
    private LocalDateTime expira;
    @Column(name = "id_alquiler")
    private Long idAlquiler;
    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    @PrePersist
    public void antesDeGuardar() {
        if (fechaRegistro == null) fechaRegistro = LocalDateTime.now();
    }

    public Long getIdIntento() { return idIntento; }
    public void setIdIntento(Long idIntento) { this.idIntento = idIntento; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    public Long getIdVehiculo() { return idVehiculo; }
    public void setIdVehiculo(Long idVehiculo) { this.idVehiculo = idVehiculo; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }
    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }
    public boolean isConChofer() { return conChofer; }
    public void setConChofer(boolean conChofer) { this.conChofer = conChofer; }
    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }
    public BigDecimal getMonto() { return monto; }
    public void setMonto(BigDecimal monto) { this.monto = monto; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public String getBanco() { return banco; }
    public void setBanco(String banco) { this.banco = banco; }
    public LocalDateTime getFechaOperacion() { return fechaOperacion; }
    public void setFechaOperacion(LocalDateTime fechaOperacion) { this.fechaOperacion = fechaOperacion; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public int getIntentosFallidos() { return intentosFallidos; }
    public void setIntentosFallidos(int intentosFallidos) { this.intentosFallidos = intentosFallidos; }
    public LocalDateTime getExpira() { return expira; }
    public void setExpira(LocalDateTime expira) { this.expira = expira; }
    public Long getIdAlquiler() { return idAlquiler; }
    public void setIdAlquiler(Long idAlquiler) { this.idAlquiler = idAlquiler; }
    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }
}
