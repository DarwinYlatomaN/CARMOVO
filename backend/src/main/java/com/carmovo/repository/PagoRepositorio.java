package com.carmovo.repository;


import com.carmovo.model.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PagoRepositorio extends JpaRepository<Pago, Long> {
    Optional<Pago> findByIdAlquiler(Long idAlquiler);

    boolean existsByMetodoIgnoreCaseAndReferencia(String metodo, String referencia);

    java.util.List<Pago> findByEstadoAndMetodoIgnoreCase(String estado, String metodo);
}
