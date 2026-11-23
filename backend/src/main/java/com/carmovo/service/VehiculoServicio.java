package com.carmovo.service;

import com.carmovo.model.Vehiculo;
import com.carmovo.repository.VehiculoRepositorio;
import com.carmovo.dto.VehiculoDTO;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehiculoServicio {

    private final VehiculoRepositorio vehiculoRepositorio;
    private final CategoriaServicio categoriaServicio;

    public VehiculoServicio(VehiculoRepositorio vehiculoRepositorio, CategoriaServicio categoriaServicio) {
        this.vehiculoRepositorio = vehiculoRepositorio;
        this.categoriaServicio = categoriaServicio;
    }

    @Transactional(readOnly = true)
    public List<VehiculoDTO> obtenerTodos() {
        return vehiculoRepositorio.findAll().stream()
                .map(this::convertirADto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VehiculoDTO obtenerPorId(Long id) {
        Vehiculo vehiculo = vehiculoRepositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado con ID: " + id));
        return convertirADto(vehiculo);
    }

    @Transactional
    public VehiculoDTO crearVehiculo(VehiculoDTO dto) {
        Vehiculo vehiculo = new Vehiculo();
        mapearEntidad(vehiculo, dto);
        Vehiculo guardado = vehiculoRepositorio.save(vehiculo);
        return convertirADto(guardado);
    }

    @Transactional
    public VehiculoDTO actualizarVehiculo(Long id, VehiculoDTO dto) {
        Vehiculo vehiculo = vehiculoRepositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado con ID: " + id));
        
        mapearEntidad(vehiculo, dto);
        Vehiculo actualizado = vehiculoRepositorio.save(vehiculo);
        return convertirADto(actualizado);
    }

    @Transactional
    public void eliminarVehiculo(Long id) {
        if (!vehiculoRepositorio.existsById(id)) {
            throw new RuntimeException("Vehículo no encontrado con ID: " + id);
        }
        vehiculoRepositorio.deleteById(id);
    }

    private VehiculoDTO convertirADto(Vehiculo vehiculo) {
        VehiculoDTO dto = new VehiculoDTO();
        dto.setIdVehiculo(vehiculo.getIdVehiculo());
        dto.setMarca(vehiculo.getMarca());
        dto.setModelo(vehiculo.getModelo());
        dto.setCategoria(vehiculo.getCategoria());
        dto.setPrecioDia(vehiculo.getPrecioDia());
        dto.setPasajeros(vehiculo.getPasajeros());
        dto.setTransmision(vehiculo.getTransmision());
        dto.setEstado(vehiculo.getEstado());
        dto.setImagen(vehiculo.getImagen());
        dto.setDescripcion(vehiculo.getDescripcion());
        dto.setPlaca(vehiculo.getPlaca());
        dto.setAnio(vehiculo.getAnio());
        dto.setColor(vehiculo.getColor());
        dto.setKilometraje(vehiculo.getKilometraje());
        dto.setVencimientoSoat(vehiculo.getVencimientoSoat());
        dto.setVencimientoRevision(vehiculo.getVencimientoRevision());
        dto.setAlertaDocumentos(alertaDocumentos(vehiculo));
        return dto;
    }

    private void mapearEntidad(Vehiculo vehiculo, VehiculoDTO dto) {
        vehiculo.setMarca(dto.getMarca());
        vehiculo.setModelo(dto.getModelo());
        // La categoría debe existir en "Categorías" (se guarda con su nombre oficial).
        vehiculo.setCategoria(categoriaServicio.validarParaVehiculo(dto.getCategoria(), vehiculo.getCategoria()));
        vehiculo.setPrecioDia(dto.getPrecioDia());
        vehiculo.setPasajeros(dto.getPasajeros());
        vehiculo.setTransmision(dto.getTransmision());
        if(dto.getEstado() != null) vehiculo.setEstado(dto.getEstado());
        vehiculo.setImagen(dto.getImagen());
        if (dto.getDescripcion() != null) {
            String descripcion = dto.getDescripcion().trim();
            vehiculo.setDescripcion(descripcion.isEmpty() ? null : descripcion);
        }

        // Datos nuevos: si el formulario no los envía (null) se conservan los actuales.
        if (dto.getPlaca() != null) {
            if (dto.getPlaca().isBlank()) {
                vehiculo.setPlaca(null);
            } else {
                String placa = ValidadorDocumentos.normalizarPlaca(dto.getPlaca());
                if (placa == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "La placa no es válida. Usa el formato ABC-123.");
                }
                boolean repetida = vehiculoRepositorio.findAll().stream()
                        .anyMatch(v -> placa.equalsIgnoreCase(v.getPlaca())
                                && !v.getIdVehiculo().equals(vehiculo.getIdVehiculo()));
                if (repetida) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe otro vehículo con la placa " + placa + ".");
                }
                vehiculo.setPlaca(placa);
            }
        }
        if (dto.getAnio() != null) {
            int maximo = LocalDate.now().getYear() + 1;
            if (dto.getAnio() < 1990 || dto.getAnio() > maximo) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El año debe estar entre 1990 y " + maximo + ".");
            }
            vehiculo.setAnio(dto.getAnio());
        }
        if (dto.getColor() != null) vehiculo.setColor(dto.getColor().isBlank() ? null : dto.getColor().trim());
        if (dto.getKilometraje() != null) {
            if (dto.getKilometraje() < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El kilometraje no puede ser negativo.");
            }
            vehiculo.setKilometraje(dto.getKilometraje());
        }
        if (dto.getVencimientoSoat() != null) vehiculo.setVencimientoSoat(dto.getVencimientoSoat());
        if (dto.getVencimientoRevision() != null) vehiculo.setVencimientoRevision(dto.getVencimientoRevision());
    }

    /** Aviso de documentos: "SOAT vencido", "Revisión vence en 12 días", etc. Null si todo está en regla. */
    public static String alertaDocumentos(Vehiculo v) {
        java.util.List<String> avisos = new java.util.ArrayList<>();
        agregarAviso(avisos, "SOAT", v.getVencimientoSoat());
        agregarAviso(avisos, "Revisión técnica", v.getVencimientoRevision());
        return avisos.isEmpty() ? null : String.join(" · ", avisos);
    }

    private static void agregarAviso(java.util.List<String> avisos, String documento, LocalDate vence) {
        if (vence == null) return;
        long dias = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), vence);
        if (dias < 0) avisos.add(documento + " vencido");
        else if (dias <= 30) avisos.add(documento + " vence en " + dias + (dias == 1 ? " día" : " días"));
    }

    /** Actualiza solo el kilometraje (devolución del vehículo). Nunca lo disminuye. */
    @Transactional
    public void registrarKilometraje(Long idVehiculo, int kilometraje) {
        Vehiculo vehiculo = vehiculoRepositorio.findById(idVehiculo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado."));
        if (vehiculo.getKilometraje() == null || kilometraje > vehiculo.getKilometraje()) {
            vehiculo.setKilometraje(kilometraje);
            vehiculoRepositorio.save(vehiculo);
        }
    }

    /** Cambia solo el estado (mantenimiento). */
    @Transactional
    public void cambiarEstado(Long idVehiculo, String estado) {
        Vehiculo vehiculo = vehiculoRepositorio.findById(idVehiculo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehículo no encontrado."));
        vehiculo.setEstado(estado);
        vehiculoRepositorio.save(vehiculo);
    }
}
