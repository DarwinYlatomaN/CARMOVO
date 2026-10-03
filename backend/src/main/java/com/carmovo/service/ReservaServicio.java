package com.carmovo.service;


import com.carmovo.model.Reserva;
import com.carmovo.dto.ReservaDTO;
import com.carmovo.service.AlquilerServicio;
import com.carmovo.dto.AlquilerDTO;
import com.carmovo.dto.AlquilerGuardarDTO;
import com.carmovo.service.PagoServicio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class ReservaServicio {

    private static final int MAX_OBSERVACIONES = 500;

    private final AlquilerServicio alquilerServicio;
    private final PagoServicio pagoServicio;

    public ReservaServicio(AlquilerServicio alquilerServicio, PagoServicio pagoServicio) {
        this.alquilerServicio = alquilerServicio;
        this.pagoServicio = pagoServicio;
    }

    @Transactional
    public AlquilerDTO procesarReserva(ReservaDTO dto) {
        validarReserva(dto);

        AlquilerGuardarDTO alquiler = new AlquilerGuardarDTO();
        alquiler.setIdUsuario(dto.getIdUsuario());
        alquiler.setIdVehiculo(dto.getVehiculoId());
        alquiler.setFechaInicio(dto.getFechaInicio());
        alquiler.setFechaFin(dto.getFechaFin());
        alquiler.setLugarRecogida(dto.getLugarRecogida().trim());
        alquiler.setLugarEntrega(dto.getLugarEntrega().trim());
        alquiler.setMetodoPago(limpiarOpcional(dto.getMetodoPago()));
        alquiler.setEstado("Pendiente");
        alquiler.setObservaciones(construirObservaciones(dto));

        // AlquilerServicio es la única fuente de verdad para disponibilidad,
        // validación del perfil Cliente y cálculo del total.
        AlquilerDTO creado = alquilerServicio.crear(alquiler);

        // La selección realizada en el sitio público también deja un registro
        // real en pagos para que el panel administrativo pueda revisarlo.
        pagoServicio.registrarDesdeReserva(
                creado.getIdAlquiler(),
                alquiler.getMetodoPago(),
                dto.getReferenciaPago(),
                dto.getTokenPago()
        );

        return creado;
    }

    private void validarReserva(ReservaDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos de la reserva son obligatorios.");
        }
        if (dto.getIdUsuario() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes iniciar sesión antes de reservar.");
        }
        if (dto.getVehiculoId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes seleccionar un vehículo.");
        }
        if (dto.getFechaInicio() == null || dto.getFechaFin() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las fechas de recogida y entrega son obligatorias.");
        }
        if (dto.getFechaFin().isBefore(dto.getFechaInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de entrega no puede ser anterior a la fecha de recogida.");
        }
        if (esVacio(dto.getLugarRecogida()) || esVacio(dto.getLugarEntrega())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los lugares de recogida y entrega son obligatorios.");
        }
        if (esVacio(dto.getMetodoPago())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un método de pago.");
        }
        if (("Yape".equalsIgnoreCase(dto.getMetodoPago()) || "Plin".equalsIgnoreCase(dto.getMetodoPago()))
                && esVacio(dto.getReferenciaPago())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa el número de operación del pago.");
        }
        if ("Tarjeta".equalsIgnoreCase(dto.getMetodoPago()) && esVacio(dto.getTokenPago())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se recibió el token del pago con tarjeta.");
        }
        if (dto.getConductor() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del conductor son obligatorios.");
        }

        ReservaDTO.ConductorDTO conductor = dto.getConductor();
        if (esVacio(conductor.getNombre())
                || esVacio(conductor.getApellidos())
                || esVacio(conductor.getDni())
                || esVacio(conductor.getCorreo())
                || esVacio(conductor.getTelefono())
                || esVacio(conductor.getLicencia())
                || esVacio(conductor.getCategoriaLicencia())
                || conductor.getVencimientoLicencia() == null
                || esVacio(conductor.getDomicilio())
                || esVacio(conductor.getDepartamento())
                || esVacio(conductor.getProvincia())
                || esVacio(conductor.getDistrito())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completa los datos obligatorios y la ubicación del conductor.");
        }
    }

    private String construirObservaciones(ReservaDTO dto) {
        ReservaDTO.ConductorDTO conductor = dto.getConductor();
        List<String> partes = new ArrayList<>();
        partes.add("Reserva web");
        partes.add("Conductor: " + limpiar(conductor.getNombre()) + " " + limpiar(conductor.getApellidos()));
        partes.add("DNI: " + limpiar(conductor.getDni()));
        partes.add("Tel: " + limpiar(conductor.getTelefono()));
        partes.add("Correo: " + limpiar(conductor.getCorreo()));
        partes.add("Licencia: " + limpiar(conductor.getLicencia()));
        partes.add("Cat.: " + limpiar(conductor.getCategoriaLicencia()));

        if (conductor.getVencimientoLicencia() != null) {
            partes.add("Vence: " + conductor.getVencimientoLicencia());
        }
        if (conductor.getFechaNacimiento() != null) {
            partes.add("Nac.: " + conductor.getFechaNacimiento());
        }
        if (!esVacio(conductor.getDomicilio())) {
            partes.add("Domicilio: " + limpiar(conductor.getDomicilio()));
        }

        String ubicacion = String.join("/", List.of(
                limpiar(conductor.getDepartamento()),
                limpiar(conductor.getProvincia()),
                limpiar(conductor.getDistrito())
        )).replaceAll("^/+|/+$", "").replaceAll("/{2,}", "/");
        if (!ubicacion.isBlank()) {
            partes.add("Ubicación: " + ubicacion);
        }

        String observaciones = String.join(" | ", partes);
        return observaciones.length() <= MAX_OBSERVACIONES
                ? observaciones
                : observaciones.substring(0, MAX_OBSERVACIONES);
    }

    private String limpiar(String valor) {
        return valor == null ? "" : valor.trim();
    }

    private String limpiarOpcional(String valor) {
        return esVacio(valor) ? null : valor.trim();
    }

    private boolean esVacio(String valor) {
        return valor == null || valor.isBlank();
    }
}
