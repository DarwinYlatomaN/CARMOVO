(function () {
    const $ = selector => document.querySelector(selector);

    let vehiculos = [];
    let alquileres = [];
    let pagos = [];
    let cargando = false;

    const normalizar = valor => String(valor ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    function escapar(valor) {
        return String(valor ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function numero(valor) {
        const resultado = Number(valor);
        return Number.isFinite(resultado) ? resultado : 0;
    }

    function moneda(valor) {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN',
            minimumFractionDigits: 2
        }).format(numero(valor));
    }

    function fechaLocal(valor) {
        if (!valor) return null;
        const partes = String(valor).slice(0, 10).split('-').map(Number);
        if (partes.length !== 3 || partes.some(parte => !parte)) return null;
        return new Date(partes[0], partes[1] - 1, partes[2]);
    }

    function fechaCorta(valor) {
        const fecha = fechaLocal(valor);
        if (!fecha) return '—';
        return new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(fecha);
    }

    function marcarApi(conectada) {
        const estado = $('#estadoApi');
        if (!estado) return;

        estado.classList.toggle('conectado', conectada);
        estado.classList.toggle('desconectado', !conectada);
        const texto = estado.querySelector('span');
        if (texto) texto.textContent = conectada ? 'API conectada' : 'API desconectada';
    }

    function periodoActual() {
        const desde = fechaLocal($('#reporteFechaDesde')?.value);
        const hasta = fechaLocal($('#reporteFechaHasta')?.value);
        if (hasta) hasta.setHours(23, 59, 59, 999);
        return { desde, hasta };
    }

    function fechaEnPeriodo(valor, periodo) {
        const fecha = fechaLocal(valor);
        if (!fecha) return false;
        if (periodo.desde && fecha < periodo.desde) return false;
        if (periodo.hasta && fecha > periodo.hasta) return false;
        return true;
    }

    function alquileresDelPeriodo() {
        const periodo = periodoActual();
        if (!periodo.desde && !periodo.hasta) return [...alquileres];
        return alquileres.filter(alquiler => fechaEnPeriodo(alquiler.fechaInicio, periodo));
    }

    function mapaAlquileres(lista) {
        return new Map(lista.map(alquiler => [String(alquiler.idAlquiler), alquiler]));
    }

    function pagosDelPeriodo(listaAlquileres) {
        const mapa = mapaAlquileres(listaAlquileres);
        return pagos.filter(pago => mapa.has(String(pago.idAlquiler)));
    }

    function pagoPorAlquiler() {
        return new Map(pagos.map(pago => [String(pago.idAlquiler), pago]));
    }

    function agrupar(lista, obtenerClave, obtenerValor = () => 1) {
        const resultado = new Map();
        lista.forEach(item => {
            const claveOriginal = obtenerClave(item) || 'Sin dato';
            const clave = String(claveOriginal).trim() || 'Sin dato';
            resultado.set(clave, (resultado.get(clave) || 0) + numero(obtenerValor(item)));
        });
        return [...resultado.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor }));
    }

    function claseBadge(estado) {
        return normalizar(estado).replaceAll(' ', '-');
    }

    function renderizarResumen(listaAlquileres, listaPagos) {
        const finalizados = listaAlquileres.filter(a => normalizar(a.estado) === 'finalizado').length;
        const pagosConfirmados = listaPagos.filter(p => normalizar(p.estadoPago) === 'pagado');
        const ingresos = pagosConfirmados.reduce((suma, pago) => suma + numero(pago.monto), 0);
        const ticket = pagosConfirmados.length ? ingresos / pagosConfirmados.length : 0;

        $('#reporteTotalAlquileres').textContent = listaAlquileres.length;
        $('#reporteFinalizados').textContent = finalizados;
        $('#reporteIngresos').textContent = moneda(ingresos);
        $('#reporteTicketPromedio').textContent = moneda(ticket);
        $('#reporteCantidadPagos').textContent = `${pagosConfirmados.length} pago${pagosConfirmados.length === 1 ? '' : 's'} confirmado${pagosConfirmados.length === 1 ? '' : 's'}`;

        const { desde, hasta } = periodoActual();
        let detalle = 'Todos los registros';
        if (desde || hasta) {
            detalle = `${desde ? new Intl.DateTimeFormat('es-PE').format(desde) : 'Inicio'} → ${hasta ? new Intl.DateTimeFormat('es-PE').format(hasta) : 'Hoy'}`;
        }
        $('#reporteDetallePeriodo').textContent = detalle;
    }

    function renderizarGraficos(listaAlquileres, listaPagos) {
        const estadosOrden = ['Pendiente', 'Confirmado', 'En curso', 'Finalizado', 'Cancelado'];
        const estados = estadosOrden.map(estado => ({
            etiqueta: estado,
            valor: listaAlquileres.filter(a => normalizar(a.estado) === normalizar(estado)).length
        }));

        window.CarmovoWidgetGrafico.renderBarras('#graficoEstadosAlquiler', estados, {
            mensajeVacio: 'No hay alquileres en el periodo seleccionado.'
        });

        const estadosFlotaOrden = ['Disponible', 'Reservado', 'Alquilado', 'Mantenimiento'];
        const estadoFlota = estadosFlotaOrden.map(estado => ({
            etiqueta: estado,
            valor: vehiculos.filter(v => normalizar(v.estado) === normalizar(estado)).length
        }));

        window.CarmovoWidgetGrafico.renderBarras('#graficoEstadoFlota', estadoFlota, {
            mensajeVacio: 'No hay vehículos registrados.'
        });

        const pagosConfirmados = listaPagos.filter(pago => normalizar(pago.estadoPago) === 'pagado');
        const porMetodo = agrupar(pagosConfirmados, pago => pago.metodoPago || 'Sin método', pago => pago.monto)
            .sort((a, b) => b.valor - a.valor);

        window.CarmovoWidgetGrafico.renderBarras('#graficoMetodosPago', porMetodo, {
            formatoValor: valor => moneda(valor),
            mensajeVacio: 'No hay pagos confirmados en el periodo seleccionado.'
        });

        const porCategoria = agrupar(listaAlquileres, alquiler => alquiler.categoriaVehiculo || 'Sin categoría')
            .sort((a, b) => b.valor - a.valor);

        window.CarmovoWidgetGrafico.renderBarras('#graficoCategorias', porCategoria, {
            mensajeVacio: 'No hay alquileres con categorías para mostrar.'
        });
    }

    function renderizarTopVehiculos(listaAlquileres, listaPagos) {
        const cuerpo = $('#tablaTopVehiculos');
        const pagosMapa = new Map(listaPagos.map(pago => [String(pago.idAlquiler), pago]));
        const agrupados = new Map();

        listaAlquileres.forEach(alquiler => {
            const clave = String(alquiler.idVehiculo ?? alquiler.vehiculo ?? 'sin-id');
            const actual = agrupados.get(clave) || {
                idVehiculo: alquiler.idVehiculo,
                vehiculo: alquiler.vehiculo || 'Vehículo',
                categoria: alquiler.categoriaVehiculo || 'Sin categoría',
                alquileres: 0,
                dias: 0,
                total: 0,
                ingresos: 0
            };

            actual.alquileres += 1;
            actual.dias += numero(alquiler.dias);
            actual.total += numero(alquiler.total);

            const pago = pagosMapa.get(String(alquiler.idAlquiler));
            if (pago && normalizar(pago.estadoPago) === 'pagado') {
                actual.ingresos += numero(pago.monto);
            }

            agrupados.set(clave, actual);
        });

        const ranking = [...agrupados.values()]
            .sort((a, b) => b.alquileres - a.alquileres || b.ingresos - a.ingresos)
            .slice(0, 10);

        $('#contadorTopVehiculos').textContent = `${ranking.length} vehículo${ranking.length === 1 ? '' : 's'}`;

        if (!ranking.length) {
            cuerpo.innerHTML = '<tr><td colspan="6" class="estado-vacio">No hay alquileres en el periodo seleccionado.</td></tr>';
            return;
        }

        cuerpo.innerHTML = ranking.map(item => `
            <tr>
                <td>
                    <div class="reporte-vehiculo">
                        <strong>${escapar(item.vehiculo)}</strong>
                        <small>${item.idVehiculo != null ? `Vehículo #${escapar(item.idVehiculo)}` : 'Sin ID'}</small>
                    </div>
                </td>
                <td>${escapar(item.categoria)}</td>
                <td><span class="reporte-numero">${item.alquileres}</span></td>
                <td>${item.dias}</td>
                <td><span class="reporte-monto">${moneda(item.total)}</span></td>
                <td><span class="reporte-monto reporte-monto--ingreso">${moneda(item.ingresos)}</span></td>
            </tr>
        `).join('');
    }

    function renderizarDetalle(listaAlquileres) {
        const cuerpo = $('#tablaDetalleReporte');
        const pagosMapa = pagoPorAlquiler();
        const ordenados = [...listaAlquileres].sort((a, b) =>
            String(b.fechaInicio || '').localeCompare(String(a.fechaInicio || '')) ||
            numero(b.idAlquiler) - numero(a.idAlquiler)
        );

        $('#contadorDetalleReporte').textContent = `${ordenados.length} registro${ordenados.length === 1 ? '' : 's'}`;

        if (!ordenados.length) {
            cuerpo.innerHTML = '<tr><td colspan="8" class="estado-vacio">No hay alquileres en el periodo seleccionado.</td></tr>';
            return;
        }

        cuerpo.innerHTML = ordenados.map(alquiler => {
            const pago = pagosMapa.get(String(alquiler.idAlquiler));
            const estadoPago = pago?.estadoPago || 'Pendiente';
            const metodo = pago?.metodoPago || alquiler.metodoPago || '—';

            return `
                <tr>
                    <td>#${escapar(alquiler.idAlquiler ?? '—')}</td>
                    <td>
                        <div class="reporte-cliente">
                            <strong>${escapar(alquiler.cliente || 'Sin cliente')}</strong>
                            <small>${escapar(alquiler.correoCliente || '—')}</small>
                        </div>
                    </td>
                    <td>
                        <div class="reporte-vehiculo">
                            <strong>${escapar(alquiler.vehiculo || 'Vehículo')}</strong>
                            <small>${escapar(alquiler.categoriaVehiculo || 'Sin categoría')}</small>
                        </div>
                    </td>
                    <td>
                        <div class="reporte-periodo">
                            <strong>${fechaCorta(alquiler.fechaInicio)} → ${fechaCorta(alquiler.fechaFin)}</strong>
                            <small>${escapar(alquiler.dias ?? '—')} día${numero(alquiler.dias) === 1 ? '' : 's'}</small>
                        </div>
                    </td>
                    <td><span class="badge-reporte ${claseBadge(alquiler.estado)}">${escapar(alquiler.estado || 'Sin estado')}</span></td>
                    <td><span class="badge-reporte ${claseBadge(estadoPago)}">${escapar(estadoPago)}</span></td>
                    <td>${escapar(metodo)}</td>
                    <td><span class="reporte-monto">${moneda(alquiler.total)}</span></td>
                </tr>`;
        }).join('');
    }

    function renderizarTodo() {
        const listaAlquileres = alquileresDelPeriodo();
        const listaPagos = pagosDelPeriodo(listaAlquileres);

        renderizarResumen(listaAlquileres, listaPagos);
        renderizarGraficos(listaAlquileres, listaPagos);
        renderizarTopVehiculos(listaAlquileres, listaPagos);
        renderizarDetalle(listaAlquileres);
    }

    function validarPeriodo() {
        const desde = $('#reporteFechaDesde').value;
        const hasta = $('#reporteFechaHasta').value;
        if (desde && hasta && desde > hasta) {
            window.alert('La fecha Desde no puede ser posterior a la fecha Hasta.');
            return false;
        }
        return true;
    }

    function escaparCsv(valor) {
        const texto = String(valor ?? '').replaceAll('"', '""');
        return `"${texto}"`;
    }

    function exportarCsv() {
        const listaAlquileres = alquileresDelPeriodo();
        if (!listaAlquileres.length) {
            window.alert('No hay registros para exportar en el periodo seleccionado.');
            return;
        }

        const pagosMapa = pagoPorAlquiler();
        const cabecera = [
            'ID alquiler', 'Cliente', 'Correo', 'Vehículo', 'Categoría', 'Fecha inicio', 'Fecha fin',
            'Días', 'Estado alquiler', 'Estado pago', 'Método pago', 'Total'
        ];

        const filas = listaAlquileres.map(alquiler => {
            const pago = pagosMapa.get(String(alquiler.idAlquiler));
            return [
                alquiler.idAlquiler,
                alquiler.cliente,
                alquiler.correoCliente,
                alquiler.vehiculo,
                alquiler.categoriaVehiculo,
                alquiler.fechaInicio,
                alquiler.fechaFin,
                alquiler.dias,
                alquiler.estado,
                pago?.estadoPago || 'Pendiente',
                pago?.metodoPago || alquiler.metodoPago || '',
                numero(alquiler.total).toFixed(2)
            ];
        });

        const contenido = [cabecera, ...filas]
            .map(fila => fila.map(escaparCsv).join(';'))
            .join('\r\n');

        const blob = new Blob([`\uFEFF${contenido}`], { type: 'text/csv;charset=utf-8;' });
        const enlace = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const { desde, hasta } = $('#reporteFechaDesde').value || $('#reporteFechaHasta').value
            ? { desde: $('#reporteFechaDesde').value || 'inicio', hasta: $('#reporteFechaHasta').value || 'actual' }
            : { desde: 'completo', hasta: '' };

        enlace.href = url;
        enlace.download = `carmovo_reporte_alquileres_${desde}${hasta ? `_${hasta}` : ''}.csv`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);
    }

    async function cargarReportes() {
        if (cargando) return;
        cargando = true;
        $('#btnActualizarReportes')?.setAttribute('disabled', 'disabled');

        try {
            [vehiculos, alquileres, pagos] = await Promise.all([
                window.CarmovoAdminApi.listarVehiculos(),
                window.CarmovoAdminApi.listarAlquileres(),
                window.CarmovoAdminApi.listarPagos()
            ]);

            marcarApi(true);
            $('#mensajeReportesApi')?.classList.remove('visible');
            renderizarTodo();

            $('#reporteUltimaActualizacion').textContent = `Última actualización: ${new Intl.DateTimeFormat('es-PE', {
                dateStyle: 'medium',
                timeStyle: 'medium'
            }).format(new Date())}`;
        } catch (error) {
            console.error('No se pudieron cargar los reportes:', error);
            marcarApi(false);
            $('#mensajeReportesApi')?.classList.add('visible');
        } finally {
            cargando = false;
            $('#btnActualizarReportes')?.removeAttribute('disabled');
        }
    }

    function configurarEventos() {
        $('#btnActualizarReportes')?.addEventListener('click', cargarReportes);

        $('#btnAplicarPeriodo')?.addEventListener('click', () => {
            if (validarPeriodo()) renderizarTodo();
        });

        $('#btnLimpiarPeriodo')?.addEventListener('click', () => {
            $('#reporteFechaDesde').value = '';
            $('#reporteFechaHasta').value = '';
            renderizarTodo();
        });

        $('#btnExportarReporte')?.addEventListener('click', exportarCsv);
    }

    document.addEventListener('DOMContentLoaded', () => {
        configurarEventos();
        cargarReportes();
    });
})();
