package com.carmovo.service;


import com.carmovo.model.Usuario;
import com.carmovo.repository.UsuarioRepositorio;
import com.carmovo.model.Perfil;
import com.carmovo.repository.PerfilRepositorio;
import com.carmovo.dto.UsuarioDTO;
import com.carmovo.dto.UsuarioGuardarDTO;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
public class UsuarioServicio {

    private static final String PERFIL_CLIENTE = "Cliente";

    private final UsuarioRepositorio usuarioRepositorio;
    private final PerfilRepositorio perfilRepositorio;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UsuarioServicio(UsuarioRepositorio usuarioRepositorio, PerfilRepositorio perfilRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.perfilRepositorio = perfilRepositorio;
    }

    @Transactional(readOnly = true)
    public List<UsuarioDTO> obtenerTodos() {
        return usuarioRepositorio.findAll().stream()
                .map(this::convertirADto)
                .toList();
    }

    @Transactional(readOnly = true)
    public UsuarioDTO obtenerPorId(Long id) {
        return convertirADto(buscarUsuario(id));
    }

    @Transactional(readOnly = true)
    public UsuarioDTO obtenerClientePorId(Long id) {
        Usuario usuario = buscarUsuario(id);
        validarQueSeaCliente(usuario);
        return convertirADto(usuario);
    }

    @Transactional
    public UsuarioDTO crearUsuario(UsuarioGuardarDTO dto) {
        validarDatosObligatorios(dto, true);

        String correo = normalizarCorreo(dto.getCorreo());
        if (usuarioRepositorio.existsByCorreoIgnoreCase(correo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario registrado con ese correo.");
        }

        Usuario usuario = new Usuario();
        usuario.setNombres(dto.getNombres().trim());
        usuario.setApellidos(dto.getApellidos().trim());
        usuario.setCorreo(correo);
        usuario.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        usuario.setTelefono(limpiarOpcional(dto.getTelefono()));
        copiarDatosPerfilSiPresentes(usuario, dto);
        usuario.setEstado(dto.getEstado() == null ? true : dto.getEstado());
        usuario.setPerfil(buscarPerfil(dto.getIdPerfil()));

        return convertirADto(usuarioRepositorio.save(usuario));
    }

    @Transactional
    public UsuarioDTO registrarCliente(UsuarioGuardarDTO dto) {
        validarDatosCliente(dto);

        String correo = normalizarCorreo(dto.getCorreo());
        if (usuarioRepositorio.existsByCorreoIgnoreCase(correo)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Este correo ya está registrado. Inicia sesión.");
        }

        Usuario usuario = new Usuario();
        usuario.setNombres(dto.getNombres().trim());
        usuario.setApellidos(dto.getApellidos().trim());
        usuario.setCorreo(correo);
        usuario.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        usuario.setTelefono(dto.getTelefono().trim());
        copiarDatosPerfilCliente(usuario, dto);
        usuario.setEstado(true);
        usuario.setPerfil(buscarPerfilCliente());

        return convertirADto(usuarioRepositorio.save(usuario));
    }

    @Transactional
    public UsuarioDTO autenticarCliente(String correoIngresado, String contrasenaIngresada) {
        if (esVacio(correoIngresado) || esVacio(contrasenaIngresada)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Correo y contraseña son obligatorios.");
        }

        String correo = normalizarCorreo(correoIngresado);
        Usuario usuario = usuarioRepositorio.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Correo o contraseña incorrectos."
                ));

        if (!Boolean.TRUE.equals(usuario.getEstado())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario se encuentra inactivo.");
        }

        validarQueSeaCliente(usuario);

        String contrasenaGuardada = usuario.getContrasena();
        boolean coincide = false;

        if (contrasenaGuardada != null && contrasenaGuardada.startsWith("$2")) {
            coincide = passwordEncoder.matches(contrasenaIngresada, contrasenaGuardada);
        } else if (contrasenaGuardada != null && contrasenaGuardada.equals(contrasenaIngresada)) {
            // Compatibilidad con usuarios de prueba antiguos: al iniciar sesión se migra a BCrypt.
            coincide = true;
            usuario.setContrasena(passwordEncoder.encode(contrasenaIngresada));
            usuarioRepositorio.save(usuario);
        }

