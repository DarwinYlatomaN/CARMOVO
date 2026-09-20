package com.carmovo.modulos.vehiculos;

import com.carmovo.modulos.vehiculos.dto.VehiculoDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VehiculoServicio {

    private final VehiculoRepositorio vehiculoRepositorio;

    public VehiculoServicio(VehiculoRepositorio vehiculoRepositorio) {
        this.vehiculoRepositorio = vehiculoRepositorio;
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
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado con ID: " + id));
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
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado con ID: " + id));
        
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
        return dto;
    }

    private void mapearEntidad(Vehiculo vehiculo, VehiculoDTO dto) {
        vehiculo.setMarca(dto.getMarca());
        vehiculo.setModelo(dto.getModelo());
        vehiculo.setCategoria(dto.getCategoria());
        vehiculo.setPrecioDia(dto.getPrecioDia());
        vehiculo.setPasajeros(dto.getPasajeros());
        vehiculo.setTransmision(dto.getTransmision());
        if(dto.getEstado() != null) vehiculo.setEstado(dto.getEstado());
        vehiculo.setImagen(dto.getImagen());
    }
}