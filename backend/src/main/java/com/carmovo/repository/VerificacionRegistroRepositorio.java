package com.carmovo.repository;

import com.carmovo.model.VerificacionRegistro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface VerificacionRegistroRepositorio extends JpaRepository<VerificacionRegistro, Long> {

    Optional<VerificacionRegistro> findByCorreoIgnoreCase(String correo);

    @Modifying
    @Query("DELETE FROM VerificacionRegistro v WHERE v.expira < :limite")
    int borrarVencidas(@Param("limite") LocalDateTime limite);
}