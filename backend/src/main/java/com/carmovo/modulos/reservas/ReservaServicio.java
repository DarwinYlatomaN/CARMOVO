package com.carmovo.modulos.reservas;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ReservaServicio {

    @Autowired
    private ReservaRepository reservaRepository;

    public Reserva procesarReserva(ReservaDTO dto) {
        Reserva reserva = new Reserva();
        
        // Datos generales de la reserva
        reserva.setIdVehiculo(dto.getVehiculoId());
        reserva.setDias(dto.getDias());
        reserva.setLugarRecogida(dto.getLugarRecogida());
        reserva.setLugarEntrega(dto.getLugarEntrega());
        reserva.setMetodoPago(dto.getMetodoPago());
        reserva.setTokenPago(dto.getTokenPago());
        reserva.setTotal(dto.getTotal());

        // Datos del conductor desempaquetados del JSON anidado
        ReservaDTO.ConductorDTO cond = dto.getConductor();
        reserva.setConductorNombre(cond.getNombre());
        reserva.setConductorApellidos(cond.getApellidos());
        reserva.setConductorDni(cond.getDni());
        reserva.setConductorCorreo(cond.getCorreo());
        reserva.setConductorTelefono(cond.getTelefono());
        reserva.setConductorLicencia(cond.getLicencia());
        reserva.setConductorCategoriaLicencia(cond.getCategoriaLicencia());
        reserva.setConductorVencimientoLicencia(cond.getVencimientoLicencia());
        reserva.setConductorDomicilio(cond.getDomicilio());

        reserva.setEstadoReserva("Pagada"); // Asumimos éxito por ahora

        return reservaRepository.save(reserva);
    }
}