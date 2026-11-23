package com.carmovo.service;

import com.carmovo.model.AdministradorAcceso;
import com.carmovo.model.Usuario;
import com.carmovo.repository.AdministradorAccesoRepositorio;
import com.carmovo.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

/**
 * Decide qué puede hacer cada cuenta del panel.
 *
 *  - Administrador principal: todo, siempre. No se puede desactivar ni cambiar de rol.
 *  - Rol "Administrador": todas las páginas (salvo Empleados y Roles, exclusivas del principal).
 *  - Agente de reservas, Cajero, Conductor: las páginas que el principal marcó para ese rol
 *    en "Roles y permisos". Todos los empleados de un mismo rol ven lo mismo.
 */
@Service
public class AdministradorAccesoServicio {

    private final AdministradorAccesoRepositorio repositorio;
    private final UsuarioRepositorio usuarios;

    public AdministradorAccesoServicio(AdministradorAccesoRepositorio repositorio, UsuarioRepositorio usuarios) {
        this.repositorio = repositorio;
        this.usuarios = usuarios;
    }

    @Transactional(readOnly = true)
    public AdministradorAcceso obtener(Long idUsuario) {
        return repositorio.findById(idUsuario).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.FORBIDDEN, "Esta cuenta no está registrada como personal de CARMOVO."));
    }

    @Transactional(readOnly = true)
    public boolean esPrincipal(Long idUsuario) {
        return repositorio.findById(idUsuario).map(AdministradorAcceso::isPrincipal).orElse(false);
    }

    /** Permisos efectivos de la cuenta según su rol. */
    @Transactional(readOnly = true)
    public Set<String> permisosEfectivos(Long idUsuario) {
        AdministradorAcceso acceso = obtener(idUsuario);
        if (acceso.isPrincipal()) {
            return new java.util.LinkedHashSet<>(PermisosAdministrativos.todosParaPrincipal());
        }
        Usuario usuario = usuarios.findById(idUsuario).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.FORBIDDEN, "La cuenta ya no existe."));
        String rol = usuario.getPerfil() == null ? null : usuario.getPerfil().getNombre();
        if (!PermisosAdministrativos.esRolPersonal(rol)) {
            return Set.of();
        }
        if (PermisosAdministrativos.esRolAdministrador(rol)) {
            return PermisosAdministrativos.todasLasPaginas();
        }
        return usuario.getPerfil().getPermisos().stream()
                .filter(PermisosAdministrativos::asignable)
                .collect(java.util.stream.Collectors.toCollection(java.util.TreeSet::new));
    }

    @Transactional(readOnly = true)
    public List<String> permisos(Long idUsuario) {
        return List.copyOf(permisosEfectivos(idUsuario));
    }

    @Transactional(readOnly = true)
    public boolean tienePermiso(Long idUsuario, String codigo) {
        return permisosEfectivos(idUsuario).contains(codigo);
    }

    /** Acepta varios permisos alternativos separados por "|". */
    @Transactional(readOnly = true)
    public void exigir(Long idUsuario, String permisosAlternativos) {
        Set<String> permisos = permisosEfectivos(idUsuario);
        for (String codigo : permisosAlternativos.split("\\|")) {
            if (permisos.contains(codigo)) return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tu rol no tiene permiso para acceder a este módulo.");
    }

    public void exigirPrincipal(Long idUsuario) {
        if (!esPrincipal(idUsuario)) throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, "Esta acción es exclusiva del administrador principal.");
    }
}
