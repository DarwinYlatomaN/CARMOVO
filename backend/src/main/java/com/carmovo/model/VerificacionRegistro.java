package com.carmovo.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Registro de cliente esperando el código que se envió a su correo.
 * La cuenta recién se crea cuando el cliente escribe el código correcto.
 * La contraseña se guarda ya cifrada (BCrypt) y el código solo como huella SHA-256.
 */
@Entity
@Table(name = "verificaciones_registro")
public class VerificacionRegistro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_verificacion")
    private Long idVerificacion;

    @Column(nullable = false, unique = true, length = 120)
    private String correo;

    @Column(name = "codigo_hash", nullable = false, length = 64)
    private String codigoHash;

    /** Datos del formulario de registro (sin la contraseña en texto plano). */
    @Lob
    @Column(name = "datos_registro", nullable = false, columnDefinition = "TEXT")
    private String datosRegistro;

    @Column(name = "contrasena_hash", nullable = false, length = 100)
    private String contrasenaHash;

    @Column(nullable = false)
    private int intentos;

    @Column(nullable = false)
    private int envios;

    @Column(name = "ultimo_envio", nullable = false)
    private LocalDateTime ultimoEnvio;

    @Column(nullable = false)
    private LocalDateTime expira;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    public Long getIdVerificacion() { return idVerificacion; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public String getCodigoHash() { return codigoHash; }
    public void setCodigoHash(String codigoHash) { this.codigoHash = codigoHash; }
    public String getDatosRegistro() { return datosRegistro; }
    public void setDatosRegistro(String datosRegistro) { this.datosRegistro = datosRegistro; }
    public String getContrasenaHash() { return contrasenaHash; }
    public void setContrasenaHash(String contrasenaHash) { this.contrasenaHash = contrasenaHash; }
    public int getIntentos() { return intentos; }
    public void setIntentos(int intentos) { this.intentos = intentos; }
    public int getEnvios() { return envios; }
    public void setEnvios(int envios) { this.envios = envios; }
    public LocalDateTime getUltimoEnvio() { return ultimoEnvio; }
    public void setUltimoEnvio(LocalDateTime ultimoEnvio) { this.ultimoEnvio = ultimoEnvio; }
    public LocalDateTime getExpira() { return expira; }
    public void setExpira(LocalDateTime expira) { this.expira = expira; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}