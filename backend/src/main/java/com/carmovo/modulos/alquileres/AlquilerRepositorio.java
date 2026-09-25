package com.carmovo.modulos.alquileres;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface AlquilerRepositorio extends JpaRepository<Alquiler, Long> {

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
