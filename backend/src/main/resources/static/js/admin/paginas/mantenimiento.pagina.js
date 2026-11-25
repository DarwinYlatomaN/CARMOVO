/* =========================================================
   CARMOVO · Mantenimiento de flota
   Programar → Enviar a taller (vehículo no alquilable) → Completar
   Al completar un SOAT o una Revisión técnica se registra la
   nueva fecha de vencimiento del vehículo.
   ========================================================= */
(() => {
    'use strict';

    const api = () => window.CarmovoAdminApi;
    const $ = id => document.getElementById(id);
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const soles = n => n == null ? '—' : `S/ ${Number(n).toFixed(2)}`;
    const fecha = v => v ? new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const hoy = () => new Date().toISOString().slice(0, 10);

    const ESTADOS = {
        PROGRAMADO: ['Programado', 'pu-chip--azul'],
        EN_TALLER: ['En taller', 'pu-chip--amarillo'],
        COMPLETADO: ['Completado', 'pu-chip--verde'],
        CANCELADO: ['Cancelado', '']
    };

    let lista = [];
    let vehiculos = [];
    let tipos = [];

    function avisar(texto, error = false) {
        const caja = $('pu-mensaje');
        caja.textContent = texto;
        caja.classList.toggle('error', error);
        caja.hidden = false;
        clearTimeout(avisar.t);
        avisar.t = setTimeout(() => { caja.hidden = true; }, 5000);
    }

    // ------------------------------------------------------------ resumen y alertas
    function pintarResumen() {
        const cuenta = e => lista.filter(m => m.estado === e).length;
        const mes = new Date().toISOString().slice(0, 7);
        const gasto = lista.filter(m => m.estado === 'COMPLETADO' && String(m.fechaFin || '').startsWith(mes))
            .reduce((s, m) => s + Number(m.costo || 0), 0);
        $('mt-resumen').innerHTML = `
            <div><span>Programados</span><strong>${cuenta('PROGRAMADO')}</strong></div>
            <div><span>En taller ahora</span><strong>${cuenta('EN_TALLER')}</strong></div>
            <div><span>Completados</span><strong>${cuenta('COMPLETADO')}</strong></div>
            <div><span>Gasto del mes</span><strong>${soles(gasto)}</strong></div>`;
    }

    function pintarAlertas(alertas) {
        $('mt-alertas').hidden = !alertas.length;
        $('mt-alertas-lista').innerHTML = alertas.map(a => `
            <div class="mt-alerta">
                <div><strong>${esc(a.vehiculo)}</strong><small>${esc(a.placa)} · ${esc(a.alerta)}</small></div>
                <button class="pu-boton pu-boton--suave pu-boton--chico" type="button" data-programar="${a.idVehiculo}"
                        data-tipo="${/soat/i.test(a.alerta) ? 'SOAT' : 'Revisión técnica'}">Programar renovación</button>
            </div>`).join('');
    }

    // ------------------------------------------------------------ tabla
    function filtrados() {
        const texto = $('mt-buscar').value.trim().toLowerCase();
        const estado = $('mt-filtro-estado').value;
        const tipo = $('mt-filtro-tipo').value;
        return lista.filter(m =>
            (!texto || `${m.vehiculo} ${m.placa} ${m.taller}`.toLowerCase().includes(texto)) &&
            (!estado || m.estado === estado) && (!tipo || m.tipo === tipo));
    }

    function acciones(m) {
        if (m.estado === 'PROGRAMADO') return `
            <button class="pu-boton pu-boton--suave pu-boton--chico" data-accion="taller" data-id="${m.idMantenimiento}"><i class="fa-solid fa-warehouse"></i> Enviar a taller</button>
            <button class="pu-boton pu-boton--verde pu-boton--chico" data-accion="completar" data-id="${m.idMantenimiento}"><i class="fa-solid fa-check"></i> Completar</button>
            <button class="pu-boton pu-boton--rojo pu-boton--chico" data-accion="cancelar" data-id="${m.idMantenimiento}" aria-label="Cancelar"><i class="fa-solid fa-xmark"></i></button>`;
        if (m.estado === 'EN_TALLER') return `
            <button class="pu-boton pu-boton--verde pu-boton--chico" data-accion="completar" data-id="${m.idMantenimiento}"><i class="fa-solid fa-check"></i> Completar y liberar</button>`;
        return '<span class="mt-cerrado">—</span>';
    }

    function pintarTabla() {
        const filas = filtrados();
        $('mt-filas').innerHTML = filas.length ? filas.map(m => {
            const [texto, clase] = ESTADOS[m.estado] || [m.estado, ''];
            const atrasado = m.estado === 'PROGRAMADO' && String(m.fechaProgramada) < hoy();
            return `<tr>
                <td><strong>${esc(m.vehiculo)}</strong><small>${esc(m.placa || '—')}${m.kilometraje ? ` · ${Number(m.kilometraje).toLocaleString('es-PE')} km` : ''}</small></td>
                <td>${esc(m.tipo)}${m.descripcion ? `<small>${esc(m.descripcion)}</small>` : ''}</td>
                <td>${fecha(m.fechaProgramada)}${atrasado ? '<small class="mt-atrasado">Atrasado</small>' : ''}</td>
                <td>${esc(m.taller || '—')}</td>
                <td>${soles(m.costo)}</td>
                <td><span class="pu-chip ${clase}">${texto}</span></td>
                <td><div class="pu-celda-acciones">${acciones(m)}</div></td>
            </tr>`;
        }).join('') : '<tr><td colspan="7" class="pu-vacio">No hay mantenimientos que coincidan.</td></tr>';
    }

    // ------------------------------------------------------------ modal
    function abrirModal(titulo, subtitulo, html, alEnviar) {
        $('mt-titulo').textContent = titulo;
        $('mt-subtitulo').textContent = subtitulo;
        const form = $('mt-form');
        form.innerHTML = `${html}<div class="pu-error" hidden></div>
            <div class="pu-modal__pie"><button class="pu-boton pu-boton--suave" type="button" data-cerrar>Cancelar</button>
            <button class="pu-boton pu-boton--primario" type="submit">Guardar</button></div>`;
        form.onsubmit = async e => {
            e.preventDefault();
            const error = form.querySelector('.pu-error');
            const boton = form.querySelector('[type=submit]');
            error.hidden = true;
            boton.disabled = true;
            try {
                const mensaje = await alEnviar(form);
                cerrarModal();
                avisar(mensaje);
                await cargar();
            } catch (err) {
                error.textContent = err.message || 'No se pudo guardar.';
                error.hidden = false;
            } finally {
                boton.disabled = false;
            }
        };
        $('mt-modal').hidden = false;
        setTimeout(() => form.querySelector('input, select')?.focus(), 60);
    }

    function cerrarModal() { $('mt-modal').hidden = true; }

    function programar(idVehiculo = '', tipo = '') {
        abrirModal('Programar mantenimiento', 'El vehículo seguirá disponible hasta que lo envíes al taller.', `
            <div class="pu-grid">
                <label class="pu-campo pu-ancho">Vehículo
                    <select name="idVehiculo" required><option value="">Selecciona un vehículo</option>
                    ${vehiculos.map(v => `<option value="${v.idVehiculo}" ${String(v.idVehiculo) === String(idVehiculo) ? 'selected' : ''}>
                        ${esc(v.marca)} ${esc(v.modelo)} · ${esc(v.placa || 'sin placa')} · ${esc(v.estado)}</option>`).join('')}</select></label>
                <label class="pu-campo">Tipo
                    <select name="tipo" required>${tipos.map(t => `<option ${t === tipo ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
                <label class="pu-campo">Fecha programada <input name="fechaProgramada" type="date" min="${hoy()}" value="${hoy()}" required></label>
                <label class="pu-campo">Taller <input name="taller" maxlength="120" placeholder="Ej.: Taller Automotriz Lima"></label>
                <label class="pu-campo">Costo estimado (S/) <input name="costo" type="number" min="0" step="0.01"></label>
                <label class="pu-campo pu-ancho">Descripción <textarea name="descripcion" maxlength="500" placeholder="Qué se va a revisar o reparar"></textarea></label>
            </div>`, async form => {
            if (!form.idVehiculo.value) throw new Error('Selecciona el vehículo.');
            if (!form.fechaProgramada.value) throw new Error('Indica la fecha programada.');
            await api().crearMantenimiento({
                idVehiculo: Number(form.idVehiculo.value), tipo: form.tipo.value,
                fechaProgramada: form.fechaProgramada.value, taller: form.taller.value.trim() || null,
                costo: form.costo.value ? Number(form.costo.value) : null, descripcion: form.descripcion.value.trim() || null
            });
            return 'Mantenimiento programado.';
        });
    }

    function completar(m) {
        const conVencimiento = m.tipo === 'SOAT' || m.tipo === 'Revisión técnica';
        const v = vehiculos.find(x => x.idVehiculo === m.idVehiculo);
        const proximoAnio = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
        abrirModal('Completar mantenimiento', `${m.vehiculo} · ${m.tipo}. El vehículo volverá a estar Disponible.`, `
            <div class="pu-grid">
                <label class="pu-campo">Costo final (S/) <input name="costo" type="number" min="0" step="0.01" value="${m.costo ?? ''}"></label>
                <label class="pu-campo">Kilometraje actual <input name="kilometraje" type="number" min="${v?.kilometraje || 0}" value="${v?.kilometraje || ''}">
                    <small>No puede ser menor al registrado</small></label>
                ${conVencimiento ? `<label class="pu-campo pu-ancho">Nuevo vencimiento del ${esc(m.tipo)}
                    <input name="nuevoVencimiento" type="date" min="${hoy()}" value="${proximoAnio}" required></label>` : ''}
            </div>`, async form => {
            if (conVencimiento && !form.nuevoVencimiento.value) throw new Error('Indica la nueva fecha de vencimiento.');
            const km = form.kilometraje.value ? Number(form.kilometraje.value) : null;
            if (km != null && km < Number(v?.kilometraje || 0)) throw new Error('El kilometraje no puede bajar.');
            await api().accionMantenimiento(m.idMantenimiento, 'completar', {
                costo: form.costo.value ? Number(form.costo.value) : null, kilometraje: km,
                nuevoVencimiento: conVencimiento ? form.nuevoVencimiento.value : null
            });
            return 'Mantenimiento completado. El vehículo está disponible.';
        });
    }

    async function accion(id, tipo) {
        const m = lista.find(x => x.idMantenimiento === id);
        if (!m) return;
        if (tipo === 'completar') return completar(m);
        const pregunta = tipo === 'taller'
            ? `¿Enviar ${m.vehiculo} al taller? No se podrá alquilar hasta completar el mantenimiento.`
            : '¿Cancelar este mantenimiento programado?';
        if (!(await window.CarmovoDialogo.confirmar({ titulo: tipo === 'taller' ? 'Enviar al taller' : 'Cancelar mantenimiento', mensaje: pregunta,
            aceptar: tipo === 'taller' ? 'Enviar al taller' : 'Cancelar mantenimiento', cancelar: 'Volver', tipo: tipo === 'taller' ? 'advertencia' : 'peligro' }))) return;
        try {
            await api().accionMantenimiento(id, tipo);
            avisar(tipo === 'taller' ? 'Vehículo enviado al taller.' : 'Mantenimiento cancelado.');
            await cargar();
        } catch (e) {
            avisar(e.message || 'No se pudo completar la acción.', true);
        }
    }

    // ------------------------------------------------------------ carga
    async function cargar() {
        try {
            const [m, v, t, a] = await Promise.all([
                api().listarMantenimientos(), api().listarVehiculos(),
                tipos.length ? tipos : api().listarTiposMantenimiento(), api().alertasMantenimiento()
            ]);
            lista = m || [];
            vehiculos = v || [];
            if (!tipos.length) {
                tipos = t || [];
                $('mt-filtro-tipo').innerHTML = '<option value="">Todos los tipos</option>' + tipos.map(x => `<option>${esc(x)}</option>`).join('');
            }
            pintarResumen();
            pintarAlertas(a || []);
            pintarTabla();
        } catch (e) {
            $('mt-filas').innerHTML = '<tr><td colspan="7" class="pu-vacio">No se pudo cargar la información.</td></tr>';
            avisar(e.message || 'Error al cargar.', true);
        }
    }

    function preparar() {
        $('mt-nuevo').addEventListener('click', () => programar());
        ['mt-buscar', 'mt-filtro-estado', 'mt-filtro-tipo'].forEach(id =>
            $(id).addEventListener(id === 'mt-buscar' ? 'input' : 'change', pintarTabla));
        $('mt-filas').addEventListener('click', e => {
            const b = e.target.closest('[data-accion]');
            if (b) accion(Number(b.dataset.id), b.dataset.accion);
        });
        $('mt-alertas-lista').addEventListener('click', e => {
            const b = e.target.closest('[data-programar]');
            if (b) programar(b.dataset.programar, b.dataset.tipo);
        });
        $('mt-modal').addEventListener('click', e => {
            if (e.target.id === 'mt-modal' || e.target.closest('[data-cerrar]')) cerrarModal();
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });
        const id = new URLSearchParams(location.search).get('vehiculo');
        cargar().then(() => { if (id) programar(id); });
    }

    document.addEventListener('DOMContentLoaded', preparar);
})();