        if (!coincide) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos.");
        }

        return convertirADto(usuario);
    }

    @Transactional
    public UsuarioDTO actualizarUsuario(Long id, UsuarioGuardarDTO dto) {
        validarDatosObligatorios(dto, false);

        Usuario usuario = buscarUsuario(id);
        String correo = normalizarCorreo(dto.getCorreo());

        if (usuarioRepositorio.existsByCorreoIgnoreCaseAndIdUsuarioNot(correo, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe otro usuario registrado con ese correo.");
        }

        usuario.setNombres(dto.getNombres().trim());
        usuario.setApellidos(dto.getApellidos().trim());
        usuario.setCorreo(correo);
        usuario.setTelefono(limpiarOpcional(dto.getTelefono()));
        copiarDatosPerfilSiPresentes(usuario, dto);
        usuario.setPerfil(buscarPerfil(dto.getIdPerfil()));

        if (dto.getEstado() != null) {
            usuario.setEstado(dto.getEstado());
        }

        if (dto.getContrasena() != null && !dto.getContrasena().isBlank()) {
            validarLongitudContrasena(dto.getContrasena());
            usuario.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        }

        return convertirADto(usuarioRepositorio.save(usuario));
    }

    @Transactional
    public UsuarioDTO actualizarPerfilCliente(Long id, UsuarioGuardarDTO dto) {
        validarPerfilCliente(dto);

        Usuario usuario = buscarUsuario(id);
        validarQueSeaCliente(usuario);

        String correo = normalizarCorreo(dto.getCorreo());
        if (usuarioRepositorio.existsByCorreoIgnoreCaseAndIdUsuarioNot(correo, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe otro usuario registrado con ese correo.");
        }

        usuario.setNombres(dto.getNombres().trim());
        usuario.setApellidos(dto.getApellidos().trim());
        usuario.setCorreo(correo);
        usuario.setTelefono(dto.getTelefono().trim());
        copiarDatosPerfilCliente(usuario, dto);

        return convertirADto(usuarioRepositorio.save(usuario));
    }

    @Transactional
    public void eliminarUsuario(Long id) {
        Usuario usuario = buscarUsuario(id);
        usuarioRepositorio.delete(usuario);
    }

    private Usuario buscarUsuario(Long id) {
        return usuarioRepositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado con ID: " + id));
    }

    private Perfil buscarPerfil(Long idPerfil) {
        if (idPerfil == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes seleccionar un perfil.");
        }

        return perfilRepositorio.findById(idPerfil)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El perfil seleccionado no existe."));
    }

    private Perfil buscarPerfilCliente() {
        return perfilRepositorio.findByNombreIgnoreCase(PERFIL_CLIENTE)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "No existe el perfil Cliente en la base de datos."
                ));
    }

    private void validarQueSeaCliente(Usuario usuario) {
        if (usuario.getPerfil() == null || !PERFIL_CLIENTE.equalsIgnoreCase(usuario.getPerfil().getNombre())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta cuenta no corresponde a un cliente de CARMOVO.");
        }
    }

    private void validarDatosObligatorios(UsuarioGuardarDTO dto, boolean requiereContrasena) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del usuario son obligatorios.");
        }

        if (esVacio(dto.getNombres()) || esVacio(dto.getApellidos()) || esVacio(dto.getCorreo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombres, apellidos y correo son obligatorios.");
        }

        validarCorreo(dto.getCorreo());

        if (dto.getIdPerfil() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes seleccionar un perfil.");
        }

        if (requiereContrasena) {
            if (esVacio(dto.getContrasena())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña es obligatoria para un nuevo usuario.");
            }
            validarLongitudContrasena(dto.getContrasena());
        }
    }

    private void validarDatosCliente(UsuarioGuardarDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del cliente son obligatorios.");
        }

        if (esVacio(dto.getContrasena())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña es obligatoria.");
        }

        validarLongitudContrasena(dto.getContrasena());
        validarPerfilCliente(dto);
    }

    private void validarPerfilCliente(UsuarioGuardarDTO dto) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del cliente son obligatorios.");
        }

        if (esVacio(dto.getNombres()) || esVacio(dto.getApellidos()) || esVacio(dto.getCorreo()) || esVacio(dto.getTelefono())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombres, apellidos, correo y teléfono son obligatorios.");
        }

        if (esVacio(dto.getDocumento())
                || dto.getFechaNacimiento() == null
                || esVacio(dto.getDepartamento())
                || esVacio(dto.getProvincia())
                || esVacio(dto.getDistrito())
                || esVacio(dto.getDomicilio())
                || esVacio(dto.getNumeroLicencia())
                || esVacio(dto.getCategoriaLicencia())
                || dto.getVencimientoLicencia() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Completa el documento, fecha de nacimiento, ubicación, domicilio y datos de la licencia."
            );
        }

        validarCorreo(dto.getCorreo());
        validarFechasPerfil(dto.getFechaNacimiento(), dto.getVencimientoLicencia());
    }

    private void validarFechasPerfil(LocalDate fechaNacimiento, LocalDate vencimientoLicencia) {
        LocalDate hoy = LocalDate.now();
        if (fechaNacimiento.isAfter(hoy)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de nacimiento no puede estar en el futuro.");
        }
        if (vencimientoLicencia.isBefore(hoy)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La licencia de conducir se encuentra vencida.");
        }
    }

    private void validarCorreo(String correo) {
        if (correo == null || !correo.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo ingresado no es válido.");
        }
    }

    private void validarLongitudContrasena(String contrasena) {
        if (contrasena.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña debe tener al menos 8 caracteres.");
        }
    }

    private void copiarDatosPerfilCliente(Usuario usuario, UsuarioGuardarDTO dto) {
        usuario.setDocumento(dto.getDocumento().trim());
        usuario.setFechaNacimiento(dto.getFechaNacimiento());
        usuario.setDomicilio(dto.getDomicilio().trim());
        usuario.setDepartamento(dto.getDepartamento().trim());
        usuario.setProvincia(dto.getProvincia().trim());
        usuario.setDistrito(dto.getDistrito().trim());
        usuario.setNumeroLicencia(dto.getNumeroLicencia().trim());
        usuario.setCategoriaLicencia(dto.getCategoriaLicencia().trim());
        usuario.setVencimientoLicencia(dto.getVencimientoLicencia());
    }

    private void copiarDatosPerfilSiPresentes(Usuario usuario, UsuarioGuardarDTO dto) {
        if (dto.getDocumento() != null) usuario.setDocumento(limpiarOpcional(dto.getDocumento()));
        if (dto.getFechaNacimiento() != null) usuario.setFechaNacimiento(dto.getFechaNacimiento());
        if (dto.getDomicilio() != null) usuario.setDomicilio(limpiarOpcional(dto.getDomicilio()));
        if (dto.getDepartamento() != null) usuario.setDepartamento(limpiarOpcional(dto.getDepartamento()));
        if (dto.getProvincia() != null) usuario.setProvincia(limpiarOpcional(dto.getProvincia()));
        if (dto.getDistrito() != null) usuario.setDistrito(limpiarOpcional(dto.getDistrito()));
        if (dto.getNumeroLicencia() != null) usuario.setNumeroLicencia(limpiarOpcional(dto.getNumeroLicencia()));
        if (dto.getCategoriaLicencia() != null) usuario.setCategoriaLicencia(limpiarOpcional(dto.getCategoriaLicencia()));
        if (dto.getVencimientoLicencia() != null) usuario.setVencimientoLicencia(dto.getVencimientoLicencia());
    }

    private boolean esVacio(String valor) {
        return valor == null || valor.isBlank();
    }

    private String normalizarCorreo(String correo) {
        return correo.trim().toLowerCase(Locale.ROOT);
    }

    private String limpiarOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }

    private UsuarioDTO convertirADto(Usuario usuario) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setIdUsuario(usuario.getIdUsuario());
        dto.setNombres(usuario.getNombres());
        dto.setApellidos(usuario.getApellidos());
        dto.setCorreo(usuario.getCorreo());
        dto.setTelefono(usuario.getTelefono());
        dto.setDocumento(usuario.getDocumento());
        dto.setFechaNacimiento(usuario.getFechaNacimiento());
        dto.setDomicilio(usuario.getDomicilio());
        dto.setDepartamento(usuario.getDepartamento());
        dto.setProvincia(usuario.getProvincia());
        dto.setDistrito(usuario.getDistrito());
        dto.setNumeroLicencia(usuario.getNumeroLicencia());
        dto.setCategoriaLicencia(usuario.getCategoriaLicencia());
        dto.setVencimientoLicencia(usuario.getVencimientoLicencia());
        dto.setEstado(usuario.getEstado());

        if (usuario.getPerfil() != null) {
            dto.setIdPerfil(usuario.getPerfil().getIdPerfil());
            dto.setNombrePerfil(usuario.getPerfil().getNombre());
        }

        return dto;
    }
}
