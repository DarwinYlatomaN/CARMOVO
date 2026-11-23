package com.carmovo.service;

import com.carmovo.dto.VehiculoDTO;
import com.carmovo.model.PortalDocumento;
import com.carmovo.model.PortalImagen;
import com.carmovo.model.PortalOferta;
import com.carmovo.model.PortalVersion;
import com.carmovo.repository.PortalDocumentoRepositorio;
import com.carmovo.repository.PortalImagenRepositorio;
import com.carmovo.repository.PortalOfertaRepositorio;
import com.carmovo.repository.PortalVersionRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Contenido editable del sitio web.
 *
 * El contenido del portal (portada, beneficios, diseño, contacto y preguntas frecuentes)
 * es un documento JSON con BORRADOR y PUBLICADO: el administrador edita el borrador y el
 * público solo ve lo publicado. Cada publicación queda en el historial y se puede restaurar.
 * Las ofertas se activan y se ocultan solas según sus fechas.
 */
@Service
public class PortalServicio {

    private static final int MAX_CONTENIDO = 200_000;
    private static final long MAX_IMAGEN = 2 * 1024 * 1024;
    private static final long MAX_VIDEO = 20 * 1024 * 1024;

    /** Contenido inicial: los textos que tenía el sitio antes del módulo. */
    public static final String CONTENIDO_INICIAL = """
            {
              "inicio": {
                "titulo": "Mueve momentos, crea recuerdos. Tu auto listo para la",
                "resaltado": "próxima aventura.",
                "subtitulo": "En Carmovo ofrecemos una flota preparada, atención cercana y asistencia 24/7 para que cada viaje se convierta en una historia inolvidable.",
                "imagen": "",
                "video": "",
                "tituloBeneficios": "Por qué los clientes aman Carmovo",
                "beneficios": [
                  {"titulo": "Reserva rápida y sencilla", "texto": "Reservas rápidas en sólo unos clicks."},
                  {"titulo": "Sin cargos ocultos", "texto": "Precios transparentes y accesibles en los que puedes confiar."},
                  {"titulo": "Autos de primera calidad", "texto": "Vehículos premium para cada trayecto."},
                  {"titulo": "Soporte para clientes 24/7", "texto": "Ayuda y soporte para que tu viaje continúe sin contratiempos."}
                ]
              },
              "tema": {},
              "contacto": {
                "telefonoEmergencias": "+51 999 888 777",
                "whatsapp": "+51 999 888 777",
                "correo": "soporte_carmovo@gmail.com",
                "direccion": "Av. Salaverry 1234, Chiclayo.",
                "horario": "Atención de 8 a. m. a 8 p. m. · Emergencias 24/7"
              },
              "faq": [
                {"pregunta": "¿Cuál es la edad mínima para alquilar un vehículo?", "respuesta": "Debes tener al menos 21 años cumplidos al momento de recoger el vehículo y una licencia de conducir vigente durante todo el alquiler."},
                {"pregunta": "¿Qué medios de pago aceptan?", "respuesta": "Tarjeta de crédito o débito, Yape (hasta S/ 2,000 por operación), Plin, transferencia bancaria y efectivo en nuestra oficina. Con Yape, Plin o transferencia subes la foto del pago y caja lo verifica. Puedes pedir boleta o factura."},
                {"pregunta": "¿Cuál es la política de combustible?", "respuesta": "Aplicamos la política \\"lleno a lleno\\": te entregamos el vehículo con el tanque lleno y debes devolverlo igual. Si falta combustible, se cobra S/ 25 por cada octavo de tanque."},
                {"pregunta": "¿Qué pasa si me retraso en la devolución del vehículo?", "respuesta": "Cada día de retraso se cobra a la tarifa diaria del vehículo. Si prevés un retraso, comunícate con soporte para ampliar tu reserva."},
                {"pregunta": "¿Están permitidas las mascotas en el auto?", "respuesta": "Sí, pero te pedimos devolver el auto limpio. Si requiere una limpieza profunda especial, se aplicará un recargo."}
              ]
            }""";

    private final PortalDocumentoRepositorio documentos;
    private final PortalVersionRepositorio versiones;
    private final PortalOfertaRepositorio ofertas;
    private final PortalImagenRepositorio imagenes;
    private final VehiculoServicio vehiculos;
    private final AuditoriaServicio auditoria;

