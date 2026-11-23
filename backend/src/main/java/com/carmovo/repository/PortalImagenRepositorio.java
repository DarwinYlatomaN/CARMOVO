package com.carmovo.repository;

import com.carmovo.model.PortalImagen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PortalImagenRepositorio extends JpaRepository<PortalImagen, Long> {

    /** Solo los ids (sin cargar el archivo), del más reciente al más antiguo. */
    @Query("select i.idImagen from PortalImagen i where i.nombre = :nombre order by i.idImagen desc")
    List<Long> idsPorNombre(@Param("nombre") String nombre);
}
