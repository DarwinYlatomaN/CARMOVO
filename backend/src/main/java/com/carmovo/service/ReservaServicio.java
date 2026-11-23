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

import com.carmovo.dto.VehiculoDTO;
import com.carmovo.model.IntentoPago;
import java.util.ArrayList;
import java.util.Locale;
import java.util.List;

@Service
public class ReservaServicio {

    private static final int MAX_OBSERVACIONES = 500;

    private final AlquilerServicio alquilerServicio;
    private final PagoServicio pagoServicio;
    private final PasarelaServicio pasarela;
    private final VehiculoServicio vehiculoServicio;
    private final NotificacionServicio notificaciones;
    private final com.carmovo.repository.PagoRepositorio pagoRepositorio;
    private final PoliticasServicio politicas;

    public ReservaServicio(AlquilerServicio alquilerServicio, PagoServicio pagoServicio, PasarelaServicio pasarela,
                           VehiculoServicio vehiculoServicio, NotificacionServicio notificaciones,
                           com.carmovo.repository.PagoRepositorio pagoRepositorio, PoliticasServicio politicas) {
        this.politicas = politicas;
        this.alquilerServicio = alquilerServicio;
        this.pagoServicio = pagoServicio;
        this.pasarela = pasarela;
        this.vehiculoServicio = vehiculoServicio;
        this.notificaciones = notificaciones;
        this.pagoRepositorio = pagoRepositorio;
    }

    /**
     * Registra una reserva del sitio web:
     *  1. Valida datos, conductor (edad, licencia vigente y categoría) y boleta o factura.
     *  2. Verifica el pago en la pasarela (monto calculado por el servidor, uso único).
     *  3. Crea el alquiler: "Confirmado" si el pago está aprobado; "Pendiente" si falta validar o cobrar.
     *  4. Registra el pago y, si corresponde, emite el comprobante.
     * Todo ocurre en una transacción: si algo falla, no queda nada a medias.
     */
    @Transactional
    public AlquilerDTO procesarReserva(ReservaDTO dto) {
        validarReserva(dto);
        PoliticasServicio.exigir(dto.getAceptaPoliticas());
        boolean conChofer = Boolean.TRUE.equals(dto.getConChofer());
        PagoServicio.DatosFacturacion facturacion = validarFacturacion(dto);

        VehiculoDTO vehiculo = vehiculoServicio.obtenerPorId(dto.getVehiculoId());
        ReservaDTO.ConductorDTO conductor = dto.getConductor();
        // Con chofer de la agencia el cliente no maneja: no se le pide licencia, solo ser mayor de edad.
        String problemaConductor = conChofer
                ? ValidadorDocumentos.validarTitularConChofer(conductor.getFechaNacimiento(), dto.getFechaInicio())
                : ValidadorDocumentos.validarConductor(
                        conductor.getFechaNacimiento(), conductor.getCategoriaLicencia(), conductor.getVencimientoLicencia(),
                        vehiculo.getCategoria(), dto.getFechaInicio(), dto.getFechaFin());
        if (problemaConductor != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, problemaConductor);
        }

        IntentoPago intento = pasarela.consumir(dto.getCodigoIntento(), dto.getIdUsuario(), dto.getVehiculoId(),
                dto.getFechaInicio(), dto.getFechaFin(), conChofer);

        AlquilerGuardarDTO alquiler = new AlquilerGuardarDTO();
        alquiler.setIdUsuario(dto.getIdUsuario());
        alquiler.setIdVehiculo(dto.getVehiculoId());
        alquiler.setFechaInicio(dto.getFechaInicio());
        alquiler.setFechaFin(dto.getFechaFin());
        alquiler.setLugarRecogida(dto.getLugarRecogida().trim());
        alquiler.setLugarEntrega(dto.getLugarEntrega().trim());
        alquiler.setMetodoPago(nombreMetodo(intento.getMetodo()));
        alquiler.setEstado("APROBADO".equals(intento.getEstado()) ? "Confirmado" : "Pendiente");
        alquiler.setObservaciones(construirObservaciones(dto));
        alquiler.setConChofer(conChofer);

