package com.carmovo.repository;

import com.carmovo.model.Comprobante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ComprobanteRepositorio extends JpaRepository<Comprobante, Long> {
    Optional<Comprobante> findByIdAlquiler(Long idAlquiler);
}
