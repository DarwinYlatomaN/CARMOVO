/* =========================================================
   CARMOVO · Categorías de vehículos
   Crear, editar, ordenar, ocultar o eliminar categorías.
   Una categoría con vehículos no se elimina: se desactiva.
   ========================================================= */
(() => {
    'use strict';

    const api = () => window.CarmovoAdminApi;
    const $ = id => document.getElementById(id);
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    let lista = [];
    let editando = null;

    function avisar(texto, error = false) {
        const caja = $('pu-mensaje');
        caja.textContent = texto;
        caja.classList.toggle('error', error);
        caja.hidden = false;
        clearTimeout(avisar.t);
        avisar.t = setTimeout(() => { caja.hidden = true; }, 4500);
    }

    function pintar() {
        $('ct-filas').innerHTML = lista.length ? lista.map(c => `<tr>
            <td><div class="ct-nombre">
                ${c.imagen ? `<img class="ct-miniatura" src="${esc(c.imagen)}" alt="">` : '<span class="ct-miniatura ct-miniatura--vacia"><i class="fa-regular fa-image"></i></span>'}
                <div><strong>${esc(c.nombre)}</strong>${c.descripcion ? `<small>${esc(c.descripcion)}</small>` : ''}</div></div></td>
            <td>${esc(c.orden)}</td>
            <td>${c.vehiculos ? `<a href="/admin/gestion-flota">${c.vehiculos} vehículo${c.vehiculos === 1 ? '' : 's'}</a>` : '<span class="pu-ayuda">Ninguno</span>'}</td>
            <td><span class="pu-chip ${c.activa ? 'pu-chip--verde' : ''}">${c.activa ? 'Visible' : 'Oculta'}</span></td>
            <td><div class="pu-celda-acciones">
                <button class="pu-boton pu-boton--suave pu-boton--chico" type="button" data-editar="${c.idCategoria}"><i class="fa-solid fa-pen"></i> Editar</button>
                <button class="pu-boton pu-boton--rojo pu-boton--chico" type="button" data-eliminar="${c.idCategoria}"
                    ${c.vehiculos ? 'disabled title="Tiene vehículos: desactívala en lugar de eliminarla"' : ''} aria-label="Eliminar ${esc(c.nombre)}"><i class="fa-solid fa-trash"></i></button>
            </div></td></tr>`).join('')
            : '<tr><td colspan="5" class="pu-vacio">Aún no hay categorías. Crea la primera con "Nueva categoría".</td></tr>';
    }

    async function cargar() {
        try {
            lista = await api().listarCategorias() || [];
            pintar();
        } catch (e) {
            $('ct-filas').innerHTML = `<tr><td colspan="5" class="pu-vacio">${esc(e.message || 'No se pudieron cargar las categorías.')}</td></tr>`;
        }
    }

    function mostrarImagen(url) {
        const f = $('ct-form');
        f.imagen.value = url || '';
        $('ct-vista').hidden = !url;
        $('ct-sin-imagen').hidden = !!url;
        $('ct-quitar').hidden = !url;
        if (url) $('ct-vista').src = url;
    }

    function error(texto) {
        const caja = $('ct-form').querySelector('.pu-error');
        caja.textContent = texto || '';
        caja.hidden = !texto;
    }

    function abrir(c = null) {
        editando = c;
        const f = $('ct-form');
        f.reset();
        error('');
        $('ct-titulo').textContent = c ? `Editar "${c.nombre}"` : 'Nueva categoría';
        f.nombre.value = c?.nombre || '';
        f.descripcion.value = c?.descripcion || '';
        f.orden.value = c?.orden ?? (lista.length ? Math.max(...lista.map(x => Number(x.orden) || 0)) + 1 : 1);
        f.activa.checked = c ? !!c.activa : true;
        mostrarImagen(c?.imagen || '');
        $('ct-modal').hidden = false;
        setTimeout(() => f.nombre.focus(), 50);
    }

    function cerrar() { $('ct-modal').hidden = true; editando = null; }

    async function guardar(e) {
        e.preventDefault();
        const f = e.target;
        const datos = {
            idCategoria: editando?.idCategoria || null,
            nombre: f.nombre.value.trim().replace(/\s+/g, ' '),
            descripcion: f.descripcion.value.trim(),
            orden: Number(f.orden.value || 0),
            activa: f.activa.checked,
            imagen: f.imagen.value || ''
        };
        if (datos.nombre.length < 2) return error('Escribe el nombre de la categoría (mínimo 2 caracteres).');
        if (lista.some(c => c.nombre.toLowerCase() === datos.nombre.toLowerCase() && c.idCategoria !== datos.idCategoria))
            return error(`Ya existe una categoría llamada "${datos.nombre}".`);
        if (!(datos.orden >= 0 && datos.orden <= 999)) return error('El orden debe estar entre 0 y 999.');
        const boton = f.querySelector('[type=submit]');
        boton.disabled = true;
        try {
            await api().guardarCategoria(datos);
            cerrar();
            avisar(datos.idCategoria ? 'Categoría actualizada.' : 'Categoría creada. Ya puedes asignarla a tus vehículos.');
            cargar();
        } catch (err) {
            error(err.message || 'No se pudo guardar.');
        } finally {
            boton.disabled = false;
        }
    }

    async function eliminar(id) {
        const c = lista.find(x => String(x.idCategoria) === String(id));
        if (!c || !window.confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return;
        try {
            await api().eliminarCategoria(id);
            avisar('Categoría eliminada.');
            cargar();
        } catch (e) {
            avisar(e.message || 'No se pudo eliminar.', true);
        }
    }

    async function subir(archivo) {
        if (!archivo) return;
        if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) return error('Solo se aceptan imágenes JPG, PNG o WEBP.');
        if (archivo.size > 2 * 1024 * 1024) return error('La imagen pesa más de 2 MB.');
        error('');
        try {
            const r = await api().subirImagenVehiculo(archivo);
            mostrarImagen(r.url);
        } catch (e) {
            error(e.message);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        $('ct-nueva').addEventListener('click', () => abrir());
        $('ct-form').addEventListener('submit', guardar);
        $('ct-archivo').addEventListener('change', e => { subir(e.target.files[0]); e.target.value = ''; });
        $('ct-quitar').addEventListener('click', () => mostrarImagen(''));
        $('ct-filas').addEventListener('click', e => {
            const ed = e.target.closest('[data-editar]');
            const el = e.target.closest('[data-eliminar]');
            if (ed) abrir(lista.find(x => String(x.idCategoria) === ed.dataset.editar));
            if (el) eliminar(el.dataset.eliminar);
        });
        $('ct-modal').addEventListener('click', e => { if (e.target.id === 'ct-modal' || e.target.closest('[data-cerrar]')) cerrar(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('ct-modal').hidden) cerrar(); });
        cargar();
    });
})();
