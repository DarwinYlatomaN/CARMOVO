package com.carmovo.service;

import com.carmovo.dto.RolDTO;
import com.carmovo.model.Perfil;
import com.carmovo.repository.PerfilRepositorio;
import com.carmovo.repository.UsuarioRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

/**
 * "Roles y permisos": el administrador principal define una sola vez
 * qué módulos ve cada rol del personal.
 *
 * El rol Administrador no se edita (tiene todo) y Cliente no entra al panel.
 * El administrador principal puede crear roles nuevos (por ejemplo "Supervisor"),
 * renombrarlos y eliminarlos si no tienen empleados. Los 4 roles de fábrica no se renombran ni eliminan.
 */
@Service
public class RolesServicio {

    /** Orden en que se muestran las columnas. */
    private static final List<String> ORDEN = List.of("Administrador", "Agente de reservas", "Cajero", "Conductor");

    private final PerfilRepositorio perfiles;
    private final UsuarioRepositorio usuarios;
    private final AdministradorAccesoServicio accesos;
    private final AuditoriaServicio auditoria;

    public RolesServicio(PerfilRepositorio perfiles, UsuarioRepositorio usuarios,
                         AdministradorAccesoServicio accesos, AuditoriaServicio auditoria) {
        this.perfiles = perfiles;
        this.usuarios = usuarios;
        this.accesos = accesos;
        this.auditoria = auditoria;
    }

    /** Catálogo de módulos agrupado: "panel" y "sitio". */
    public Map<String, Map<String, String>> catalogo() {
        Map<String, String> panel = new LinkedHashMap<>();
        Map<String, String> sitio = new LinkedHashMap<>();
        PermisosAdministrativos.paginas().forEach((codigo, nombre) -> {
            if (codigo.startsWith("WEB_")) sitio.put(codigo, nombre.replace("Sitio: ", ""));
            else panel.put(codigo, nombre);
        });
        Map<String, Map<String, String>> resultado = new LinkedHashMap<>();
        resultado.put("panel", panel);
        resultado.put("sitio", sitio);
        return resultado;
    }

    @Transactional(readOnly = true)
    public List<RolDTO> listar(Long actor) {
        accesos.exigirPrincipal(actor);
        return perfiles.findAll().stream()
                .filter(p -> PermisosAdministrativos.esRolPersonal(p.getNombre()))
                .sorted(Comparator.comparingInt((Perfil p) -> posicion(p.getNombre())))
                .map(this::convertir)
                .toList();
    }

