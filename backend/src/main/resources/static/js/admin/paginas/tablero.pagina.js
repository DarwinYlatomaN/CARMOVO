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

    function renderizarVehiculos(vehiculos) {
        const cuerpo = document.getElementById('tablaVehiculosRecientes');

        if (!cuerpo) return;

        const ultimos = [...vehiculos]
            .sort((a, b) => (b.idVehiculo || 0) - (a.idVehiculo || 0))
            .slice(0, 5);

        if (!ultimos.length) {
            cuerpo.innerHTML = `
                <tr>
                    <td colspan="5" class="estado-vacio">
                        No hay vehículos registrados todavía.
                    </td>
                </tr>
            `;
            return;
        }

        cuerpo.innerHTML = ultimos.map(vehiculo => `
            <tr>
                <td>#${escapar(vehiculo.idVehiculo ?? '-')}</td>

                <td>
                    <strong>
                        ${escapar(vehiculo.marca || '-')}
                        ${escapar(vehiculo.modelo || '')}
                    </strong>
                </td>

                <td>${escapar(vehiculo.categoria || '-')}</td>

                <td>
                    S/ ${Number(vehiculo.precioDia || 0).toFixed(2)}
                </td>

                <td>
                    <span class="badge-estado ${claseEstado(vehiculo.estado)}">
                        ${escapar(vehiculo.estado || 'Sin estado')}
                    </span>
                </td>
            </tr>
        `).join('');
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

    document.addEventListener('DOMContentLoaded', cargarTablero);
})();
