package com.carmovo.modulos.usuarios;

import com.carmovo.modulos.roles.Perfil;
import com.carmovo.modulos.roles.PerfilRepositorio;
import com.carmovo.modulos.usuarios.dto.UsuarioDTO;
import com.carmovo.modulos.usuarios.dto.UsuarioGuardarDTO;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class UsuarioServicio {

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
        usuario.setEstado(dto.getEstado() == null ? true : dto.getEstado());
        usuario.setPerfil(buscarPerfil(dto.getIdPerfil()));

        return convertirADto(usuarioRepositorio.save(usuario));
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

    private void validarDatosObligatorios(UsuarioGuardarDTO dto, boolean requiereContrasena) {
        if (dto == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Los datos del usuario son obligatorios.");
        }

        if (esVacio(dto.getNombres()) || esVacio(dto.getApellidos()) || esVacio(dto.getCorreo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombres, apellidos y correo son obligatorios.");
        }

        if (!dto.getCorreo().contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El correo ingresado no es válido.");
        }

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

    private void validarLongitudContrasena(String contrasena) {
        if (contrasena.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña debe tener al menos 8 caracteres.");
        }
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
        dto.setEstado(usuario.getEstado());

        if (usuario.getPerfil() != null) {
            dto.setIdPerfil(usuario.getPerfil().getIdPerfil());
            dto.setNombrePerfil(usuario.getPerfil().getNombre());
        }

        return dto;
    }
}
