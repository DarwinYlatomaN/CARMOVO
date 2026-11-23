/* =========================================================
   CARMOVO · Operaciones del alquiler (Agente de reservas)
   - Entrega del vehículo (Confirmado + Pagado → En curso)
   - Devolución (En curso → Finalizado, calcula cargos)
   - Asignar chofer (alquileres con servicio de chofer)
   - Ver inspecciones y cargos
   Se usa desde Gestión de alquileres:
     CarmovoOperacionesAlquiler.botones(alquiler)  → HTML de botones
     CarmovoOperacionesAlquiler.ejecutar(accion, alquiler, alTerminar)
   ========================================================= */
(() => {
    'use strict';

    const api = () => window.CarmovoAdminApi;
    const PRECIO_OCTAVO = 25;

    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const norm = v => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const soles = n => `S/ ${Number(n || 0).toFixed(2)}`;
    const fecha = v => v ? new Date(v).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
    const hoy = () => new Date().toISOString().slice(0, 10);

    const SERVICIO = { ASIGNADO: 'Asignado', INICIADO: 'En camino', ENTREGADO: 'Con el cliente', FINALIZADO: 'Finalizado' };

    function boton(accion, id, icono, titulo, clase = '') {
        return `<button class="boton-alquiler-icono ${clase}" type="button" data-accion="${accion}" data-id="${esc(id)}"
                    title="${titulo}" aria-label="${titulo}"><i class="fa-solid ${icono}"></i></button>`;
    }

    function botones(a) {
        const estado = norm(a.estado);
        let html = boton('op-detalle', a.idAlquiler, 'fa-clipboard-check', 'Ver inspecciones y cargos');
        if (estado === 'confirmado') html += boton('op-entrega', a.idAlquiler, 'fa-key', 'Registrar entrega del vehículo', 'op-entrega');
        if (estado === 'en curso') html += boton('op-devolucion', a.idAlquiler, 'fa-flag-checkered', 'Registrar devolución', 'op-devolucion');
        if (a.conChofer && ['pendiente', 'confirmado', 'en curso'].includes(estado)) {
            html += boton('op-chofer', a.idAlquiler, 'fa-id-card', a.idConductor ? 'Cambiar chofer' : 'Asignar chofer', 'op-chofer');
        }
        return html;
    }

    /** Línea extra para la celda del vehículo (placa, chofer). */
    function etiquetas(a) {
        const partes = [];
        if (a.placa) partes.push(`<span class="pu-chip">${esc(a.placa)}</span>`);
        if (a.conChofer) {
            partes.push(a.conductor
                ? `<span class="pu-chip pu-chip--azul"><i class="fa-solid fa-id-card"></i>${esc(a.conductor)} · ${esc(SERVICIO[a.estadoServicio] || 'Asignado')}</span>`
                : '<span class="pu-chip pu-chip--amarillo"><i class="fa-solid fa-id-card"></i>Chofer sin asignar</span>');
        }
        if (a.estadoPago && norm(a.estadoPago) !== 'pagado') {
            partes.push(`<span class="pu-chip pu-chip--amarillo">Pago: ${esc(a.estadoPago)}</span>`);
        }
        return partes.length ? `<div class="op-etiquetas">${partes.join('')}</div>` : '';
    }

    // ------------------------------------------------------------ modal
    let modal;
    function asegurarModal() {
        if (modal) return modal;
        modal = document.createElement('div');
        modal.className = 'pu-modal';
        modal.hidden = true;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = '<div class="pu-modal__caja" id="op-caja"></div>';
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) cerrar(); });
        return modal;
    }

    function abrir(html) {
        asegurarModal();
        modal.querySelector('#op-caja').innerHTML = html;
        modal.hidden = false;
        modal.querySelector('[data-cerrar]')?.addEventListener('click', cerrar);
        modal.querySelectorAll('[data-cancelar]').forEach(b => b.addEventListener('click', cerrar));
        setTimeout(() => modal.querySelector('input, select, textarea')?.focus(), 60);
    }

    function cerrar() { if (modal) modal.hidden = true; }

    function cabecera(titulo, subtitulo) {
        return `<div class="pu-modal__cabecera"><div><h2>${titulo}</h2><p>${subtitulo}</p></div>
                <button class="pu-modal__cerrar" type="button" data-cerrar aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button></div>`;
    }

    function error(texto) {
        const caja = modal.querySelector('.pu-error');
        caja.textContent = texto;
        caja.hidden = !texto;
    }

    function selectorCombustible(nombre, valor = 8) {
        return `<div class="pu-combustible" data-combustible="${nombre}">
            ${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button type="button" data-octavo="${n}" class="${n <= valor ? 'lleno' : ''}"
                aria-label="${n} de 8">${n === 4 ? '½' : n === 8 ? 'F' : ''}</button>`).join('')}
            </div><input type="hidden" name="${nombre}" value="${valor}">`;
    }

    function activarCombustible(alCambiar) {
        modal.querySelectorAll('[data-combustible]').forEach(grupo => {
            const input = modal.querySelector(`input[name="${grupo.dataset.combustible}"]`);
            grupo.addEventListener('click', e => {
                const b = e.target.closest('[data-octavo]');
                if (!b) return;
                const n = Number(b.dataset.octavo);
                input.value = n;
                grupo.querySelectorAll('button').forEach(x => x.classList.toggle('lleno', Number(x.dataset.octavo) <= n));
                alCambiar?.();
            });
        });
    }

    async function enviar(form, accion, alTerminar, mensaje) {
        const b = form.querySelector('[type=submit]');
        b.disabled = true;
        error('');
        try {
            const r = await accion();
            cerrar();
            alTerminar?.(mensaje(r));
        } catch (e) {
            error(e.message || 'No se pudo completar la operación.');
        } finally {
            b.disabled = false;
        }
    }

    // ------------------------------------------------------------ entrega
    async function entrega(a, alTerminar) {
        let kmBase = 0;
        try {
            const v = await api().obtenerVehiculo?.(a.idVehiculo);
            kmBase = Number(v?.kilometraje || 0);
        } catch (_) { /* opcional */ }
        abrir(`${cabecera('Entregar vehículo', `Alquiler #${esc(a.idAlquiler)} · ${esc(a.vehiculo)} · ${esc(a.cliente)}`)}
            <form id="op-form" novalidate>
              <div class="pu-grid">
                <label class="pu-campo">Kilometraje de salida
                    <input name="kilometraje" type="number" min="${kmBase}" step="1" value="${kmBase || ''}" required>
                    <small>Último registrado: ${kmBase.toLocaleString('es-PE')} km</small></label>
                <div class="pu-campo">Combustible de salida ${selectorCombustible('combustible', 8)}</div>
                <label class="pu-campo pu-ancho">Estado del vehículo / daños previos
                    <textarea name="danos" maxlength="500" placeholder="Ej.: rayón leve en puerta trasera derecha"></textarea></label>
                <label class="pu-campo pu-ancho">Observaciones
                    <textarea name="observaciones" maxlength="500" placeholder="Documentos entregados, accesorios, etc."></textarea></label>
              </div>
              <div class="pu-nota"><i class="fa-solid fa-circle-info"></i> Solo se puede entregar si el pago está confirmado. Verifica la licencia y el DNI del cliente antes de entregar las llaves.</div>
              <div class="pu-error" hidden></div>
              <div class="pu-modal__pie">
                <button class="pu-boton pu-boton--suave" type="button" data-cancelar>Cancelar</button>
                <button class="pu-boton pu-boton--primario" type="submit"><i class="fa-solid fa-key"></i> Confirmar entrega</button>
              </div>
            </form>`);
        activarCombustible();
        const form = modal.querySelector('#op-form');
        form.addEventListener('submit', e => {
            e.preventDefault();
            const km = Number(form.kilometraje.value);
            if (!Number.isInteger(km) || km < kmBase) return error(`El kilometraje debe ser un número mayor o igual a ${kmBase}.`);
            enviar(form, () => api().registrarEntrega(a.idAlquiler, {
                kilometraje: String(km), combustible: form.combustible.value,
                danos: form.danos.value.trim(), observaciones: form.observaciones.value.trim()
            }), alTerminar, () => 'Entrega registrada. El alquiler está En curso.');
        });
    }

    // ------------------------------------------------------------ devolución
    async function devolucion(a, alTerminar) {
        let salida = null;
        try {
            const d = await api().listarInspecciones(a.idAlquiler);
            salida = (d?.inspecciones || []).find(i => i.tipo === 'ENTREGA') || null;
        } catch (_) { /* opcional */ }
        const kmSalida = Number(salida?.kilometraje || 0);
        const combSalida = Number(salida?.combustible ?? 8);

        abrir(`${cabecera('Recibir vehículo', `Alquiler #${esc(a.idAlquiler)} · ${esc(a.vehiculo)} · fin pactado ${esc(a.fechaFin)}`)}
            <form id="op-form" novalidate>
              <div class="pu-grid">
                <label class="pu-campo">Fecha de devolución
                    <input name="fechaDevolucion" type="date" value="${hoy()}" required></label>
                <label class="pu-campo">Kilometraje de llegada
                    <input name="kilometraje" type="number" min="${kmSalida}" step="1" required>
                    <small>Salió con ${kmSalida.toLocaleString('es-PE')} km</small></label>
                <div class="pu-campo pu-ancho">Combustible de llegada <small>Salió con ${combSalida}/8 · S/ ${PRECIO_OCTAVO} por cada octavo faltante</small>
                    ${selectorCombustible('combustible', combSalida)}</div>
                <label class="pu-campo pu-ancho">Daños encontrados
                    <textarea name="danos" maxlength="500" placeholder="Déjalo vacío si el vehículo llegó en buen estado"></textarea></label>
                <label class="pu-campo">Costo de daños (S/)
                    <input name="montoDanos" type="number" min="0" step="0.01" value="0"></label>
                <label class="pu-campo">Observaciones
                    <input name="observaciones" maxlength="500"></label>
              </div>
              <div class="pu-nota" id="op-estimado"></div>
              <div class="pu-error" hidden></div>
              <div class="pu-modal__pie">
                <button class="pu-boton pu-boton--suave" type="button" data-cancelar>Cancelar</button>
                <button class="pu-boton pu-boton--primario" type="submit"><i class="fa-solid fa-flag-checkered"></i> Finalizar alquiler</button>
              </div>
            </form>`);
        const form = modal.querySelector('#op-form');
        const estimar = () => {
            const faltan = Math.max(0, combSalida - Number(form.combustible.value));
            const danos = Math.max(0, Number(form.montoDanos.value || 0));
            const retraso = Math.max(0, Math.round((new Date(form.fechaDevolucion.value) - new Date(a.fechaFin)) / 86400000));
            const lineas = [];
            if (retraso) lineas.push(`${retraso} día(s) de retraso (se cobra la tarifa diaria)`);
            if (faltan) lineas.push(`Combustible: ${faltan}/8 faltante = ${soles(faltan * PRECIO_OCTAVO)}`);
            if (danos) lineas.push(`Daños: ${soles(danos)}`);
            modal.querySelector('#op-estimado').innerHTML = lineas.length
                ? `<i class="fa-solid fa-receipt"></i> Cargos adicionales que quedarán pendientes para Caja: ${lineas.map(esc).join(' · ')}`
                : '<i class="fa-solid fa-circle-check"></i> Sin cargos adicionales.';
        };
        activarCombustible(estimar);
        ['fechaDevolucion', 'montoDanos'].forEach(n => form[n].addEventListener('input', estimar));
        estimar();

        form.addEventListener('submit', e => {
            e.preventDefault();
            const km = Number(form.kilometraje.value);
            if (!form.kilometraje.value || !Number.isInteger(km) || km < kmSalida) return error(`El kilometraje debe ser mayor o igual a ${kmSalida}.`);
            if (Number(form.montoDanos.value) > 0 && !form.danos.value.trim()) return error('Describe los daños para justificar el cobro.');
            enviar(form, () => api().registrarDevolucion(a.idAlquiler, {
                fechaDevolucion: form.fechaDevolucion.value, kilometraje: String(km), combustible: form.combustible.value,
                danos: form.danos.value.trim(), montoDanos: String(form.montoDanos.value || 0), observaciones: form.observaciones.value.trim()
            }), alTerminar, r => {
                const total = (r?.cargos || []).reduce((s, c) => s + Number(c.monto || 0), 0);
                return total > 0 ? `Alquiler finalizado. Cargos pendientes por ${soles(total)} (cobrar en Pagos).` : 'Alquiler finalizado sin cargos adicionales.';
            });
        });
    }

    // ------------------------------------------------------------ chofer
    async function chofer(a, alTerminar) {
        let conductores = [];
        try { conductores = await api().listarConductores(); } catch (_) { /* se informa abajo */ }
        abrir(`${cabecera(a.idConductor ? 'Cambiar chofer' : 'Asignar chofer', `Alquiler #${esc(a.idAlquiler)} · ${esc(a.fechaInicio)} al ${esc(a.fechaFin)} · recojo en ${esc(a.lugarRecogida)}`)}
            <form id="op-form" novalidate>
              <label class="pu-campo">Conductor
                <select name="idConductor" required>
                  <option value="">Selecciona un conductor</option>
                  ${conductores.map(c => `<option value="${c.idUsuario}" ${c.idUsuario === a.idConductor ? 'selected' : ''}>${esc(c.nombres)} ${esc(c.apellidos)}</option>`).join('')}
                </select></label>
              ${conductores.length ? '' : '<div class="pu-nota">No hay conductores activos. Créalos en Empleados con el rol Conductor.</div>'}
              <div class="pu-nota">El conductor verá este servicio en "Mis servicios" desde su celular. No se puede asignar a alguien que ya tiene otro servicio en esas fechas.</div>
              <div class="pu-error" hidden></div>
              <div class="pu-modal__pie">
                <button class="pu-boton pu-boton--suave" type="button" data-cancelar>Cancelar</button>
                <button class="pu-boton pu-boton--primario" type="submit"><i class="fa-solid fa-id-card"></i> Asignar</button>
              </div>
            </form>`);
        const form = modal.querySelector('#op-form');
        form.addEventListener('submit', e => {
            e.preventDefault();
            if (!form.idConductor.value) return error('Selecciona un conductor.');
            enviar(form, () => api().asignarConductor(a.idAlquiler, form.idConductor.value), alTerminar,
                r => `Chofer asignado: ${r?.conductor || 'listo'}.`);
        });
    }

    // ------------------------------------------------------------ detalle
    async function detalle(a) {
        abrir(`${cabecera('Inspecciones y cargos', `Alquiler #${esc(a.idAlquiler)} · ${esc(a.vehiculo)}`)}<p>Cargando…</p>`);
        try {
            const d = await api().listarInspecciones(a.idAlquiler);
            const insp = d?.inspecciones || [];
            const cargos = d?.cargos || [];
            modal.querySelector('#op-caja').innerHTML = `${cabecera('Inspecciones y cargos', `Alquiler #${esc(a.idAlquiler)} · ${esc(a.vehiculo)} · pago: ${esc(d?.estadoPago)}`)}
              <div class="pu-linea">
                ${insp.length ? insp.map(i => `<div class="pu-linea__item">
                    <strong><i class="fa-solid ${i.tipo === 'ENTREGA' ? 'fa-key' : 'fa-flag-checkered'}"></i> ${i.tipo === 'ENTREGA' ? 'Entrega' : 'Devolución'}</strong>
                    · ${fecha(i.fecha)} · ${esc(i.registradoPor || '')}
                    <p>${Number(i.kilometraje || 0).toLocaleString('es-PE')} km · combustible ${esc(i.combustible)}/8</p>
                    ${i.danos ? `<p>Daños: ${esc(i.danos)}</p>` : ''}${i.observaciones ? `<p>${esc(i.observaciones)}</p>` : ''}
                  </div>`).join('') : '<div class="pu-linea__item"><p>Aún no se registró la entrega del vehículo.</p></div>'}
              </div>
              ${cargos.length ? `<h3 style="margin:20px 0 8px;font-size:.95rem">Cargos adicionales</h3>
              <div class="pu-linea">${cargos.map(c => `<div class="pu-linea__item">
                  <strong>${esc(c.concepto)}</strong> · ${soles(c.monto)}
                  <span class="pu-chip ${c.estado === 'COBRADO' ? 'pu-chip--verde' : 'pu-chip--amarillo'}" style="float:right">${c.estado === 'COBRADO' ? 'Cobrado' : 'Pendiente'}</span>
                  <p>${esc(c.detalle || '')}${c.metodoCobro ? ` · ${esc(c.metodoCobro)}` : ''}</p></div>`).join('')}</div>` : ''}
              <div class="pu-modal__pie"><button class="pu-boton pu-boton--suave" type="button" data-cancelar>Cerrar</button></div>`;
            modal.querySelector('[data-cerrar]')?.addEventListener('click', cerrar);
            modal.querySelectorAll('[data-cancelar]').forEach(b => b.addEventListener('click', cerrar));
        } catch (e) {
            modal.querySelector('#op-caja').innerHTML = `${cabecera('Inspecciones y cargos', '')}<div class="pu-error">${esc(e.message)}</div>`;
            modal.querySelector('[data-cerrar]')?.addEventListener('click', cerrar);
        }
    }

    function ejecutar(accion, alquiler, alTerminar) {
        if (accion === 'op-entrega') return entrega(alquiler, alTerminar);
        if (accion === 'op-devolucion') return devolucion(alquiler, alTerminar);
        if (accion === 'op-chofer') return chofer(alquiler, alTerminar);
        if (accion === 'op-detalle') return detalle(alquiler);
        return null;
    }

    window.CarmovoOperacionesAlquiler = { botones, etiquetas, ejecutar };
})();
