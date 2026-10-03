package com.carmovo.repository;


import com.carmovo.model.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PerfilRepositorio extends JpaRepository<Perfil, Long> {

    Optional<Perfil> findByNombreIgnoreCase(String nombre);
}
