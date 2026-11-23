package com.carmovo.repository;

import com.carmovo.model.AceptacionPolitica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AceptacionPoliticaRepositorio extends JpaRepository<AceptacionPolitica, Long> {

    boolean existsByIdUsuarioAndContexto(Long idUsuario, String contexto);

    @Query("SELECT DISTINCT a.idUsuario FROM AceptacionPolitica a WHERE a.contexto = :contexto")
    List<Long> usuariosConAceptacion(@Param("contexto") String contexto);
}
