package com.carmovo.repository;

import com.carmovo.model.Comprobante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ComprobanteRepositorio extends JpaRepository<Comprobante, Long> {
    Optional<Comprobante> findByIdAlquiler(Long idAlquiler);

    /** Último correlativo usado en una serie (B001 boletas, F001 facturas). */
    @org.springframework.data.jpa.repository.Query(
            "select coalesce(max(c.correlativo), 0) from Comprobante c where c.serie = :serie")
    int ultimoCorrelativo(@org.springframework.data.repository.query.Param("serie") String serie);
}
