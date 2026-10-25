
(function () {
    const $ = selector => document.querySelector(selector);

    let vehiculos = [];
    let alquileres = [];
    let temporizadorActualizacion = null;
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

    function fechaCorta(valor) {
        if (!valor) return '\u2014';

        const partes = String(valor).split('-').map(Number);

        if (partes.length !== 3 || partes.some(numero => !numero)) {
            return escapar(valor);
        }

        return new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(new Date(partes[0], partes[1] - 1, partes[2]));
    }

    function horaActual() {
        return new Intl.DateTimeFormat('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(new Date());
    }

    function claseEstadoVehiculo(estado) {
        const valor = normalizar(estado).replaceAll(' ', '-');

        return [
            'disponible',
            'reservado',
            'alquilado',
            'mantenimiento'
        ].includes(valor) ? valor : '';
    }

    function prioridadAlquiler(alquiler) {
        const estado = normalizar(alquiler.estado);

        if (estado === 'en curso') return 0;
        if (estado === 'confirmado') return 1;
        if (estado === 'pendiente') return 2;

        return 9;
    }

    function alquilerRelevante(idVehiculo) {
        return alquileres
            .filter(alquiler =>
                String(alquiler.idVehiculo) === String(idVehiculo) &&
                ['en curso', 'confirmado', 'pendiente'].includes(
                    normalizar(alquiler.estado)
                )
            )
            .sort((a, b) => {
                const diferenciaPrioridad =
                    prioridadAlquiler(a) - prioridadAlquiler(b);

                if (diferenciaPrioridad !== 0) {
                    return diferenciaPrioridad;
                }

                return String(a.fechaInicio || '').localeCompare(
                    String(b.fechaInicio || '')
                );
            })[0] || null;
    }

    function alquilerActivo(idVehiculo) {
        return alquileres.find(alquiler =>
            String(alquiler.idVehiculo) === String(idVehiculo) &&
            ['en curso', 'confirmado'].includes(
                normalizar(alquiler.estado)
            )
        ) || null;
    }

    function contextoOperativo(vehiculo, alquiler) {
        if (!alquiler) {
            if (normalizar(vehiculo.estado) === 'mantenimiento') {
                return {
                    principal: 'Ubicaci\u00f3n no registrada',
                    detalle: 'Veh\u00edculo marcado en mantenimiento'
                };
            }

            return {
                principal: 'Sin alquiler activo',
                detalle: 'No hay sede operativa asociada'
            };
        }

        const estado = normalizar(alquiler.estado);

        if (estado === 'en curso') {
            return {
                principal: `${alquiler.lugarRecogida || 'Sin sede'} \u2192 ${alquiler.lugarEntrega || 'Sin sede'}`,
                detalle: 'Trayecto registrado en el alquiler'
            };
        }

        if (estado === 'confirmado') {
            return {
                principal: alquiler.lugarRecogida || 'Sin sede de recogida',
                detalle: `Recogida programada \u00b7 entrega: ${alquiler.lugarEntrega || 'sin sede'}`
            };
        }

        return {
            principal: alquiler.lugarRecogida || 'Sin sede de recogida',
            detalle: 'Reserva pendiente de confirmaci\u00f3n'
        };
    }

    function controlVehiculo(vehiculo) {
        const estadoVehiculo = normalizar(vehiculo.estado);
        const activo = alquilerActivo(vehiculo.idVehiculo);

        if (estadoVehiculo === 'mantenimiento' && activo) {
            return {
                tipo: 'alerta',
                texto: 'Revisar',
                detalle: `Veh\u00edculo en mantenimiento con alquiler ${activo.estado} #${activo.idAlquiler}.`
            };
        }

        if (estadoVehiculo === 'alquilado') {
            if (!activo || normalizar(activo.estado) !== 'en curso') {
                return {
                    tipo: 'alerta',
                    texto: 'Revisar',
                    detalle: 'El veh\u00edculo figura Alquilado, pero no tiene un alquiler En curso.'
                };
            }

            return {
                tipo: 'correcto',
                texto: 'Consistente',
                detalle: ''
            };
        }

        if (estadoVehiculo === 'reservado') {
            if (!activo || normalizar(activo.estado) !== 'confirmado') {
                return {
                    tipo: 'alerta',
                    texto: 'Revisar',
                    detalle: 'El veh\u00edculo figura Reservado, pero no tiene un alquiler Confirmado.'
                };
            }

            return {
                tipo: 'correcto',
                texto: 'Consistente',
                detalle: ''
            };
        }

        if (estadoVehiculo === 'disponible' && activo) {
            return {
                tipo: 'alerta',
                texto: 'Revisar',
                detalle: `El veh\u00edculo figura Disponible, pero tiene un alquiler ${activo.estado} #${activo.idAlquiler}.`
            };
        }

        return {
            tipo: 'neutro',
            texto: 'Sin novedad',
            detalle: ''
        };
    }

    function obtenerFiltrados() {
        const busqueda = normalizar($('#buscarMonitoreo').value);
        const estado = normalizar($('#filtroEstadoMonitoreo').value);
        const categoria = normalizar($('#filtroCategoriaMonitoreo').value);

        return vehiculos.filter(vehiculo => {
            const alquiler = alquilerRelevante(vehiculo.idVehiculo);

            const coincideBusqueda = !busqueda || [
                vehiculo.idVehiculo,
                vehiculo.marca,
                vehiculo.modelo,
                vehiculo.categoria,
                vehiculo.transmision,
                vehiculo.estado,
                alquiler?.idAlquiler,
                alquiler?.cliente,
                alquiler?.correoCliente,
                alquiler?.lugarRecogida,
                alquiler?.lugarEntrega
            ].some(valor => normalizar(valor).includes(busqueda));

            const coincideEstado = !estado ||
                normalizar(vehiculo.estado) === estado;

            const coincideCategoria = !categoria ||
                normalizar(vehiculo.categoria) === categoria;

            return coincideBusqueda &&
                coincideEstado &&
                coincideCategoria;
        });
    }

    function renderizarResumen() {
        const contar = estado => vehiculos.filter(
            vehiculo => normalizar(vehiculo.estado) === estado
        ).length;

        $('#resumenMonitoreoTotal').textContent = vehiculos.length;
        $('#resumenMonitoreoDisponibles').textContent = contar('disponible');
        $('#resumenMonitoreoReservados').textContent = contar('reservado');
        $('#resumenMonitoreoAlquilados').textContent = contar('alquilado');
        $('#resumenMonitoreoMantenimiento').textContent = contar('mantenimiento');
    }

    function cargarCategorias() {
        const select = $('#filtroCategoriaMonitoreo');
        const actual = select.value;

        const categorias = [...new Set(
            vehiculos
                .map(vehiculo => vehiculo.categoria)
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, 'es'));

        select.innerHTML =
            '<option value="">Todas las categor\u00edas</option>' +
            categorias.map(categoria =>
                `<option value="${escapar(categoria)}">${escapar(categoria)}</option>`
            ).join('');

        if (categorias.includes(actual)) {
            select.value = actual;
        }
    }

    function renderizarTabla() {
        const cuerpo = $('#tablaMonitoreo');
        const filtrados = obtenerFiltrados();

        $('#cantidadMonitoreo').textContent =
            `${filtrados.length} veh\u00edculo${filtrados.length === 1 ? '' : 's'}`;

        if (!filtrados.length) {
            cuerpo.innerHTML = `
                <tr>
                    <td colspan="7" class="estado-vacio">
                        No se encontraron veh\u00edculos con los filtros seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        cuerpo.innerHTML = filtrados.map(vehiculo => {
            const alquiler = alquilerRelevante(vehiculo.idVehiculo);
            const contexto = contextoOperativo(vehiculo, alquiler);
            const control = controlVehiculo(vehiculo);

            const alquilerHtml = alquiler
                ? `
                    <div class="monitoreo-alquiler">
                        <strong>
                            #${escapar(alquiler.idAlquiler)}
                            \u00b7 ${escapar(alquiler.estado)}
                        </strong>
                        <small>
                            ${escapar(alquiler.categoriaVehiculo || vehiculo.categoria || '\u2014')}
                        </small>
                    </div>
                `
                : `
                    <span class="monitoreo-control neutro">
                        <i class="fa-solid fa-minus"></i>
                        Ninguno
                    </span>
                `;

            const clienteHtml = alquiler
                ? `
                    <div class="monitoreo-cliente">
                        <strong>
                            ${escapar(alquiler.cliente || 'Sin cliente')}
                        </strong>
                        <small>
                            ${escapar(alquiler.correoCliente || '\u2014')}
                        </small>
                    </div>
                `
                : '<span>\u2014</span>';

            const periodoHtml = alquiler
                ? `
                    <div class="monitoreo-periodo">
                        <strong>
                            ${fechaCorta(alquiler.fechaInicio)}
                            \u2192
                            ${fechaCorta(alquiler.fechaFin)}
                        </strong>
                        <small>
                            ${escapar(alquiler.dias || '\u2014')}
                            d\u00eda${Number(alquiler.dias) === 1 ? '' : 's'}
                        </small>
                    </div>
                `
                : '<span>\u2014</span>';

            return `
                <tr>
                    <td>
                        <div class="monitoreo-vehiculo">
                            <strong>
                                ${escapar(vehiculo.marca || '\u2014')}
                                ${escapar(vehiculo.modelo || '')}
                            </strong>
                            <small>
                                #${escapar(vehiculo.idVehiculo)}
                                \u00b7
                                ${escapar(vehiculo.categoria || 'Sin categor\u00eda')}
                            </small>
                        </div>
                    </td>

                    <td>
                        <span class="badge-estado ${claseEstadoVehiculo(vehiculo.estado)}">
                            ${escapar(vehiculo.estado || 'Sin estado')}
                        </span>
                    </td>

                    <td>${alquilerHtml}</td>

                    <td>${clienteHtml}</td>

                    <td>
                        <div class="monitoreo-contexto">
                            <strong>
                                ${escapar(contexto.principal)}
                            </strong>
                            <small>
                                ${escapar(contexto.detalle)}
                            </small>
                        </div>
                    </td>

                    <td>${periodoHtml}</td>

                    <td>
                        <span class="monitoreo-control ${control.tipo}">
                            <i class="fa-solid ${
                control.tipo === 'alerta'
                    ? 'fa-triangle-exclamation'
                    : control.tipo === 'correcto'
                        ? 'fa-circle-check'
                        : 'fa-circle-minus'
            }"></i>
                            ${escapar(control.texto)}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function obtenerAlertas() {
        return vehiculos
            .map(vehiculo => ({
                vehiculo,
                control: controlVehiculo(vehiculo)
            }))
            .filter(item => item.control.tipo === 'alerta');
    }

    function renderizarAlertas() {
        const contenedor = $('#listaAlertasMonitoreo');
        const alertas = obtenerAlertas();

        $('#contadorAlertas').textContent = alertas.length;

        if (!alertas.length) {
            contenedor.innerHTML = `
                <div class="monitoreo-ok">
                    <i class="fa-solid fa-circle-check"></i>
                    No se detectaron inconsistencias entre los estados
                    de la flota y los alquileres activos.
                </div>
            `;
            return;
        }

        contenedor.innerHTML = alertas.map(({ vehiculo, control }) => `
            <div class="alerta-monitoreo">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <div>
                    <strong>
                        ${escapar(vehiculo.marca)}
                        ${escapar(vehiculo.modelo)}
                        \u00b7 #${escapar(vehiculo.idVehiculo)}
                    </strong>
                    <span>${escapar(control.detalle)}</span>
                </div>
            </div>
        `).join('');
    }

    function renderizarOperaciones() {
        const contenedor = $('#listaOperacionesMonitoreo');

        const operaciones = alquileres
            .filter(alquiler =>
                ['confirmado', 'en curso'].includes(
                    normalizar(alquiler.estado)
                )
            )
            .sort((a, b) =>
                String(a.fechaFin || '').localeCompare(
                    String(b.fechaFin || '')
                )
            );

        if (!operaciones.length) {
            contenedor.innerHTML = `
                <div class="estado-vacio">
                    No hay reservas confirmadas ni alquileres en curso.
                </div>
            `;
            return;
        }

        contenedor.innerHTML = operaciones.map(alquiler => `
            <div class="operacion-monitoreo">
                <div>
                    <strong>
                        #${escapar(alquiler.idAlquiler)}
                        \u00b7
                        ${escapar(alquiler.vehiculo || 'Veh\u00edculo')}
                    </strong>

                    <span>
                        ${escapar(alquiler.cliente || 'Sin cliente')}
                        \u00b7
                        ${escapar(alquiler.lugarRecogida || 'Sin sede')}
                        \u2192
                        ${escapar(alquiler.lugarEntrega || 'Sin sede')}
                    </span>

                    <small>
                        ${fechaCorta(alquiler.fechaInicio)}
                        \u2192
                        ${fechaCorta(alquiler.fechaFin)}
                    </small>
                </div>

                <span class="badge-estado ${
            normalizar(alquiler.estado) === 'en curso'
                ? 'alquilado'
                : 'reservado'
        } operacion-monitoreo__estado">
                    ${escapar(alquiler.estado)}
                </span>
            </div>
        `).join('');
    }

    function renderizarTodo() {
        renderizarResumen();
        cargarCategorias();
        renderizarTabla();
        renderizarAlertas();
        renderizarOperaciones();
    }

    async function cargarMonitoreo() {
        if (cargando) return;

        cargando = true;

        const boton = $('#btnRecargarMonitoreo');
        const contenidoOriginal = boton?.innerHTML;

        if (boton) {
            boton.disabled = true;
            boton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando';
        }

        try {
            const [vehiculosRespuesta, alquileresRespuesta] =
                await Promise.all([
                    window.CarmovoAdminApi.listarVehiculos(),
                    window.CarmovoAdminApi.listarAlquileres()
                ]);

            vehiculos = Array.isArray(vehiculosRespuesta)
                ? vehiculosRespuesta
                : [];

            alquileres = Array.isArray(alquileresRespuesta)
                ? alquileresRespuesta
                : [];

            marcarApi(true);
            renderizarTodo();

            $('#ultimaActualizacion').textContent =
                `\u00daltima actualizaci\u00f3n: ${horaActual()}`;

        } catch (error) {
            console.error('No se pudo cargar el monitoreo:', error);

            marcarApi(false);

            $('#tablaMonitoreo').innerHTML = `
                <tr>
                    <td colspan="7" class="estado-vacio">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        No se pudo cargar el monitoreo.
                        Verifica Spring Boot y los endpoints de
                        veh\u00edculos y alquileres.
                    </td>
                </tr>
            `;

            $('#listaAlertasMonitoreo').innerHTML = `
                <div class="estado-vacio">
                    No se pudo realizar el control de consistencia.
                </div>
            `;

            $('#listaOperacionesMonitoreo').innerHTML = `
                <div class="estado-vacio">
                    No se pudieron cargar las operaciones activas.
                </div>
            `;

            $('#ultimaActualizacion').textContent = 'Error al actualizar';

        } finally {
            cargando = false;

            if (boton) {
                boton.disabled = false;
                boton.innerHTML = contenidoOriginal;
            }
        }
    }

    function prepararEventos() {
        $('#buscarMonitoreo').addEventListener('input', renderizarTabla);

        $('#filtroEstadoMonitoreo').addEventListener(
            'change',
            renderizarTabla
        );

        $('#filtroCategoriaMonitoreo').addEventListener(
            'change',
            renderizarTabla
        );

        $('#btnRecargarMonitoreo').addEventListener(
            'click',
            cargarMonitoreo
        );

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                cargarMonitoreo();
            }
        });
    }

    function iniciarActualizacionAutomatica() {
        temporizadorActualizacion = window.setInterval(() => {
            if (!document.hidden) {
                cargarMonitoreo();
            }
        }, 30000);
    }

    document.addEventListener('DOMContentLoaded', () => {
        prepararEventos();
        cargarMonitoreo();
        iniciarActualizacionAutomatica();
    });

    window.addEventListener('beforeunload', () => {
        if (temporizadorActualizacion) {
            clearInterval(temporizadorActualizacion);
        }
    });
})();
