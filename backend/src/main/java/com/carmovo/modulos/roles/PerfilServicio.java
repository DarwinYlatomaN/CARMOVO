package com.carmovo.modulos.roles;

import com.carmovo.modulos.roles.dto.PerfilDTO;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PerfilServicio {

    private final PerfilRepositorio perfilRepositorio;

    public PerfilServicio(PerfilRepositorio perfilRepositorio) {
        this.perfilRepositorio = perfilRepositorio;
    }

    @Transactional(readOnly = true)
    public List<PerfilDTO> obtenerTodos() {
        return perfilRepositorio.findAll(Sort.by(Sort.Direction.ASC, "nombre")).stream()
                .map(perfil -> new PerfilDTO(perfil.getIdPerfil(), perfil.getNombre()))
                .toList();
    }
}