    public PortalServicio(PortalDocumentoRepositorio documentos, PortalVersionRepositorio versiones,
                          PortalOfertaRepositorio ofertas, PortalImagenRepositorio imagenes,
                          VehiculoServicio vehiculos, AuditoriaServicio auditoria) {
        this.documentos = documentos;
        this.versiones = versiones;
        this.ofertas = ofertas;
        this.imagenes = imagenes;
        this.vehiculos = vehiculos;
        this.auditoria = auditoria;
    }

    // ================================================================ sitio público

    @Transactional
    public Map<String, Object> publico() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("contenido", documento().getPublicado());
        r.put("ofertas", ofertasActivas());
        return r;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> ofertasActivas() {
        LocalDate hoy = LocalDate.now();
        return ofertas.findAllByOrderByInicioDesc().stream()
                .filter(PortalOferta::isVisible)
                .filter(o -> !hoy.isBefore(o.getInicio()) && !hoy.isAfter(o.getFin()))
                .map(this::ofertaConVehiculo)
                .filter(Objects::nonNull)
                .toList();
    }

    @Transactional(readOnly = true)
    public PortalImagen imagen(Long id) {
        return imagenes.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La imagen no existe."));
    }

    // ================================================================ administración del contenido

    @Transactional
    public Map<String, Object> estadoEditor() {
        PortalDocumento d = documento();
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("borrador", d.getBorrador());
        r.put("publicado", d.getPublicado());
        r.put("hayCambios", !Objects.equals(d.getBorrador(), d.getPublicado()));
        r.put("fechaBorrador", d.getFechaBorrador());
        r.put("fechaPublicacion", d.getFechaPublicacion());
        r.put("actualizadoPor", d.getActualizadoPor());
        return r;
    }

    @Transactional
    public Map<String, Object> guardarBorrador(String contenido, String actor) {
        validarContenido(contenido);
        PortalDocumento d = documento();
        d.setBorrador(contenido.trim());
        d.setFechaBorrador(LocalDateTime.now());
        d.setActualizadoPor(actor);
        documentos.save(d);
        return estadoEditor();
    }

    @Transactional
    public Map<String, Object> publicar(String resumen, String actor) {
        PortalDocumento d = documento();
        d.setPublicado(d.getBorrador());
        d.setFechaPublicacion(LocalDateTime.now());
        d.setActualizadoPor(actor);
        documentos.save(d);

        PortalVersion v = new PortalVersion();
        v.setContenido(d.getPublicado());
        v.setAutor(actor);
        v.setResumen(resumen == null || resumen.isBlank() ? "Publicación del contenido del sitio" : recortar(resumen, 255));
        versiones.save(v);

        auditoria.registrarSeguro("Portal web", "PUBLICAR", "Portal", v.getIdVersion(),
                "Se publicó una nueva versión del sitio web: " + v.getResumen());
        return estadoEditor();
    }

    /**
     * Vuelve el sitio a su configuración inicial (textos, fondo de portada y diseño originales)
     * y la publica. La versión anterior queda en el historial, así que se puede deshacer.
     */
    @Transactional
    public Map<String, Object> restaurarInicial(String actor) {
        PortalDocumento d = documento();
        d.setBorrador(CONTENIDO_INICIAL.trim());
        d.setFechaBorrador(LocalDateTime.now());
        d.setActualizadoPor(actor);
        documentos.save(d);
        Map<String, Object> r = publicar("Restauración a la configuración inicial", actor);
        auditoria.registrarSeguro("Portal web", "RESTAURAR_INICIAL", "Portal", 1L,
                "Se restauró la configuración inicial del sitio web.");
        return r;
    }

    @Transactional
    public Map<String, Object> descartarBorrador() {
        PortalDocumento d = documento();
        d.setBorrador(d.getPublicado());
        d.setFechaBorrador(LocalDateTime.now());
        documentos.save(d);
        return estadoEditor();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> historial() {
        return versiones.findTop20ByOrderByFechaDesc().stream().map(v -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("idVersion", v.getIdVersion());
            m.put("fecha", v.getFecha());
            m.put("autor", v.getAutor());
            m.put("resumen", v.getResumen());
            return m;
        }).toList();
    }

    /** Copia una versión anterior al borrador (luego se revisa y se publica). */
    @Transactional
    public Map<String, Object> restaurar(Long idVersion, String actor) {
        PortalVersion v = versiones.findById(idVersion)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La versión no existe."));
        return guardarBorrador(v.getContenido(), actor);
    }

    @Transactional
    public Map<String, Object> subirImagen(MultipartFile archivo) {
        return guardarImagen(archivo, null);
    }

