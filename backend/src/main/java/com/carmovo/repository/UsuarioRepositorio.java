package com.carmovo.repository;

import com.carmovo.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepositorio extends JpaRepository<Usuario, Long> {

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
