package com.carmovo.repository;

import com.carmovo.model.CargoAlquiler;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CargoAlquilerRepositorio extends JpaRepository<CargoAlquiler, Long> {
    List<CargoAlquiler> findByIdAlquilerOrderByFechaRegistroAsc(Long idAlquiler);
    List<CargoAlquiler> findByEstado(String estado);
}
