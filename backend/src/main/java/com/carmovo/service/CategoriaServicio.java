package com.carmovo.service;

import com.carmovo.model.Categoria;
import com.carmovo.repository.CategoriaRepositorio;
import com.carmovo.repository.VehiculoRepositorio;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Categorías de vehículos administradas desde el panel (Gestión de flota → Categorías).
 * - El nombre es único (sin distinguir mayúsculas).
 * - Al renombrarla, sus vehículos se actualizan.
 * - Solo se elimina si no tiene vehículos; si tiene, se puede desactivar
 *   (deja de aparecer en el sitio y en el formulario de vehículos nuevos).
 */
@Service
public class CategoriaServicio {

    private static final String PATRON_NOMBRE = "^[\\p{L}0-9][\\p{L}0-9 /&+.\\-]{1,49}$";

    private final CategoriaRepositorio categorias;
    private final VehiculoRepositorio vehiculos;
    private final AuditoriaServicio auditoria;

    public CategoriaServicio(CategoriaRepositorio categorias, VehiculoRepositorio vehiculos, AuditoriaServicio auditoria) {
        this.categorias = categorias;
        this.vehiculos = vehiculos;
        this.auditoria = auditoria;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarPublicas() {
        return categorias.findByActivaTrueOrderByOrdenAscNombreAsc().stream().map(c -> aMapa(c, false)).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarTodas() {
        return categorias.findAllByOrderByOrdenAscNombreAsc().stream().map(c -> aMapa(c, true)).toList();
    }

    /** Valida que la categoría de un vehículo exista y esté activa. Devuelve el nombre oficial. */
    @Transactional(readOnly = true)
    public String validarParaVehiculo(String nombre, String categoriaActual) {
        String limpio = nombre == null ? "" : nombre.trim();
        if (limpio.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría es obligatoria.");
        }
        Categoria c = categorias.findByNombreIgnoreCase(limpio).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "La categoría \"" + limpio + "\" no existe. Créala primero en Gestión de flota → Categorías."));
        boolean mismaQueAntes = categoriaActual != null && categoriaActual.equalsIgnoreCase(c.getNombre());
        if (!c.isActiva() && !mismaQueAntes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría \"" + c.getNombre() + "\" está desactivada.");
        }
        return c.getNombre();
    }

    @Transactional
    public Map<String, Object> guardar(Long id, Map<String, Object> datos) {
        Categoria c = id == null ? new Categoria() : categorias.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La categoría no existe."));
        String anterior = c.getNombre();

        String nombre = texto(datos.get("nombre")).replaceAll("\\s+", " ");
        if (!nombre.matches(PATRON_NOMBRE)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El nombre debe tener entre 2 y 50 caracteres (letras, números, espacios y / & + . -).");
        }
        boolean repetido = id == null ? categorias.existsByNombreIgnoreCase(nombre)
                : categorias.existsByNombreIgnoreCaseAndIdCategoriaNot(nombre, id);
        if (repetido) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una categoría llamada \"" + nombre + "\".");
        }
        String descripcion = texto(datos.get("descripcion"));
        if (descripcion.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La descripción no puede superar los 255 caracteres.");
        }
        String imagen = texto(datos.get("imagen"));
        if (imagen.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La ruta de la imagen es demasiado larga.");
        }
        int orden;
        try {
            orden = datos.get("orden") == null || texto(datos.get("orden")).isEmpty() ? 0 : Integer.parseInt(texto(datos.get("orden")));
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El orden debe ser un número.");
        }
        if (orden < 0 || orden > 999) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El orden debe estar entre 0 y 999.");
        }

        c.setNombre(nombre);
        c.setDescripcion(descripcion.isEmpty() ? null : descripcion);
        c.setImagen(imagen.isEmpty() ? null : imagen);
        c.setOrden(orden);
        Object activa = datos.get("activa");
        c.setActiva(activa == null || Boolean.TRUE.equals(activa) || "true".equalsIgnoreCase(String.valueOf(activa)));
        // Se cuentan antes: la clave foránea (ON UPDATE CASCADE) renombra los vehículos junto con la categoría.
        long cambiados = anterior != null && !anterior.equals(nombre) ? vehiculos.countByCategoriaIgnoreCase(anterior) : 0;
        c = categorias.saveAndFlush(c);

        if (anterior != null && !anterior.equals(nombre)) {
            vehiculos.renombrarCategoria(anterior, nombre);
            auditoria.registrarSeguro("Flota", "RENOMBRAR_CATEGORIA", "Categoria", c.getIdCategoria(),
                    "La categoría \"" + anterior + "\" ahora se llama \"" + nombre + "\" (" + cambiados + " vehículos actualizados).");
        } else {
            auditoria.registrarSeguro("Flota", id == null ? "CREAR_CATEGORIA" : "EDITAR_CATEGORIA", "Categoria",
                    c.getIdCategoria(), (id == null ? "Se creó" : "Se editó") + " la categoría \"" + nombre + "\".");
        }
        return aMapa(c, true);
    }

    @Transactional
    public void eliminar(Long id) {
        Categoria c = categorias.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "La categoría no existe."));
        long total = vehiculos.countByCategoriaIgnoreCase(c.getNombre());
        if (total > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede eliminar: tiene " + total
                    + " vehículo(s). Cámbialos de categoría o desactívala.");
        }
        categorias.delete(c);
        auditoria.registrarSeguro("Flota", "ELIMINAR_CATEGORIA", "Categoria", id,
                "Se eliminó la categoría \"" + c.getNombre() + "\".");
    }

    private Map<String, Object> aMapa(Categoria c, boolean conConteo) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("idCategoria", c.getIdCategoria());
        m.put("nombre", c.getNombre());
        m.put("descripcion", c.getDescripcion());
        m.put("imagen", c.getImagen());
        m.put("orden", c.getOrden());
        m.put("activa", c.isActiva());
        if (conConteo) m.put("vehiculos", vehiculos.countByCategoriaIgnoreCase(c.getNombre()));
        return m;
    }

    private static String texto(Object v) {
        return v == null ? "" : String.valueOf(v).trim();
    }
}
