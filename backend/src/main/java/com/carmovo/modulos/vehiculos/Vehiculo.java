package com.carmovo.modulos.vehiculos;

import jakarta.persistence.*;
import java.math.BigDecimal;


@Entity
@Table(name = "vehiculos")
public class Vehiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_vehiculo")
    private Long idVehiculo;

    @Column(nullable = false, length = 60)
    private String marca;

    @Column(nullable = false, length = 80)
    private String modelo;

    @Column(nullable = false, length = 50)
    private String categoria;

    @Column(name = "precio_dia", nullable = false)
    private BigDecimal precioDia;

    @Column(nullable = false)
    private Integer pasajeros;

    @Column(nullable = false, length = 30)
    private String transmision;

    @Column(nullable = false, length = 30)
    private String estado;

    @Column(length = 255)
    private String imagen;

    
    public Vehiculo() {
    }

    public Long getIdVehiculo() { return idVehiculo; }
    public void setIdVehiculo(Long idVehiculo) { this.idVehiculo = idVehiculo; }

    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }

    public String getModelo() { return modelo; }
    public void setModelo(String modelo) { this.modelo = modelo; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public BigDecimal getPrecioDia() { return precioDia; }
    public void setPrecioDia(BigDecimal precioDia) { this.precioDia = precioDia; }

    public Integer getPasajeros() { return pasajeros; }
    public void setPasajeros(Integer pasajeros) { this.pasajeros = pasajeros; }

    public String getTransmision() { return transmision; }
    public void setTransmision(String transmision) { this.transmision = transmision; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getImagen() { return imagen; }
    public void setImagen(String imagen) { this.imagen = imagen; }
}