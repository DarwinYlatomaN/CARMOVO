package com.carmovo.repository;

import com.carmovo.model.IntentoPago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IntentoPagoRepositorio extends JpaRepository<IntentoPago, Long> {
    Optional<IntentoPago> findByCodigo(String codigo);
    boolean existsByMetodoAndReferencia(String metodo, String referencia);
    List<IntentoPago> findByEstadoInAndExpiraBefore(List<String> estados, LocalDateTime limite);
    Optional<IntentoPago> findFirstByIdAlquilerOrderByIdIntentoDesc(Long idAlquiler);
}
