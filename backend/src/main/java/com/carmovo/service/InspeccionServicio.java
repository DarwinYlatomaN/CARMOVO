package com.carmovo.service;

import com.carmovo.dto.AlquilerDTO;
import com.carmovo.dto.VehiculoDTO;
import com.carmovo.model.Alquiler;
import com.carmovo.model.CargoAlquiler;
import com.carmovo.model.InspeccionAlquiler;
import com.carmovo.repository.CargoAlquilerRepositorio;
import com.carmovo.repository.InspeccionAlquilerRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Entrega y devolución del vehículo (trabajo del Agente de reservas).
 *
 * ENTREGA: solo si el alquiler está Confirmado y pagado. Registra kilometraje y combustible
 *          de salida; el alquiler pasa a "En curso".
 * DEVOLUCIÓN: registra kilometraje, combustible y daños. Calcula los cargos adicionales:
 *   - Devolución tardía: días de retraso × precio por día.
 *   - Combustible faltante: S/ 25 por cada octavo de tanque menos.
 *   - Daños: el monto que indique el agente.
 *   El alquiler pasa a "Finalizado" y los cargos quedan pendientes para el Cajero.
 */
@Service
public class InspeccionServicio {

    public static final BigDecimal PRECIO_OCTAVO_COMBUSTIBLE = new BigDecimal("25.00");

    private final AlquilerServicio alquileres;
    private final VehiculoServicio vehiculos;
    private final PagoServicio pagos;
    private final InspeccionAlquilerRepositorio inspecciones;
    private final CargoAlquilerRepositorio cargos;
    private final AuditoriaServicio auditoria;

    public InspeccionServicio(AlquilerServicio alquileres, VehiculoServicio vehiculos, PagoServicio pagos,
                              InspeccionAlquilerRepositorio inspecciones, CargoAlquilerRepositorio cargos,
                              AuditoriaServicio auditoria) {
        this.alquileres = alquileres;
        this.vehiculos = vehiculos;
        this.pagos = pagos;
        this.inspecciones = inspecciones;
        this.cargos = cargos;
        this.auditoria = auditoria;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> detalle(Long idAlquiler) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("inspecciones", inspecciones.findByIdAlquilerOrderByFechaAsc(idAlquiler));
        r.put("cargos", cargos.findByIdAlquilerOrderByFechaRegistroAsc(idAlquiler));
        r.put("estadoPago", pagos.estadoDelPago(idAlquiler).orElse("Sin pago"));
        return r;
    }

