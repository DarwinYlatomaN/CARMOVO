(function () {
    const normalizar = valor => String(valor || '').trim().toLowerCase();

    function contarPorEstado(vehiculos, estadoBuscado) {
        return vehiculos.filter(
            vehiculo => normalizar(vehiculo.estado) === estadoBuscado
        ).length;
    }

    function actualizarNumero(id, valor) {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = valor;
        }
    }

    function escapar(valor) {
        return String(valor ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function claseEstado(estado) {
        const valor = normalizar(estado).replaceAll(' ', '-');

        return ['disponible', 'alquilado', 'reservado', 'mantenimiento'].includes(valor)
            ? valor
            : '';
    }

    function iconoVehiculo(categoria) {
        const c = normalizar(categoria);
        if (/van|minivan|bus/.test(c)) return 'fa-van-shuttle';
        if (/camioneta|pickup|4x4|terreno/.test(c)) return 'fa-truck-pickup';
        if (/suv/.test(c)) return 'fa-car-rear';
        return 'fa-car-side';
    }

    function renderizarVehiculos(vehiculos) {
        const lista = document.getElementById('tablaVehiculosRecientes');

        if (!lista) return;

        const ultimos = [...vehiculos]
            .sort((a, b) => (b.idVehiculo || 0) - (a.idVehiculo || 0))
            .slice(0, 5);

        if (!ultimos.length) {
            lista.innerHTML = '<li class="estado-vacio">No hay vehículos registrados todavía.</li>';
            return;
        }

        lista.innerHTML = ultimos.map(vehiculo => `
            <li class="uv-item">
                <span class="uv-icono"><i class="fa-solid ${iconoVehiculo(vehiculo.categoria)}"></i></span>
                <span class="uv-nombre">
                    <strong>${escapar(vehiculo.marca || '-')} ${escapar(vehiculo.modelo || '')}</strong>
                    <small>${escapar(vehiculo.categoria || 'Sin categoría')} · #${escapar(vehiculo.idVehiculo ?? '-')}</small>
                </span>
                <span class="uv-dato">
                    <strong>S/ ${Number(vehiculo.precioDia || 0).toFixed(2)}</strong>
                    <span class="badge-estado ${claseEstado(vehiculo.estado)}">${escapar(vehiculo.estado || 'Sin estado')}</span>
                </span>
            </li>
        `).join('');
    }

    // =========================================================
    // INGRESOS (solo pagos aprobados: estado "Pagado")
    // =========================================================

    const METODOS = [
        { clave: 'tarjeta', nombre: 'Tarjeta', color: '#315A75' },
        { clave: 'yape', nombre: 'Yape', color: '#7B3FBF' },
        { clave: 'plin', nombre: 'Plin', color: '#13B5C8' },
        { clave: 'transferencia', nombre: 'Transferencia', color: '#E0A23B' },
        { clave: 'efectivo', nombre: 'Efectivo', color: '#9DB4C6' }
    ];
    const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];

    let pagos = [];
    let periodo = 'mes';
    let graficoLinea = null;
    let graficoDona = null;

    const soles = v => 'S/ ' + Number(v || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const solesCorto = v => 'S/ ' + Number(v || 0).toLocaleString('es-PE', { maximumFractionDigits: 0 });
    const inicioDia = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const sumarDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    const mismoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    function fechaDe(pago) {
        const valor = pago.fechaValidacion || pago.fechaPago || pago.fechaRegistro;
        const fecha = valor ? new Date(valor) : null;
        return fecha && !Number.isNaN(fecha.getTime()) ? fecha : null;
    }

    function montoDe(pago) {
        return Number(pago.montoPagado ?? pago.monto ?? 0) || 0;
    }

    function claveMetodo(pago) {
        const m = normalizar(pago.metodoPago);
        if (/tarjeta|visa|master|card/.test(m)) return 'tarjeta';
        return METODOS.some(x => x.clave === m) ? m : 'efectivo';
    }

    /** Arma los tramos (días o meses) del período elegido y del período anterior para comparar. */
    function tramos(tipo) {
        const hoy = inicioDia(new Date());
        const lista = [];
        if (tipo === '7d') {
            for (let i = 6; i >= 0; i--) {
                const d = sumarDias(hoy, -i);
                lista.push({ etiqueta: `${d.getDate()} ${MESES[d.getMonth()]}`, desde: d, hasta: sumarDias(d, 1), antesDesde: sumarDias(d, -7), antesHasta: sumarDias(d, -6) });
            }
            return { lista, nombre: 'Últimos 7 días', anterior: '7 días anteriores', total: 'Total de 7 días' };
        }
        if (tipo === 'mes') {
            const dias = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
            for (let dia = 1; dia <= dias; dia++) {
                const d = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
                const a = new Date(hoy.getFullYear(), hoy.getMonth() - 1, dia);
                const valida = a.getMonth() === (hoy.getMonth() + 11) % 12;
                lista.push({ etiqueta: String(dia), desde: d, hasta: sumarDias(d, 1), antesDesde: valida ? a : null, antesHasta: valida ? sumarDias(a, 1) : null, futuro: d > hoy });
            }
            const anterior = MESES_LARGO[(hoy.getMonth() + 11) % 12];
            return { lista, nombre: `${MESES_LARGO[hoy.getMonth()][0].toUpperCase()}${MESES_LARGO[hoy.getMonth()].slice(1)} ${hoy.getFullYear()}`, anterior: anterior[0].toUpperCase() + anterior.slice(1), total: 'Total del mes' };
        }
        const cantidad = tipo === '6m' ? 6 : hoy.getMonth() + 1;
        const base = tipo === '6m' ? new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1) : new Date(hoy.getFullYear(), 0, 1);
        const atras = tipo === '6m' ? 6 : 12;
        for (let i = 0; i < cantidad; i++) {
            const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
            const a = new Date(d.getFullYear(), d.getMonth() - atras, 1);
            lista.push({ etiqueta: MESES[d.getMonth()], desde: d, hasta: new Date(d.getFullYear(), d.getMonth() + 1, 1), antesDesde: a, antesHasta: new Date(a.getFullYear(), a.getMonth() + 1, 1) });
        }
        return tipo === '6m'
            ? { lista, nombre: 'Últimos 6 meses', anterior: '6 meses anteriores', total: 'Total de 6 meses' }
            : { lista, nombre: `Año ${hoy.getFullYear()}`, anterior: `Año ${hoy.getFullYear() - 1}`, total: 'Total del año' };
    }

    function sumarEntre(lista, desde, hasta) {
        if (!desde || !hasta) return 0;
        return lista.reduce((t, p) => {
            const f = fechaDe(p);
            return f && f >= desde && f < hasta ? t + montoDe(p) : t;
        }, 0);
    }

    function dibujarIngresos() {
        const aprobados = pagos.filter(p => normalizar(p.estadoPago) === 'pagado');
        const enRevision = pagos.filter(p => normalizar(p.estadoPago) === 'en revisión');
        const t = tramos(periodo);
        const actual = t.lista.map(x => x.futuro ? null : sumarEntre(aprobados, x.desde, x.hasta));
        const previo = t.lista.map(x => sumarEntre(aprobados, x.antesDesde, x.antesHasta));
        const desde = t.lista[0].desde;
        const hasta = t.lista[t.lista.length - 1].hasta;
        const total = sumarEntre(aprobados, desde, hasta);
        const hoy = new Date();
        const limiteAnterior = periodo === 'mes'
            ? t.lista.filter(x => !x.futuro).map(x => x.antesHasta).filter(Boolean).pop()
            : t.lista[t.lista.length - 1].antesHasta;
        const totalPrevio = sumarEntre(aprobados, t.lista.find(x => x.antesDesde)?.antesDesde, limiteAnterior);

        actualizarNumero('tiEtiquetaTotal', t.total);
        actualizarNumero('tiTotal', soles(total));
        actualizarNumero('tiHoy', soles(aprobados.filter(p => fechaDe(p) && mismoDia(fechaDe(p), hoy)).reduce((s, p) => s + montoDe(p), 0)));
        actualizarNumero('tiRevisar', soles(enRevision.reduce((s, p) => s + montoDe(p), 0)));
        actualizarNumero('tiEtiquetaMetodos', t.nombre);

        const variacion = document.getElementById('tiVariacion');
        if (variacion) {
            if (totalPrevio > 0) {
                const cambio = Math.round(((total - totalPrevio) / totalPrevio) * 100);
                variacion.hidden = false;
                variacion.className = 'ti-variacion ' + (cambio >= 0 ? 'sube' : 'baja');
                variacion.textContent = `${cambio >= 0 ? '▲' : '▼'} ${Math.abs(cambio)}%`;
                variacion.title = `Comparado con: ${t.anterior}`;
            } else {
                variacion.hidden = true;
            }
        }

        if (!window.Chart) return;
        Chart.defaults.font.family = "'Montserrat', sans-serif";
        Chart.defaults.color = '#5F7A8E';

        const lienzo = document.getElementById('tiGraficoLinea');
        if (lienzo) {
            const ctx = lienzo.getContext('2d');
            const degradado = ctx.createLinearGradient(0, 0, 0, lienzo.clientHeight || 260);
            degradado.addColorStop(0, 'rgba(49, 90, 117, .28)');
            degradado.addColorStop(1, 'rgba(49, 90, 117, 0)');
            const datos = {
                labels: t.lista.map(x => x.etiqueta),
                datasets: [
                    { label: t.nombre, data: actual, borderColor: '#315A75', backgroundColor: degradado, fill: true, tension: .4, borderWidth: 3, pointRadius: 0, pointHoverRadius: 5, spanGaps: false },
                    { label: t.anterior, data: previo, borderColor: '#A9C3D6', borderDash: [6, 6], tension: .4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: false }
                ]
            };
            if (graficoLinea) {
                graficoLinea.data = datos;
                graficoLinea.update();
            } else {
                graficoLinea = new Chart(ctx, {
                    type: 'line',
                    data: datos,
                    options: {
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } },
                            tooltip: { callbacks: { label: c => `${c.dataset.label}: ${soles(c.parsed.y)}` } }
                        },
                        scales: {
                            x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 16 } },
                            y: { beginAtZero: true, grid: { color: '#EEF3F7' }, border: { display: false }, ticks: { callback: solesCorto, maxTicksLimit: 6 } }
                        }
                    }
                });
            }
        }

        const enPeriodo = aprobados.filter(p => { const f = fechaDe(p); return f && f >= desde && f < hasta; });
        const porMetodo = METODOS.map(m => ({ ...m, total: enPeriodo.filter(p => claveMetodo(p) === m.clave).reduce((s, p) => s + montoDe(p), 0) }));
        const hayMetodos = porMetodo.some(m => m.total > 0);
        const vacia = document.getElementById('tiDonaVacia');
        if (vacia) vacia.hidden = hayMetodos;

        const leyenda = document.getElementById('tiLeyenda');
        if (leyenda) {
            leyenda.innerHTML = porMetodo.map(m => `
                <li><span><i style="background:${m.color}"></i>${m.nombre}</span><strong>${solesCorto(m.total)}</strong></li>
            `).join('');
        }

        const dona = document.getElementById('tiGraficoDona');
        if (dona) {
            const datos = {
                labels: porMetodo.map(m => m.nombre),
                datasets: [{
                    data: hayMetodos ? porMetodo.map(m => m.total) : [1],
                    backgroundColor: hayMetodos ? porMetodo.map(m => m.color) : ['#EEF3F7'],
                    borderWidth: 0, spacing: hayMetodos ? 3 : 0, borderRadius: hayMetodos ? 6 : 0
                }]
            };
            if (graficoDona) {
                graficoDona.data = datos;
                graficoDona.options.plugins.tooltip.enabled = hayMetodos;
                graficoDona.update();
            } else {
                graficoDona = new Chart(dona, {
                    type: 'doughnut',
                    data: datos,
                    options: {
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: hayMetodos, callbacks: { label: c => `${c.label}: ${soles(c.parsed)}` } }
                        }
                    }
                });
            }
        }
    }

    function prepararFiltros() {
        document.querySelectorAll('.ti-filtros [data-periodo]').forEach(boton => {
            boton.addEventListener('click', () => {
                periodo = boton.dataset.periodo;
                document.querySelectorAll('.ti-filtros [data-periodo]').forEach(b => b.classList.toggle('activo', b === boton));
                dibujarIngresos();
            });
        });
    }

    async function cargarIngresos() {
        const aviso = document.getElementById('tiAviso');
        try {
            pagos = await window.CarmovoAdminApi.listarPagos();
            if (!Array.isArray(pagos)) pagos = [];
            if (aviso) aviso.hidden = true;
        } catch (error) {
            pagos = [];
            if (aviso) {
                aviso.hidden = false;
                aviso.textContent = error?.status === 403
                    ? 'Tu rol no tiene permiso para ver los ingresos.'
                    : 'No se pudieron cargar los pagos.';
            }
        }
        dibujarIngresos();
    }

    function marcarApi(conectada) {
        const estado = document.getElementById('estadoApi');

        if (!estado) return;

        estado.classList.remove('conectado', 'desconectado');
        estado.classList.add(
            conectada ? 'conectado' : 'desconectado'
        );

        const texto = estado.querySelector('span');

        if (texto) {
            texto.textContent = conectada
                ? 'API conectada'
                : 'API desconectada';
        }
    }

    async function cargarTablero() {
        const mensaje = document.getElementById('mensajeApi');

        try {
            const vehiculos = await window.CarmovoAdminApi.listarVehiculos();

            actualizarNumero(
                'totalVehiculos',
                vehiculos.length
            );

            actualizarNumero(
                'vehiculosDisponibles',
                contarPorEstado(vehiculos, 'disponible')
            );

            actualizarNumero(
                'vehiculosAlquilados',
                contarPorEstado(vehiculos, 'alquilado') +
                contarPorEstado(vehiculos, 'reservado')
            );

            actualizarNumero(
                'vehiculosMantenimiento',
                contarPorEstado(vehiculos, 'mantenimiento')
            );

            renderizarVehiculos(vehiculos);
            marcarApi(true);

            mensaje?.classList.remove('visible');

        } catch (error) {
            console.error(
                'No se pudo cargar el tablero:',
                error
            );

            marcarApi(false);
            mensaje?.classList.add('visible');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        prepararFiltros();
        cargarTablero();
        cargarIngresos();
    });
})();