
(() => {
    'use strict';

    const LOGOS = {
        tarjeta: '/recursos/pagos/visa.jpg',
        paypal: '/recursos/pagos/Pay-Pal.webp',
        yape: '/recursos/pagos/yape.png',
        plin: '/recursos/pagos/plin.jpg'
    };

    const TITULOS = {
        tarjeta: 'Tarjeta de crédito / débito',
        paypal: 'PayPal',
        yape: 'Yape',
        plin: 'Plin'
    };

    const PASOS = {
        tarjeta: ['Datos', 'Validando', '3D Secure', 'Resultado'],
        paypal: ['Cuenta', 'Revisar', 'Procesando', 'Resultado'],
        yape: ['QR', 'Aprobación', 'Validando', 'Resultado'],
        plin: ['QR', 'Operación', 'Validando', 'Resultado']
    };

    const TARJETA_RECHAZO = '4000000000000002';
    const OTP_PRUEBA = '123456';
    const TIPO_CAMBIO = 3.75;
    const SEGUNDOS_QR = 300;

    let estado = null;
    let temporizadores = [];

    const $ = (id) => document.getElementById(id);

    // ---------------------------------------------------------------- utilidades
    function esc(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function soles(monto) {
        return `S/ ${Number(monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function esperar(ms) {
        return new Promise(resolver => {
            const t = setTimeout(resolver, ms);
            temporizadores.push(t);
        });
    }

    function limpiarTemporizadores() {
        temporizadores.forEach(t => { clearTimeout(t); clearInterval(t); });
        temporizadores = [];
    }

    function aleatorio(digitos) {
        let s = '';
        for (let i = 0; i < digitos; i++) s += Math.floor(Math.random() * 10);
        return s;
    }

    function alfanumerico(n) {
        const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let s = '';
        for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)];
        return s;
    }

    function luhn(numero) {
        let suma = 0;
        let doble = false;
        for (let i = numero.length - 1; i >= 0; i--) {
            let d = Number(numero[i]);
            if (doble) { d *= 2; if (d > 9) d -= 9; }
            suma += d;
            doble = !doble;
        }
        return numero.length >= 13 && suma % 10 === 0;
    }

    function marcaTarjeta(numero) {
        if (/^4/.test(numero)) return 'VISA';
        if (/^(5[1-5]|2[2-7])/.test(numero)) return 'MASTERCARD';
        if (/^3[47]/.test(numero)) return 'AMEX';
        if (/^3(0|6|8)/.test(numero)) return 'DINERS';
        return '';
    }

    function enmascararCelular(cel) {
        const d = String(cel || '').replace(/\D/g, '');
        return d.length >= 3 ? `***-***-${d.slice(-3)}` : '***';
    }

    function enmascararCorreo(correo) {
        const [u, dom] = String(correo || '').split('@');
        if (!dom) return '***';
        return `${u.slice(0, 3)}•••@${dom}`;
    }

  
    function pintarPasos(activo) {
        const lista = $('pasarela-pasos');
        if (!lista) return;
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

    function pantallaProceso(titulo, items, paso) {
        const c = cuerpo(`
            <div class="pas-centro">
                <div class="pas-spinner"></div>
                <p class="pas-titulo-proceso">${esc(titulo)}</p>
                <div class="pas-progreso"><div id="pas-barra"></div></div>
                <ul class="pas-checklist">
                    ${items.map(t => `<li>${esc(t)}</li>`).join('')}
                </ul>
            </div>`, paso);
        return c;
    }

    async function animarProceso(titulo, items, paso, msPorItem = 650) {
        pantallaProceso(titulo, items, paso);
        const lis = document.querySelectorAll('#pasarela-cuerpo .pas-checklist li');
        const barra = $('pas-barra');
        for (let i = 0; i < lis.length; i++) {
            lis[i].classList.add('en-curso');
            await esperar(msPorItem + Math.random() * 300);
            if (!estado) return false;
            lis[i].classList.remove('en-curso');
            lis[i].classList.add('hecho');
            if (barra) barra.style.width = `${((i + 1) / lis.length) * 100}%`;
        }
        await esperar(250);
        return Boolean(estado);
    }

    function crearOtp(contenedor, longitud = 6) {
        contenedor.innerHTML = Array.from({ length: longitud }, (_, i) =>
            `<input type="text" inputmode="numeric" maxlength="1" class="pas-otp-caja" aria-label="Dígito ${i + 1}">`
        ).join('');
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
        return () => cajas.map(c => c.value).join('');
    }

    function iniciarCuentaRegresiva(idTexto, segundos, alVencer) {
        let restante = segundos;
        const pintar = () => {
            const el = $(idTexto);
            if (!el) return;
            const m = Math.floor(restante / 60);
            const s = String(restante % 60).padStart(2, '0');
            el.textContent = `${m}:${s}`;
        };
        pintar();
        const t = setInterval(() => {
            restante -= 1;
            pintar();
            if (restante <= 0) {
                clearInterval(t);
                alVencer?.();
            }
        }, 1000);
        temporizadores.push(t);
    }

    function error(id, mensaje) {
        const el = $(id);
        if (el) {
            el.textContent = mensaje;
            el.classList.toggle('visible', Boolean(mensaje));
        }
    }

    function pantallaRechazo(motivo, paso = 3, permitirReintento = true) {
        cuerpo(`
            <div class="pas-centro">
                <div class="pas-icono-resultado rechazo"><i class="fa-solid fa-xmark"></i></div>
                <p class="pas-resultado-titulo">Pago rechazado</p>
                <p class="pas-texto-suave">${esc(motivo)}</p>
                <p class="pas-texto-suave">No se realizó ningún cargo.</p>
                <div class="pas-botones">
                    <button type="button" class="pas-btn pas-btn-sec" id="pas-cambiar">${permitirReintento ? 'Cambiar método' : 'Cerrar'}</button>
                    ${permitirReintento ? '<button type="button" class="pas-btn pas-btn-pri" id="pas-reintentar">Reintentar</button>' : ''}
                </div>
            </div>`, paso);
        $('pas-reintentar')?.addEventListener('click', () => iniciarFlujo());
        $('pas-cambiar').addEventListener('click', () => cerrar(true));
    }

  
    async function pantallaAprobado(resultado, filas, titulo = '¡Pago exitoso!') {
        pantallaProceso('Confirmando tu reserva…', ['Verificando disponibilidad del vehículo', 'Registrando el pago', 'Emitiendo comprobante'], 3);
        const lis = document.querySelectorAll('#pasarela-cuerpo .pas-checklist li');
        lis[0]?.classList.add('en-curso');

        estado.bloqueado = true;
        try {
            await estado.onAprobado?.(resultado);
        } catch (e) {
            estado.bloqueado = false;
            if (!estado) return;
            pantallaRechazo(
                e?.message || 'No se pudo registrar la reserva.',
                3,
                false
            );
            return;
        }
        estado.bloqueado = false;
        if (!estado) return;

        cuerpo(`
            <div class="pas-icono-resultado ok"><i class="fa-solid fa-check"></i></div>
            <p class="pas-resultado-titulo pas-centro-texto">${esc(titulo)}</p>
            <div class="pas-resumen">
                ${filas.map(([k, v]) => `<div class="pas-kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
                <div class="pas-kv"><span>Monto</span><b>${soles(estado.total)}</b></div>
            </div>
            <p class="pas-emitiendo"><i class="fa-solid fa-file-invoice"></i> Comprobante emitido correctamente.</p>
        `, 4);

        await esperar(1800);
        if (estado) cerrar(false);
    }


    function flujoTarjeta() {
        cuerpo(`
            <div class="pas-tarjeta-visual" id="pas-tv">
                <span class="pas-tv-marca" id="pas-tv-marca"></span>
                <div class="pas-tv-chip"></div>
                <div class="pas-tv-numero" id="pas-tv-numero">•••• •••• •••• ••••</div>
                <div class="pas-tv-fila">
                    <span id="pas-tv-titular">${esc((estado.titular || 'NOMBRE DEL TITULAR').toUpperCase())}</span>
                    <span id="pas-tv-vence">MM/AA</span>
                </div>
            </div>
            <form id="pas-form-tarjeta" novalidate autocomplete="off">
                <label class="pas-campo"><small>Número de tarjeta</small>
                    <input id="pas-num" inputmode="numeric" placeholder="0000 0000 0000 0000" maxlength="23"></label>
                <label class="pas-campo"><small>Titular</small>
                    <input id="pas-titular" value="${esc(estado.titular || '')}" placeholder="Como figura en la tarjeta"></label>
                <div class="pas-fila">
                    <label class="pas-campo"><small>Vence</small>
                        <input id="pas-vence" inputmode="numeric" placeholder="MM/AA" maxlength="5"></label>
                    <label class="pas-campo"><small>CVV</small>
                        <input id="pas-cvv" inputmode="numeric" type="password" placeholder="•••" maxlength="4"></label>
                </div>
                <p class="pas-error" id="pas-error-tarjeta"></p>
                <button type="submit" class="pas-btn pas-btn-pri pas-btn-bloque">Pagar ${soles(estado.total)}</button>
                <p class="pas-ayuda">Prueba: <b>4111 1111 1111 1111</b> aprobada · <b>4000 0000 0000 0002</b> rechazada.</p>
            </form>`, 0);

        const num = $('pas-num');
        const titular = $('pas-titular');
        const vence = $('pas-vence');
        const cvv = $('pas-cvv');

        num.addEventListener('input', () => {
            const digitos = num.value.replace(/\D/g, '');
            const limite = { AMEX: 15, DINERS: 14 }[marcaTarjeta(digitos)] || 16;
            const d = digitos.slice(0, limite);
            num.value = d.replace(/(.{4})/g, '$1 ').trim();
            const visible = (d + '•'.repeat(Math.max(0, 16 - d.length))).replace(/(.{4})/g, '$1 ').trim();
            $('pas-tv-numero').textContent = visible;
            const marca = marcaTarjeta(d);
            $('pas-tv-marca').textContent = marca;
            $('pas-tv').dataset.marca = marca.toLowerCase();
        });
        titular.addEventListener('input', () => {
            $('pas-tv-titular').textContent = (titular.value || 'NOMBRE DEL TITULAR').toUpperCase();
        });
        vence.addEventListener('input', () => {
            let d = vence.value.replace(/\D/g, '').slice(0, 4);
            if (d.length >= 3) d = `${d.slice(0, 2)}/${d.slice(2)}`;
            vence.value = d;
            $('pas-tv-vence').textContent = d || 'MM/AA';
        });
        cvv.addEventListener('input', () => { cvv.value = cvv.value.replace(/\D/g, '').slice(0, 4); });

        $('pas-form-tarjeta').addEventListener('submit', async (e) => {
            e.preventDefault();
            const d = num.value.replace(/\D/g, '');
            const marca = marcaTarjeta(d);
            const [mm, aa] = vence.value.split('/').map(Number);
            const hoy = new Date();
            const finMes = new Date(2000 + (aa || 0), mm || 0, 0, 23, 59, 59);

            if (!luhn(d) || !marca) return error('pas-error-tarjeta', 'El número de tarjeta no es válido.');
            if (titular.value.trim().length < 5) return error('pas-error-tarjeta', 'Ingresa el nombre del titular.');
            if (!mm || mm > 12 || !aa || finMes < hoy) return error('pas-error-tarjeta', 'La fecha de vencimiento no es válida.');
            const largoCvv = marca === 'AMEX' ? 4 : 3;
            if (cvv.value.length !== largoCvv) return error('pas-error-tarjeta', `El CVV debe tener ${largoCvv} dígitos.`);
            error('pas-error-tarjeta', '');


            const datos = { marca, ultimos4: d.slice(-4), rechazar: d === TARJETA_RECHAZO };
            const ok = await animarProceso('Validando con el banco emisor…',
                ['Validación Luhn y fecha', 'Tokenizando tarjeta', 'Consultando antifraude', 'Autorizando importe'], 1);
            if (!ok) return;
            if (datos.rechazar) return pantallaRechazo('Fondos insuficientes. Intenta con otra tarjeta.');
            tarjeta3ds(datos);
        });
    }

    function tarjeta3ds(datos) {
        let intentos = 0;
        const celular = enmascararCelular(estado.celular);
        cuerpo(`
            <div class="pas-centro">
                <div class="pas-3ds-sello"><i class="fa-solid fa-shield-halved"></i> Verificación 3D Secure</div>
                <p class="pas-texto-suave">Enviamos un código de 6 dígitos a tu celular <b>${esc(celular)}</b></p>
                <div class="pas-otp" id="pas-otp"></div>
                <p class="pas-ayuda">Código de prueba: <b>${OTP_PRUEBA}</b> · Reenviar en <span id="pas-reenvio">0:59</span></p>
                <p class="pas-error" id="pas-error-otp"></p>
                <button type="button" class="pas-btn pas-btn-pri pas-btn-bloque" id="pas-verificar">Verificar</button>
            </div>`, 2);
        const leer = crearOtp($('pas-otp'));
        iniciarCuentaRegresiva('pas-reenvio', 59, () => {
            const el = $('pas-reenvio');
            if (el) el.textContent = '0:00 (código reenviado)';
        });

        $('pas-verificar').addEventListener('click', async () => {
            const codigo = leer();
            if (codigo.length !== 6) return error('pas-error-otp', 'Completa los 6 dígitos.');
            if (codigo !== OTP_PRUEBA) {
                intentos += 1;
                if (intentos >= 3) return pantallaRechazo('Superaste el número de intentos de verificación.');
                return error('pas-error-otp', `Código incorrecto. Te quedan ${3 - intentos} intento(s).`);
            }
            limpiarTemporizadores();
            const ok = await animarProceso('Confirmando autorización…', ['Código verificado', 'Capturando pago'], 2, 500);
            if (!ok) return;
            const referencia = `AUT-${aleatorio(6)}`;
            pantallaAprobado({
                metodo: 'tarjeta',
                referencia,
                tokenPago: `SIM-TRJ-${Date.now()}`,
                detallePago: `${datos.marca} •••• ${datos.ultimos4}`
            }, [['Autorización', referencia], ['Tarjeta', `${datos.marca} •••• ${datos.ultimos4}`]]);
        });
    }

    function flujoPaypal() {
        cuerpo(`
            <p class="pas-subtitulo">Conecta tu cuenta (simulada)</p>
            <label class="pas-campo"><small>Correo de tu cuenta PayPal</small>
                <input id="pas-pp-correo" type="email" value="${esc(estado.correo || '')}" placeholder="correo@ejemplo.com"></label>
            <label class="pas-campo"><small>Pagar con</small>
                <select id="pas-pp-fondo">
                    <option>Saldo PayPal</option>
                    <option>Tarjeta vinculada •••• 8842</option>
                    <option>Cuenta bancaria vinculada</option>
                </select></label>
            <p class="pas-error" id="pas-error-pp"></p>
            <button type="button" class="pas-btn pas-btn-pri pas-btn-bloque" id="pas-pp-continuar">Continuar</button>
            <p class="pas-ayuda">Ventana de simulación de CARMOVO. No pide contraseña ni envía datos a PayPal.</p>`, 0);

        $('pas-pp-continuar').addEventListener('click', async () => {
            const correo = $('pas-pp-correo').value.trim();
            const fondo = $('pas-pp-fondo').value;
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return error('pas-error-pp', 'Ingresa un correo válido.');
            const ok = await animarProceso('Conectando con tu cuenta…', ['Verificando cuenta'], 0, 700);
            if (!ok) return;
            paypalRevisar(correo, fondo);
        });
    }

    function paypalRevisar(correo, fondo) {
        const usd = estado.total / TIPO_CAMBIO;
        cuerpo(`
            <p class="pas-subtitulo">Revisa tu pago</p>
            <div class="pas-resumen">
                <div class="pas-kv"><span>Comercio</span><b>CARMOVO</b></div>
                <div class="pas-kv"><span>Concepto</span><b>${esc(estado.concepto)}</b></div>
                <div class="pas-kv"><span>Cuenta</span><b>${esc(enmascararCorreo(correo))}</b></div>
                <div class="pas-kv"><span>Pagar con</span><b>${esc(fondo)}</b></div>
                <div class="pas-kv"><span>Tipo de cambio</span><b>S/ ${TIPO_CAMBIO.toFixed(2)} = US$ 1</b></div>
            </div>
            <div class="pas-total-caja"><span>Total</span><b>US$ ${usd.toFixed(2)}<small>${soles(estado.total)}</small></b></div>
            <div class="pas-botones">
                <button type="button" class="pas-btn pas-btn-sec" id="pas-pp-volver">Volver</button>
                <button type="button" class="pas-btn pas-btn-pri" id="pas-pp-pagar">Aceptar y pagar</button>
            </div>`, 1);
        $('pas-pp-volver').addEventListener('click', flujoPaypal);
        $('pas-pp-pagar').addEventListener('click', async () => {
            const ok = await animarProceso('Confirmando con PayPal…',
                ['Autenticando cuenta', 'Reservando fondos', 'Capturando pago'], 2);
            if (!ok) return;
            const referencia = `PAYID-${alfanumerico(5)}`;
            pantallaAprobado({
                metodo: 'paypal',
                referencia,
                tokenPago: `SIM-PP-${Date.now()}`,
                detallePago: `PayPal ${enmascararCorreo(correo)}`
            }, [['ID transacción', referencia], ['Cuenta', enmascararCorreo(correo)]], '¡Pago completado!');
        });
    }


    function bloqueQr(metodo, idTimer) {
        const qr = metodo === 'yape' ? '/recursos/pagos/QR-YAPE.jpg' : '/recursos/pagos/QR-PLIN3.png';
        return `
            <div class="pas-qr pas-qr-${metodo}" id="pas-qr">
                <img src="${qr}" alt="QR ${TITULOS[metodo]}">
                <strong>${soles(estado.total)}</strong>
                <span><i class="fa-regular fa-clock"></i> El QR vence en <b id="${idTimer}">5:00</b></span>
            </div>`;
    }

    function qrVencido() {
        const qr = $('pas-qr');
        if (!qr) return;
        qr.classList.add('vencido');
        qr.insertAdjacentHTML('beforeend',
            '<div class="pas-qr-vencido"><p>QR vencido</p><button type="button" class="pas-btn pas-btn-sec" id="pas-qr-nuevo">Generar nuevo</button></div>');
        $('pas-qr-nuevo').addEventListener('click', () => { limpiarTemporizadores(); iniciarFlujo(); });
    }

    function flujoYape() {
        const cel = String(estado.celular || '').replace(/\D/g, '').slice(-9);
        cuerpo(`
            ${bloqueQr('yape', 'pas-timer')}
            <label class="pas-campo"><small>Celular afiliado a Yape</small>
                <input id="pas-yape-cel" inputmode="numeric" maxlength="11" value="${esc(cel)}" placeholder="9XX XXX XXX"></label>
            <p class="pas-error" id="pas-error-yape"></p>
            <button type="button" class="pas-btn pas-btn-yape pas-btn-bloque" id="pas-yape-continuar">Continuar</button>`, 0);
        iniciarCuentaRegresiva('pas-timer', SEGUNDOS_QR, qrVencido);

        $('pas-yape-continuar').addEventListener('click', () => {
            const celular = $('pas-yape-cel').value.replace(/\D/g, '');
            if (!/^9\d{8}$/.test(celular)) return error('pas-error-yape', 'Ingresa un celular válido de 9 dígitos que empiece con 9.');
            limpiarTemporizadores();
            yapeAprobacion(celular);
        });
    }

    function yapeAprobacion(celular) {
        cuerpo(`
            <div class="pas-centro">
                <p class="pas-texto-suave">Abre tu app Yape, ve a <b>Código de aprobación</b> e ingresa los 6 dígitos.</p>
                <div class="pas-otp" id="pas-otp"></div>
                <p class="pas-ayuda">Simulación: cualquier código de 6 dígitos es válido; <b>000000</b> se rechaza.</p>
                <p class="pas-error" id="pas-error-otp"></p>
                <button type="button" class="pas-btn pas-btn-yape pas-btn-bloque" id="pas-yapear">Yapear ${soles(estado.total)}</button>
            </div>`, 1);
        const leer = crearOtp($('pas-otp'));
        $('pas-yapear').addEventListener('click', async () => {
            const codigo = leer();
            if (codigo.length !== 6) return error('pas-error-otp', 'Completa los 6 dígitos.');
            const ok = await animarProceso('Validando con Yape…', ['Verificando código', 'Debitando monto', 'Confirmando operación'], 2);
            if (!ok) return;
            if (codigo === '000000') return pantallaRechazo('Código de aprobación inválido o vencido.');
            const referencia = aleatorio(8);
            pantallaAprobado({
                metodo: 'yape',
                referencia,
                tokenPago: `SIM-YP-${Date.now()}`,
                detallePago: `celular ${enmascararCelular(celular)}`
            }, [['N° operación', referencia], ['Celular', enmascararCelular(celular)]], '¡Yapeo recibido!');
        });
    }

    function flujoPlin() {
        cuerpo(`
            ${bloqueQr('plin', 'pas-timer')}
            <p class="pas-texto-suave pas-centro-texto">Escanea el QR desde la app de tu banco con Plin y paga el monto exacto.</p>
            <button type="button" class="pas-btn pas-btn-plin pas-btn-bloque" id="pas-plin-pague">Ya realicé el pago</button>`, 0);
        iniciarCuentaRegresiva('pas-timer', SEGUNDOS_QR, qrVencido);
        $('pas-plin-pague').addEventListener('click', () => { limpiarTemporizadores(); plinOperacion(); });
    }

    function plinOperacion() {
        cuerpo(`
            <p class="pas-subtitulo">Datos de la operación</p>
            <label class="pas-campo"><small>N° de operación Plin</small>
                <input id="pas-plin-op" inputmode="numeric" maxlength="10" placeholder="Ej. 00731562"></label>
            <label class="pas-campo"><small>Banco de origen</small>
                <select id="pas-plin-banco">
                    <option>Interbank</option><option>BBVA</option><option>Scotiabank</option>
                    <option>BanBif</option><option>Caja Arequipa</option>
                </select></label>
            <p class="pas-error" id="pas-error-plin"></p>
            <button type="button" class="pas-btn pas-btn-plin pas-btn-bloque" id="pas-plin-validar">Validar pago</button>`, 1);

        $('pas-plin-validar').addEventListener('click', async () => {
            const op = $('pas-plin-op').value.replace(/\D/g, '');
            const banco = $('pas-plin-banco').value;
            if (op.length < 6 || op.length > 10) return error('pas-error-plin', 'El N° de operación debe tener entre 6 y 10 dígitos.');
            const ok = await animarProceso('Validando con Plin…', ['Buscando operación', 'Verificando monto', 'Confirmando con el banco'], 2);
            if (!ok) return;
            if (/^0+$/.test(op)) return pantallaRechazo('No encontramos una operación con ese número.');
            pantallaAprobado({
                metodo: 'plin',
                referencia: op,
                tokenPago: `SIM-PL-${Date.now()}`,
                detallePago: `Plin desde ${banco}`
            }, [['N° operación', op], ['Banco', banco]], '¡Pago recibido!');
        });
    }

    
    function iniciarFlujo() {
        limpiarTemporizadores();
        ({ tarjeta: flujoTarjeta, paypal: flujoPaypal, yape: flujoYape, plin: flujoPlin })[estado.metodo]();
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

        estado = {
            total: 0,
            concepto: 'Alquiler de vehículo',
            ...opciones,
            bloqueado: false
        };

        $('pasarela-logo').src = LOGOS[estado.metodo];
        $('pasarela-logo').alt = TITULOS[estado.metodo];
        $('pasarela-titulo').textContent = TITULOS[estado.metodo];
        $('pasarela-total').textContent = soles(estado.total);
        modal.dataset.metodo = estado.metodo;

        modal.classList.remove('oculto');
        modal.classList.add('activo');
        document.body.style.overflow = 'hidden';
        iniciarFlujo();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const modal = $('modal-pasarela');
        if (!modal) return;
        modal.querySelector('.pasarela-cerrar')?.addEventListener('click', () => cerrar(true));
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && estado) cerrar(true);
        });
    });

    window.PasarelaSimulada = { abrir, cerrar };
})();