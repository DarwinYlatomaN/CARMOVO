package com.carmovo.service;

import com.carmovo.dto.MantenimientoDTO;
import com.carmovo.dto.VehiculoDTO;
import com.carmovo.model.Mantenimiento;
import com.carmovo.model.Vehiculo;
import com.carmovo.repository.AlquilerRepositorio;
import com.carmovo.repository.MantenimientoRepositorio;
import com.carmovo.repository.VehiculoRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Mantenimiento de la flota.
 *   PROGRAMADO → EN_TALLER (el vehículo pasa a "Mantenimiento" y no se puede alquilar)
 *              → COMPLETADO (vuelve a "Disponible"; actualiza kilometraje y, si era SOAT o
 *                revisión técnica, la nueva fecha de vencimiento)
 *   PROGRAMADO → CANCELADO
 */
@Service
public class MantenimientoServicio {

    public static final List<String> TIPOS = List.of("Preventivo", "Correctivo", "Cambio de aceite",
            "Llantas", "Frenos", "SOAT", "Revisión técnica", "Limpieza");

    private final MantenimientoRepositorio mantenimientos;
    private final VehiculoRepositorio vehiculos;
    private final VehiculoServicio vehiculoServicio;
    private final AlquilerRepositorio alquileres;
    private final AuditoriaServicio auditoria;

    public MantenimientoServicio(MantenimientoRepositorio mantenimientos, VehiculoRepositorio vehiculos,
                                 VehiculoServicio vehiculoServicio, AlquilerRepositorio alquileres,
                                 AuditoriaServicio auditoria) {
        this.mantenimientos = mantenimientos;
        this.vehiculos = vehiculos;
        this.vehiculoServicio = vehiculoServicio;
        this.alquileres = alquileres;
        this.auditoria = auditoria;
    }

    @Transactional(readOnly = true)
    public List<MantenimientoDTO> listar() {
        return mantenimientos.findAllByOrderByFechaProgramadaDesc().stream().map(this::aDto).toList();
    }

    /** Vehículos con SOAT o revisión técnica vencidos o por vencer (30 días). */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> alertas() {
        return vehiculoServicio.obtenerTodos().stream()
                .filter(v -> v.getAlertaDocumentos() != null)
                .map(v -> Map.<String, Object>of(
                        "idVehiculo", v.getIdVehiculo(),
                        "vehiculo", (v.getMarca() + " " + v.getModelo()).trim(),
                        "placa", v.getPlaca() == null ? "—" : v.getPlaca(),
                        "alerta", v.getAlertaDocumentos()))
                .toList();
    }

