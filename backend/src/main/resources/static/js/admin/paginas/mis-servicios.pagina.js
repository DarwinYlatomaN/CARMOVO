/* =========================================================
   CARMOVO · Mis servicios (rol Conductor)
   Lista los alquileres con chofer asignados al conductor y le
   permite avanzar: Asignado → En camino → Con el cliente → Finalizado.
   Diseñado para usarse desde el celular.
   ========================================================= */
(() => {
    'use strict';

    const api = () => window.CarmovoAdminApi;
    const $ = id => document.getElementById(id);
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fecha = v => v ? new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' }) : '—';
    const hoy = () => new Date().toISOString().slice(0, 10);

    const ORDEN = ['ASIGNADO', 'INICIADO', 'ENTREGADO', 'FINALIZADO'];
    const SIGUIENTE = {
        ASIGNADO: { estado: 'INICIADO', texto: 'Salí a recoger', icono: 'fa-car-side' },
        INICIADO: { estado: 'ENTREGADO', texto: 'Llegué con el cliente', icono: 'fa-handshake' },
        ENTREGADO: { estado: 'FINALIZADO', texto: 'Finalizar servicio', icono: 'fa-flag-checkered' }
    };

    let servicios = [];
    let filtro = 'activos';

    function avisar(texto, error = false) {
        const caja = $('pu-mensaje');
        caja.textContent = texto;
        caja.classList.toggle('error', error);
        caja.hidden = false;
        clearTimeout(avisar.t);
        avisar.t = setTimeout(() => { caja.hidden = true; }, 4000);
    }

    function tarjeta(s) {
        const estado = s.estadoServicio || 'ASIGNADO';
        const paso = ORDEN.indexOf(estado);
        const siguiente = SIGUIENTE[estado];
        const tel = String(s.telefonoCliente || '').replace(/\D/g, '');
        const esHoy = String(s.fechaInicio) === hoy();
        return `<article class="ms-tarjeta ${esHoy && estado !== 'FINALIZADO' ? 'ms-hoy' : ''}">
            <div class="ms-cabecera">
                <div><strong>${esc(s.cliente)}</strong><small>Alquiler #${esc(s.idAlquiler)}${esHoy ? ' · <b>Hoy</b>' : ''}</small></div>
                <span class="pu-chip ${estado === 'FINALIZADO' ? 'pu-chip--verde' : 'pu-chip--azul'}">${['Asignado', 'En camino', 'Con el cliente', 'Finalizado'][paso] || estado}</span>
            </div>
            <div class="ms-dato"><i class="fa-solid fa-calendar"></i><div>${fecha(s.fechaInicio)} al ${fecha(s.fechaFin)}<small>${esc(s.dias)} día(s)</small></div></div>
            <div class="ms-dato"><i class="fa-solid fa-location-dot"></i><div>${esc(s.lugarRecogida)}<small>Devolución: ${esc(s.lugarEntrega)}</small></div></div>
            <div class="ms-dato"><i class="fa-solid fa-car"></i><div>${esc(s.vehiculo)}<small>Placa ${esc(s.placa || '—')}</small></div></div>
            <div class="ms-pasos" aria-hidden="true">${ORDEN.map((_, i) => `<span class="${i <= paso ? 'hecho' : ''}"></span>`).join('')}</div>
            <div class="ms-pasos-texto" aria-hidden="true"><span>Asignado</span><span>En camino</span><span>Con cliente</span><span>Fin</span></div>
            <div class="ms-botones">
                ${tel ? `<a class="pu-boton pu-boton--suave" href="tel:${tel}"><i class="fa-solid fa-phone"></i> Llamar</a>
                         <a class="pu-boton pu-boton--suave ms-wa" aria-label="WhatsApp" href="https://wa.me/51${tel.slice(-9)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
                ${siguiente ? `<button class="pu-boton pu-boton--primario" type="button" data-id="${s.idAlquiler}" data-estado="${siguiente.estado}">
                    <i class="fa-solid ${siguiente.icono}"></i> ${siguiente.texto}</button>` : ''}
            </div>
        </article>`;
    }

    function pintar() {
        const lista = servicios.filter(s => filtro === 'finalizados'
            ? s.estadoServicio === 'FINALIZADO'
            : s.estadoServicio !== 'FINALIZADO');
        $('ms-lista').innerHTML = lista.length ? lista.map(tarjeta).join('')
            : `<div class="pu-tarjeta">${filtro === 'activos' ? 'No tienes servicios pendientes. Cuando te asignen uno aparecerá aquí.' : 'Aún no tienes servicios finalizados.'}</div>`;
    }

    async function cargar() {
        try {
            servicios = await api().misServicios() || [];
            pintar();
        } catch (e) {
            $('ms-lista').innerHTML = `<div class="pu-tarjeta">${esc(e.message || 'No se pudieron cargar tus servicios.')}</div>`;
        }
    }

    async function avanzar(boton) {
        if (boton.dataset.estado === 'FINALIZADO' && !window.confirm('¿Confirmas que el servicio terminó?')) return;
        boton.disabled = true;
        try {
            await api().avanzarServicio(boton.dataset.id, boton.dataset.estado);
            avisar('Estado actualizado.');
            await cargar();
        } catch (e) {
            avisar(e.message || 'No se pudo actualizar.', true);
            boton.disabled = false;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        $('ms-recargar').addEventListener('click', cargar);
        $('ms-lista').addEventListener('click', e => {
            const b = e.target.closest('button[data-estado]');
            if (b) avanzar(b);
        });
        document.querySelectorAll('[data-filtro]').forEach(b => b.addEventListener('click', () => {
            document.querySelectorAll('[data-filtro]').forEach(x => x.classList.toggle('activa', x === b));
            filtro = b.dataset.filtro;
            pintar();
        }));
        cargar();
        setInterval(cargar, 60000);
    });
})();
