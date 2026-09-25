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
        if (texto) texto.textContent = conectada ? 'API conectada' : 'API desconectada';
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
        return `S/ ${Number.isFinite(numero) ? numero.toFixed(2) : '0.00'}`;
    }

    function fechaHora(valor) {
        if (!valor) return '—';
        const fecha = new Date(valor);
        if (Number.isNaN(fecha.getTime())) return '—';
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
        return 'pendiente';
    }

    function obtenerFiltrados() {
        const busqueda = normalizar($('#buscarPago').value);
        const estado = normalizar($('#filtroEstadoPago').value);
        const metodo = normalizar($('#filtroMetodoPago').value);

        return pagos.filter(pago => {
            const metodoReal = pago.metodoPago || 'Sin especificar';
            const coincideBusqueda = !busqueda || [
                pago.idAlquiler,
                pago.cliente,
                pago.correoCliente,
                pago.vehiculo,
                metodoReal,
                pago.referencia
            ].some(valor => normalizar(valor).includes(busqueda));

            const coincideEstado = !estado || normalizar(pago.estadoPago) === estado;
            const coincideMetodo = !metodo || normalizar(metodoReal) === metodo;

            return coincideBusqueda && coincideEstado && coincideMetodo;
        });
    }

    function renderizarResumen() {
        const pendientes = pagos.filter(item => normalizar(item.estadoPago) === 'pendiente').length;
        const revision = pagos.filter(item => normalizar(item.estadoPago) === 'en revision').length;
        const pagados = pagos.filter(item => normalizar(item.estadoPago) === 'pagado');
        const ingresos = pagados.reduce((total, item) => total + Number(item.monto || 0), 0);

        $('#resumenPagosTotal').textContent = pagos.length;
        $('#resumenPagosPendientes').textContent = pendientes;
        $('#resumenPagosRevision').textContent = revision;
        $('#resumenPagosPagados').textContent = pagados.length;
        $('#resumenIngresos').textContent = moneda(ingresos);
    }

    function renderizarTabla() {
        const cuerpo = $('#tablaPagos');
        const filtrados = obtenerFiltrados();
        $('#cantidadPagos').textContent = `${filtrados.length} resultado${filtrados.length === 1 ? '' : 's'}`;

        if (!filtrados.length) {
            cuerpo.innerHTML = '<tr><td colspan="9" class="estado-vacio">No se encontraron pagos con los filtros seleccionados.</td></tr>';
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
                            <strong>${escapar(pago.cliente || 'Sin cliente')}</strong>
                            <small>${escapar(pago.correoCliente || '—')}</small>
                        </div>
                    </td>
                    <td>
                        <div class="pago-vehiculo">
                            <strong>${escapar(pago.vehiculo || 'Sin vehículo')}</strong>
                            <small>ID vehículo #${escapar(pago.idVehiculo || '—')}</small>
                        </div>
                    </td>
                    <td>${escapar(metodo)}</td>
                    <td><span class="pago-monto">${escapar(moneda(pago.monto))}</span></td>
                    <td><span class="badge-alquiler-pago">${escapar(pago.estadoAlquiler || '—')}</span></td>
                    <td><span class="badge-pago ${clasePago}">${escapar(estadoPago)}</span></td>
                    <td><span class="pago-fecha ${pago.fechaPago ? '' : 'pago-sin-dato'}">${escapar(fechaHora(pago.fechaPago))}</span></td>
                    <td>
                        <div class="acciones-pago">
                            <button class="boton-pago-icono editar" type="button" data-accion="editar" data-id-alquiler="${pago.idAlquiler}" title="Actualizar pago" aria-label="Actualizar pago">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    }

    async function cargarPagos() {
        const cuerpo = $('#tablaPagos');
        cuerpo.innerHTML = '<tr><td colspan="9" class="estado-vacio">Cargando pagos...</td></tr>';

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
                    <td colspan="9" class="estado-vacio">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        No se pudo cargar Pagos e ingresos. Verifica Spring Boot y que la tabla pagos exista en PostgreSQL.
                    </td>
                </tr>`;
            notificar(error.message || 'No se pudo conectar con el backend.', 'error');
        }
    }

    function abrirModal(pago) {
        if (!pago) return;
        pagoEditandoIdAlquiler = pago.idAlquiler;

        $('#tituloModalPagoAdmin').textContent = `Pago del alquiler #${pago.idAlquiler}`;
        $('#pagoEstado').value = pago.estadoPago || 'Pendiente';
        $('#pagoReferencia').value = pago.referencia || '';
        $('#pagoObservaciones').value = pago.observaciones || '';

        $('#resumenPagoModal').innerHTML = `
            <div><span>Cliente</span><strong>${escapar(pago.cliente || '—')}</strong></div>
            <div><span>Vehículo</span><strong>${escapar(pago.vehiculo || '—')}</strong></div>
            <div><span>Método</span><strong>${escapar(pago.metodoPago || 'Sin especificar')}</strong></div>
            <div><span>Monto</span><strong>${escapar(moneda(pago.monto))}</strong></div>
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
        boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        try {
            await window.CarmovoAdminApi.actualizarPago(pagoEditandoIdAlquiler, datos);
            notificar('Estado de pago actualizado correctamente.');
            cerrarModal();
            await cargarPagos();
        } catch (error) {
            console.error(error);
            notificar(error.message || 'No se pudo actualizar el pago.', 'error');
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
            if (evento.target.id === 'modalPagoAdmin') cerrarModal();
        });

        $('#tablaPagos').addEventListener('click', evento => {
            const boton = evento.target.closest('[data-accion="editar"]');
            if (!boton) return;
            const pago = pagos.find(item => String(item.idAlquiler) === String(boton.dataset.idAlquiler));
            abrirModal(pago);
        });

        document.addEventListener('keydown', evento => {
            if (evento.key === 'Escape' && $('#modalPagoAdmin').classList.contains('abierto')) {
                cerrarModal();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        prepararEventos();
        cargarPagos();
    });
})();