        // AlquilerServicio es la única fuente de verdad para disponibilidad y precio.
        AlquilerDTO creado = alquilerServicio.crear(alquiler);
        if (creado.getTotal().compareTo(intento.getMonto()) != 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "El precio cambió mientras pagabas. Vuelve a iniciar el pago.");
        }

        pagoServicio.registrarDesdeReserva(creado, intento, facturacion);
        pasarela.marcarUsado(intento, creado.getIdAlquiler());
        politicas.registrar(dto.getIdUsuario(), PoliticasServicio.RESERVA, creado.getIdAlquiler(), null);

        pagoRepositorio.findByIdAlquiler(creado.getIdAlquiler())
                .ifPresent(pago -> notificaciones.reservaRegistrada(creado, pago));
        return alquilerServicio.obtenerPorId(creado.getIdAlquiler());
    }

    private PagoServicio.DatosFacturacion validarFacturacion(ReservaDTO dto) {
        String tipo = dto.getTipoComprobante() == null ? "BOLETA" : dto.getTipoComprobante().trim().toUpperCase(Locale.ROOT);
        if (!"FACTURA".equals(tipo)) {
            return new PagoServicio.DatosFacturacion("BOLETA", null, null, null);
        }
        String ruc = dto.getRuc() == null ? "" : dto.getRuc().trim();
        if (!ValidadorDocumentos.rucValido(ruc)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El RUC no es válido: debe tener 11 dígitos, empezar con 10, 15, 17 o 20 y su dígito verificador debe coincidir.");
        }
        if (esVacio(dto.getRazonSocial()) || dto.getRazonSocial().trim().length() > 150) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La razón social es obligatoria para emitir factura.");
        }
        if (esVacio(dto.getDireccionFiscal()) || dto.getDireccionFiscal().trim().length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La dirección fiscal es obligatoria para emitir factura.");
        }
        return new PagoServicio.DatosFacturacion("FACTURA", ruc,
                dto.getRazonSocial().trim().toUpperCase(Locale.ROOT), dto.getDireccionFiscal().trim());
    }

    private static String nombreMetodo(String metodo) {
        return switch (metodo) {
            case "tarjeta" -> "Tarjeta";
            case "yape" -> "Yape";
            case "plin" -> "Plin";
            case "transferencia" -> "Transferencia";
            case "efectivo" -> "Efectivo";
            default -> metodo;
        };
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
        if (dto.getConductor() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del conductor son obligatorios.");
        }

        ReservaDTO.ConductorDTO conductor = dto.getConductor();
        if (esVacio(conductor.getNombre())
                || esVacio(conductor.getApellidos())
                || esVacio(conductor.getDni())
                || esVacio(conductor.getCorreo())
                || esVacio(conductor.getTelefono())
                || (!Boolean.TRUE.equals(dto.getConChofer()) && (esVacio(conductor.getLicencia())
                        || esVacio(conductor.getCategoriaLicencia())
                        || conductor.getVencimientoLicencia() == null))
                || esVacio(conductor.getDomicilio())
                || esVacio(conductor.getDepartamento())
                || esVacio(conductor.getProvincia())
                || esVacio(conductor.getDistrito())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Completa los datos obligatorios y la ubicación del conductor.");
        }
        if (!ValidadorDocumentos.dniValido(conductor.getDni())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El DNI del conductor debe tener 8 dígitos.");
        }
    }

    private String construirObservaciones(ReservaDTO dto) {
        ReservaDTO.ConductorDTO conductor = dto.getConductor();
        List<String> partes = new ArrayList<>();
        partes.add("Reserva web" + (Boolean.TRUE.equals(dto.getConChofer()) ? " con chofer" : ""));
        boolean conChofer = Boolean.TRUE.equals(dto.getConChofer());
        partes.add((conChofer ? "Titular: " : "Conductor: ") + limpiar(conductor.getNombre()) + " " + limpiar(conductor.getApellidos()));
        partes.add("DNI: " + limpiar(conductor.getDni()));
        partes.add("Tel: " + limpiar(conductor.getTelefono()));
        partes.add("Correo: " + limpiar(conductor.getCorreo()));
        if (!conChofer || !esVacio(conductor.getLicencia())) {
            partes.add("Licencia: " + limpiar(conductor.getLicencia()));
            partes.add("Cat.: " + limpiar(conductor.getCategoriaLicencia()));
        }

        if (!conChofer && conductor.getVencimientoLicencia() != null) {
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
