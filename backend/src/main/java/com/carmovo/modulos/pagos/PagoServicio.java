package com.carmovo.modulos.pagos;

import com.carmovo.modulos.alquileres.AlquilerServicio;
import com.carmovo.modulos.alquileres.dto.AlquilerDTO;
import com.carmovo.modulos.pagos.dto.PagoActualizarDTO;
import com.carmovo.modulos.pagos.dto.PagoDTO;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PagoServicio {

    private static final Set<String> ESTADOS_VALIDOS = Set.of(
            "Pendiente", "En revisión", "Pagado", "Rechazado"
    );

    private final PagoRepositorio pagoRepositorio;
    private final AlquilerServicio alquilerServicio;

    public PagoServicio(PagoRepositorio pagoRepositorio, AlquilerServicio alquilerServicio) {
        this.pagoRepositorio = pagoRepositorio;
        this.alquilerServicio = alquilerServicio;
    }

    @Transactional(readOnly = true)
    public List<PagoDTO> obtenerTodos() {
        Map<Long, Pago> pagosPorAlquiler = pagoRepositorio.findAll().stream()
                .collect(Collectors.toMap(Pago::getIdAlquiler, Function.identity()));

        return alquilerServicio.obtenerTodos().stream()
                .sorted(Comparator.comparing(AlquilerDTO::getIdAlquiler).reversed())
                .map(alquiler -> convertirADto(alquiler, pagosPorAlquiler.get(alquiler.getIdAlquiler())))
                .toList();
    }

    @Transactional(readOnly = true)
    public PagoDTO obtenerPorAlquiler(Long idAlquiler) {
        AlquilerDTO alquiler = alquilerServicio.obtenerPorId(idAlquiler);
        Pago pago = pagoRepositorio.findByIdAlquiler(idAlquiler).orElse(null);
        return convertirADto(alquiler, pago);
    }

    @Transactional
    public PagoDTO actualizarPago(Long idAlquiler, PagoActualizarDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del pago son obligatorios.");
        }

        AlquilerDTO alquiler = alquilerServicio.obtenerPorId(idAlquiler);
        String estado = normalizarEstado(dto.getEstado());

        if ("Pagado".equals(estado) && esVacio(alquiler.getMetodoPago())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El alquiler debe tener un método de pago antes de marcarse como pagado."
            );
        }

        Pago pago = pagoRepositorio.findByIdAlquiler(idAlquiler).orElseGet(() -> {
            Pago nuevo = new Pago();
            nuevo.setIdAlquiler(idAlquiler);
            nuevo.setEstado("Pendiente");
            return nuevo;
        });

        String estadoAnterior = pago.getEstado();
        pago.setEstado(estado);
        pago.setReferencia(limpiarOpcional(dto.getReferencia()));
        pago.setObservaciones(limpiarOpcional(dto.getObservaciones()));

        if ("Pagado".equals(estado)) {
            if (!"Pagado".equals(estadoAnterior) || pago.getFechaPago() == null) {
                pago.setFechaPago(LocalDateTime.now());
            }
        } else {
            pago.setFechaPago(null);
        }

        Pago guardado = pagoRepositorio.save(pago);
        return convertirADto(alquiler, guardado);
    }

    private PagoDTO convertirADto(AlquilerDTO alquiler, Pago pago) {
        PagoDTO dto = new PagoDTO();
        dto.setIdPago(pago == null ? null : pago.getIdPago());
        dto.setIdAlquiler(alquiler.getIdAlquiler());
        dto.setIdUsuario(alquiler.getIdUsuario());
        dto.setCliente(alquiler.getCliente());
        dto.setCorreoCliente(alquiler.getCorreoCliente());
        dto.setIdVehiculo(alquiler.getIdVehiculo());
        dto.setVehiculo(alquiler.getVehiculo());
        dto.setMetodoPago(alquiler.getMetodoPago());
        dto.setMonto(alquiler.getTotal());
        dto.setEstadoAlquiler(alquiler.getEstado());
        dto.setEstadoPago(pago == null ? "Pendiente" : pago.getEstado());
        dto.setReferencia(pago == null ? null : pago.getReferencia());
        dto.setObservaciones(pago == null ? null : pago.getObservaciones());
        dto.setFechaPago(pago == null ? null : pago.getFechaPago());
        dto.setFechaRegistro(pago == null ? null : pago.getFechaRegistro());
        return dto;
    }

    private String normalizarEstado(String estado) {
        String valor = esVacio(estado) ? "Pendiente" : estado.trim();
        return ESTADOS_VALIDOS.stream()
                .filter(permitido -> permitido.equalsIgnoreCase(valor))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado de pago no válido."));
    }

    private String limpiarOpcional(String valor) {
        return esVacio(valor) ? null : valor.trim();
    }

    private boolean esVacio(String valor) {
        return valor == null || valor.isBlank();
    }
}
