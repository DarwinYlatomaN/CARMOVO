
package com.carmovo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class VehiculoDTO {

    private Long idVehiculo;

    @NotBlank(message = "La marca es obligatoria.")
    @Size(
            max = 60,
            message = "La marca no puede superar los 60 caracteres."
    )
    @Pattern(
            regexp = "^(?=(?:[^\\p{L}]*\\p{L}){3})\\p{L}+(?:[ ]+\\p{L}+)*$",
            message = "La marca debe contener al menos 3 letras y no puede incluir números ni símbolos."
    )
    private String marca;

    @NotBlank(message = "El modelo es obligatorio.")
    @Size(
            max = 80,
            message = "El modelo no puede superar los 80 caracteres."
    )
    @Pattern(
            regexp = "^(?=(?:[^\\p{L}]*\\p{L}){3})\\p{L}+(?:[ ]+\\p{L}+)*$",
            message = "El modelo debe contener al menos 3 letras y no puede incluir números ni símbolos."
    )
    private String modelo;

    @NotBlank(message = "La categoría es obligatoria.")
    @Size(max = 50, message = "La categoría no puede superar los 50 caracteres.")
    private String categoria;

    @NotNull(message = "El precio por día es obligatorio.")
    @DecimalMin(
            value = "0.01",
            message = "El precio por día debe ser mayor que cero."
    )
    @Digits(
            integer = 10,
            fraction = 2,
            message = "El precio debe tener como máximo 2 decimales."
    )
    private BigDecimal precioDia;

    @NotNull(message = "La cantidad de pasajeros es obligatoria.")
    @Min(
            value = 1,
            message = "El vehículo debe permitir al menos 1 pasajero."
    )
    @Max(
            value = 5,
            message = "Por ahora, el máximo permitido es de 5 pasajeros."
    )
    private Integer pasajeros;

    @NotBlank(message = "La transmisión es obligatoria.")
    @Pattern(
            regexp = "^(Automático|Mecánico)$",
            message = "Selecciona una transmisión válida."
    )
    private String transmision;

    @NotBlank(message = "El estado es obligatorio.")
    @Pattern(
            regexp = "^(Disponible|Alquilado|Reservado|Mantenimiento)$",
            message = "Selecciona un estado válido."
    )
    private String estado;

    @Size(
            max = 255,
            message = "La ruta o URL de imagen no puede superar los 255 caracteres."
    )
    @Pattern(
            regexp = "^(?:https?://[A-Za-z0-9.-]+(?::[0-9]{1,5})?(?:[/?#][^\\s]*)?|(?:\\.\\./)?recursos/[A-Za-z0-9_./-]+|/recursos/[A-Za-z0-9_./-]+|/[A-Za-z0-9_./-]+)$",
            message = "Ingresa una URL HTTP(S) o una ruta local de imagen válida."
    )
    private String imagen;

    @Size(max = 1000, message = "La descripción no puede superar los 1000 caracteres.")
    private String descripcion;

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public VehiculoDTO() {}

    public Long getIdVehiculo() {
        return idVehiculo;
    }

    public void setIdVehiculo(Long idVehiculo) {
        this.idVehiculo = idVehiculo;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public BigDecimal getPrecioDia() {
        return precioDia;
    }

    public void setPrecioDia(BigDecimal precioDia) {
        this.precioDia = precioDia;
    }

    public Integer getPasajeros() {
        return pasajeros;
    }

    public void setPasajeros(Integer pasajeros) {
        this.pasajeros = pasajeros;
    }

    public String getTransmision() {
        return transmision;
    }

    public void setTransmision(String transmision) {
        this.transmision = transmision;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getImagen() {
        return imagen;
    }

    public void setImagen(String imagen) {
        this.imagen = imagen;
    }

    // ---- Campos agregados (actualización 2026) ----
    private String placa;
    private Integer anio;
    private String color;
    private Integer kilometraje;
    private java.time.LocalDate vencimientoSoat;
    private java.time.LocalDate vencimientoRevision;
    private String alertaDocumentos;
    public String getPlaca() { return placa; }
    public void setPlaca(String placa) { this.placa = placa; }
    public Integer getAnio() { return anio; }
    public void setAnio(Integer anio) { this.anio = anio; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public Integer getKilometraje() { return kilometraje; }
    public void setKilometraje(Integer kilometraje) { this.kilometraje = kilometraje; }
    public java.time.LocalDate getVencimientoSoat() { return vencimientoSoat; }
    public void setVencimientoSoat(java.time.LocalDate vencimientoSoat) { this.vencimientoSoat = vencimientoSoat; }
    public java.time.LocalDate getVencimientoRevision() { return vencimientoRevision; }
    public void setVencimientoRevision(java.time.LocalDate vencimientoRevision) { this.vencimientoRevision = vencimientoRevision; }
    public String getAlertaDocumentos() { return alertaDocumentos; }
    public void setAlertaDocumentos(String alertaDocumentos) { this.alertaDocumentos = alertaDocumentos; }
}
