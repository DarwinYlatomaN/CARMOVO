package com.carmovo.modulos.auditoria;

import com.carmovo.modulos.auditoria.dto.AuditoriaDTO;
import com.carmovo.modulos.autenticacion.AdminContextoSesion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AuditoriaServicio {

    private static final Logger LOGGER = LoggerFactory.getLogger(AuditoriaServicio.class);
    private final AuditoriaRepositorio auditoriaRepositorio;

    public AuditoriaServicio(AuditoriaRepositorio auditoriaRepositorio) {
        this.auditoriaRepositorio = auditoriaRepositorio;
    }

    @Transactional(readOnly = true)
    public List<AuditoriaDTO> obtenerTodos() {
        return auditoriaRepositorio.findAllByOrderByFechaHoraDesc().stream()
                .map(this::convertirADto)
                .toList();
    }

    @Transactional(readOnly = true)
    public AuditoriaDTO obtenerPorId(Long id) {
        Auditoria auditoria = auditoriaRepositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Registro de auditoría no encontrado con ID: " + id
                ));
        return convertirADto(auditoria);
    }

    @Transactional
    public AuditoriaDTO registrar(String modulo, String accion, String entidad, Long idEntidad, String detalle) {
        Auditoria auditoria = new Auditoria();
        auditoria.setModulo(limitar(modulo, 50));
        auditoria.setAccion(limitar(accion, 50));
        auditoria.setEntidad(limitar(entidad, 60));
        auditoria.setIdEntidad(idEntidad);
        auditoria.setActor(AdminContextoSesion.obtenerActor());
        auditoria.setDetalle(limitar(detalle, 700));
        return convertirADto(auditoriaRepositorio.save(auditoria));
    }

    public void registrarSeguro(String modulo, String accion, String entidad, Long idEntidad, String detalle) {
        try {
            registrar(modulo, accion, entidad, idEntidad, detalle);
        } catch (Exception error) {
            LOGGER.error("No se pudo registrar la auditoría del módulo {} y acción {}.", modulo, accion, error);
        }
    }

    private AuditoriaDTO convertirADto(Auditoria auditoria) {
        AuditoriaDTO dto = new AuditoriaDTO();
        dto.setIdAuditoria(auditoria.getIdAuditoria());
        dto.setFechaHora(auditoria.getFechaHora());
        dto.setModulo(auditoria.getModulo());
        dto.setAccion(auditoria.getAccion());
        dto.setEntidad(auditoria.getEntidad());
        dto.setIdEntidad(auditoria.getIdEntidad());
        dto.setActor(auditoria.getActor());
        dto.setDetalle(auditoria.getDetalle());
        return dto;
    }

    private String limitar(String valor, int maximo) {
        String texto = valor == null || valor.isBlank() ? "—" : valor.trim();
        return texto.length() <= maximo ? texto : texto.substring(0, maximo);
    }
}
