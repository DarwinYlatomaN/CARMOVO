package com.carmovo.service;

import com.carmovo.dto.AdministradorSecundarioDTO;
import com.carmovo.dto.AdministradorSecundarioGuardarDTO;
import com.carmovo.model.AdministradorAcceso;
import com.carmovo.model.Perfil;
import com.carmovo.model.Usuario;
import com.carmovo.repository.AdministradorAccesoRepositorio;
import com.carmovo.repository.PerfilRepositorio;
import com.carmovo.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.HashSet;

@Service
public class GestionAdministradoresServicio {
    private final UsuarioRepositorio usuarios;
    private final PerfilRepositorio perfiles;
    private final AdministradorAccesoRepositorio accesos;
    private final AdministradorAccesoServicio accesoServicio;
    private final AuditoriaServicio auditoria;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public GestionAdministradoresServicio(UsuarioRepositorio usuarios, PerfilRepositorio perfiles,
            AdministradorAccesoRepositorio accesos, AdministradorAccesoServicio accesoServicio,
            AuditoriaServicio auditoria) {
        this.usuarios = usuarios; this.perfiles = perfiles; this.accesos = accesos;
        this.accesoServicio = accesoServicio; this.auditoria = auditoria;
    }

    @Transactional(readOnly = true)
    public List<AdministradorSecundarioDTO> listar(Long actor) {
        accesoServicio.exigirPrincipal(actor);
        return accesos.findAll().stream().filter(a -> !a.isPrincipal())
                .map(a -> usuarios.findById(a.getIdUsuario()).map(u -> convertir(u, a)).orElse(null))
                .filter(java.util.Objects::nonNull).toList();
    }

    @Transactional
    public AdministradorSecundarioDTO crear(Long actor, AdministradorSecundarioGuardarDTO dto) {
        accesoServicio.exigirPrincipal(actor);
        validar(dto, true);
        String correo = dto.getCorreo().trim().toLowerCase(Locale.ROOT);
        if (usuarios.existsByCorreoIgnoreCase(correo)) throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Ya existe una cuenta con ese correo electrónico.");
        Perfil perfil = perfiles.findByNombreIgnoreCase("Administrador")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falta el perfil Administrador en la base de datos."));
        Usuario usuario = new Usuario();
        usuario.setNombres(dto.getNombres().trim()); usuario.setApellidos(dto.getApellidos().trim());
        usuario.setCorreo(correo); usuario.setContrasena(encoder.encode(dto.getContrasena()));
        usuario.setEstado(dto.getEstado() == null || dto.getEstado()); usuario.setPerfil(perfil);
        usuario = usuarios.save(usuario);
        AdministradorAcceso acceso = new AdministradorAcceso();
        acceso.setIdUsuario(usuario.getIdUsuario()); acceso.setPrincipal(false);
        acceso.setPermisos(dto.getPermisos()); acceso = accesos.save(acceso);
        auditoria.registrarSeguro("Administradores", "CREAR_SECUNDARIO", "Usuario", usuario.getIdUsuario(),
                "Se creó el administrador secundario " + usuario.getCorreo() + " con permisos " + acceso.getPermisos());
        return convertir(usuario, acceso);
    }

    @Transactional
    public AdministradorSecundarioDTO actualizar(Long actor, Long id, AdministradorSecundarioGuardarDTO dto) {
        accesoServicio.exigirPrincipal(actor);
        validar(dto, false);
        AdministradorAcceso acceso = secundario(id);
        Usuario usuario = usuarios.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String correo = dto.getCorreo().trim().toLowerCase(Locale.ROOT);
        if (usuarios.existsByCorreoIgnoreCaseAndIdUsuarioNot(correo, id)) throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Ese correo pertenece a otro usuario.");
        usuario.setNombres(dto.getNombres().trim()); usuario.setApellidos(dto.getApellidos().trim());
        usuario.setCorreo(correo);
        if (dto.getContrasena() != null && !dto.getContrasena().isBlank())
            usuario.setContrasena(encoder.encode(dto.getContrasena()));
        if (dto.getEstado() != null) usuario.setEstado(dto.getEstado());
        acceso.setPermisos(dto.getPermisos());
        usuarios.save(usuario); accesos.save(acceso);
        auditoria.registrarSeguro("Administradores", "ACTUALIZAR_SECUNDARIO", "Usuario", id,
                "Se actualizaron los permisos del administrador " + correo + ": " + acceso.getPermisos());
        return convertir(usuario, acceso);
    }

    @Transactional
    public AdministradorSecundarioDTO desactivar(Long actor, Long id) {
        accesoServicio.exigirPrincipal(actor);
        AdministradorAcceso acceso = secundario(id);
        Usuario usuario = usuarios.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        usuario.setEstado(false);
        usuarios.save(usuario);
        auditoria.registrarSeguro("Administradores", "DESACTIVAR_SECUNDARIO", "Usuario", id,
                "Se desactivó el acceso de " + usuario.getCorreo());
        return convertir(usuario, acceso);
    }

    private AdministradorAcceso secundario(Long id) {
        AdministradorAcceso acceso = accesos.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "No existe el administrador secundario."));
        if (acceso.isPrincipal()) throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "No está permitido modificar un administrador principal.");
        return acceso;
    }

    private void validar(AdministradorSecundarioGuardarDTO dto, boolean nuevo) {
        if (dto == null || dto.getNombres() == null || dto.getNombres().isBlank() || dto.getNombres().length() > 100
                || dto.getApellidos() == null || dto.getApellidos().isBlank() || dto.getApellidos().length() > 100
                || dto.getCorreo() == null || dto.getCorreo().isBlank() || dto.getCorreo().length() > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombres, apellidos y correo válidos son obligatorios.");
        }
        if (nuevo && (dto.getContrasena() == null || dto.getContrasena().isBlank())) throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Debes asignar una contraseña al administrador secundario.");
        if (dto.getContrasena() != null && !dto.getContrasena().isBlank() &&
                (dto.getContrasena().length() < 8 || dto.getContrasena().length() > 72)) throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "La contraseña debe contener entre 8 y 72 caracteres.");
        if (dto.getPermisos() == null || dto.getPermisos().isEmpty() || dto.getPermisos().stream().anyMatch(p -> p == null || !PermisosAdministrativos.asignable(p)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes seleccionar al menos una página válida.");
    }

    private AdministradorSecundarioDTO convertir(Usuario usuario, AdministradorAcceso acceso) {
        AdministradorSecundarioDTO dto = new AdministradorSecundarioDTO();
        dto.setIdUsuario(usuario.getIdUsuario()); dto.setNombres(usuario.getNombres());
        dto.setApellidos(usuario.getApellidos()); dto.setCorreo(usuario.getCorreo());
        dto.setEstado(usuario.getEstado()); dto.setPermisos(Set.copyOf(acceso.getPermisos()));
        return dto;
    }
}
