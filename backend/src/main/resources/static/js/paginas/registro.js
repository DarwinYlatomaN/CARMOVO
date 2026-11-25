/* =========================================================
   CARMOVO · Crear cuenta: medidor de contraseña y verificación del correo
   1. Mientras se escribe, marca cada requisito de la contraseña y su fuerza.
   2. Tras enviar el formulario, abre la ventana para escribir el código
      de 6 dígitos que llegó al correo. Recién con el código correcto se crea la cuenta.
   ========================================================= */
(() => {
    'use strict';

    const $ = id => document.getElementById(id);
    const normalizar = v => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    // ------------------------------------------------------------ requisitos de la contraseña
    function reglas(clave) {
        const n = normalizar(clave);
        const partes = [$('nombres')?.value, $('apellidos')?.value]
            .flatMap(t => normalizar(t).split(/\s+/)).filter(p => p.length >= 3);
        const dni = ($('documento')?.value || '').trim();
        const nacimiento = ($('fechaNacimiento')?.value || '').replace(/-/g, '');
        const personal = !!clave && (partes.some(p => n.includes(p)) || (dni.length >= 6 && n.includes(dni))
            || (nacimiento && n.includes(nacimiento)));
        return {
            largo: clave.length >= 8 && clave.length <= 12,
            mayuscula: /[A-Z]/.test(clave),
            minuscula: /[a-z]/.test(clave),
            numero: /[0-9]/.test(clave),
            simbolo: /[@#$%*_\-]/.test(clave),
            personal: !!clave && !personal && !/^\s|\s$/.test(clave)
        };
    }

    function pintarRequisitos() {
        const campo = $('contrasena');
        const caja = $('requisitosContrasena');
        if (!campo || !caja) return;
        const clave = campo.value;
        const r = reglas(clave);
        const cumplidas = Object.values(r).filter(Boolean).length;
        caja.querySelectorAll('[data-regla]').forEach(li => {
            const ok = r[li.dataset.regla];
            li.classList.toggle('si', ok);
            li.querySelector('i').className = ok ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle';
        });
        const nivel = !clave ? 0 : cumplidas <= 2 ? 1 : cumplidas <= 4 ? 2 : cumplidas === 5 ? 3 : 4;
        const nombres = ['Escribe tu contraseña', 'Contraseña débil', 'Contraseña regular', 'Contraseña media', 'Contraseña segura'];
        const faltan = Object.entries(r).filter(([, ok]) => !ok).map(([k]) => ({
            largo: 'entre 8 y 12 caracteres', mayuscula: 'una mayúscula', minuscula: 'una minúscula',
            numero: 'un número', simbolo: 'un símbolo', personal: 'quitar tus datos personales'
        })[k]);
        caja.dataset.nivel = String(nivel);
        $('rvFuerza').textContent = nivel && nivel < 4 && faltan.length
            ? `${nombres[nivel]} · te falta ${faltan[0]}`
            : nombres[nivel];
        pintarCoincidencia();
        return cumplidas === 6;
    }

    function pintarCoincidencia() {
        const a = $('contrasena')?.value || '';
        const b = $('confirmarContrasena')?.value || '';
        const aviso = $('rvCoincide');
        const campo = $('confirmarContrasena');
        if (!aviso || !campo) return;
        const envoltura = campo.closest('.campo-input-registro') || campo;
        if (!b) {
            aviso.textContent = '';
            envoltura.classList.remove('rv-bien', 'rv-mal');
            return;
        }
        const igual = a === b;
        aviso.innerHTML = igual
            ? '<i class="fa-solid fa-circle-check"></i> Las contraseñas coinciden.'
            : '<i class="fa-solid fa-circle-exclamation"></i> Las contraseñas no coinciden.';
        aviso.className = `rv-coincide ${igual ? 'rv-ok' : 'rv-error'}`;
        envoltura.classList.toggle('rv-bien', igual);
        envoltura.classList.toggle('rv-mal', !igual);
    }

    document.addEventListener('DOMContentLoaded', () => {
        ['contrasena', 'confirmarContrasena', 'nombres', 'apellidos', 'documento', 'fechaNacimiento'].forEach(id =>
            $(id)?.addEventListener('input', pintarRequisitos));
        pintarRequisitos();
    });

    // ------------------------------------------------------------ ventana del código
    const ESTILOS = `
        .rv-fondo{position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;padding:16px;
            background:rgba(15,28,22,.45);backdrop-filter:blur(3px);animation:rvAparecer .2s ease}
        .rv-caja{width:min(440px,100%);background:#fff;border-radius:24px;padding:30px 26px 24px;text-align:center;
            box-shadow:0 30px 80px rgba(15,28,22,.3);animation:rvSubir .28s cubic-bezier(.2,.9,.3,1.2);font-family:inherit;color:#263B30}
        .rv-icono{width:68px;height:68px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;font-size:28px;
            background:#E4F3E9;color:#376B50}
        .rv-icono.ok{background:#1C8353;color:#fff;box-shadow:0 0 0 8px #E5F7EE}
        .rv-caja h2{margin:0 0 6px;font-size:1.35rem;font-weight:800;color:#2A5A40}
        .rv-caja p{margin:0;color:#5F7368;font-size:.92rem;line-height:1.5}
        .rv-caja p b{color:#263B30}
        .rv-cods{display:flex;gap:8px;justify-content:center;margin:20px 0 10px}
        .rv-cods input{width:46px;height:56px;border:0;border-radius:14px;background:#F1F6F3;text-align:center;
            font-size:1.5rem;font-weight:800;color:#263B30;outline:none;transition:box-shadow .15s ease, background .15s ease}
        .rv-cods input:focus{background:#fff;box-shadow:0 0 0 2px #376B50 inset}
        .rv-cods.error input{box-shadow:0 0 0 2px #E58C8C inset;background:#FDF3F3;animation:rvTemblar .35s ease}
        .rv-tiempo{font-size:.85rem;color:#5F7368}.rv-tiempo b{color:#263B30}
        .rv-tiempo.vencido b{color:#B23B3B}
        .rv-error{min-height:20px;margin:8px 0 0;color:#B23B3B;font-size:.85rem;font-weight:600}
        .rv-principal{width:100%;margin-top:14px;border:0;border-radius:14px;padding:14px;background:#376B50;color:#fff;
            font:inherit;font-weight:800;font-size:1rem;cursor:pointer;box-shadow:0 10px 24px rgba(55,107,80,.28);
            transition:transform .15s ease, filter .15s ease}
        .rv-principal:hover{transform:translateY(-1px);filter:brightness(1.05)}
        .rv-principal:disabled{background:#B9CFC2;box-shadow:none;cursor:default;transform:none}
        .rv-enlaces{margin-top:14px;font-size:.85rem;color:#8A9C92}
        .rv-enlaces button{border:0;background:none;padding:0;font:inherit;font-weight:700;color:#376B50;cursor:pointer}
        .rv-enlaces button:disabled{color:#A8B8AF;cursor:default}
        .rv-volver{display:block;margin:10px auto 0;color:#8A9C92 !important;font-weight:600 !important}
        .rv-prueba{margin-top:12px;padding:9px 12px;border-radius:12px;background:#FFF4DB;color:#94620A;font-size:.8rem;font-weight:600}
        @keyframes rvAparecer{from{opacity:0}to{opacity:1}}
        @keyframes rvSubir{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
        @keyframes rvTemblar{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @media (max-width:560px){.rv-fondo{align-items:flex-end;padding:0}
            .rv-caja{width:100%;border-radius:24px 24px 0 0;padding:26px 18px calc(22px + env(safe-area-inset-bottom))}
            .rv-cods input{width:42px;height:52px}}
        @media (prefers-reduced-motion:reduce){.rv-fondo,.rv-caja,.rv-cods.error input{animation:none}}`;

    function estilos() {
        if ($('rv-estilos')) return;
        const st = document.createElement('style');
        st.id = 'rv-estilos';
        st.textContent = ESTILOS;
        document.head.appendChild(st);
    }

    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const reloj = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    /**
     * Abre la ventana del código. Devuelve una promesa con el cliente ya creado (con su token)
     * o null si la persona cerró la ventana para corregir su correo.
     */
    function abrir(respuesta) {
        estilos();
        return new Promise(resolver => {
            const api = window.CarmovoClienteApi;
            let vigencia = Number(respuesta.segundosVigencia) || 600;
            let espera = Number(respuesta.segundosReenvio) || 60;
            const fondo = document.createElement('div');
            fondo.className = 'rv-fondo';
            fondo.innerHTML = `
                <div class="rv-caja" role="dialog" aria-modal="true" aria-labelledby="rv-titulo">
                    <div class="rv-icono"><i class="fa-solid fa-envelope-open-text"></i></div>
                    <h2 id="rv-titulo">Verifica tu correo</h2>
                    <p>Enviamos un código de 6 dígitos a<br><b>${esc(respuesta.correoOculto || respuesta.correo)}</b></p>
                    <div class="rv-cods" id="rv-cods">
                        ${Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" maxlength="1" autocomplete="${i === 0 ? 'one-time-code' : 'off'}" aria-label="Dígito ${i + 1}">`).join('')}
                    </div>
                    <p class="rv-tiempo" id="rv-tiempo">El código vence en <b>${reloj(vigencia)}</b></p>
                    <p class="rv-error" id="rv-error" role="alert"></p>
                    <button type="button" class="rv-principal" id="rv-verificar" disabled>Verificar y crear cuenta</button>
                    <div class="rv-enlaces">¿No te llegó? Revisa spam o
                        <button type="button" id="rv-reenviar" disabled>reenviar código</button> <span id="rv-espera"></span>
                        <button type="button" class="rv-volver" id="rv-volver">← Cambiar correo</button>
                    </div>
                    ${respuesta.correoReal === false ? '<div class="rv-prueba"><i class="fa-solid fa-circle-info"></i> Modo prueba: el correo no está configurado, el código aparece en la terminal donde corre el sistema.</div>' : ''}
                </div>`;
            document.body.appendChild(fondo);
            const casillas = [...fondo.querySelectorAll('.rv-cods input')];
            const btn = $('rv-verificar');
            const error = $('rv-error');
            const codigo = () => casillas.map(c => c.value).join('');
            const actualizar = () => { btn.disabled = codigo().length !== 6 || vigencia <= 0; };
            const mostrarError = texto => {
                error.textContent = texto || '';
                const grupo = $('rv-cods');
                grupo.classList.remove('error');
                if (texto) { void grupo.offsetWidth; grupo.classList.add('error'); }
            };
            setTimeout(() => casillas[0].focus(), 50);

            casillas.forEach((c, i) => {
                c.addEventListener('input', () => {
                    const solo = c.value.replace(/\D/g, '');
                    if (solo.length > 1) {
                        solo.slice(0, 6 - i).split('').forEach((d, k) => { casillas[i + k].value = d; });
                        casillas[Math.min(i + solo.length, 5)].focus();
                    } else {
                        c.value = solo;
                        if (solo && i < 5) casillas[i + 1].focus();
                    }
                    mostrarError('');
                    actualizar();
                    if (codigo().length === 6) verificar();
                });
                c.addEventListener('keydown', e => {
                    if (e.key === 'Backspace' && !c.value && i > 0) casillas[i - 1].focus();
                    if (e.key === 'Enter' && codigo().length === 6) verificar();
                });
                c.addEventListener('paste', e => {
                    const texto = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
                    if (!texto) return;
                    e.preventDefault();
                    texto.split('').forEach((d, k) => { casillas[k].value = d; });
                    casillas[Math.min(texto.length, 5)].focus();
                    actualizar();
                    if (texto.length === 6) verificar();
                });
            });

            const reloj1 = setInterval(() => {
                vigencia = Math.max(0, vigencia - 1);
                espera = Math.max(0, espera - 1);
                const t = $('rv-tiempo');
                if (t) {
                    t.classList.toggle('vencido', vigencia === 0);
                    t.innerHTML = vigencia ? `El código vence en <b>${reloj(vigencia)}</b>` : '<b>El código venció.</b> Pide uno nuevo.';
                }
                $('rv-reenviar').disabled = espera > 0;
                $('rv-espera').textContent = espera > 0 ? `(en ${espera} s)` : '';
                actualizar();
            }, 1000);
            $('rv-espera').textContent = `(en ${espera} s)`;

            const cerrar = valor => {
                clearInterval(reloj1);
                fondo.remove();
                resolver(valor);
            };

            let ocupado = false;
            async function verificar() {
                if (ocupado || codigo().length !== 6) return;
                ocupado = true;
                btn.disabled = true;
                btn.textContent = 'Verificando…';
                try {
                    const usuario = await api.verificarRegistro(respuesta.correo, codigo());
                    clearInterval(reloj1);
                    fondo.querySelector('.rv-caja').innerHTML = `
                        <div class="rv-icono ok"><i class="fa-solid fa-check"></i></div>
                        <h2>¡Cuenta creada!</h2>
                        <p>Tu correo fue verificado. Ya puedes reservar.</p>`;
                    setTimeout(() => cerrar(usuario), 1400);
                } catch (e) {
                    mostrarError(e?.message || 'No se pudo verificar el código.');
                    casillas.forEach(c => { c.value = ''; });
                    casillas[0].focus();
                    btn.textContent = 'Verificar y crear cuenta';
                    actualizar();
                } finally {
                    ocupado = false;
                }
            }

            btn.addEventListener('click', verificar);
            $('rv-reenviar').addEventListener('click', async () => {
                $('rv-reenviar').disabled = true;
                try {
                    const r = await api.reenviarCodigoRegistro(respuesta.correo);
                    vigencia = Number(r.segundosVigencia) || 600;
                    espera = Number(r.segundosReenvio) || 60;
                    casillas.forEach(c => { c.value = ''; });
                    casillas[0].focus();
                    mostrarError('');
                    error.textContent = 'Te enviamos un código nuevo.';
                    error.style.color = '#1C8353';
                    setTimeout(() => { error.style.color = ''; }, 2500);
                } catch (e) {
                    mostrarError(e?.message || 'No se pudo reenviar el código.');
                    espera = 10;
                }
            });
            $('rv-volver').addEventListener('click', () => {
                cerrar(null);
                $('correo')?.focus();
            });
        });
    }

    window.CarmovoVerificacionRegistro = { abrir, contrasenaValida: () => pintarRequisitos() };
})();