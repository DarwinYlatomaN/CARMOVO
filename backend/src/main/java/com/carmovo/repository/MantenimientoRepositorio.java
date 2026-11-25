package com.carmovo.repository;

import com.carmovo.model.Mantenimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

import java.util.List;

public interface MantenimientoRepositorio extends JpaRepository<Mantenimiento, Long> {
    List<Mantenimiento> findAllByOrderByFechaProgramadaDesc();
    List<Mantenimiento> findByIdVehiculoAndEstado(Long idVehiculo, String estado);

    /** Autos que estarán en el taller entre esas fechas (en taller ahora o con un servicio programado). */
    @Query("""
        SELECT DISTINCT m.idVehiculo FROM Mantenimiento m
        WHERE m.estado = 'EN_TALLER'
           OR (m.estado = 'PROGRAMADO' AND m.fechaProgramada BETWEEN :inicio AND :fin)
        """)
    List<Long> vehiculosEnTaller(@Param("inicio") LocalDate inicio, @Param("fin") LocalDate fin);
}
