package com.carmovo.modulos.pagos;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PagoRepositorio extends JpaRepository<Pago, Long> {
    Optional<Pago> findByIdAlquiler(Long idAlquiler);
}
