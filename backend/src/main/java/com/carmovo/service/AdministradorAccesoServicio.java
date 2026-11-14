package com.carmovo.service;

import com.carmovo.model.AdministradorAcceso;
import com.carmovo.repository.AdministradorAccesoRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Set;

@Service
public class AdministradorAccesoServicio {
    private final AdministradorAccesoRepositorio repositorio;
    public AdministradorAccesoServicio(AdministradorAccesoRepositorio repositorio) { this.repositorio = repositorio; }

    @Transactional(readOnly = true)
    public AdministradorAcceso obtener(Long idUsuario) {
        return repositorio.findById(idUsuario).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.FORBIDDEN, "Cuenta administrativa sin permisos configurados. Ejecuta la migración de administradores."));
    }

    @Transactional(readOnly = true)
    public boolean esPrincipal(Long idUsuario) { return obtener(idUsuario).isPrincipal(); }

    @Transactional(readOnly = true)
    public List<String> permisos(Long idUsuario) {
        AdministradorAcceso acceso = obtener(idUsuario);
        return acceso.isPrincipal() ? PermisosAdministrativos.todosParaPrincipal() : acceso.getPermisos().stream().sorted().toList();
    }

    @Transactional(readOnly = true)
    public boolean tienePermiso(Long idUsuario, String codigo) {
        AdministradorAcceso acceso = obtener(idUsuario);
        return acceso.isPrincipal() || acceso.getPermisos().contains(codigo);
    }

    @Transactional(readOnly = true)
    public void exigir(Long idUsuario, String permisosAlternativos) {
        AdministradorAcceso acceso = obtener(idUsuario);
        if (acceso.isPrincipal()) return;
        for (String codigo : permisosAlternativos.split("\\|")) {
            if (acceso.getPermisos().contains(codigo)) return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para acceder a este módulo.");
    }

    public void exigirPrincipal(Long idUsuario) {
        if (!esPrincipal(idUsuario)) throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, "Esta acción es exclusiva del administrador principal.");
    }
}
