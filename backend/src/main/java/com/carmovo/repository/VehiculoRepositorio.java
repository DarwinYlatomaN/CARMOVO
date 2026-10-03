package com.carmovo.repository;


import com.carmovo.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VehiculoRepositorio extends JpaRepository<Vehiculo, Long> {
    // Aquí podremos agregar filtros más adelante
}
