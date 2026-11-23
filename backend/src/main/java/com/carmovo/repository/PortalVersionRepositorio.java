package com.carmovo.repository;

import com.carmovo.model.PortalVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortalVersionRepositorio extends JpaRepository<PortalVersion, Long> {
    List<PortalVersion> findTop20ByOrderByFechaDesc();
}
