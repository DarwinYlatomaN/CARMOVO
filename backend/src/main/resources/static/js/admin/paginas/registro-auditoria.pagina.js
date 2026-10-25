
(function () {
    const $ = selector => document.querySelector(selector);

    let registros = [];

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

        $('#mensajeAuditoriaApi')?.classList.toggle('visible', !conectada);
    }

    function fechaLocal(valor) {
        if (!valor) return null;

        const fecha = new Date(valor);

        return Number.isNaN(fecha.getTime()) ? null : fecha;
    }

    function fechaClave(fecha) {
        if (!fecha) return '';

        const y = fecha.getFullYear();
        const m = String(fecha.getMonth() + 1).padStart(2, '0');
        const d = String(fecha.getDate()).padStart(2, '0');

        return `${y}-${m}-${d}`;
    }

    function formatearFechaHora(valor) {
        const fecha = fechaLocal(valor);

        if (!fecha) {
            return {
                fecha: '\u2014',
                hora: '\u2014'
            };
        }

        return {
            fecha: new Intl.DateTimeFormat('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(fecha),

            hora: new Intl.DateTimeFormat('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).format(fecha)
        };
    }

    function claseAccion(accion) {
        return normalizar(accion)
            .replaceAll('_', '-')
            .replaceAll(' ', '-');
    }

    function obtenerFiltrados() {
        const texto = normalizar($('#buscarAuditoria').value);
        const modulo = $('#filtroModuloAuditoria').value;
        const accion = $('#filtroAccionAuditoria').value;
        const desde = $('#filtroAuditoriaDesde').value;
        const hasta = $('#filtroAuditoriaHasta').value;

        return registros.filter(registro => {
            const coincideTexto = !texto || [
                registro.idAuditoria,
                registro.modulo,
                registro.accion,
                registro.entidad,
                registro.idEntidad,
                registro.actor,
                registro.detalle
            ].some(valor => normalizar(valor).includes(texto));

            const coincideModulo = !modulo || registro.modulo === modulo;
            const coincideAccion = !accion || registro.accion === accion;

            const fecha = fechaLocal(registro.fechaHora);
            const clave = fechaClave(fecha);

            const coincideDesde = !desde || (clave && clave >= desde);
            const coincideHasta = !hasta || (clave && clave <= hasta);

            return coincideTexto
                && coincideModulo
                && coincideAccion
                && coincideDesde
                && coincideHasta;
        });
    }

    function renderizarResumen() {
        const hoy = fechaClave(new Date());

        $('#auditoriaTotal').textContent = registros.length;

        $('#auditoriaHoy').textContent = registros.filter(item =>
            fechaClave(fechaLocal(item.fechaHora)) === hoy
        ).length;

        $('#auditoriaModulos').textContent = new Set(
            registros.map(item => item.modulo).filter(Boolean)
        ).size;

        $('#auditoriaEliminaciones').textContent = registros.filter(item =>
            normalizar(item.accion) === 'eliminar'
        ).length;
    }

    function renderizarFiltros() {
        const modulos = [
            ...new Set(registros.map(item => item.modulo).filter(Boolean))
        ].sort();

        const acciones = [
            ...new Set(registros.map(item => item.accion).filter(Boolean))
        ].sort();

        const filtroModulo = $('#filtroModuloAuditoria');
        const filtroAccion = $('#filtroAccionAuditoria');

        const moduloActual = filtroModulo.value;
        const accionActual = filtroAccion.value;

        filtroModulo.innerHTML =
            '<option value="">Todos los m\u00f3dulos</option>' +
            modulos
                .map(valor =>
                    `<option value="${escapar(valor)}">${escapar(valor)}</option>`
                )
                .join('');

        filtroAccion.innerHTML =
            '<option value="">Todas las acciones</option>' +
            acciones
                .map(valor =>
                    `<option value="${escapar(valor)}">${escapar(valor.replaceAll('_', ' '))}</option>`
                )
                .join('');

        if (modulos.includes(moduloActual)) {
            filtroModulo.value = moduloActual;
        }

        if (acciones.includes(accionActual)) {
            filtroAccion.value = accionActual;
        }
    }

    function renderizarTabla() {
        const filtrados = obtenerFiltrados();
        const cuerpo = $('#tablaAuditoria');

        $('#contadorAuditoria').textContent =
            `${filtrados.length} registro${filtrados.length === 1 ? '' : 's'}`;

        if (!filtrados.length) {
            cuerpo.innerHTML =
                '<tr><td colspan="6" class="estado-vacio">' +
                'No hay registros de auditor\u00eda con los filtros seleccionados.' +
                '</td></tr>';

            return;
        }

        cuerpo.innerHTML = filtrados.map(registro => {
            const momento = formatearFechaHora(registro.fechaHora);

            const accionTexto = String(registro.accion || '\u2014')
                .replaceAll('_', ' ');

            return `
                <tr>
                    <td>
                        <div class="auditoria-fecha">
                            <strong>${escapar(momento.fecha)}</strong>
                            <small>${escapar(momento.hora)}</small>
                        </div>
                    </td>

                    <td>${escapar(registro.modulo || '\u2014')}</td>

                    <td>
                        <span class="badge-auditoria ${escapar(claseAccion(registro.accion))}">
                            ${escapar(accionTexto)}
                        </span>
                    </td>

                    <td>
                        <div class="auditoria-entidad">
                            <strong>${escapar(registro.entidad || '\u2014')}</strong>
                            <small>${
                registro.idEntidad == null
                    ? 'Sin ID asociado'
                    : `ID #${escapar(registro.idEntidad)}`
            }</small>
                        </div>
                    </td>

                    <td class="auditoria-detalle">
                        ${escapar(registro.detalle || '\u2014')}
                    </td>

                    <td>${escapar(registro.actor || 'Panel administrador')}</td>
                </tr>
            `;
        }).join('');
    }

    function escaparCsv(valor) {
        const texto = String(valor ?? '').replaceAll('"', '""');

        return `"${texto}"`;
    }

    function exportarCsv() {
        const filtrados = obtenerFiltrados();

        if (!filtrados.length) return;

        const cabecera = [
            'ID',
            'Fecha y hora',
            'M\u00f3dulo',
            'Acci\u00f3n',
            'Entidad',
            'ID entidad',
            'Detalle',
            'Origen'
        ];

        const filas = filtrados.map(item => [
            item.idAuditoria,
            item.fechaHora,
            item.modulo,
            item.accion,
            item.entidad,
            item.idEntidad ?? '',
            item.detalle,
            item.actor
        ]);

        const contenido = [cabecera, ...filas]
            .map(fila => fila.map(escaparCsv).join(';'))
            .join('\n');

        const blob = new Blob(
            ['\ufeff' + contenido],
            { type: 'text/csv;charset=utf-8;' }
        );

        const enlace = document.createElement('a');

        enlace.href = URL.createObjectURL(blob);
        enlace.download = `carmovo_auditoria_${fechaClave(new Date())}.csv`;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        URL.revokeObjectURL(enlace.href);
    }

    async function cargarAuditoria() {
        const cuerpo = $('#tablaAuditoria');

        cuerpo.innerHTML =
            '<tr><td colspan="6" class="estado-vacio">' +
            'Cargando auditor\u00eda...' +
            '</td></tr>';

        try {
            registros = await window.CarmovoAdminApi.listarAuditoria();

            marcarApi(true);
            renderizarResumen();
            renderizarFiltros();
            renderizarTabla();

            $('#auditoriaUltimaActualizacion').textContent =
                `\u00daltima actualizaci\u00f3n: ${
                    new Intl.DateTimeFormat('es-PE', {
                        dateStyle: 'short',
                        timeStyle: 'medium'
                    }).format(new Date())
                }`;

        } catch (error) {
            console.error(error);

            marcarApi(false);

            registros = [];

            renderizarResumen();
            renderizarFiltros();

            cuerpo.innerHTML =
                '<tr><td colspan="6" class="estado-vacio">' +
                'No se pudo consultar el registro de auditor\u00eda.' +
                '</td></tr>';
        }
    }

    function limpiarFiltros() {
        $('#buscarAuditoria').value = '';
        $('#filtroModuloAuditoria').value = '';
        $('#filtroAccionAuditoria').value = '';
        $('#filtroAuditoriaDesde').value = '';
        $('#filtroAuditoriaHasta').value = '';

        renderizarTabla();
    }

    document.addEventListener('DOMContentLoaded', () => {
        [
            '#buscarAuditoria',
            '#filtroModuloAuditoria',
            '#filtroAccionAuditoria',
            '#filtroAuditoriaDesde',
            '#filtroAuditoriaHasta'
        ].forEach(selector => {
            const elemento = $(selector);

            elemento?.addEventListener(
                selector === '#buscarAuditoria' ? 'input' : 'change',
                renderizarTabla
            );
        });

        $('#btnActualizarAuditoria')?.addEventListener(
            'click',
            cargarAuditoria
        );

        $('#btnLimpiarAuditoria')?.addEventListener(
            'click',
            limpiarFiltros
        );

        $('#btnExportarAuditoria')?.addEventListener(
            'click',
            exportarCsv
        );

        cargarAuditoria();
    });
})();
