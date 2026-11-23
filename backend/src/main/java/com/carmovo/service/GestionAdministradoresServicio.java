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

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Módulo "Empleados": cuentas del personal que entra al panel.
 * Cada empleado tiene UN rol; sus permisos salen de "Roles y permisos".
 *
 * Reglas de la cuenta principal:
 *  - no se puede desactivar, eliminar ni cambiar de rol;
 *  - solo ella misma puede editar sus datos y su contraseña.
 */
@Service
public class GestionAdministradoresServicio {

    private final UsuarioRepositorio usuarios;
    private final PerfilRepositorio perfiles;
    private final AdministradorAccesoRepositorio accesos;
    private final AdministradorAccesoServicio accesoServicio;
    private final AuditoriaServicio auditoria;
    private final PoliticasServicio politicas;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public GestionAdministradoresServicio(UsuarioRepositorio usuarios, PerfilRepositorio perfiles,
            AdministradorAccesoRepositorio accesos, AdministradorAccesoServicio accesoServicio,
            AuditoriaServicio auditoria, PoliticasServicio politicas) {
        this.usuarios = usuarios; this.perfiles = perfiles; this.accesos = accesos;
        this.accesoServicio = accesoServicio; this.auditoria = auditoria; this.politicas = politicas;
    }

    /** Todos los empleados; el principal aparece primero. */
    @Transactional(readOnly = true)
    public List<AdministradorSecundarioDTO> listar(Long actor) {
        accesoServicio.exigirPrincipal(actor);
        return accesos.findAll().stream()
                .map(a -> usuarios.findById(a.getIdUsuario()).map(u -> convertir(u, a)).orElse(null))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(AdministradorSecundarioDTO::isPrincipal).reversed()
                        .thenComparing(AdministradorSecundarioDTO::getNombres, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional
    public AdministradorSecundarioDTO crear(Long actor, AdministradorSecundarioGuardarDTO dto) {
        accesoServicio.exigirPrincipal(actor);
        validar(dto, true);
        PoliticasServicio.exigir(dto.getAceptaPoliticas());
        String correo = dto.getCorreo().trim().toLowerCase(Locale.ROOT);
        if (usuarios.existsByCorreoIgnoreCase(correo)) throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Ya existe una cuenta con ese correo electrónico.");
        Perfil rol = rolDePersonal(dto.getIdPerfil());

        Usuario usuario = new Usuario();
        usuario.setNombres(dto.getNombres().trim());
        usuario.setApellidos(dto.getApellidos().trim());
        usuario.setCorreo(correo);
        usuario.setContrasena(encoder.encode(dto.getContrasena()));
        usuario.setEstado(dto.getEstado() == null || dto.getEstado());
        usuario.setPerfil(rol);
        aplicarDatosPersonales(usuario, dto, rol, null);
        usuario = usuarios.save(usuario);

        AdministradorAcceso acceso = new AdministradorAcceso();
        acceso.setIdUsuario(usuario.getIdUsuario());
        acceso.setPrincipal(false);
        acceso = accesos.save(acceso);
        politicas.registrar(usuario.getIdUsuario(), PoliticasServicio.EMPLEADO, null, correoDe(actor));

        auditoria.registrarSeguro("Empleados", "CREAR_EMPLEADO", "Usuario", usuario.getIdUsuario(),
                "Se creó el empleado " + usuario.getCorreo() + " con el rol " + rol.getNombre() + ".");
        return convertir(usuario, acceso);
    }

    @Transactional
    public AdministradorSecundarioDTO actualizar(Long actor, Long id, AdministradorSecundarioGuardarDTO dto) {
        accesoServicio.exigirPrincipal(actor);
        validar(dto, false);
        AdministradorAcceso acceso = accesos.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "No existe el empleado."));
        Usuario usuario = usuarios.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (acceso.isPrincipal() && !Objects.equals(actor, id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Solo el administrador principal puede editar su propia cuenta.");
        }

        String correo = dto.getCorreo().trim().toLowerCase(Locale.ROOT);
        if (usuarios.existsByCorreoIgnoreCaseAndIdUsuarioNot(correo, id)) throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Ese correo pertenece a otro usuario.");

        String rolAnterior = usuario.getPerfil().getNombre();
        usuario.setNombres(dto.getNombres().trim());
        usuario.setApellidos(dto.getApellidos().trim());
        usuario.setCorreo(correo);
        if (dto.getContrasena() != null && !dto.getContrasena().isBlank()) {
            usuario.setContrasena(encoder.encode(dto.getContrasena()));
        }

        // La cuenta principal conserva siempre su rol y queda siempre activa.
        if (!acceso.isPrincipal()) {
            if (dto.getEstado() != null) usuario.setEstado(dto.getEstado());
            if (dto.getIdPerfil() != null) usuario.setPerfil(rolDePersonal(dto.getIdPerfil()));
        }
        aplicarDatosPersonales(usuario, dto, usuario.getPerfil(), id);
        // Empleados creados antes de esta versión: se pide la aceptación una sola vez.
        if (!politicas.acepto(id, PoliticasServicio.EMPLEADO)) {
            PoliticasServicio.exigir(dto.getAceptaPoliticas());
            politicas.registrar(id, PoliticasServicio.EMPLEADO, null, correoDe(actor));
        }
        usuarios.save(usuario);

        auditoria.registrarSeguro("Empleados", "ACTUALIZAR_EMPLEADO", "Usuario", id,
                "Se actualizó el empleado " + correo + ". Rol: " + rolAnterior + " → "
                        + usuario.getPerfil().getNombre() + "; estado: "
                        + (Boolean.TRUE.equals(usuario.getEstado()) ? "activo" : "inactivo") + ".");
        return convertir(usuario, acceso);
    }

    @Transactional
    public AdministradorSecundarioDTO cambiarEstado(Long actor, Long id, boolean activo) {
        accesoServicio.exigirPrincipal(actor);
        AdministradorAcceso acceso = accesos.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "No existe el empleado."));
        if (acceso.isPrincipal()) throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "La cuenta del administrador principal no se puede desactivar.");
        Usuario usuario = usuarios.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        usuario.setEstado(activo);
        usuarios.save(usuario);
        auditoria.registrarSeguro("Empleados", activo ? "ACTIVAR_EMPLEADO" : "DESACTIVAR_EMPLEADO", "Usuario", id,
                (activo ? "Se activó" : "Se desactivó") + " el acceso de " + usuario.getCorreo() + ".");
        return convertir(usuario, acceso);
    }

    /** Compatibilidad con la ruta anterior "desactivar". */
    @Transactional
    public AdministradorSecundarioDTO desactivar(Long actor, Long id) {
        return cambiarEstado(actor, id, false);
    }

    private Perfil rolDePersonal(Long idPerfil) {
        if (idPerfil == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona el rol del empleado.");
        Perfil perfil = perfiles.findById(idPerfil).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "El rol seleccionado no existe."));
        if (!PermisosAdministrativos.esRolPersonal(perfil.getNombre())) throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Ese rol no corresponde a personal de CARMOVO.");
        return perfil;
    }

    private void validar(AdministradorSecundarioGuardarDTO dto, boolean nuevo) {
        if (dto == null || dto.getNombres() == null || dto.getNombres().isBlank() || dto.getNombres().length() > 100
                || dto.getApellidos() == null || dto.getApellidos().isBlank() || dto.getApellidos().length() > 100
                || dto.getCorreo() == null || dto.getCorreo().isBlank() || dto.getCorreo().length() > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombres, apellidos y correo válidos son obligatorios.");
        }
        if (nuevo && (dto.getContrasena() == null || dto.getContrasena().isBlank())) throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Asigna una contraseña temporal al empleado.");
        if (dto.getContrasena() != null && !dto.getContrasena().isBlank() &&
                (dto.getContrasena().length() < 8 || dto.getContrasena().length() > 72)) throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "La contraseña debe contener entre 8 y 72 caracteres.");
        if (nuevo && dto.getIdPerfil() == null) throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Selecciona el rol del empleado.");
    }

    /**
     * Datos para registrar de verdad a un empleado: DNI, celular, fecha de nacimiento (mayor de 18),
     * domicilio y distrito. Si su rol es Conductor, también la licencia (número, categoría y vencimiento vigente).
     */
    private void aplicarDatosPersonales(Usuario usuario, AdministradorSecundarioGuardarDTO dto, Perfil rol, Long idPropio) {
        String dni = limpio(dto.getDocumento());
        if (dni == null || !ValidadorDocumentos.dniValido(dni)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El DNI debe tener 8 dígitos.");
        }
        boolean dniRepetido = idPropio == null ? usuarios.existsByDocumento(dni) : usuarios.existsByDocumentoAndIdUsuarioNot(dni, idPropio);
        if (dniRepetido) throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese DNI ya está registrado en otra cuenta.");

        String celular = limpio(dto.getTelefono());
        if (celular == null || !ValidadorDocumentos.celularValido(celular)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El celular debe tener 9 dígitos y empezar con 9.");
        }
        celular = celular.replaceAll("\\s", "");
        boolean celularRepetido = idPropio == null ? usuarios.existsByTelefono(celular) : usuarios.existsByTelefonoAndIdUsuarioNot(celular, idPropio);
        if (celularRepetido) throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese celular ya está registrado en otra cuenta.");

        java.time.LocalDate nacimiento = dto.getFechaNacimiento();
        if (nacimiento == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indica la fecha de nacimiento.");
        int edad = ValidadorDocumentos.edad(nacimiento, java.time.LocalDate.now());
        if (edad < 18 || edad > 80) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El empleado debe tener entre 18 y 80 años.");

        String domicilio = limpio(dto.getDomicilio());
        if (domicilio == null || domicilio.length() < 5 || domicilio.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escribe el domicilio (mínimo 5 caracteres).");
        }
        String distrito = limpio(dto.getDistrito());
        if (distrito != null && distrito.length() > 80) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El distrito es demasiado largo.");

        usuario.setDocumento(dni);
        usuario.setTelefono(celular);
        usuario.setFechaNacimiento(nacimiento);
        usuario.setDomicilio(domicilio);
        usuario.setDistrito(distrito);

        boolean conductor = rol != null && "conductor".equalsIgnoreCase(rol.getNombre());
        String licencia = limpio(dto.getNumeroLicencia());
        if (conductor || licencia != null) {
            if (licencia == null || !licencia.toUpperCase(java.util.Locale.ROOT).matches("[A-Z]?\\d{8,9}")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El número de licencia debe ser una letra seguida del DNI (por ejemplo Q12345678).");
            }
            licencia = licencia.toUpperCase(java.util.Locale.ROOT);
            boolean licenciaRepetida = idPropio == null ? usuarios.existsByNumeroLicencia(licencia)
                    : usuarios.existsByNumeroLicenciaAndIdUsuarioNot(licencia, idPropio);
            if (licenciaRepetida) throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese número de licencia ya está registrado.");
            String categoria = ValidadorDocumentos.normalizarCategoria(dto.getCategoriaLicencia());
            if (categoria == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona la categoría de la licencia.");
            java.time.LocalDate vence = dto.getVencimientoLicencia();
            if (vence == null || !vence.isAfter(java.time.LocalDate.now())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La licencia debe estar vigente (fecha de vencimiento futura).");
            }
            usuario.setNumeroLicencia(licencia);
            usuario.setCategoriaLicencia(ValidadorDocumentos.mostrarCategoria(categoria));
            usuario.setVencimientoLicencia(vence);
        }
    }

    private String correoDe(Long idUsuario) {
        return idUsuario == null ? null : usuarios.findById(idUsuario).map(Usuario::getCorreo).orElse(null);
    }

    private static String limpio(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }

    private AdministradorSecundarioDTO convertir(Usuario usuario, AdministradorAcceso acceso) {
        AdministradorSecundarioDTO dto = new AdministradorSecundarioDTO();
        dto.setIdUsuario(usuario.getIdUsuario());
        dto.setNombres(usuario.getNombres());
        dto.setApellidos(usuario.getApellidos());
        dto.setCorreo(usuario.getCorreo());
        dto.setEstado(usuario.getEstado());
        dto.setDocumento(usuario.getDocumento());
        dto.setTelefono(usuario.getTelefono());
        dto.setFechaNacimiento(usuario.getFechaNacimiento());
        dto.setDomicilio(usuario.getDomicilio());
        dto.setDistrito(usuario.getDistrito());
        dto.setNumeroLicencia(usuario.getNumeroLicencia());
        dto.setCategoriaLicencia(usuario.getCategoriaLicencia());
        dto.setVencimientoLicencia(usuario.getVencimientoLicencia());
        dto.setPrincipal(acceso.isPrincipal());
        dto.setPoliticasAceptadas(politicas.acepto(usuario.getIdUsuario(), PoliticasServicio.EMPLEADO));
        if (usuario.getPerfil() != null) {
            dto.setIdPerfil(usuario.getPerfil().getIdPerfil());
            dto.setRol(acceso.isPrincipal() ? "Administrador principal" : usuario.getPerfil().getNombre());
        }
        dto.setPermisos(new java.util.TreeSet<>(accesoServicio.permisos(usuario.getIdUsuario())));
        return dto;
    }
}
