package com.carmovo.repository;

import com.carmovo.model.RestablecimientoContrasena;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RestablecimientoContrasenaRepositorio extends JpaRepository<RestablecimientoContrasena, Long> {

    Optional<RestablecimientoContrasena> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RestablecimientoContrasena r set r.usado = true where r.idUsuario = :idUsuario and r.usado = false")
    void invalidarPendientes(@Param("idUsuario") Long idUsuario);
}
