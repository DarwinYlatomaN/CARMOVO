package com.carmovo.repository;


import com.carmovo.model.Alquiler;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface AlquilerRepositorio extends JpaRepository<Alquiler, Long> {

    Optional<Alquiler> findFirstByIdUsuarioOrderByFechaRegistroDesc(Long idUsuario);

    boolean existsByIdUsuario(Long idUsuario);

    /** Servicios con chofer asignados a un conductor. */
    List<Alquiler> findByIdConductorOrderByFechaInicioAsc(Long idConductor);

    List<Alquiler> findByIdUsuarioOrderByFechaRegistroDesc(Long idUsuario);

    /** Vehículos con un alquiler activo que se cruza con las fechas. */
    @Query("""
        SELECT DISTINCT a.idVehiculo
        FROM Alquiler a
        WHERE a.estado IN :estados
          AND a.fechaInicio <= :fechaFin
          AND a.fechaFin >= :fechaInicio
        """)
    List<Long> vehiculosOcupados(
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("estados") Collection<String> estados
    );

    @Query("""
        SELECT a
        FROM Alquiler a
        WHERE a.idVehiculo = :idVehiculo
          AND a.estado IN :estados
          AND a.fechaInicio <= :fechaFin
          AND a.fechaFin >= :fechaInicio
        """)
    List<Alquiler> buscarConflictos(
            @Param("idVehiculo") Long idVehiculo,
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin,
            @Param("estados") Collection<String> estados
    );
}
