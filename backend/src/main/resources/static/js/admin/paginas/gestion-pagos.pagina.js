(function () {
    const $ = selector => document.querySelector(selector);

    let pagos = [];
    let pagoEditandoIdAlquiler = null;

    function normalizar(valor) {
        return String(valor ?? '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function escapar(valor) {
        return String(valor ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function marcarApi(conectada) {
        const estado = $('#estadoApi');
        if (!estado) return;

        estado.classList.toggle('conectado', conectada);
        estado.classList.toggle('desconectado', !conectada);

        const texto = estado.querySelector('span');

        if (texto) {
            texto.textContent = conectada
                ? 'API conectada'
                : 'API desconectada';
        }
    }

    function notificar(mensaje, tipo = 'exito') {
        const caja = $('#notificacionPagoAdmin');
        if (!caja) return;

        caja.textContent = mensaje;
        caja.className = `notificacion-pago-admin ${tipo} visible`;

        clearTimeout(caja._temporizador);

        caja._temporizador = setTimeout(() => {
            caja.classList.remove('visible');
        }, 3200);
    }

    function moneda(valor) {
        const numero = Number(valor ?? 0);

        return `S/ ${Number.isFinite(numero)
            ? numero.toFixed(2)
            : '0.00'}`;
    }

    function fechaHora(valor) {
        if (!valor) return '\u2014';

        const fecha = new Date(valor);

        if (Number.isNaN(fecha.getTime())) {
            return '\u2014';
        }

        return new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(fecha);
    }

    function claseEstadoPago(estado) {
        const valor = normalizar(estado);

        if (valor === 'en revision') return 'en-revision';
        if (valor === 'pagado') return 'pagado';
        if (valor === 'rechazado') return 'rechazado';
        if (valor === 'expirado' || valor === 'anulado') return 'expirado';
        if (valor === 'reembolso pendiente') return 'reembolso';
        if (valor === 'reembolsado') return 'reembolsado';

        return 'pendiente';
    }

    function obtenerFiltrados() {
        const busqueda = normalizar($('#buscarPago').value);
        const estado = normalizar($('#filtroEstadoPago').value);
        const metodo = normalizar($('#filtroMetodoPago').value);
        const comprobante = $('#filtroComprobante')?.value || '';

        return pagos.filter(pago => {
            const metodoReal = pago.metodoPago || 'Sin especificar';

            const coincideBusqueda = !busqueda || [
                pago.idAlquiler,
                pago.cliente,
                pago.correoCliente,
                pago.vehiculo,
                metodoReal,
                pago.referencia,
                pago.numeroComprobante,
                pago.ruc,
                pago.razonSocial
            ].some(valor => normalizar(valor).includes(busqueda));

            const tipo = pago.numeroComprobante ? (pago.tipoComprobante || 'BOLETA') : 'SIN';
            const coincideComprobante = !comprobante || tipo === comprobante;

            const coincideEstado = !estado ||
                normalizar(pago.estadoPago) === estado;

            const coincideMetodo = !metodo ||
                normalizar(metodoReal) === metodo;

            return coincideBusqueda && coincideEstado && coincideMetodo && coincideComprobante;
        });
    }

    function renderizarResumen() {
        const pendientes = pagos.filter(
            item => normalizar(item.estadoPago) === 'pendiente'
        ).length;

        const revision = pagos.filter(
            item => normalizar(item.estadoPago) === 'en revision'
        ).length;

        const pagados = pagos.filter(
            item => normalizar(item.estadoPago) === 'pagado'
        );

        const ingresos = pagados.reduce(
            (total, item) => total + Number(item.monto || 0),
            0
        );

        $('#resumenPagosTotal').textContent = pagos.length;
        $('#resumenPagosPendientes').textContent = pendientes;
        $('#resumenPagosRevision').textContent = revision;
        $('#resumenPagosPagados').textContent = pagados.length;
        $('#resumenIngresos').textContent = moneda(ingresos);
    }

    /** Botones de caja según el estado del pago. */
    function botonesCajero(pago) {
        const id = escapar(pago.idAlquiler);
        const boton = (accion, icono, titulo, clase = '') => `
            <button class="boton-pago-icono ${clase}" type="button" data-accion="${accion}" data-id-alquiler="${id}"
                    title="${titulo}" aria-label="${titulo}"><i class="fa-solid ${icono}"></i></button>`;
        const estado = pago.estadoPago || '';
        const metodo = normalizar(pago.metodoPago);
        let html = '';
        if (estado === 'En revisión') {
            html += `<button class="boton-verificar-pago" type="button" data-accion="verificar" data-id-alquiler="${id}"
                        title="Revisar el pago y aprobar o rechazar"><i class="fa-solid fa-magnifying-glass-dollar"></i> Verificar</button>`;
        }
        if (estado === 'Pendiente' && metodo === 'efectivo') {
            html += boton('cobrar-efectivo', 'fa-money-bill-wave', 'Cobrar en efectivo', 'aprobar');
            html += boton('rechazar', 'fa-xmark', 'Anular reserva', 'rechazar');
        }
        if (estado === 'Reembolso pendiente') {
            html += boton('reembolsar', 'fa-rotate-left', 'Registrar reembolso', 'reembolsar');
        }
        if (Number(pago.cargosPendientes || 0) > 0) {
            html += boton('cobrar-cargos', 'fa-file-invoice-dollar', `Cobrar cargos adicionales (${moneda(pago.cargosPendientes)})`, 'cargos');
        }
        if (estado !== 'En revisión') {
            html += boton('detalle', 'fa-receipt', 'Ver detalle de la operación', 'detalle');
        }
        return html;
    }

    function renderizarTabla() {
        const cuerpo = $('#tablaPagos');
        const filtrados = obtenerFiltrados();

        $('#cantidadPagos').textContent =
            `${filtrados.length} resultado${filtrados.length === 1 ? '' : 's'}`;

        if (!filtrados.length) {
            cuerpo.innerHTML = `
                <tr>
                    <td colspan="10" class="estado-vacio">
                        No se encontraron pagos con los filtros seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        cuerpo.innerHTML = filtrados.map(pago => {
            const metodo = pago.metodoPago || 'Sin especificar';
            const estadoPago = pago.estadoPago || 'Pendiente';
            const clasePago = claseEstadoPago(estadoPago);

            return `
                <tr>
                    <td>#${escapar(pago.idAlquiler)}</td>

                    <td>
                        <div class="pago-cliente">
                            <strong>
                                ${escapar(pago.cliente || 'Sin cliente')}
                            </strong>
                            <small>
                                ${escapar(pago.correoCliente || '\u2014')}
                            </small>
                        </div>
                    </td>

                    <td>
                        <div class="pago-vehiculo">
                            <strong>
                                ${escapar(pago.vehiculo || 'Sin veh\u00edculo')}
                            </strong>
                            <small>
                                ID veh\u00edculo #${escapar(pago.idVehiculo || '\u2014')}
                            </small>
                        </div>
                    </td>

                    <td>
                        ${escapar(metodo)}
                        ${pago.referencia ? `<small class="pago-referencia">${escapar({ Tarjeta: 'Aut. ', Efectivo: 'Cód. ' }[pago.metodoPago] ?? 'Op. ')}${escapar(pago.referencia)}</small>` : ''}
                        ${pago.detalle ? `<small class="pago-referencia">${escapar(pago.detalle)}</small>` : ''}
                    </td>

                    <td>
                        <span class="pago-monto">
                            ${escapar(moneda(pago.monto))}
                        </span>
                        ${Number(pago.cargosPendientes || 0) > 0 ? `<small class="pago-cargos">+ ${escapar(moneda(pago.cargosPendientes))} en cargos</small>` : ''}
                        ${pago.vuelto != null && pago.montoRecibido ? `<small class="pago-referencia">Recibido ${escapar(moneda(pago.montoRecibido))} · vuelto ${escapar(moneda(pago.vuelto))}</small>` : ''}
                    </td>

                    <td>
                        <span class="badge-alquiler-pago">
                            ${escapar(pago.estadoAlquiler || '\u2014')}
                        </span>
                    </td>

                    <td>
                        <span class="badge-pago ${clasePago}">
                            ${escapar(estadoPago)}
                        </span>
                    </td>

                    <td>
                        <span class="pago-fecha ${pago.fechaPago ? '' : 'pago-sin-dato'}">
                            ${escapar(fechaHora(pago.fechaPago))}
                        </span>
                    </td>

                    <td>
                        ${pago.numeroComprobante ? `
                            <div class="pago-comprobante">
                                <strong>${escapar(pago.numeroComprobante)}</strong>
                                <div class="acciones-pago">
                                    <button class="boton-pago-icono" type="button"
                                        data-accion="ver-comprobante"
                                        data-id-alquiler="${escapar(pago.idAlquiler)}"
                                        title="Ver comprobante" aria-label="Ver comprobante">
                                        <i class="fa-solid fa-eye"></i>
                                    </button>
                                    <button class="boton-pago-icono descargar" type="button"
                                        data-accion="descargar-comprobante"
                                        data-id-alquiler="${escapar(pago.idAlquiler)}"
                                        title="Descargar PDF" aria-label="Descargar PDF">
                                        <i class="fa-solid fa-download"></i>
                                    </button>
                                </div>
                            </div>
                        ` : `<span class="pago-sin-dato">${estadoPago === 'Rechazado' ? 'No emitido (pago rechazado)' : 'No emitido'}</span>`}
                    </td>

                    <td>
                        <div class="acciones-pago">
                            ${botonesCajero(pago)}
                            <button
                                class="boton-pago-icono editar"
                                type="button"
                                data-accion="editar"
                                data-id-alquiler="${escapar(pago.idAlquiler)}"
                                title="Editar pago manualmente"
                                aria-label="Editar pago manualmente"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ================================================================ acciones de caja

    /** Ventana simple (sin bordes) para confirmar acciones de caja. Devuelve los datos o null. */
    function ventanaCaja({ titulo, texto, campo, confirmar, peligro = false, alCambiar }) {
        return new Promise(resolver => {
            const fondo = document.createElement('div');
            fondo.className = 'caja-modal';
            fondo.innerHTML = `
                <div class="caja-modal__caja" role="dialog" aria-modal="true" aria-labelledby="caja-titulo">
                    <h3 id="caja-titulo">${escapar(titulo)}</h3>
                    <div class="caja-modal__texto">${texto}</div>
                    ${campo ? `<label class="caja-modal__campo">${escapar(campo.etiqueta)}
                        ${campo.tipo === 'textarea'
                            ? `<textarea id="caja-valor" rows="3" maxlength="255" placeholder="${escapar(campo.placeholder || '')}"></textarea>`
                            : `<input id="caja-valor" type="${campo.tipo}" step="0.10" min="0" inputmode="decimal" value="${escapar(campo.valor || '')}">`}
                    </label>` : ''}
                    <p class="caja-modal__info" id="caja-info"></p>
                    <p class="caja-modal__error" id="caja-error" hidden></p>
                    <div class="caja-modal__acciones">
                        <button type="button" class="caja-btn caja-btn--suave" data-r="no">Cancelar</button>
                        <button type="button" class="caja-btn ${peligro ? 'caja-btn--peligro' : 'caja-btn--ok'}" data-r="si">${escapar(confirmar)}</button>
                    </div>
                </div>`;
            document.body.appendChild(fondo);
            const valor = fondo.querySelector('#caja-valor');
            const info = fondo.querySelector('#caja-info');
            const errorCaja = fondo.querySelector('#caja-error');
            const actualizar = () => { if (alCambiar) info.innerHTML = alCambiar(valor?.value || ''); };
            valor?.addEventListener('input', actualizar);
            actualizar();
            setTimeout(() => (valor || fondo.querySelector('[data-r="si"]')).focus(), 30);
            const terminar = r => { fondo.remove(); resolver(r); };
            fondo.addEventListener('click', e => {
                if (e.target === fondo || e.target.dataset.r === 'no') return terminar(null);
                if (e.target.dataset.r === 'si') {
                    if (campo?.requerido && !(valor.value || '').trim()) {
                        errorCaja.textContent = campo.mensajeRequerido || 'Completa el campo.';
                        errorCaja.hidden = false;
                        return;
                    }
                    if (campo?.validar) {
                        const problema = campo.validar(valor.value);
                        if (problema) { errorCaja.textContent = problema; errorCaja.hidden = false; return; }
                    }
                    terminar({ valor: valor ? valor.value.trim() : true });
                }
            });
            fondo.addEventListener('keydown', e => { if (e.key === 'Escape') terminar(null); });
        });
    }

    // ================================================================ verificación de Yape, Plin y transferencia

    const MOTIVOS_RECHAZO = [
        'El pago no llegó a la cuenta de CARMOVO.',
        'El monto recibido no coincide con el total.',
        'La foto no se ve bien o no es una constancia válida.',
        'El N° de operación no coincide con la constancia.',
        'La fecha de la operación no coincide.'
    ];

    function nombreMetodo(metodo) {
        return ({ yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia bancaria', tarjeta: 'Tarjeta', efectivo: 'Efectivo' })[normalizar(metodo)] || metodo || '—';
    }

    function fechaCorta(valor) {
        if (!valor) return '—';
        const [a, m, d] = String(valor).slice(0, 10).split('-');
        return `${d}/${m}/${a}`;
    }

    /** Ventana para revisar todos los datos de la operación y la constancia, y aprobar o rechazar con motivo. */
    async function verificarPago(pago, soloLectura = false) {
        const total = Number(pago.monto || 0);
        const reportado = Number(pago.montoPagado || pago.monto || 0);
        const coincide = Math.abs(total - reportado) < 0.005;
        const fila = (k, v, destacado = false) => `<div class="vp-dato ${destacado ? 'vp-dato--fuerte' : ''}"><span>${escapar(k)}</span><b>${v}</b></div>`;
        const fondo = document.createElement('div');
        fondo.className = 'caja-modal';
        fondo.innerHTML = `
            <div class="caja-modal__caja vp" role="dialog" aria-modal="true" aria-labelledby="vp-titulo">
                <div class="vp-cabecera">
                    <div>
                        <h3 id="vp-titulo">${soloLectura ? 'Detalle del pago' : 'Verificar pago'} · ${escapar(nombreMetodo(pago.metodoPago))}</h3>
                        <p>Alquiler #${escapar(pago.idAlquiler)} · registrado el ${escapar(fechaHora(pago.fechaRegistro))}</p>
                    </div>
                    <button type="button" class="vp-cerrar" data-vp="cerrar" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="vp-cuerpo">
                    <div class="vp-constancia" id="vp-constancia"><div class="vp-cargando"><i class="fa-solid fa-spinner fa-spin"></i> Cargando constancia…</div></div>
                    <div class="vp-datos">
                        <h4>Operación</h4>
                        ${fila('Método', escapar(nombreMetodo(pago.metodoPago)))}
                        ${fila('N° de operación', escapar(pago.referencia || '—'), true)}
                        ${fila('Detalle', escapar(pago.detalle || '—'))}
                        ${pago.banco ? fila('Banco', escapar(pago.banco)) : ''}
                        ${fila('Fecha y hora del pago', escapar(fechaHora(pago.fechaOperacion)))}
                        ${fila(soloLectura ? 'Monto' : 'Monto a recibir', `${moneda(total)} ${coincide ? '' : `<em class="vp-alerta">reportado ${moneda(reportado)}</em>`}`, true)}
                        ${soloLectura ? `
                        <h4>Estado</h4>
                        ${fila('Estado del pago', escapar(pago.estadoPago || '—'), true)}
                        ${pago.fechaPago ? fila('Fecha de aprobación', escapar(fechaHora(pago.fechaPago))) : ''}
                        ${pago.validadoPor ? fila('Validado por', escapar(pago.validadoPor)) : ''}
                        ${pago.motivoRechazo ? fila('Motivo del rechazo', escapar(pago.motivoRechazo)) : ''}
                        ${pago.montoRecibido != null ? fila('Recibido / vuelto', `${moneda(pago.montoRecibido)} / ${moneda(pago.vuelto || 0)}`) : ''}
                        ${fila('Comprobante', escapar(pago.numeroComprobante || 'No emitido'))}` : ''}
                        <h4>Reserva</h4>
                        ${fila('Cliente', `${escapar(pago.cliente || '—')}<small>${escapar(pago.correoCliente || '')}</small>`)}
                        ${fila('Vehículo', escapar(pago.vehiculo || '—'))}
                        ${fila('Fechas', `${escapar(fechaCorta(pago.fechaInicio))} al ${escapar(fechaCorta(pago.fechaFin))}${pago.conChofer ? ' · con chofer' : ''}`)}
                        ${pago.lugarRecogida ? fila('Recojo', escapar(pago.lugarRecogida)) : ''}
                        ${fila('Comprobante pedido', escapar(pago.tipoComprobante === 'FACTURA' ? `Factura · RUC ${pago.ruc || ''}` : 'Boleta'))}
                        <ul class="vp-checklist" ${soloLectura ? 'hidden' : ''}>
                            <li><i class="fa-regular fa-square-check"></i> El dinero aparece en la cuenta o app de CARMOVO.</li>
                            <li><i class="fa-regular fa-square-check"></i> El monto, el N° de operación y la fecha coinciden con la foto.</li>
                        </ul>
                    </div>
                </div>
                <div class="vp-rechazo" id="vp-rechazo" hidden>
                    <label class="caja-modal__campo">Motivo del rechazo (el cliente lo recibirá por correo)
                        <textarea id="vp-motivo" rows="2" maxlength="255" placeholder="Escribe o elige un motivo"></textarea></label>
                    <div class="vp-motivos">${MOTIVOS_RECHAZO.map(m => `<button type="button" data-motivo="${escapar(m)}">${escapar(m)}</button>`).join('')}</div>
                </div>
                <p class="caja-modal__error" id="vp-error" hidden></p>
                <div class="caja-modal__acciones">
                    <button type="button" class="caja-btn caja-btn--suave" data-vp="cerrar">Cerrar</button>
                    ${soloLectura ? '' : `<button type="button" class="caja-btn caja-btn--peligro" data-vp="rechazar"><i class="fa-solid fa-xmark"></i> Rechazar</button>
                    <button type="button" class="caja-btn caja-btn--ok" data-vp="aprobar"><i class="fa-solid fa-check"></i> Aprobar y emitir comprobante</button>`}
                </div>
            </div>`;
        document.body.appendChild(fondo);
        let urlConstancia = null;
        const cerrar = () => { if (urlConstancia) URL.revokeObjectURL(urlConstancia); fondo.remove(); };
        const mostrarError = texto => { const e = fondo.querySelector('#vp-error'); e.textContent = texto; e.hidden = !texto; };

        const esTarjeta = normalizar(pago.metodoPago) === 'tarjeta';
        const esEfectivo = normalizar(pago.metodoPago) === 'efectivo';
        if (esEfectivo) {
            fondo.querySelector('#vp-constancia').innerHTML = `
                <div class="vp-tarjeta vp-tarjeta--efectivo">
                    <i class="fa-solid fa-money-bill-wave"></i>
                    <b>Pago en efectivo en oficina</b>
                    <span>Código de pago: <strong>${escapar(pago.referencia || '—')}</strong></span>
                    ${pago.montoRecibido != null ? `<span>Recibido ${moneda(pago.montoRecibido)} · vuelto ${moneda(pago.vuelto || 0)}</span>` : '<span>Aún no se cobra en caja.</span>'}
                </div>`;
        } else if (esTarjeta) {
            fondo.querySelector('#vp-constancia').innerHTML = `
                <div class="vp-tarjeta">
                    <i class="fa-regular fa-credit-card"></i>
                    <b>Cargo autorizado por la pasarela</b>
                    <span>${escapar(pago.detalle || 'Tarjeta')}</span>
                    <span>Código de autorización: <strong>${escapar(pago.referencia || '—')}</strong></span>
                    <small>Los pagos con tarjeta no llevan foto: revisa la autorización en el reporte de tu pasarela o banco.</small>
                </div>`;
            fondo.querySelector('.vp-checklist').innerHTML = `
                <li><i class="fa-regular fa-square-check"></i> El cargo aparece en el reporte de la pasarela o del banco.</li>
                <li><i class="fa-regular fa-square-check"></i> El monto y el código de autorización coinciden.</li>`;
        } else try {
            const c = await window.CarmovoAdminApi.constanciaPago(pago.idAlquiler);
            const caja = fondo.querySelector('#vp-constancia');
            if (!c) {
                caja.innerHTML = '<div class="vp-sin-constancia"><i class="fa-regular fa-image"></i><p>Este pago no tiene foto de constancia.</p></div>';
            } else {
                urlConstancia = c.url;
                caja.innerHTML = c.tipo.includes('pdf')
                    ? `<iframe src="${c.url}" title="Constancia del pago"></iframe><a class="vp-abrir" href="${c.url}" target="_blank" rel="noopener"><i class="fa-solid fa-up-right-from-square"></i> Abrir PDF</a>`
                    : `<a href="${c.url}" target="_blank" rel="noopener" title="Abrir en tamaño completo"><img src="${c.url}" alt="Constancia del pago"></a>
                       <a class="vp-abrir" href="${c.url}" target="_blank" rel="noopener"><i class="fa-solid fa-magnifying-glass-plus"></i> Ver en grande</a>`;
            }
        } catch (error) {
            fondo.querySelector('#vp-constancia').innerHTML = `<div class="vp-sin-constancia"><p>${escapar(error.message)}</p></div>`;
        }

        fondo.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
        fondo.addEventListener('click', async e => {
            if (e.target === fondo) return cerrar();
            const motivo = e.target.closest('[data-motivo]');
            if (motivo) { fondo.querySelector('#vp-motivo').value = motivo.dataset.motivo; return; }
            const accion = e.target.closest('[data-vp]')?.dataset.vp;
            if (!accion) return;
            if (accion === 'cerrar') return cerrar();
            const rechazo = fondo.querySelector('#vp-rechazo');
            if (accion === 'rechazar' && rechazo.hidden) {
                rechazo.hidden = false;
                fondo.querySelector('[data-vp="aprobar"]').hidden = true;
                fondo.querySelector('#vp-motivo').focus();
                return;
            }
            const motivoTexto = fondo.querySelector('#vp-motivo').value.trim();
            if (accion === 'rechazar' && motivoTexto.length < 5) return mostrarError('Escribe o elige el motivo del rechazo.');
            const botones = fondo.querySelectorAll('.caja-modal__acciones button');
            botones.forEach(b => { b.disabled = true; });
            try {
                if (accion === 'aprobar') await window.CarmovoAdminApi.accionPago(pago.idAlquiler, 'aprobar');
                else await window.CarmovoAdminApi.accionPago(pago.idAlquiler, 'rechazar', { motivo: motivoTexto });
                cerrar();
                notificar(accion === 'aprobar'
                    ? 'Pago aprobado. La reserva quedó confirmada, se emitió el comprobante y se avisó al cliente.'
                    : 'Pago rechazado. La reserva se canceló y el cliente recibió el motivo por correo.');
                await cargarPagos();
            } catch (error) {
                botones.forEach(b => { b.disabled = false; });
                mostrarError(error?.message || 'No se pudo guardar la decisión.');
            }
        });
    }

    async function accionCaja(accion, pago) {
        if (accion === 'verificar') return verificarPago(pago);
        if (accion === 'detalle') return verificarPago(pago, true);
        const etiqueta = `alquiler #${pago.idAlquiler} · ${pago.cliente}`;
        const total = Number(pago.montoPagado || pago.monto || 0);
        let respuesta = null;
        let peticion = null;

        const metodoTexto = ({ yape: 'Yape', plin: 'Plin', tarjeta: 'Tarjeta', efectivo: 'Efectivo' })[String(pago.metodoPago || '').toLowerCase()] || pago.metodoPago || '';
        if (accion === 'aprobar') {
            respuesta = await ventanaCaja({
                titulo: `Verificar pago ${escapar(metodoTexto)}`.trim(),
                texto: `<p>Revisa en la app ${escapar(metodoTexto)} de CARMOVO que llegó la operación <b>${escapar(pago.referencia || '—')}</b>
                    (${escapar(pago.detalle || pago.banco || '—')}) por <b>${moneda(total)}</b>.</p>
                    <p>Si llegó, apruébalo: se confirmará la reserva, se emitirá el comprobante y se avisará al cliente.
                    Si no llegó o el monto no coincide, ciérralo y usa <b>Rechazar pago</b> indicando el motivo.</p>`,
                confirmar: 'Aprobar y emitir comprobante'
            });
            peticion = () => window.CarmovoAdminApi.accionPago(pago.idAlquiler, 'aprobar');
        }
        if (accion === 'rechazar') {
            respuesta = await ventanaCaja({
                titulo: 'Rechazar pago',
                texto: `<p>La reserva del ${escapar(etiqueta)} se cancelará y el vehículo quedará libre. El cliente recibirá un correo con el motivo.</p>`,
                campo: { etiqueta: 'Motivo del rechazo', tipo: 'textarea', requerido: true, placeholder: 'Ej. El yapeo no llegó a la cuenta de CARMOVO / El monto recibido no coincide.', mensajeRequerido: 'Indica el motivo.' },
                confirmar: 'Rechazar pago',
                peligro: true
            });
            if (respuesta) peticion = () => window.CarmovoAdminApi.accionPago(pago.idAlquiler, 'rechazar', { motivo: respuesta.valor });
        }
        if (accion === 'cobrar-efectivo') {
            respuesta = await ventanaCaja({
                titulo: 'Cobro en efectivo',
                texto: `<p>${escapar(etiqueta)} · código <b>${escapar(pago.referencia || '—')}</b></p><p class="caja-monto">Total a cobrar: <b>${moneda(total)}</b></p>`,
                campo: {
                    etiqueta: 'Monto recibido (S/)', tipo: 'number', valor: total.toFixed(2), requerido: true,
                    validar: v => Number(v) >= total ? null : `El monto recibido debe ser al menos ${moneda(total)}.`
                },
                alCambiar: v => Number(v) >= total
                    ? `Vuelto a entregar: <b>${moneda(Number(v) - total)}</b>`
                    : `Faltan <b>${moneda(total - Number(v || 0))}</b>`,
                confirmar: 'Registrar cobro y emitir comprobante'
            });
            if (respuesta) peticion = () => window.CarmovoAdminApi.accionPago(pago.idAlquiler, 'efectivo', { montoRecibido: respuesta.valor });
        }
        if (accion === 'reembolsar') {
            respuesta = await ventanaCaja({
                titulo: 'Registrar reembolso',
                texto: `<p>Confirma que devolviste <b>${moneda(total)}</b> al cliente del ${escapar(etiqueta)} por el mismo medio de pago (${escapar(pago.metodoPago || '—')}).</p><p>El comprobante <b>${escapar(pago.numeroComprobante || '—')}</b> quedará anulado.</p>`,
                confirmar: 'Registrar reembolso',
                peligro: true
            });
            peticion = () => window.CarmovoAdminApi.accionPago(pago.idAlquiler, 'reembolsar');
        }
        if (accion === 'cobrar-cargos') {
            respuesta = await ventanaCaja({
                titulo: 'Cobrar cargos adicionales',
                texto: `<p>${escapar(etiqueta)}</p><p class="caja-monto">Cargos pendientes: <b>${moneda(pago.cargosPendientes)}</b></p><p>Incluye devolución tardía, combustible faltante o daños registrados en la devolución.</p>`,
                confirmar: 'Marcar como cobrados'
            });
            peticion = () => window.CarmovoAdminApi.accionPago(pago.idAlquiler, 'cargos/cobrar', { metodo: 'Efectivo' });
        }

        if (!respuesta || !peticion) return;
        try {
            await peticion();
            notificar({
                aprobar: 'Pago aprobado. Se emitió el comprobante y se avisó al cliente.',
                rechazar: 'Pago rechazado. La reserva se canceló.',
                'cobrar-efectivo': 'Cobro registrado. Se emitió el comprobante.',
                reembolsar: 'Reembolso registrado. El comprobante quedó anulado.',
                'cobrar-cargos': 'Cargos adicionales cobrados.'
            }[accion]);
            await cargarPagos();
        } catch (error) {
            notificar(error.message || 'No se pudo completar la acción.', 'error');
        }
    }

    async function cargarPagos() {
        const cuerpo = $('#tablaPagos');

        cuerpo.innerHTML = `
            <tr>
                <td colspan="10" class="estado-vacio">
                    Cargando pagos...
                </td>
            </tr>
        `;

        try {
            pagos = await window.CarmovoAdminApi.listarPagos();

            marcarApi(true);
            renderizarResumen();
            renderizarTabla();

        } catch (error) {
            console.error(error);
            marcarApi(false);

            cuerpo.innerHTML = `
                <tr>
                    <td colspan="10" class="estado-vacio">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        No se pudo cargar Pagos e ingresos.
                        Verifica que Spring Boot est\u00e9 ejecut\u00e1ndose
                        y que la tabla de pagos exista en MySQL.
                    </td>
                </tr>
            `;

            notificar(
                error.message || 'No se pudo conectar con el backend.',
                'error'
            );
        }
    }

    function abrirModal(pago) {
        if (!pago) return;

        pagoEditandoIdAlquiler = pago.idAlquiler;

        $('#tituloModalPagoAdmin').textContent =
            `Pago del alquiler #${pago.idAlquiler}`;

        $('#pagoEstado').value = pago.estadoPago || 'Pendiente';
        $('#pagoReferencia').value = pago.referencia || '';
        $('#pagoObservaciones').value = pago.observaciones || '';

        $('#resumenPagoModal').innerHTML = `
            <div>
                <span>Cliente</span>
                <strong>
                    ${escapar(pago.cliente || '\u2014')}
                </strong>
            </div>

            <div>
                <span>Veh\u00edculo</span>
                <strong>
                    ${escapar(pago.vehiculo || '\u2014')}
                </strong>
            </div>

            <div>
                <span>M\u00e9todo</span>
                <strong>
                    ${escapar(pago.metodoPago || 'Sin especificar')}
                </strong>
            </div>

            <div>
                <span>Monto</span>
                <strong>
                    ${escapar(moneda(pago.monto))}
                </strong>
            </div>
        `;

        $('#modalPagoAdmin').classList.add('abierto');
        document.body.style.overflow = 'hidden';

        setTimeout(() => $('#pagoEstado').focus(), 50);
    }

    function cerrarModal() {
        $('#modalPagoAdmin').classList.remove('abierto');
        document.body.style.overflow = '';

        $('#formPagoAdmin').reset();
        $('#resumenPagoModal').innerHTML = '';

        pagoEditandoIdAlquiler = null;
    }

    async function guardarPago(evento) {
        evento.preventDefault();

        if (!pagoEditandoIdAlquiler) return;

        const datos = {
            estado: $('#pagoEstado').value,
            referencia: $('#pagoReferencia').value.trim() || null,
            observaciones: $('#pagoObservaciones').value.trim() || null
        };

        const boton = $('#btnGuardarPago');
        const contenidoOriginal = boton.innerHTML;

        boton.disabled = true;
        boton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        try {
            await window.CarmovoAdminApi.actualizarPago(
                pagoEditandoIdAlquiler,
                datos
            );

            notificar('Estado de pago actualizado correctamente.');

            cerrarModal();
            await cargarPagos();

        } catch (error) {
            console.error(error);

            notificar(
                error.message || 'No se pudo actualizar el pago.',
                'error'
            );

        } finally {
            boton.disabled = false;
            boton.innerHTML = contenidoOriginal;
        }
    }

    function prepararEventos() {
        $('#buscarPago').addEventListener('input', renderizarTabla);
        $('#filtroEstadoPago').addEventListener('change', renderizarTabla);
        $('#filtroMetodoPago').addEventListener('change', renderizarTabla);
        $('#btnRecargarPagos').addEventListener('click', cargarPagos);

        $('#btnCerrarModalPago').addEventListener('click', cerrarModal);
        $('#btnCancelarPago').addEventListener('click', cerrarModal);
        $('#formPagoAdmin').addEventListener('submit', guardarPago);

        $('#modalPagoAdmin').addEventListener('click', evento => {
            if (evento.target.id === 'modalPagoAdmin') {
                cerrarModal();
            }
        });

        $('#filtroComprobante')?.addEventListener('change', renderizarTabla);

        $('#tablaPagos').addEventListener('click', async evento => {
            const botonCaja = evento.target.closest(
                '[data-accion="verificar"], [data-accion="aprobar"], [data-accion="rechazar"], [data-accion="cobrar-efectivo"], [data-accion="reembolsar"], [data-accion="cobrar-cargos"], [data-accion="detalle"]'
            );
            if (botonCaja) {
                const pago = pagos.find(item => String(item.idAlquiler) === String(botonCaja.dataset.idAlquiler));
                if (pago) await accionCaja(botonCaja.dataset.accion, pago);
                return;
            }

            const botonComprobante = evento.target.closest(
                '[data-accion="ver-comprobante"], [data-accion="descargar-comprobante"]'
            );
            if (botonComprobante) {
                const icono = botonComprobante.querySelector('i');
                const claseOriginal = icono?.className;
                botonComprobante.disabled = true;
                if (icono) icono.className = 'fa-solid fa-spinner fa-spin';
                try {
                    const comprobante = await window.CarmovoAdminApi.obtenerComprobante(
                        botonComprobante.dataset.idAlquiler
                    );
                    if (botonComprobante.dataset.accion === 'ver-comprobante') {
                        await window.CarmovoComprobante.previsualizar(comprobante);
                    } else {
                        await window.CarmovoComprobante.descargarPdf(comprobante);
                    }
                } catch (error) {
                    notificar(error?.message || 'No se pudo obtener el comprobante.', 'error');
                } finally {
                    botonComprobante.disabled = false;
                    if (icono) icono.className = claseOriginal;
                }
                return;
            }

            const boton = evento.target.closest('[data-accion="editar"]');
            if (!boton) return;

            const pago = pagos.find(
                item => String(item.idAlquiler) ===
                    String(boton.dataset.idAlquiler)
            );

            abrirModal(pago);
        });

        document.addEventListener('keydown', evento => {
            if (
                evento.key === 'Escape' &&
                $('#modalPagoAdmin').classList.contains('abierto')
            ) {
                cerrarModal();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        prepararEventos();
        cargarPagos();
    });
})();