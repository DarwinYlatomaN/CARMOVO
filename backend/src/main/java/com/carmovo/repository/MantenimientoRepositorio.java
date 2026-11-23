package com.carmovo.repository;

import com.carmovo.model.Mantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MantenimientoRepositorio extends JpaRepository<Mantenimiento, Long> {
    List<Mantenimiento> findAllByOrderByFechaProgramadaDesc();
    List<Mantenimiento> findByIdVehiculoAndEstado(Long idVehiculo, String estado);
}