    @Transactional
    public RolDTO actualizar(Long actor, Long idPerfil, Set<String> permisos) {
        accesos.exigirPrincipal(actor);
        Perfil perfil = perfiles.findById(idPerfil).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "El rol no existe."));
        if (!PermisosAdministrativos.esRolPersonal(perfil.getNombre())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ese rol no entra al panel administrativo.");
        }
        if (PermisosAdministrativos.esRolAdministrador(perfil.getNombre())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El rol Administrador siempre tiene todos los permisos.");
        }
        Set<String> nuevos = permisos == null ? Set.of() : permisos;
        if (nuevos.stream().anyMatch(c -> c == null || !PermisosAdministrativos.asignable(c))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hay módulos que no existen en el sistema.");
        }
        Set<String> anteriores = new TreeSet<>(perfil.getPermisos());
        perfil.setPermisos(nuevos);
        perfiles.save(perfil);

        Set<String> agregados = new TreeSet<>(nuevos); agregados.removeAll(anteriores);
        Set<String> quitados = new TreeSet<>(anteriores); quitados.removeAll(nuevos);
        auditoria.registrarSeguro("Roles", "ACTUALIZAR_PERMISOS", "Perfil", idPerfil,
                "Permisos del rol " + perfil.getNombre() + ". Agregados: " + (agregados.isEmpty() ? "—" : agregados)
                        + "; quitados: " + (quitados.isEmpty() ? "—" : quitados) + ".");
        return convertir(perfil);
    }

    private static final String PATRON_NOMBRE = "^[\\p{L}][\\p{L} .\\-]{1,49}$";

    @Transactional
    public RolDTO crear(Long actor, String nombre, Set<String> permisos) {
        accesos.exigirPrincipal(actor);
        String limpio = validarNombre(nombre, null);
        Set<String> nuevos = validarPermisos(permisos);
        Perfil perfil = new Perfil();
        perfil.setNombre(limpio);
        perfil.setPermisos(nuevos);
        perfil = perfiles.save(perfil);
        auditoria.registrarSeguro("Roles", "CREAR_ROL", "Perfil", perfil.getIdPerfil(),
                "Se creó el rol " + limpio + " con " + nuevos.size() + " módulo(s).");
        return convertir(perfil);
    }

    @Transactional
    public RolDTO renombrar(Long actor, Long idPerfil, String nombre) {
        accesos.exigirPrincipal(actor);
        Perfil perfil = buscarPersonalizado(idPerfil, "renombrar");
        String anterior = perfil.getNombre();
        perfil.setNombre(validarNombre(nombre, idPerfil));
        perfiles.save(perfil);
        auditoria.registrarSeguro("Roles", "RENOMBRAR_ROL", "Perfil", idPerfil,
                "El rol " + anterior + " ahora se llama " + perfil.getNombre() + ".");
        return convertir(perfil);
    }

    @Transactional
    public void eliminar(Long actor, Long idPerfil) {
        accesos.exigirPrincipal(actor);
        Perfil perfil = buscarPersonalizado(idPerfil, "eliminar");
        long empleados = usuarios.countByPerfilIdPerfil(idPerfil);
        if (empleados > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede eliminar: " + empleados
                    + " empleado(s) tienen este rol. Cámbialos de rol primero en Empleados.");
        }
        perfiles.delete(perfil);
        auditoria.registrarSeguro("Roles", "ELIMINAR_ROL", "Perfil", idPerfil, "Se eliminó el rol " + perfil.getNombre() + ".");
    }

    private Perfil buscarPersonalizado(Long idPerfil, String accion) {
        Perfil perfil = perfiles.findById(idPerfil).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "El rol no existe."));
        if (PermisosAdministrativos.esRolDeFabrica(perfil.getNombre())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Los roles de fábrica (Administrador, Agente de reservas, Cajero, Conductor y Cliente) no se pueden " + accion + ".");
        }
        return perfil;
    }

    private String validarNombre(String nombre, Long idPropio) {
        String limpio = nombre == null ? "" : nombre.trim().replaceAll("\\s+", " ");
        if (!limpio.matches(PATRON_NOMBRE)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El nombre del rol debe tener entre 2 y 50 letras (puede llevar espacios, puntos o guiones).");
        }
        boolean repetido = perfiles.findAll().stream().anyMatch(p ->
                p.getNombre().equalsIgnoreCase(limpio) && !p.getIdPerfil().equals(idPropio));
        if (repetido) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un rol llamado " + limpio + ".");
        }
        if (PermisosAdministrativos.ROL_CLIENTE.equalsIgnoreCase(limpio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ese nombre está reservado.");
        }
        return limpio;
    }

    private Set<String> validarPermisos(Set<String> permisos) {
        Set<String> nuevos = permisos == null ? new HashSet<>() : new HashSet<>(permisos);
        if (nuevos.stream().anyMatch(c -> c == null || !PermisosAdministrativos.asignable(c))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hay módulos que no existen en el sistema.");
        }
        return nuevos;
    }

    private RolDTO convertir(Perfil perfil) {
        RolDTO dto = new RolDTO();
        dto.setIdPerfil(perfil.getIdPerfil());
        dto.setNombre(perfil.getNombre());
        boolean admin = PermisosAdministrativos.esRolAdministrador(perfil.getNombre());
        dto.setEditable(!admin);
        dto.setDeFabrica(PermisosAdministrativos.esRolDeFabrica(perfil.getNombre()));
        dto.setEmpleados(usuarios.countByPerfilIdPerfil(perfil.getIdPerfil()));
        dto.setPermisos(admin ? PermisosAdministrativos.todasLasPaginas() : new TreeSet<>(perfil.getPermisos()));
        return dto;
    }

    private static int posicion(String nombre) {
        for (int i = 0; i < ORDEN.size(); i++) {
            if (ORDEN.get(i).equalsIgnoreCase(nombre)) return i;
        }
        return ORDEN.size();
    }
}
