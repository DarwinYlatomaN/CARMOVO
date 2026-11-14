package com.carmovo.repository;

import com.carmovo.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UsuarioRepositorio extends JpaRepository<Usuario, Long> {

    /** Solo clientes activos, sin datos administrativos. */
    @Query("""
            SELECT u FROM Usuario u
            WHERE u.estado = true AND LOWER(u.perfil.nombre) = 'cliente'
            ORDER BY u.nombres, u.apellidos
            """)
    java.util.List<Usuario> buscarClientesActivosParaAlquileres();


    // Validaciones existentes del correo electrónico
    Optional<Usuario> findByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCaseAndIdUsuarioNot(String correo, Long idUsuario);

    // Validaciones para nuevos registros
    boolean existsByDocumento(String documento);

    boolean existsByTelefono(String telefono);

    boolean existsByNumeroLicencia(String numeroLicencia);

    // Validaciones para actualización de perfiles
    // Permiten conservar los datos del usuario actual
    boolean existsByDocumentoAndIdUsuarioNot(String documento, Long idUsuario);

    boolean existsByTelefonoAndIdUsuarioNot(String telefono, Long idUsuario);

    boolean existsByNumeroLicenciaAndIdUsuarioNot(String numeroLicencia, Long idUsuario);
}
