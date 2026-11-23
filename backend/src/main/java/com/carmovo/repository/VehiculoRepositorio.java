package com.carmovo.repository;


import com.carmovo.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VehiculoRepositorio extends JpaRepository<Vehiculo, Long> {

    long countByCategoriaIgnoreCase(String categoria);

    /** Al renombrar una categoría, sus vehículos pasan al nuevo nombre. */
    @Modifying
    @Query("update Vehiculo v set v.categoria = :nuevo where lower(v.categoria) = lower(:anterior)")
    int renombrarCategoria(@Param("anterior") String anterior, @Param("nuevo") String nuevo);
}
