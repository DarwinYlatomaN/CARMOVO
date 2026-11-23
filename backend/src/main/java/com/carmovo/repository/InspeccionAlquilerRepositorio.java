package com.carmovo.repository;

import com.carmovo.model.InspeccionAlquiler;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InspeccionAlquilerRepositorio extends JpaRepository<InspeccionAlquiler, Long> {
    List<InspeccionAlquiler> findByIdAlquilerOrderByFechaAsc(Long idAlquiler);
    Optional<InspeccionAlquiler> findFirstByIdAlquilerAndTipo(Long idAlquiler, String tipo);
}
