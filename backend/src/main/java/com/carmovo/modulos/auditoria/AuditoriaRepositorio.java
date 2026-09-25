package com.carmovo.modulos.auditoria;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditoriaRepositorio extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findAllByOrderByFechaHoraDesc();
}