    @Transactional
    public MantenimientoDTO crear(MantenimientoDTO dto) {
        if (dto == null || dto.getIdVehiculo() == null || dto.getFechaProgramada() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona el vehículo y la fecha programada.");
        }
        if (dto.getTipo() == null || !TIPOS.contains(dto.getTipo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un tipo de mantenimiento válido.");
        }
        Vehiculo vehiculo = vehiculo(dto.getIdVehiculo());
        Mantenimiento m = new Mantenimiento();
        m.setIdVehiculo(vehiculo.getIdVehiculo());
        m.setTipo(dto.getTipo());
        m.setDescripcion(recortar(dto.getDescripcion(), 500));
        m.setFechaProgramada(dto.getFechaProgramada());
        m.setKilometraje(dto.getKilometraje());
        m.setTaller(recortar(dto.getTaller(), 120));
        m.setCosto(dto.getCosto());
        m.setEstado("PROGRAMADO");
        m = mantenimientos.save(m);
        auditoria.registrarSeguro("Flota", "PROGRAMAR_MANTENIMIENTO", "Vehiculo", vehiculo.getIdVehiculo(),
                "Se programó " + m.getTipo() + " para " + nombre(vehiculo) + " el " + m.getFechaProgramada() + ".");
        return aDto(m);
    }

    @Transactional
    public MantenimientoDTO enviarATaller(Long id) {
        Mantenimiento m = buscar(id);
        if (!"PROGRAMADO".equals(m.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se envían al taller mantenimientos programados.");
        }
        boolean enCurso = alquileres.findAll().stream()
                .anyMatch(a -> a.getIdVehiculo().equals(m.getIdVehiculo()) && "En curso".equals(a.getEstado()));
        if (enCurso) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El vehículo está alquilado ahora. Espera a que lo devuelvan.");
        }
        m.setEstado("EN_TALLER");
        m.setFechaInicio(LocalDateTime.now());
        vehiculoServicio.cambiarEstado(m.getIdVehiculo(), "Mantenimiento");
        auditoria.registrarSeguro("Flota", "ENVIAR_TALLER", "Vehiculo", m.getIdVehiculo(),
                "El vehículo #" + m.getIdVehiculo() + " entró al taller (" + m.getTipo() + ").");
        return aDto(mantenimientos.save(m));
    }

    @Transactional
    public MantenimientoDTO completar(Long id, MantenimientoDTO datos) {
        Mantenimiento m = buscar(id);
        if (!"EN_TALLER".equals(m.getEstado()) && !"PROGRAMADO".equals(m.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este mantenimiento ya está cerrado.");
        }
        if (datos != null && datos.getCosto() != null) {
            if (datos.getCosto().compareTo(BigDecimal.ZERO) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El costo no puede ser negativo.");
            }
            m.setCosto(datos.getCosto());
        }
        if (datos != null && datos.getKilometraje() != null) {
            m.setKilometraje(datos.getKilometraje());
            vehiculoServicio.registrarKilometraje(m.getIdVehiculo(), datos.getKilometraje());
        }
        Vehiculo vehiculo = vehiculo(m.getIdVehiculo());
        if (datos != null && datos.getNuevoVencimiento() != null) {
            if ("SOAT".equals(m.getTipo())) vehiculo.setVencimientoSoat(datos.getNuevoVencimiento());
            if ("Revisión técnica".equals(m.getTipo())) vehiculo.setVencimientoRevision(datos.getNuevoVencimiento());
            vehiculos.save(vehiculo);
        }
        m.setEstado("COMPLETADO");
        m.setFechaFin(LocalDateTime.now());
        if ("Mantenimiento".equalsIgnoreCase(vehiculo.getEstado())) {
            vehiculoServicio.cambiarEstado(m.getIdVehiculo(), "Disponible");
        }
        auditoria.registrarSeguro("Flota", "COMPLETAR_MANTENIMIENTO", "Vehiculo", m.getIdVehiculo(),
                "Se completó " + m.getTipo() + " de " + nombre(vehiculo)
                        + (m.getCosto() == null ? "." : ". Costo: S/ " + m.getCosto() + "."));
        return aDto(mantenimientos.save(m));
    }

    @Transactional
    public MantenimientoDTO cancelar(Long id) {
        Mantenimiento m = buscar(id);
        if (!"PROGRAMADO".equals(m.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Solo se cancelan mantenimientos programados.");
        }
        m.setEstado("CANCELADO");
        return aDto(mantenimientos.save(m));
    }

    private Mantenimiento buscar(Long id) {
        return mantenimientos.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El mantenimiento no existe."));
    }

    private Vehiculo vehiculo(Long id) {
        return vehiculos.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "El vehículo no existe."));
    }

    private static String nombre(Vehiculo v) {
        return (v.getMarca() + " " + v.getModelo()).trim() + (v.getPlaca() == null ? "" : " (" + v.getPlaca() + ")");
    }

    private MantenimientoDTO aDto(Mantenimiento m) {
        MantenimientoDTO dto = new MantenimientoDTO();
        dto.setIdMantenimiento(m.getIdMantenimiento());
        dto.setIdVehiculo(m.getIdVehiculo());
        vehiculos.findById(m.getIdVehiculo()).ifPresent(v -> {
            dto.setVehiculo((v.getMarca() + " " + v.getModelo()).trim());
            dto.setPlaca(v.getPlaca());
        });
        dto.setTipo(m.getTipo());
        dto.setDescripcion(m.getDescripcion());
        dto.setFechaProgramada(m.getFechaProgramada());
        dto.setKilometraje(m.getKilometraje());
        dto.setEstado(m.getEstado());
        dto.setCosto(m.getCosto());
        dto.setTaller(m.getTaller());
        dto.setFechaInicio(m.getFechaInicio());
        dto.setFechaFin(m.getFechaFin());
        return dto;
    }

    private static String recortar(String v, int max) {
        if (v == null || v.isBlank()) return null;
        String t = v.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }
}
