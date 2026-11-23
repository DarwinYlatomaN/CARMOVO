package com.carmovo.repository;

import com.carmovo.model.PortalOferta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortalOfertaRepositorio extends JpaRepository<PortalOferta, Long> {
    List<PortalOferta> findAllByOrderByInicioDesc();

    /** Ofertas visibles de un vehículo cuya vigencia incluye la fecha indicada. */
    List<PortalOferta> findByIdVehiculoAndVisibleTrueAndInicioLessThanEqualAndFinGreaterThanEqual(
            Long idVehiculo, java.time.LocalDate fecha1, java.time.LocalDate fecha2);
}