    /** Guarda una imagen validada. Si se indica un nombre fijo (por ejemplo, la foto de un usuario), se usa ese. */
    @Transactional
    public Map<String, Object> guardarImagen(MultipartFile archivo, String nombreFijo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona una imagen.");
        }
        if (archivo.getSize() > MAX_IMAGEN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La imagen pesa más de 2 MB.");
        }
        byte[] datos;
        try {
            datos = archivo.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer la imagen.");
        }
        String tipo = tipoReal(datos);
        if (tipo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se aceptan imágenes JPG, PNG o WEBP.");
        }
        PortalImagen img = new PortalImagen();
        img.setNombre(nombreFijo != null ? nombreFijo
                : recortar(Optional.ofNullable(archivo.getOriginalFilename()).orElse("imagen"), 120));
        img.setTipoContenido(tipo);
        img.setDatos(datos);
        img.setTamano((long) datos.length);
        img = imagenes.save(img);
        return Map.of("idImagen", img.getIdImagen(), "url", "/api/v1/portal/imagenes/" + img.getIdImagen());
    }

    // ================================================================ foto de perfil del personal

    private static String nombreFoto(Long idUsuario) {
        return "perfil-usuario-" + idUsuario;
    }

    @Transactional(readOnly = true)
    public String fotoPerfil(Long idUsuario) {
        List<Long> ids = imagenes.idsPorNombre(nombreFoto(idUsuario));
        return ids.isEmpty() ? null : "/api/v1/portal/imagenes/" + ids.get(0);
    }

    /** Reemplaza la foto anterior: guarda la nueva y borra las viejas. */
    @Transactional
    public String cambiarFotoPerfil(Long idUsuario, MultipartFile archivo) {
        List<Long> anteriores = imagenes.idsPorNombre(nombreFoto(idUsuario));
        Map<String, Object> nueva = guardarImagen(archivo, nombreFoto(idUsuario));
        anteriores.forEach(imagenes::deleteById);
        return String.valueOf(nueva.get("url"));
    }

    @Transactional
    public void quitarFotoPerfil(Long idUsuario) {
        imagenes.idsPorNombre(nombreFoto(idUsuario)).forEach(imagenes::deleteById);
    }

    // ================================================================ ofertas

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarOfertas() {
        return ofertas.findAllByOrderByInicioDesc().stream().map(this::ofertaConVehiculo).filter(Objects::nonNull).toList();
    }

    @Transactional
    public Map<String, Object> guardarOferta(Long id, Map<String, Object> datos, String actor) {
        PortalOferta o = id == null ? new PortalOferta() : ofertas.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La oferta no existe."));
        String titulo = texto(datos.get("titulo"));
        if (titulo.isBlank() || titulo.length() > 80) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El título es obligatorio (máximo 80 caracteres).");
        }
        Long idVehiculo = numero(datos.get("idVehiculo"), "Selecciona un vehículo.").longValue();
        vehiculos.obtenerPorId(idVehiculo);
        int descuento = numero(datos.get("descuento"), "Indica el descuento.").intValue();
        if (descuento < 1 || descuento > 70) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El descuento debe estar entre 1% y 70%.");
        }
        LocalDate inicio, fin;
        try {
            inicio = LocalDate.parse(texto(datos.get("inicio")));
            fin = LocalDate.parse(texto(datos.get("fin")));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Indica las fechas de vigencia.");
        }
        if (fin.isBefore(inicio)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha de fin no puede ser anterior al inicio.");
        }
        o.setTitulo(titulo);
        o.setSubtitulo(recortar(texto(datos.get("subtitulo")), 160));
        o.setIdVehiculo(idVehiculo);
        o.setDescuento(descuento);
        o.setInicio(inicio);
        o.setFin(fin);
        o.setVisible(!Boolean.FALSE.equals(datos.get("visible")) && !"false".equals(String.valueOf(datos.get("visible"))));
        o = ofertas.save(o);
        auditoria.registrarSeguro("Portal web", id == null ? "CREAR_OFERTA" : "EDITAR_OFERTA", "Oferta", o.getIdOferta(),
                "Oferta \"" + o.getTitulo() + "\": " + descuento + "% del " + inicio + " al " + fin + ".");
        return ofertaConVehiculo(o);
    }

    @Transactional
    public void eliminarOferta(Long id) {
        PortalOferta o = ofertas.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La oferta no existe."));
        ofertas.delete(o);
        auditoria.registrarSeguro("Portal web", "ELIMINAR_OFERTA", "Oferta", id, "Se eliminó la oferta \"" + o.getTitulo() + "\".");
    }

    // ================================================================ auxiliares

    private PortalDocumento documento() {
        return documentos.findById(1L).orElseGet(() -> {
            PortalDocumento d = new PortalDocumento();
            d.setIdDocumento(1L);
            d.setBorrador(CONTENIDO_INICIAL);
            d.setPublicado(CONTENIDO_INICIAL);
            d.setFechaPublicacion(LocalDateTime.now());
            return documentos.save(d);
        });
    }

    private Map<String, Object> ofertaConVehiculo(PortalOferta o) {
        VehiculoDTO v;
        try {
            v = vehiculos.obtenerPorId(o.getIdVehiculo());
        } catch (RuntimeException e) {
            return null;
        }
        LocalDate hoy = LocalDate.now();
        String estado = !o.isVisible() ? "Oculta" : hoy.isBefore(o.getInicio()) ? "Programada"
                : hoy.isAfter(o.getFin()) ? "Vencida" : "Activa";
        BigDecimal precio = v.getPrecioDia();
        BigDecimal precioFinal = precio.multiply(BigDecimal.valueOf(100 - o.getDescuento()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("idOferta", o.getIdOferta());
        m.put("titulo", o.getTitulo());
        m.put("subtitulo", o.getSubtitulo());
        m.put("idVehiculo", v.getIdVehiculo());
        m.put("vehiculo", (v.getMarca() + " " + v.getModelo()).trim());
        m.put("categoria", v.getCategoria());
        m.put("imagen", v.getImagen());
        m.put("pasajeros", v.getPasajeros());
        m.put("transmision", v.getTransmision());
        m.put("descuento", o.getDescuento());
        m.put("precioDia", precio);
        m.put("precioFinal", precioFinal);
        m.put("inicio", o.getInicio());
        m.put("fin", o.getFin());
        m.put("visible", o.isVisible());
        m.put("estado", estado);
        return m;
    }

    private static void validarContenido(String contenido) {
        if (contenido == null || contenido.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El contenido está vacío.");
        }
        String c = contenido.trim();
        if (c.length() > MAX_CONTENIDO || !c.startsWith("{") || !c.endsWith("}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El contenido no tiene un formato válido.");
        }
    }

    /** Video de la portada: MP4 o WEBM reales (se revisa el contenido), máximo 20 MB. */
    @Transactional
    public Map<String, Object> subirVideo(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecciona un video.");
        }
        if (archivo.getSize() > MAX_VIDEO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El video pesa más de 20 MB. Usa uno más corto o comprimido.");
        }
        byte[] datos;
        try {
            datos = archivo.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se pudo leer el video.");
        }
        String tipo = tipoVideo(datos);
        if (tipo == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se aceptan videos MP4 o WEBM.");
        }
        PortalImagen video = new PortalImagen();
        video.setNombre(recortar(Optional.ofNullable(archivo.getOriginalFilename()).orElse("video"), 120));
        video.setTipoContenido(tipo);
        video.setDatos(datos);
        video.setTamano((long) datos.length);
        video = imagenes.save(video);
        return Map.of("idImagen", video.getIdImagen(), "url", "/api/v1/portal/imagenes/" + video.getIdImagen());
    }

    private static String tipoVideo(byte[] d) {
        if (d.length > 12 && d[4] == 'f' && d[5] == 't' && d[6] == 'y' && d[7] == 'p') return "video/mp4";
        if (d.length > 4 && (d[0] & 0xFF) == 0x1A && (d[1] & 0xFF) == 0x45 && (d[2] & 0xFF) == 0xDF && (d[3] & 0xFF) == 0xA3) return "video/webm";
        return null;
    }

    /** Reconoce el tipo de imagen por sus primeros bytes (no por la extensión). */
    private static String tipoReal(byte[] d) {
        if (d.length > 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF) return "image/jpeg";
        if (d.length > 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G') return "image/png";
        if (d.length > 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
                && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') return "image/webp";
        return null;
    }

    private static String texto(Object v) {
        return v == null ? "" : String.valueOf(v).trim();
    }

    private static Number numero(Object v, String mensaje) {
        try {
            return v instanceof Number n ? n : new BigDecimal(texto(v));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, mensaje);
        }
    }

    private static String recortar(String v, int max) {
        if (v == null || v.isBlank()) return null;
        String t = v.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }
}
