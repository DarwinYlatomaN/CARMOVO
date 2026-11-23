/* =========================================================
   CARMOVO - Pasarela de pago (modo prueba)
   El navegador SOLO muestra las pantallas: cada paso lo valida
   el servidor (/api/v1/reservas/pagos/...). El monto lo calcula
   el servidor y el número de tarjeta nunca se guarda.

   window.PasarelaSimulada.abrir({
       metodo: 'tarjeta' | 'yape' | 'plin' | 'transferencia' | 'efectivo',
       reserva: { vehiculoId, fechaInicio, fechaFin, conChofer },
       concepto, titular, celular, correo,
       onAprobado: async ({ codigoIntento, metodo, estado, referencia }) => {...},
       onCancelado: () => {...}
   });
   ========================================================= */
(() => {
    'use strict';

    const LOGOS = {
        tarjeta: '/recursos/pagos/visa.jpg',
        yape: '/recursos/pagos/yape.png',
        plin: '/recursos/pagos/plin.jpg',
        transferencia: null,
        efectivo: null
    };
    const TITULOS = {
        tarjeta: 'Tarjeta de crédito / débito',
        yape: 'Yape',
        plin: 'Plin',
        transferencia: 'Transferencia bancaria',
        efectivo: 'Efectivo en oficina'
    };
    const PASOS = {
        tarjeta: ['Datos', 'Autorizando', '3D Secure', 'Resultado'],
        yape: ['QR', 'Constancia', 'Revisión', 'Resultado'],
        plin: ['QR', 'Constancia', 'Revisión', 'Resultado'],
        transferencia: ['Cuentas', 'Constancia', 'Revisión', 'Resultado'],
        efectivo: ['Monto', 'Código', 'Oficina', 'Resultado']
    };
    const BANCOS_PLIN = ['Interbank', 'BBVA', 'Scotiabank', 'BanBif', 'Caja Arequipa', 'Caja Huancayo'];
    const BANCOS_TRANSFERENCIA = ['BCP', 'Interbank', 'BBVA', 'Scotiabank', 'BanBif', 'Banco de la Nación',
        'Banco Pichincha', 'Caja Arequipa', 'Caja Huancayo', 'Caja Piura'];
    // Cuentas de CARMOVO para transferencias. Reemplázalas por las cuentas reales de la empresa.
    const CUENTAS_CARMOVO = [
        { banco: 'BCP', tipo: 'Cuenta corriente en soles', numero: '191-2345678-0-12', cci: '002-191-002345678012-55' },
        { banco: 'Interbank', tipo: 'Cuenta corriente en soles', numero: '200-3001234567', cci: '003-200-003001234567-41' }
    ];
    const TITULAR_CUENTAS = 'CARMOVO RENTAL CARS S.A.C.';
    const MAX_CONSTANCIA = 5 * 1024 * 1024;
    const SEGUNDOS_QR = 300;

    let estado = null;
    let temporizadores = [];

    const $ = (id) => document.getElementById(id);
    const api = () => window.CarmovoClienteApi;

    // ---------------------------------------------------------------- utilidades
    function esc(v) {
        return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function soles(m) {
        return `S/ ${Number(m || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    function esperar(ms) {
        return new Promise(r => { const t = setTimeout(r, ms); temporizadores.push(t); });
    }
    function limpiarTemporizadores() {
        temporizadores.forEach(t => { clearTimeout(t); clearInterval(t); });
        temporizadores = [];
    }
    function enmascararCelular(cel) {
        const d = String(cel || '').replace(/\D/g, '');
        return d.length >= 3 ? `***-***-${d.slice(-3)}` : '***';
    }
    function marcaTarjeta(n) {
        if (/^4/.test(n)) return 'VISA';
        if (/^(5[1-5]|2[2-7])/.test(n)) return 'MASTERCARD';
        if (/^3[47]/.test(n)) return 'AMEX';
        if (/^3(0|6|8)/.test(n)) return 'DINERS';
        return '';
    }
    /** Misma regla del servidor (simulada): BIN con sexto dígito par = crédito. */
    function tipoTarjeta(n) {
        return n.length >= 6 && Number(n[5]) % 2 === 0 ? 'CRÉDITO' : 'DÉBITO';
    }
    function ahoraLocal() {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    }

    /** Llama al servidor y devuelve la respuesta o lanza el error con su mensaje. */
    function servidor(ruta, datos) {
        return api().pasarela(ruta, datos);
    }
    function rutaIntento(accion) {
        return `pagos/intentos/${encodeURIComponent(estado.intento.codigo)}/${accion}`;
    }

    // ---------------------------------------------------------------- estructura
    function pintarPasos(activo) {
        const lista = $('pasarela-pasos');
        if (!lista || !estado) return;
        lista.innerHTML = PASOS[estado.metodo].map((nombre, i) => {
            const clase = i < activo ? 'hecho' : (i === activo ? 'activo' : '');
            return `<li class="${clase}"><span>${i < activo ? '<i class="fa-solid fa-check"></i>' : i + 1}</span>${nombre}</li>`;
        }).join('');
    }

    function cuerpo(html, paso) {
        pintarPasos(paso);
        const c = $('pasarela-cuerpo');
        c.innerHTML = `<div class="pasarela-anim">${html}</div>`;
        return c;
    }

    function error(id, mensaje) {
        const el = $(id);
        if (el) { el.textContent = mensaje || ''; el.classList.toggle('visible', !!mensaje); }
    }

    async function conBoton(boton, texto, accion) {
        const original = boton.innerHTML;
        boton.disabled = true;
        boton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${texto}`;
        try { return await accion(); }
        finally { if (document.body.contains(boton)) { boton.disabled = false; boton.innerHTML = original; } }
    }

    /** Animación de "procesando" mientras el servidor responde. */
    async function procesar(titulo, items, paso, llamada) {
        cuerpo(`
            <div class="pas-centro">
                <div class="pas-spinner"></div>
                <p class="pas-titulo-proceso">${esc(titulo)}</p>
                <div class="pas-progreso"><div id="pas-barra"></div></div>
                <ul class="pas-checklist">${items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
            </div>`, paso);
        const lis = [...document.querySelectorAll('#pasarela-cuerpo .pas-checklist li')];
        const barra = $('pas-barra');
        const peticion = llamada();
        for (let i = 0; i < lis.length; i++) {
            lis[i].classList.add('en-curso');
            await esperar(450 + Math.random() * 250);
            if (!estado) return null;
            lis[i].classList.replace('en-curso', 'hecho');
            if (barra) barra.style.width = `${((i + 1) / lis.length) * 100}%`;
        }
        return peticion;
    }

    function iniciarCuentaRegresiva(idTexto, segundos, alVencer) {
        let restante = segundos;
        const pintar = () => {
            const el = $(idTexto);
            if (el) el.textContent = `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}`;
        };
        pintar();
        const t = setInterval(() => {
            restante -= 1;
            pintar();
            if (restante <= 0) { clearInterval(t); alVencer?.(); }
        }, 1000);
        temporizadores.push(t);
    }

    function crearOtp(contenedor, longitud = 6) {
        contenedor.innerHTML = Array.from({ length: longitud }, (_, i) =>
            `<input type="text" inputmode="numeric" maxlength="1" class="pas-otp-caja" aria-label="Dígito ${i + 1}">`).join('');
        const cajas = [...contenedor.querySelectorAll('input')];
        cajas.forEach((caja, i) => {
            caja.addEventListener('input', () => {
                caja.value = caja.value.replace(/\D/g, '').slice(0, 1);
                if (caja.value && cajas[i + 1]) cajas[i + 1].focus();
            });
            caja.addEventListener('keydown', e => {
                if (e.key === 'Backspace' && !caja.value && cajas[i - 1]) cajas[i - 1].focus();
            });
            caja.addEventListener('paste', e => {
                const texto = (e.clipboardData?.getData('text') || '').replace(/\D/g, '');
                if (!texto) return;
                e.preventDefault();
                cajas.forEach((c, j) => { c.value = texto[j] || ''; });
                cajas[Math.min(texto.length, longitud) - 1]?.focus();
            });
        });
        setTimeout(() => cajas[0]?.focus(), 50);
        return {
            leer: () => cajas.map(c => c.value).join(''),
            limpiar: () => { cajas.forEach(c => { c.value = ''; }); cajas[0]?.focus(); }
        };
    }

    // ---------------------------------------------------------------- resultados
    function pantallaRechazo(motivo, { reintentar = true, paso = 3 } = {}) {
        cuerpo(`
            <div class="pas-centro">
                <div class="pas-icono-resultado rechazo"><i class="fa-solid fa-xmark"></i></div>
                <p class="pas-resultado-titulo">Pago rechazado</p>
                <p class="pas-texto-suave">${esc(motivo)}</p>
                <p class="pas-texto-suave">No se realizó ningún cargo.</p>
                <div class="pas-botones">
                    <button type="button" class="pas-btn pas-btn-sec" id="pas-cambiar">${reintentar ? 'Cambiar método' : 'Cerrar'}</button>
                    ${reintentar ? '<button type="button" class="pas-btn pas-btn-pri" id="pas-reintentar">Intentar de nuevo</button>' : ''}
                </div>
            </div>`, paso);
        $('pas-reintentar')?.addEventListener('click', () => iniciar());
        $('pas-cambiar').addEventListener('click', () => cerrar(true));
    }

    /**
     * Registra la reserva con el intento aprobado/en revisión/pendiente.
     * Solo muestra "éxito" cuando el servidor confirma la reserva.
     */
    async function finalizar(intento, filas, titulo) {
        cuerpo(`
            <div class="pas-centro">
                <div class="pas-spinner"></div>
                <p class="pas-titulo-proceso">Confirmando tu reserva…</p>
                <ul class="pas-checklist">
                    <li class="en-curso">Verificando disponibilidad del vehículo</li>
                    <li>Registrando el pago</li>
                    <li>${intento.estado === 'APROBADO' ? 'Emitiendo comprobante' : 'Guardando tu reserva'}</li>
                </ul>
            </div>`, 3);

        estado.bloqueado = true;
        try {
            await estado.onAprobado?.({
                codigoIntento: intento.codigo,
                metodo: estado.metodo,
                estado: intento.estado,
                referencia: intento.referencia
            });
        } catch (e) {
            estado.bloqueado = false;
            pantallaRechazo(e?.message || 'No se pudo registrar la reserva.', { reintentar: false });
            return;
        }
        estado.bloqueado = false;
        if (!estado) return;

        const icono = intento.estado === 'APROBADO'
            ? '<div class="pas-icono-resultado ok"><i class="fa-solid fa-check"></i></div>'
            : '<div class="pas-icono-resultado espera"><i class="fa-solid fa-hourglass-half"></i></div>';
        const pie = {
            APROBADO: 'Comprobante emitido. Lo encuentras en Mi Cuenta.',
            EN_REVISION: 'Tu pago queda en revisión hasta que caja lo apruebe o lo rechace. Te avisaremos por correo.',
            PENDIENTE: 'Presenta este código en caja para pagar y recibir tu comprobante.'
        }[intento.estado] || '';
        cuerpo(`
            ${icono}
            <p class="pas-resultado-titulo pas-centro-texto">${esc(titulo)}</p>
            <div class="pas-resumen">
                ${filas.map(([k, v]) => `<div class="pas-kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
                <div class="pas-kv"><span>Monto</span><b>${soles(intento.monto)}</b></div>
            </div>
            <p class="pas-emitiendo"><i class="fa-solid fa-circle-info"></i> ${esc(pie)}</p>`, 4);
        await esperar(intento.estado === 'APROBADO' ? 1800 : 2600);
        if (estado) cerrar(false);
    }

    /** Maneja una respuesta "RECHAZADO" / "BLOQUEADO" del servidor. Devuelve true si se manejó. */
    function manejarRechazo(r, idError) {
        if (r.estado === 'BLOQUEADO') {
            pantallaRechazo(r.motivo || 'El pago se bloqueó por demasiados intentos.', { paso: 3 });
            return true;
        }
        if (r.estado === 'RECHAZADO') {
            if (idError && $(idError)) {
                error(idError, `${r.motivo || 'Pago rechazado.'}${r.intentosRestantes ? ` Te quedan ${r.intentosRestantes} intento(s).` : ''}`);
            } else {
                pantallaRechazo(r.motivo || 'Pago rechazado.', { paso: 3 });
            }
            return true;
        }
        return false;
    }

    // ---------------------------------------------------------------- TARJETA
    function pasoTarjeta(mensajeError = '') {
        cuerpo(`
            <div class="pas-tarjeta-visual" id="pas-tv">
                <span class="pas-tv-marca" id="pas-tv-marca"></span>
                <span class="pas-tv-tipo" id="pas-tv-tipo"></span>
                <div class="pas-tv-chip"></div>
                <div class="pas-tv-numero" id="pas-tv-numero">•••• •••• •••• ••••</div>
                <div class="pas-tv-fila"><span id="pas-tv-titular">${esc((estado.titular || 'NOMBRE DEL TITULAR').toUpperCase())}</span><span id="pas-tv-vence">MM/AA</span></div>
            </div>
            <form id="pas-form-tarjeta" novalidate autocomplete="off">
                <label class="pas-campo"><small>Número de tarjeta</small>
                    <input id="pas-num" inputmode="numeric" placeholder="0000 0000 0000 0000" autocomplete="off"></label>
                <label class="pas-campo"><small>Titular</small>
                    <input id="pas-titular" value="${esc(estado.titular || '')}" placeholder="Como figura en la tarjeta"></label>
                <div class="pas-fila">
                    <label class="pas-campo"><small>Vence</small><input id="pas-vence" inputmode="numeric" placeholder="MM/AA" maxlength="5"></label>
                    <label class="pas-campo"><small>CVV</small><input id="pas-cvv" inputmode="numeric" type="password" placeholder="•••" maxlength="4"></label>
                </div>
                <div id="pas-cuotas-caja" hidden>
                    <p class="pas-etiqueta">Pagar en cuotas</p>
                    <div class="pas-cuotas" role="radiogroup">
                        ${[1, 3, 6, 12].map(c => `<label><input type="radio" name="pas-cuotas" value="${c}" ${c === 1 ? 'checked' : ''}><span>${c === 1 ? 'Sin cuotas' : c}</span></label>`).join('')}
                    </div>
                </div>
                <p class="pas-error ${mensajeError ? 'visible' : ''}" id="pas-error-tarjeta">${esc(mensajeError)}</p>
                <button type="submit" class="pas-btn pas-btn-pri pas-btn-bloque">Pagar ${soles(estado.intento.monto)}</button>
                <details class="pas-prueba"><summary>Modo prueba: tarjetas de ejemplo</summary>
                    <ul><li><b>4111 1111 1111 1111</b> aprobada</li><li><b>4000 0000 0000 0002</b> fondos insuficientes</li>
                    <li><b>4000 0000 0000 0069</b> tarjeta bloqueada</li><li><b>4000 0000 0000 0127</b> CVV incorrecto</li>
                    <li><b>4000 0000 0000 3220</b> falla 3D Secure</li><li>Código 3D Secure: <b>123456</b></li></ul></details>
            </form>`, 0);

        const num = $('pas-num'), titular = $('pas-titular'), vence = $('pas-vence'), cvv = $('pas-cvv');
        num.addEventListener('input', () => {
            const digitos = num.value.replace(/\D/g, '');
            const marca = marcaTarjeta(digitos);
            const limite = { AMEX: 15, DINERS: 14 }[marca] || 16;
            const d = digitos.slice(0, limite);
            num.value = d.replace(/(.{4})/g, '$1 ').trim();
            $('pas-tv-numero').textContent = (d + '•'.repeat(Math.max(0, 16 - d.length))).replace(/(.{4})/g, '$1 ').trim();
            $('pas-tv-marca').textContent = marca;
            $('pas-tv').dataset.marca = marca.toLowerCase();
            const tipo = d.length >= 6 ? tipoTarjeta(d) : '';
            $('pas-tv-tipo').textContent = tipo;
            $('pas-cuotas-caja').hidden = tipo !== 'CRÉDITO';
            if (tipo !== 'CRÉDITO') document.querySelector('input[name="pas-cuotas"][value="1"]').checked = true;
        });
        titular.addEventListener('input', () => { $('pas-tv-titular').textContent = (titular.value || 'NOMBRE DEL TITULAR').toUpperCase(); });
        vence.addEventListener('input', () => {
            let d = vence.value.replace(/\D/g, '').slice(0, 4);
            if (d.length >= 3) d = `${d.slice(0, 2)}/${d.slice(2)}`;
            vence.value = d;
            $('pas-tv-vence').textContent = d || 'MM/AA';
        });
        cvv.addEventListener('input', () => { cvv.value = cvv.value.replace(/\D/g, '').slice(0, 4); });
        setTimeout(() => num.focus(), 50);

        $('pas-form-tarjeta').addEventListener('submit', async e => {
            e.preventDefault();
            const numero = num.value.replace(/\D/g, '');
            if (numero.length < 13) return error('pas-error-tarjeta', 'Ingresa el número completo de la tarjeta.');
            if (titular.value.trim().length < 5) return error('pas-error-tarjeta', 'Ingresa el nombre del titular.');
            if (!/^\d{2}\/\d{2}$/.test(vence.value)) return error('pas-error-tarjeta', 'Ingresa el vencimiento como MM/AA.');
            if (!/^\d{3,4}$/.test(cvv.value)) return error('pas-error-tarjeta', 'Ingresa el CVV.');
            const cuotas = document.querySelector('input[name="pas-cuotas"]:checked')?.value || '1';
            try {
                const r = await procesar('Validando con el banco emisor…',
                    ['Verificando datos de la tarjeta', 'Revisión antifraude', 'Autorizando importe'], 1,
                    () => servidor(rutaIntento('tarjeta'), { numero, vence: vence.value, cvv: cvv.value, cuotas }));
                if (!r || !estado) return;
                if (r.estado === 'RECHAZADO') return pasoTarjeta(`${r.motivo}${r.intentosRestantes ? ` Te quedan ${r.intentosRestantes} intento(s).` : ''}`);
                if (manejarRechazo(r)) return;
                estado.intento = { ...estado.intento, ...r };
                paso3ds();
            } catch (err) {
                pantallaRechazo(err.message || 'No se pudo procesar el pago.');
            }
        });
    }

    function paso3ds() {
        cuerpo(`
            <div class="pas-centro">
                <div class="pas-3ds-sello"><i class="fa-solid fa-shield-halved"></i> Verificación 3D Secure</div>
                <p class="pas-texto-suave">Tu banco envió un código de 6 dígitos a tu celular <b>${esc(enmascararCelular(estado.celular))}</b>.</p>
                <p class="pas-texto-suave"><b>${esc(estado.intento.detalle || '')}</b></p>
                <div class="pas-otp" id="pas-otp"></div>
                <p class="pas-ayuda">Código de prueba: <b>123456</b> · Vence en <span id="pas-reenvio">2:00</span></p>
                <p class="pas-error" id="pas-error-otp"></p>
                <button type="button" class="pas-btn pas-btn-pri pas-btn-bloque" id="pas-verificar">Verificar</button>
            </div>`, 2);
        const otp = crearOtp($('pas-otp'));
        iniciarCuentaRegresiva('pas-reenvio', 120, () => pantallaRechazo('El código de verificación venció.'));
        $('pas-verificar').addEventListener('click', async e => {
            const codigo = otp.leer();
            if (codigo.length !== 6) return error('pas-error-otp', 'Completa los 6 dígitos.');
            try {
                const r = await conBoton(e.currentTarget, 'Verificando...', () => servidor(rutaIntento('3ds'), { codigo }));
                if (r.estado === 'RECHAZADO' && r.intentosRestantes > 0 && /incorrecto/i.test(r.motivo || '')) {
                    otp.limpiar();
                    return error('pas-error-otp', `${r.motivo} Te quedan ${r.intentosRestantes} intento(s).`);
                }
                if (manejarRechazo(r)) return;
                limpiarTemporizadores();
                finalizar(r, [['Autorización', r.referencia], ['Tarjeta', r.detalle]], '¡Pago aprobado!');
            } catch (err) {
                pantallaRechazo(err.message || 'No se pudo verificar el pago.');
            }
        });
    }

    // ---------------------------------------------------------------- YAPE / PLIN (QR)
    function bloqueQr(metodo) {
        const qr = metodo === 'yape' ? '/recursos/pagos/QR-YAPE.jpg' : '/recursos/pagos/QR-PLIN3.png';
        return `
            <div class="pas-qr pas-qr-${metodo}" id="pas-qr">
                <img src="${qr}" alt="Código QR de ${TITULOS[metodo]}">
                <strong>${soles(estado.intento.monto)}</strong>
                <span><i class="fa-regular fa-clock"></i> El QR vence en <b id="pas-timer">5:00</b></span>
            </div>`;
    }
    function qrVencido() {
        const qr = $('pas-qr');
        if (!qr) return;
        qr.classList.add('vencido');
        qr.insertAdjacentHTML('beforeend', '<div class="pas-qr-vencido"><p>QR vencido</p><button type="button" class="pas-btn pas-btn-sec" id="pas-qr-nuevo">Generar nuevo</button></div>');
        $('pas-qr-nuevo').addEventListener('click', () => iniciar());
    }

    // ---------------------------------------------------------------- constancia (foto del pago)
    /** Campo para subir la foto, captura o PDF del pago, con vista previa. */
    function campoConstancia() {
        return `
            <div class="pas-constancia" id="pas-constancia">
                <input type="file" id="pas-constancia-archivo" accept="image/jpeg,image/png,image/webp,application/pdf" hidden>
                <label for="pas-constancia-archivo" class="pas-constancia__zona" id="pas-constancia-zona">
                    <i class="fa-solid fa-camera"></i>
                    <span><b>Sube la foto o captura de tu pago</b><small>JPG, PNG, WEBP o PDF · máximo 5 MB · obligatorio</small></span>
                </label>
                <div class="pas-constancia__vista" id="pas-constancia-vista" hidden></div>
            </div>`;
    }

    function prepararConstancia() {
        const input = $('pas-constancia-archivo');
        estado.constancia = { archivo: null, subida: false };
        input.addEventListener('change', () => {
            const archivo = input.files?.[0];
            if (!archivo) return;
            const vista = $('pas-constancia-vista');
            if (archivo.size > MAX_CONSTANCIA) {
                input.value = '';
                return error('pas-error-reporte', 'La foto pesa más de 5 MB. Toma una captura más liviana.');
            }
            if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(archivo.type)) {
                input.value = '';
                return error('pas-error-reporte', 'Sube una imagen JPG, PNG o WEBP, o un PDF.');
            }
            error('pas-error-reporte', '');
            estado.constancia = { archivo, subida: false };
            const quitar = '<button type="button" class="pas-constancia__cambiar" id="pas-constancia-cambiar">Cambiar</button>';
            vista.innerHTML = archivo.type === 'application/pdf'
                ? `<div class="pas-constancia__pdf"><i class="fa-solid fa-file-pdf"></i><span>${esc(archivo.name)}</span></div>${quitar}`
                : `<img src="${URL.createObjectURL(archivo)}" alt="Constancia de pago">${quitar}`;
            vista.hidden = false;
            $('pas-constancia-zona').hidden = true;
            $('pas-constancia-cambiar').addEventListener('click', () => input.click());
        });
    }

    async function subirConstanciaSiFalta() {
        if (!estado.constancia?.archivo) throw new Error('Sube la foto o captura de tu pago para que caja pueda verificarlo.');
        if (estado.constancia.subida) return;
        await api().subirConstancia(estado.intento.codigo, estado.constancia.archivo);
        estado.constancia.subida = true;
    }

    /** Envía la constancia y los datos; el pago queda "En revisión" hasta que caja lo apruebe o rechace. */
    async function enviarReporte(boton, accion, datos, filas) {
        try {
            const r = await conBoton(boton, 'Enviando…', async () => {
                await subirConstanciaSiFalta();
                return servidor(rutaIntento(accion), datos);
            });
            if (!r || !estado) return;
            if (manejarRechazo(r, 'pas-error-reporte')) return;
            finalizar(r, [...filas(r), ['Estado', 'En revisión']], 'Pago enviado · en revisión');
        } catch (err) {
            error('pas-error-reporte', err.message || 'No se pudo enviar el pago.');
        }
    }

    function avisoRevision() {
        return `<p class="pas-ayuda"><i class="fa-solid fa-circle-info"></i> Caja revisará tu pago con la foto que subas.
            Tu reserva quedará <b>en revisión</b> hasta que se apruebe o se rechace; te avisaremos por correo.</p>`;
    }

    // ---------------------------------------------------------------- YAPE
    function pasoYape() {
        const limite = estado.cotizacion?.limiteYape;
        cuerpo(`
            ${bloqueQr('yape')}
            ${limite ? `<p class="pas-ayuda pas-centro-texto">Límite de Yape por operación: ${soles(limite)}</p>` : ''}
            <p class="pas-texto-suave pas-centro-texto">Escanea el QR con tu app Yape y yapea el <b>monto exacto</b>. Luego toma una captura de la constancia.</p>
            <button type="button" class="pas-btn pas-btn-yape pas-btn-bloque" id="pas-yape-pague">Ya yapeé</button>`, 0);
        iniciarCuentaRegresiva('pas-timer', SEGUNDOS_QR, qrVencido);
        $('pas-yape-pague').addEventListener('click', () => { limpiarTemporizadores(); pasoYapeReporte(); });
    }

    function pasoYapeReporte() {
        const cel = String(estado.celular || '').replace(/\D/g, '').slice(-9);
        cuerpo(`
            <p class="pas-subtitulo">Reporta tu yapeo</p>
            ${campoConstancia()}
            <label class="pas-campo"><small>Celular desde el que yapeaste</small>
                <input id="pas-yape-cel" inputmode="numeric" maxlength="11" value="${esc(cel)}" placeholder="9XX XXX XXX"></label>
            <div class="pas-fila">
                <label class="pas-campo"><small>N° de operación</small><input id="pas-op" inputmode="numeric" maxlength="12" placeholder="Ej. 04812093"></label>
                <label class="pas-campo"><small>Fecha y hora</small><input id="pas-fecha" type="datetime-local" value="${ahoraLocal()}" max="${ahoraLocal()}"></label>
            </div>
            ${avisoRevision()}
            <p class="pas-error" id="pas-error-reporte"></p>
            <button type="button" class="pas-btn pas-btn-yape pas-btn-bloque" id="pas-enviar">Enviar para verificación</button>`, 1);
        prepararConstancia();
        $('pas-enviar').addEventListener('click', e => {
            const celular = $('pas-yape-cel').value.replace(/\D/g, '');
            const operacion = $('pas-op').value.replace(/\D/g, '');
            const fecha = $('pas-fecha').value;
            if (!estado.constancia?.archivo) return error('pas-error-reporte', 'Sube la foto o captura de tu yapeo.');
            if (!/^9\d{8}$/.test(celular)) return error('pas-error-reporte', 'Ingresa un celular de 9 dígitos que empiece con 9.');
            if (operacion.length < 6) return error('pas-error-reporte', 'El N° de operación debe tener entre 6 y 12 dígitos.');
            if (!fecha) return error('pas-error-reporte', 'Indica la fecha y hora del yapeo.');
            enviarReporte(e.currentTarget, 'yape', { celular, operacion, fechaOperacion: `${fecha}:00` },
                r => [['N° operación', r.referencia], ['Celular', enmascararCelular(celular)]]);
        });
    }

    // ---------------------------------------------------------------- PLIN
    function pasoPlin() {
        cuerpo(`
            ${bloqueQr('plin')}
            <p class="pas-texto-suave pas-centro-texto">Escanea el QR desde la app de tu banco con Plin y paga el <b>monto exacto</b>. Luego toma una captura de la constancia.</p>
            <button type="button" class="pas-btn pas-btn-plin pas-btn-bloque" id="pas-plin-pague">Ya realicé el pago</button>`, 0);
        iniciarCuentaRegresiva('pas-timer', SEGUNDOS_QR, qrVencido);
        $('pas-plin-pague').addEventListener('click', () => { limpiarTemporizadores(); pasoPlinOperacion(); });
    }

    function pasoPlinOperacion() {
        cuerpo(`
            <p class="pas-subtitulo">Reporta tu pago Plin</p>
            ${campoConstancia()}
            <label class="pas-campo"><small>Banco desde el que pagaste</small>
                <select id="pas-banco"><option value="">Selecciona</option>${BANCOS_PLIN.map(b => `<option>${b}</option>`).join('')}</select></label>
            <div class="pas-fila">
                <label class="pas-campo"><small>N° de operación</small><input id="pas-op" inputmode="numeric" maxlength="10" placeholder="Ej. 00731562"></label>
                <label class="pas-campo"><small>Fecha y hora</small><input id="pas-fecha" type="datetime-local" value="${ahoraLocal()}" max="${ahoraLocal()}"></label>
            </div>
            ${avisoRevision()}
            <p class="pas-error" id="pas-error-reporte"></p>
            <button type="button" class="pas-btn pas-btn-plin pas-btn-bloque" id="pas-enviar">Enviar para verificación</button>`, 1);
        prepararConstancia();
        $('pas-enviar').addEventListener('click', e => {
            const operacion = $('pas-op').value.replace(/\D/g, '');
            const banco = $('pas-banco').value;
            const fecha = $('pas-fecha').value;
            if (!estado.constancia?.archivo) return error('pas-error-reporte', 'Sube la foto o captura de tu pago Plin.');
            if (!banco) return error('pas-error-reporte', 'Selecciona el banco.');
            if (operacion.length < 6) return error('pas-error-reporte', 'El N° de operación debe tener entre 6 y 10 dígitos.');
            if (!fecha) return error('pas-error-reporte', 'Indica la fecha y hora del pago.');
            enviarReporte(e.currentTarget, 'plin', { operacion, banco, fechaOperacion: `${fecha}:00` },
                r => [['N° operación', r.referencia], ['Banco', banco]]);
        });
    }

    // ---------------------------------------------------------------- TRANSFERENCIA
    function pasoTransferencia() {
        cuerpo(`
            <div class="pas-efectivo__monto"><small>Transfiere el monto exacto</small><strong>${soles(estado.intento.monto)}</strong></div>
            <p class="pas-etiqueta">Cuentas de CARMOVO · titular ${esc(TITULAR_CUENTAS)}</p>
            <div class="pas-cuentas">
                ${CUENTAS_CARMOVO.map(c => `
                    <div class="pas-cuenta">
                        <div class="pas-cuenta__cabecera"><b>${esc(c.banco)}</b><small>${esc(c.tipo)}</small></div>
                        <div class="pas-kv"><span>N° de cuenta</span><b>${esc(c.numero)}</b>
                            <button type="button" class="pas-copiar" data-copiar="${esc(c.numero)}" aria-label="Copiar número de cuenta"><i class="fa-regular fa-copy"></i></button></div>
                        <div class="pas-kv"><span>CCI</span><b>${esc(c.cci)}</b>
                            <button type="button" class="pas-copiar" data-copiar="${esc(c.cci)}" aria-label="Copiar CCI"><i class="fa-regular fa-copy"></i></button></div>
                    </div>`).join('')}
            </div>
            <p class="pas-ayuda">Desde otros bancos usa el CCI. Luego toma una captura o descarga la constancia.</p>
            <button type="button" class="pas-btn pas-btn-pri pas-btn-bloque" id="pas-transf-hecha">Ya transferí</button>`, 0);
        document.querySelectorAll('.pas-copiar').forEach(b => b.addEventListener('click', async () => {
            try { await navigator.clipboard.writeText(b.dataset.copiar); b.innerHTML = '<i class="fa-solid fa-check"></i>'; }
            catch (_) { /* sin portapapeles */ }
        }));
        $('pas-transf-hecha').addEventListener('click', pasoTransferenciaReporte);
    }

    function pasoTransferenciaReporte() {
        cuerpo(`
            <p class="pas-subtitulo">Reporta tu transferencia</p>
            ${campoConstancia()}
            <div class="pas-fila">
                <label class="pas-campo"><small>Banco de origen</small>
                    <select id="pas-banco"><option value="">Selecciona</option>${BANCOS_TRANSFERENCIA.map(b => `<option>${b}</option>`).join('')}</select></label>
                <label class="pas-campo"><small>N° de operación</small><input id="pas-op" inputmode="numeric" maxlength="12" placeholder="Ej. 5839201"></label>
            </div>
            <div class="pas-fila">
                <label class="pas-campo"><small>Titular de la cuenta de origen</small><input id="pas-titular" maxlength="80" value="${esc(estado.titular || '')}"></label>
                <label class="pas-campo"><small>Fecha y hora</small><input id="pas-fecha" type="datetime-local" value="${ahoraLocal()}" max="${ahoraLocal()}"></label>
            </div>
            ${avisoRevision()}
            <p class="pas-error" id="pas-error-reporte"></p>
            <button type="button" class="pas-btn pas-btn-pri pas-btn-bloque" id="pas-enviar">Enviar para verificación</button>`, 1);
        prepararConstancia();
        $('pas-enviar').addEventListener('click', e => {
            const operacion = $('pas-op').value.replace(/\D/g, '');
            const banco = $('pas-banco').value;
            const titular = $('pas-titular').value.trim();
            const fecha = $('pas-fecha').value;
            if (!estado.constancia?.archivo) return error('pas-error-reporte', 'Sube la foto o constancia de tu transferencia.');
            if (!banco) return error('pas-error-reporte', 'Selecciona el banco de origen.');
            if (operacion.length < 6) return error('pas-error-reporte', 'El N° de operación debe tener entre 6 y 12 dígitos.');
            if (titular.length < 3) return error('pas-error-reporte', 'Escribe el nombre del titular de la cuenta de origen.');
            if (!fecha) return error('pas-error-reporte', 'Indica la fecha y hora de la transferencia.');
            enviarReporte(e.currentTarget, 'transferencia', { operacion, banco, titular, fechaOperacion: `${fecha}:00` },
                r => [['N° operación', r.referencia], ['Banco', banco]]);
        });
    }

    // ---------------------------------------------------------------- EFECTIVO
    function pasoEfectivo() {
        const c = estado.cotizacion || {};
        const recojo = estado.reserva?.fechaInicio
            ? new Date(`${estado.reserva.fechaInicio}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
            : 'el día de recojo';
        cuerpo(`
            <div class="pas-efectivo">
                <div class="pas-efectivo__monto"><small>Monto a pagar en caja</small><strong>${soles(estado.intento.monto)}</strong></div>
                <div class="pas-resumen">
                    <div class="pas-kv"><span>Alquiler (${esc(c.dias || '')} ${c.dias === 1 ? 'día' : 'días'})</span><b>${soles(c.tarifaBase)}</b></div>
                    ${Number(c.chofer) > 0 ? `<div class="pas-kv"><span>Servicio con chofer</span><b>${soles(c.chofer)}</b></div>` : ''}
                    <div class="pas-kv"><span>Seguro básico</span><b>${soles(c.seguro)}</b></div>
                    <div class="pas-kv"><span>IGV (18%)</span><b>${soles(c.igv)}</b></div>
                </div>
                <ul class="pas-pasos-efectivo">
                    <li><i class="fa-solid fa-ticket"></i> Te daremos un <b>código de reserva</b>.</li>
                    <li><i class="fa-solid fa-building"></i> Paga en nuestra oficina hasta las <b>12:00 del ${esc(recojo)}</b>.</li>
                    <li><i class="fa-solid fa-receipt"></i> Caja te entrega tu comprobante y el vuelto, si corresponde.</li>
                </ul>
                <p class="pas-ayuda">Si no pagas a tiempo, la reserva se cancela automáticamente y el auto queda libre.</p>
                <button type="button" class="pas-btn pas-btn-pri pas-btn-bloque" id="pas-efectivo-confirmar">Reservar y pagar en oficina</button>
            </div>`, 0);
        $('pas-efectivo-confirmar').addEventListener('click', async e => {
            try {
                const r = await conBoton(e.currentTarget, 'Generando código...', () => servidor(rutaIntento('efectivo'), {}));
                pintarPasos(1);
                finalizar(r, [['Código de reserva', r.referencia], ['Paga hasta', `12:00 · ${recojo}`]], 'Reserva por pagar en caja');
            } catch (err) {
                pantallaRechazo(err.message || 'No se pudo generar el código.');
            }
        });
    }

    // ---------------------------------------------------------------- control
    async function iniciar() {
        limpiarTemporizadores();
        cuerpo(`<div class="pas-centro"><div class="pas-spinner"></div><p class="pas-titulo-proceso">Preparando pago seguro…</p></div>`, 0);
        try {
            const r = await servidor('pagos/intentos', { metodo: estado.metodo, ...estado.reserva });
            if (!estado) return;
            estado.intento = r;
            estado.cotizacion = r.cotizacion || estado.cotizacion;
            $('pasarela-total').textContent = soles(r.monto);
            ({ tarjeta: pasoTarjeta, yape: pasoYape, plin: pasoPlin, transferencia: pasoTransferencia, efectivo: pasoEfectivo })[estado.metodo]();
        } catch (err) {
            pantallaRechazo(err.message || 'No se pudo iniciar el pago.', { reintentar: false, paso: 0 });
        }
    }

    function cerrar(cancelado = true) {
        if (estado?.bloqueado) return;
        limpiarTemporizadores();
        const modal = $('modal-pasarela');
        modal?.classList.remove('activo');
        modal?.classList.add('oculto');
        const callback = cancelado ? estado?.onCancelado : null;
        estado = null;
        document.body.style.overflow = '';
        callback?.();
    }

    function abrir(opciones) {
        const modal = $('modal-pasarela');
        if (!modal || !PASOS[opciones?.metodo]) return;
        if (!api()?.pasarela) { alert('No se pudo cargar el servicio de pagos.'); return; }

        estado = { concepto: 'Alquiler de vehículo', ...opciones, bloqueado: false, intento: null };

        const logo = $('pasarela-logo');
        if (LOGOS[estado.metodo]) {
            logo.src = LOGOS[estado.metodo];
            logo.alt = TITULOS[estado.metodo];
            logo.hidden = false;
            $('pasarela-icono')?.setAttribute('hidden', '');
        } else {
            logo.hidden = true;
            const icono = $('pasarela-icono');
            if (icono) {
                icono.removeAttribute('hidden');
                icono.innerHTML = `<i class="fa-solid ${estado.metodo === 'transferencia' ? 'fa-building-columns' : 'fa-money-bill-wave'}"></i>`;
            }
        }
        $('pasarela-titulo').textContent = TITULOS[estado.metodo];
        $('pasarela-total').textContent = '—';
        modal.dataset.metodo = estado.metodo;
        modal.classList.remove('oculto');
        modal.classList.add('activo');
        document.body.style.overflow = 'hidden';
        iniciar();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const modal = $('modal-pasarela');
        if (!modal) return;
        modal.querySelector('.pasarela-cerrar')?.addEventListener('click', () => cerrar(true));
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && estado) cerrar(true); });
    });

    window.PasarelaSimulada = { abrir, cerrar };
})();
