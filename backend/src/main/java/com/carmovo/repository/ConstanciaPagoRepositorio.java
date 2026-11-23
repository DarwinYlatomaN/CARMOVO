package com.carmovo.repository;

import com.carmovo.model.ConstanciaPago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConstanciaPagoRepositorio extends JpaRepository<ConstanciaPago, Long> {
    Optional<ConstanciaPago> findByIdIntento(Long idIntento);
    boolean existsByIdIntento(Long idIntento);
    void deleteByIdIntento(Long idIntento);
}