    @Transactional
    public Map<String, Object> registrarEntrega(Long idAlquiler, Integer km, Integer combustible,
                                                String observaciones, String danos, String actor) {
        Alquiler alquiler = alquileres.buscarEntidad(idAlquiler);
        if (!"Confirmado".equals(alquiler.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se entregan alquileres confirmados.");
        }
        if (!"Pagado".equals(pagos.estadoDelPago(idAlquiler).orElse(""))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El pago todavía no está confirmado. Pasa primero por caja.");
        }
        if (inspecciones.findFirstByIdAlquilerAndTipo(idAlquiler, "ENTREGA").isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La entrega de este alquiler ya fue registrada.");
        }
        VehiculoDTO vehiculo = vehiculos.obtenerPorId(alquiler.getIdVehiculo());
        validarLectura(km, combustible);
        if (vehiculo.getKilometraje() != null && km < vehiculo.getKilometraje()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El kilometraje no puede ser menor al registrado del vehículo (" + vehiculo.getKilometraje() + " km).");
        }
        guardar(idAlquiler, "ENTREGA", km, combustible, observaciones, danos, actor);
        vehiculos.registrarKilometraje(alquiler.getIdVehiculo(), km);
        alquileres.cambiarEstadoInterno(idAlquiler, "En curso");
        auditoria.registrarSeguro("Alquileres", "ENTREGAR_VEHICULO", "Alquiler", idAlquiler,
                "Se entregó el vehículo con " + km + " km y combustible " + combustible + "/8.");
        return detalle(idAlquiler);
    }

    @Transactional
    public Map<String, Object> registrarDevolucion(Long idAlquiler, Integer km, Integer combustible, String observaciones,
                                                   String danos, BigDecimal montoDanos, LocalDate fechaDevolucion, String actor) {
        Alquiler alquiler = alquileres.buscarEntidad(idAlquiler);
        if (!"En curso".equals(alquiler.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se reciben alquileres en curso.");
        }
        InspeccionAlquiler salida = inspecciones.findFirstByIdAlquilerAndTipo(idAlquiler, "ENTREGA")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Falta registrar la entrega del vehículo."));
        validarLectura(km, combustible);
        if (km < salida.getKilometraje()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El kilometraje de llegada no puede ser menor al de salida (" + salida.getKilometraje() + " km).");
        }
        LocalDate devuelto = fechaDevolucion == null ? LocalDate.now() : fechaDevolucion;
        if (devuelto.isBefore(alquiler.getFechaInicio())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de devolución no puede ser anterior al inicio.");
        }
        if (montoDanos != null && montoDanos.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El monto por daños no puede ser negativo.");
        }

        guardar(idAlquiler, "DEVOLUCION", km, combustible, observaciones, danos, actor);
        VehiculoDTO vehiculo = vehiculos.obtenerPorId(alquiler.getIdVehiculo());

        long diasTarde = Math.max(0, ChronoUnit.DAYS.between(alquiler.getFechaFin(), devuelto));
        if (diasTarde > 0) {
            cargo(idAlquiler, "DEVOLUCION_TARDIA", diasTarde + (diasTarde == 1 ? " día" : " días") + " de retraso",
                    vehiculo.getPrecioDia().multiply(BigDecimal.valueOf(diasTarde)));
        }
        int octavosFaltantes = salida.getCombustible() - combustible;
        if (octavosFaltantes > 0) {
            cargo(idAlquiler, "COMBUSTIBLE", octavosFaltantes + "/8 de tanque faltante",
                    PRECIO_OCTAVO_COMBUSTIBLE.multiply(BigDecimal.valueOf(octavosFaltantes)));
        }
        if (montoDanos != null && montoDanos.compareTo(BigDecimal.ZERO) > 0) {
            cargo(idAlquiler, "DANOS", danos == null || danos.isBlank() ? "Daños registrados en la devolución" : danos, montoDanos);
        }

        vehiculos.registrarKilometraje(alquiler.getIdVehiculo(), km);
        AlquilerDTO finalizado = alquileres.cambiarEstadoInterno(idAlquiler, "Finalizado");
        auditoria.registrarSeguro("Alquileres", "RECIBIR_VEHICULO", "Alquiler", idAlquiler,
                "Se recibió el vehículo (" + finalizado.getVehiculo() + ") con " + km + " km y combustible " + combustible + "/8."
                        + (diasTarde > 0 ? " Retraso: " + diasTarde + " día(s)." : ""));
        return detalle(idAlquiler);
    }

    private void validarLectura(Integer km, Integer combustible) {
        if (km == null || km < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa el kilometraje.");
        if (combustible == null || combustible < 0 || combustible > 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indica el combustible en octavos (0 a 8).");
        }
    }

    private void guardar(Long idAlquiler, String tipo, int km, int combustible, String obs, String danos, String actor) {
        InspeccionAlquiler i = new InspeccionAlquiler();
        i.setIdAlquiler(idAlquiler);
        i.setTipo(tipo);
        i.setKilometraje(km);
        i.setCombustible(combustible);
        i.setObservaciones(recortar(obs, 500));
        i.setDanos(recortar(danos, 500));
        i.setRegistradoPor(actor);
        inspecciones.save(i);
    }

    private void cargo(Long idAlquiler, String concepto, String detalle, BigDecimal monto) {
        CargoAlquiler c = new CargoAlquiler();
        c.setIdAlquiler(idAlquiler);
        c.setConcepto(concepto);
        c.setDetalle(recortar(detalle, 255));
        c.setMonto(monto.setScale(2, RoundingMode.HALF_UP));
        c.setEstado("PENDIENTE");
        cargos.save(c);
    }

    private static String recortar(String v, int max) {
        if (v == null || v.isBlank()) return null;
        String t = v.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }
}
