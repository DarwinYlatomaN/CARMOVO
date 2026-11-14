package com.carmovo.dto;

/** Datos mínimos para seleccionar clientes en Alquileres; excluye documentos y credenciales. */
public record ClienteAlquilerResumenDTO(
        Long idUsuario,
        String nombres,
        String apellidos,
        String correo
) {}
