package com.carmovo.repository;

import com.carmovo.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepositorio extends JpaRepository<Categoria, Long> {
    List<Categoria> findAllByOrderByOrdenAscNombreAsc();
    List<Categoria> findByActivaTrueOrderByOrdenAscNombreAsc();
    Optional<Categoria> findByNombreIgnoreCase(String nombre);
    boolean existsByNombreIgnoreCaseAndIdCategoriaNot(String nombre, Long idCategoria);
    boolean existsByNombreIgnoreCase(String nombre);
}
