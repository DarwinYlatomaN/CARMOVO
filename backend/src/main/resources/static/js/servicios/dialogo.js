/* =========================================================
   CARMOVO · Ventanas de aviso y confirmación
   Reemplazan las ventanas del navegador (alert, confirm, prompt)
   por una ventana propia con el diseño del sitio.

   await CarmovoDialogo.confirmar({ titulo, mensaje, aceptar, cancelar, tipo })  → true / false
   await CarmovoDialogo.avisar({ titulo, mensaje, tipo })                        → se cierra con "Entendido"
   await CarmovoDialogo.pedir({ titulo, mensaje, valor, etiqueta })               → texto o null
   tipo: 'info' | 'exito' | 'advertencia' | 'peligro'
   ========================================================= */
(() => {
    'use strict';
    if (window.CarmovoDialogo) return;

    const ICONOS = {
        info: 'fa-circle-info',
        exito: 'fa-circle-check',
        advertencia: 'fa-triangle-exclamation',
        peligro: 'fa-trash-can'
    };

    const ESTILOS = `
        .cd-fondo { position: fixed; inset: 0; z-index: 6000; display: flex; align-items: center; justify-content: center;
            padding: 16px; background: rgba(15, 28, 22, .42); backdrop-filter: blur(3px); animation: cdFondo .18s ease; }
        .cd-caja { width: min(440px, 100%); background: var(--cd-superficie, #fff); color: var(--cd-texto, #22332B);
            border-radius: 24px; padding: 28px 26px 22px; box-shadow: 0 30px 80px rgba(15, 28, 22, .28);
            text-align: center; font-family: inherit; animation: cdEntrar .26s cubic-bezier(.2, .9, .3, 1.2); }
        .cd-icono { width: 58px; height: 58px; margin: 0 auto 14px; border-radius: 50%; display: grid; place-items: center;
            font-size: 1.5rem; background: var(--cd-suave); color: var(--cd-color); }
        .cd-titulo { margin: 0 0 8px; font-size: 1.15rem; font-weight: 800; line-height: 1.3; }
        .cd-mensaje { margin: 0; color: var(--cd-texto-suave, #5C7066); font-size: .95rem; line-height: 1.55; white-space: pre-line; }
        .cd-campo { width: 100%; margin-top: 16px; border: 0; border-radius: 14px; padding: 13px 15px; font: inherit; font-size: .95rem;
            background: var(--cd-campo, #F2F6F4); color: inherit; outline: none; text-align: left; }
        .cd-campo:focus { box-shadow: 0 0 0 3px var(--cd-suave); }
        .cd-botones { display: flex; gap: 10px; margin-top: 22px; }
        .cd-boton { flex: 1; border: 0; border-radius: 14px; padding: 13px 16px; font: inherit; font-weight: 700; font-size: .95rem;
            cursor: pointer; transition: transform .15s ease, filter .15s ease, box-shadow .15s ease; }
        .cd-boton:hover { transform: translateY(-1px); filter: brightness(1.04); }
        .cd-boton:active { transform: translateY(0); }
        .cd-boton:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--cd-suave); }
        .cd-boton--suave { background: var(--cd-campo, #F2F6F4); color: var(--cd-texto-suave, #5C7066); }
        .cd-boton--principal { background: var(--cd-color); color: #fff; box-shadow: 0 8px 20px var(--cd-sombra); }
        .cd-saliendo { animation: cdSalir .16s ease forwards; }
        .cd-saliendo .cd-caja { animation: cdCajaSalir .16s ease forwards; }
        @keyframes cdFondo { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cdEntrar { from { opacity: 0; transform: translateY(14px) scale(.96); } to { opacity: 1; transform: none; } }
        @keyframes cdSalir { to { opacity: 0; } }
        @keyframes cdCajaSalir { to { opacity: 0; transform: translateY(8px) scale(.97); } }
        @media (max-width: 560px) {
            .cd-fondo { align-items: flex-end; padding: 0; }
            .cd-caja { width: 100%; border-radius: 24px 24px 0 0; padding: 26px 20px calc(20px + env(safe-area-inset-bottom)); }
            .cd-botones { flex-direction: column-reverse; }
        }
        @media (prefers-reduced-motion: reduce) { .cd-fondo, .cd-caja { animation: none; } }
    `;

    /** Colores según la zona: panel (azul) o sitio web (verde del tema). */
    function colores(tipo) {
        const panel = !!document.querySelector('.app-admin, [class*="login-admin"]');
        const principal = panel ? '#315A75' : (getComputedStyle(document.documentElement).getPropertyValue('--color-principal').trim() || '#2E7D52');
        const mapa = {
            peligro: ['#C0392B', '#FBE9E9', 'rgba(192, 57, 43, .28)'],
            advertencia: ['#B7791F', '#FFF4DB', 'rgba(183, 121, 31, .25)'],
            exito: ['#1C8353', '#E5F7EE', 'rgba(28, 131, 83, .25)'],
            info: [principal, panel ? '#E6F0F7' : '#E4F3E9', panel ? 'rgba(49, 90, 117, .25)' : 'rgba(46, 125, 82, .25)']
        };
        return mapa[tipo] || mapa.info;
    }

    function ponerEstilos() {
        if (document.getElementById('cd-estilos')) return;
        const st = document.createElement('style');
        st.id = 'cd-estilos';
        st.textContent = ESTILOS;
        (document.head || document.documentElement).appendChild(st);
    }

    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const cola = [];
    let abierto = false;

    function abrir(opciones) {
        return new Promise(resolver => {
            cola.push({ opciones, resolver });
            if (!abierto) siguiente();
        });
    }

    function siguiente() {
        const item = cola.shift();
        if (!item) { abierto = false; return; }
        abierto = true;
        ponerEstilos();
        const { opciones: o, resolver } = item;
        const tipo = o.tipo || (o.modo === 'confirmar' ? 'advertencia' : 'info');
        const [color, suave, sombra] = colores(tipo);
        const anterior = document.activeElement;

        const fondo = document.createElement('div');
        fondo.className = 'cd-fondo';
        fondo.style.setProperty('--cd-color', color);
        fondo.style.setProperty('--cd-suave', suave);
        fondo.style.setProperty('--cd-sombra', sombra);
        fondo.innerHTML = `
            <div class="cd-caja" role="${o.modo === 'avisar' ? 'alertdialog' : 'dialog'}" aria-modal="true" aria-labelledby="cd-titulo" aria-describedby="cd-mensaje">
                <div class="cd-icono" aria-hidden="true"><i class="fa-solid ${ICONOS[tipo] || ICONOS.info}"></i></div>
                <h2 class="cd-titulo" id="cd-titulo">${esc(o.titulo)}</h2>
                ${o.mensaje ? `<p class="cd-mensaje" id="cd-mensaje">${esc(o.mensaje)}</p>` : ''}
                ${o.modo === 'pedir' ? `<input class="cd-campo" id="cd-campo" maxlength="${o.maximo || 200}" value="${esc(o.valor || '')}" aria-label="${esc(o.etiqueta || o.titulo)}">` : ''}
                <div class="cd-botones">
                    ${o.modo === 'avisar' ? '' : `<button type="button" class="cd-boton cd-boton--suave" data-cd="no">${esc(o.cancelar || 'Cancelar')}</button>`}
                    <button type="button" class="cd-boton cd-boton--principal" data-cd="si">${esc(o.aceptar || (o.modo === 'avisar' ? 'Entendido' : 'Aceptar'))}</button>
                </div>
            </div>`;
        document.body.appendChild(fondo);
        const campo = fondo.querySelector('#cd-campo');
        const principal = fondo.querySelector('[data-cd="si"]');
        setTimeout(() => (campo || principal).focus(), 30);
        if (campo) campo.select();

        const cerrar = valor => {
            document.removeEventListener('keydown', teclas, true);
            fondo.classList.add('cd-saliendo');
            setTimeout(() => {
                fondo.remove();
                try { anterior?.focus?.(); } catch (_) { /* nada */ }
                resolver(valor);
                siguiente();
            }, 150);
        };
        const responder = si => {
            if (o.modo === 'pedir') return cerrar(si ? campo.value.trim() : null);
            if (o.modo === 'avisar') return cerrar(undefined);
            cerrar(!!si);
        };
        const teclas = e => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); responder(false); }
            if (e.key === 'Enter' && (e.target === campo || e.target === principal)) { e.preventDefault(); responder(true); }
            if (e.key === 'Tab') {
                const focos = [...fondo.querySelectorAll('button, input')];
                const i = focos.indexOf(document.activeElement);
                if (e.shiftKey && i <= 0) { e.preventDefault(); focos[focos.length - 1].focus(); }
                else if (!e.shiftKey && i === focos.length - 1) { e.preventDefault(); focos[0].focus(); }
            }
        };
        document.addEventListener('keydown', teclas, true);
        fondo.addEventListener('click', e => {
            if (e.target === fondo) return responder(false);
            const b = e.target.closest('[data-cd]');
            if (b) responder(b.dataset.cd === 'si');
        });
    }

    const normalizar = (x, porDefecto) => (typeof x === 'string' ? { mensaje: x } : (x || {}));

    window.CarmovoDialogo = {
        confirmar(x) {
            const o = normalizar(x);
            return abrir({ modo: 'confirmar', titulo: o.titulo || '¿Confirmas esta acción?', ...o, mensaje: o.titulo ? o.mensaje : (o.mensaje || '') });
        },
        avisar(x) {
            const o = normalizar(x);
            return abrir({ modo: 'avisar', titulo: o.titulo || 'Aviso', ...o });
        },
        pedir(x) {
            const o = normalizar(x);
            return abrir({ modo: 'pedir', titulo: o.titulo || 'Escribe un valor', ...o });
        }
    };

    // Cualquier alert() que quede en el código usa también esta ventana.
    window.alert = mensaje => { window.CarmovoDialogo.avisar({ titulo: 'Aviso', mensaje: String(mensaje ?? '') }); };
})();
