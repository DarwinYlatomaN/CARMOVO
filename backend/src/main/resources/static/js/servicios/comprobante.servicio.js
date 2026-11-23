/* =========================================================
   CARMOVO - Comprobante de pago (cliente y admin)
   window.CarmovoComprobante.previsualizar(dto)
   window.CarmovoComprobante.descargarPdf(dto)
   window.CarmovoComprobante.imprimir()
   Las librerías (QR y PDF) se cargan solo cuando se necesitan.
   ========================================================= */
(() => {
    'use strict';

    const LIB_QR = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    const LIB_PDF = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    const LOGO = '/recursos/imagenes/home/logo-carmovo-transparente.png';

    const cargados = {};
    function cargarScript(url) {
        if (!cargados[url]) {
            cargados[url] = new Promise((resolver, rechazar) => {
                const s = document.createElement('script');
                s.src = url;
                s.onload = resolver;
                s.onerror = () => { delete cargados[url]; rechazar(new Error('No se pudo cargar ' + url)); };
                document.head.appendChild(s);
            });
        }
        return cargados[url];
    }

    function esc(v) {
        return String(v ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function soles(m) {
        return `S/ ${Number(m || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function fecha(v) {
        if (!v) return '—';
        const [a, m, d] = String(v).slice(0, 10).split('-');
        return d && m && a ? `${d}/${m}/${a}` : String(v);
    }

    function fechaHora(v) {
        if (!v) return '—';
        const f = new Date(v);
        if (Number.isNaN(f.getTime())) return String(v);
        return f.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function etiquetaReferencia(metodo) {
        const m = String(metodo || '').toLowerCase();
        if (m === 'tarjeta') return 'Código de autorización';
        if (m === 'efectivo') return 'Código de reserva';
        if (m === 'paypal') return 'ID de transacción';
        return 'N° de operación';
    }

    function renderizar(c) {
        const dias = Number(c.dias) || 1;
        const factura = c.tipo === 'FACTURA';
        const anulado = c.estado === 'ANULADO';
        const valorUnitario = Number(c.subtotal || 0) / dias;
        const metodo = [c.metodoPago, c.detalleMetodo].filter(Boolean).join(' · ');
        const titulo = factura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';

        const cliente = factura
            ? `<div><span>Razón social</span>${esc(c.nombreCliente || '—')}</div>
               <div><span>RUC</span>${esc(c.documentoCliente || '—')}</div>
               <div class="cmp-ancho"><span>Dirección fiscal</span>${esc(c.direccionCliente || '—')}</div>`
            : `<div><span>Cliente</span>${esc(c.nombreCliente || c.cliente || '—')}</div>
               <div><span>DNI</span>${esc(c.documentoCliente || c.documento || '—')}</div>`;

        const efectivo = c.montoRecibido
            ? `<div><span>Efectivo recibido</span><span>${soles(c.montoRecibido)}</span></div>
               <div><span>Vuelto</span><span>${soles(c.vuelto)}</span></div>`
            : '';

        return `
        <div class="cmp-recibo ${anulado ? 'cmp-anulado' : ''}" id="cmp-recibo">
            ${anulado ? '<div class="cmp-marca-anulado" aria-hidden="true">ANULADO</div>' : ''}
            <div class="cmp-cabecera">
                <div>
                    <img src="${LOGO}" alt="CARMOVO" class="cmp-logo" crossorigin="anonymous">
                    <p class="cmp-empresa">CARMOVO Rental Cars S.A.C. · RUC 20601234565<br>Av. Balta 123, Chiclayo · soporte@carmovo.com</p>
                </div>
                <div class="cmp-caja-numero">
                    <span>RUC 20601234565</span>
                    <span class="cmp-tipo">${titulo}</span>
                    <strong>${esc(c.numero)}</strong>
                    <span>Emisión: ${esc(fechaHora(c.fechaEmision))}</span>
                </div>
            </div>

            <div class="cmp-grilla">
                ${cliente}
                <div><span>Alquiler</span>#${esc(c.idAlquiler)} · ${esc(c.vehiculo || 'Vehículo')}</div>
                <div><span>Método de pago</span>${esc(metodo || '—')}</div>
                <div><span>${etiquetaReferencia(c.metodoPago)}</span>${esc(c.referencia || '—')}</div>
                <div><span>Correo</span>${esc(c.correo || '—')}</div>
            </div>

            <table class="cmp-tabla">
                <thead>
                    <tr><th>Descripción</th><th>Cant.</th><th class="der">${factura ? 'V. unit.' : 'P. unit.'}</th><th class="der">${factura ? 'Valor venta' : 'Importe'}</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Alquiler ${esc(c.vehiculo || 'de vehículo')}
                            <small>${esc(fecha(c.fechaInicio))} – ${esc(fecha(c.fechaFin))} · Recojo: ${esc(c.lugarRecogida || '—')} · Entrega: ${esc(c.lugarEntrega || '—')}</small>
                        </td>
                        <td>${dias}</td>
                        <td class="der">${soles(factura ? valorUnitario : Number(c.total || 0) / dias)}</td>
                        <td class="der">${soles(factura ? c.subtotal : c.total)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="cmp-pie">
                <div class="cmp-verificacion">
                    <div class="cmp-qr" id="cmp-qr"></div>
                    <div>
                        <span class="cmp-sello ${anulado ? 'cmp-sello-anulado' : ''}">${anulado ? 'ANULADO' : 'PAGADO'}</span>
                        <p>Código de verificación<br><b>${esc(c.codigoVerificacion)}</b></p>
                    </div>
                </div>
                <div class="cmp-totales">
                    <div><span>Op. gravada</span><span>${soles(c.subtotal)}</span></div>
                    <div><span>IGV (18%)</span><span>${soles(c.igv)}</span></div>
                    <div class="cmp-total"><span>${factura ? 'Importe total' : 'Total pagado'}</span><span>${soles(c.total)}</span></div>
                    ${efectivo}
                </div>
            </div>
            ${anulado && c.motivoAnulacion ? `<p class="cmp-nota"><b>Motivo de anulación:</b> ${esc(c.motivoAnulacion)}</p>` : ''}
            <p class="cmp-nota">Documento generado en entorno de simulación con fines académicos. No tiene validez tributaria ante SUNAT.</p>
        </div>`;
    }

    async function pintarQr(contenedor, c) {
        if (!contenedor) return;
        try {
            await cargarScript(LIB_QR);
            contenedor.innerHTML = '';
            // eslint-disable-next-line no-undef
            new QRCode(contenedor, {
                text: `${c.numero}|${c.codigoVerificacion}|${Number(c.total || 0).toFixed(2)}`,
                width: 92,
                height: 92,
                correctLevel: QRCode.CorrectLevel.M
            });
        } catch (_) {
            contenedor.innerHTML = '<small>QR no disponible</small>';
        }
    }

    function obtenerModal() {
        let modal = document.getElementById('modal-comprobante');
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = 'modal-comprobante';
        modal.className = 'cmp-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="cmp-modal-caja">
                <div class="cmp-modal-cabecera">
                    <strong>Comprobante de pago</strong>
                    <div class="cmp-modal-acciones">
                        <button type="button" class="cmp-btn cmp-btn-sec" data-accion="imprimir"><i class="fa-solid fa-print"></i> Imprimir</button>
                        <button type="button" class="cmp-btn cmp-btn-pri" data-accion="pdf"><i class="fa-solid fa-download"></i> Descargar PDF</button>
                        <button type="button" class="cmp-btn cmp-btn-cerrar" data-accion="cerrar" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <div class="cmp-modal-cuerpo" id="cmp-modal-cuerpo"></div>
            </div>`;
        document.body.appendChild(modal);

        modal.addEventListener('click', e => {
            if (e.target === modal) return cerrar();
            const accion = e.target.closest('[data-accion]')?.dataset.accion;
            if (accion === 'cerrar') cerrar();
            if (accion === 'imprimir') imprimir();
            if (accion === 'pdf' && modal._dto) descargarPdf(modal._dto);
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && modal.classList.contains('abierto')) cerrar();
        });
        return modal;
    }

    function cerrar() {
        const modal = document.getElementById('modal-comprobante');
        modal?.classList.remove('abierto');
        document.body.style.overflow = '';
    }

    async function previsualizar(dto) {
        if (!dto) return;
        const modal = obtenerModal();
        modal._dto = dto;
        const cuerpo = modal.querySelector('#cmp-modal-cuerpo');
        cuerpo.innerHTML = renderizar(dto);
        modal.classList.add('abierto');
        document.body.style.overflow = 'hidden';
        await pintarQr(cuerpo.querySelector('#cmp-qr'), dto);
    }

    async function descargarPdf(dto) {
        if (!dto) return;
        const temporal = document.createElement('div');
        temporal.className = 'cmp-temporal';
        temporal.innerHTML = renderizar(dto);
        document.body.appendChild(temporal);
        try {
            await Promise.all([cargarScript(LIB_PDF), pintarQr(temporal.querySelector('#cmp-qr'), dto)]);
            await new Promise(r => setTimeout(r, 150));
            // eslint-disable-next-line no-undef
            await html2pdf().set({
                margin: [10, 10, 10, 10],
                filename: `Comprobante-${dto.numero || dto.idAlquiler}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(temporal.querySelector('.cmp-recibo')).save();
        } catch (e) {
            console.error(e);
            alert('No se pudo generar el PDF. Revisa tu conexión e inténtalo de nuevo.');
        } finally {
            temporal.remove();
        }
    }

    function imprimir() {
        document.body.classList.add('cmp-imprimiendo');
        const quitar = () => {
            document.body.classList.remove('cmp-imprimiendo');
            window.removeEventListener('afterprint', quitar);
        };
        window.addEventListener('afterprint', quitar);
        window.print();
        setTimeout(quitar, 1000);
    }

    window.CarmovoComprobante = { renderizar, previsualizar, descargarPdf, imprimir, cerrar };
})();
