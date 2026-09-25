(function () {
    let vehiculos = [];
    let vehiculoEditandoId = null;

    const $ = selector => document.querySelector(selector);
    const normalizar = valor => String(valor || '').trim().toLowerCase();

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
        return ['disponible', 'alquilado', 'reservado', 'mantenimiento'].includes(valor) ? valor : '';
    }

    function marcarApi(conectada) {
        const estado = $('#estadoApi');
        if (!estado) return;
        estado.classList.remove('conectado', 'desconectado');
        estado.classList.add(conectada ? 'conectado' : 'desconectado');
        estado.querySelector('span').textContent = conectada ? 'API conectada' : 'API desconectada';
    }

    function notificar(mensaje, tipo = 'exito') {
        const caja = $('#notificacionAdmin');
        caja.textContent = mensaje;
        caja.className = `notificacion-admin visible ${tipo}`;
        clearTimeout(notificar.temporizador);
        notificar.temporizador = setTimeout(() => {
            caja.classList.remove('visible');
        }, 3000);
    }

    function resolverImagen(ruta) {
        if (!ruta) return '';
        if (/^(https?:|data:|blob:)/i.test(ruta)) return ruta;
        if (ruta.startsWith('../recursos/')) return `../../sitio-publico/${ruta.slice(3)}`;
        if (ruta.startsWith('recursos/')) return `../../sitio-publico/${ruta}`;
        return ruta;
    }

    function obtenerFiltrados() {
        const texto = normalizar($('#buscarVehiculo').value);
        const estado = normalizar($('#filtroEstado').value);
        const categoria = normalizar($('#filtroCategoria').value);

        return vehiculos.filter(v => {
            const coincideTexto = !texto || [v.idVehiculo, v.marca, v.modelo, v.categoria, v.transmision]
                .some(valor => normalizar(valor).includes(texto));
            const coincideEstado = !estado || normalizar(v.estado) === estado;
            const coincideCategoria = !categoria || normalizar(v.categoria) === categoria;
            return coincideTexto && coincideEstado && coincideCategoria;
        });
    }

    function renderizarResumen() {
        $('#resumenTotal').textContent = vehiculos.length;
        $('#resumenDisponibles').textContent = vehiculos.filter(v => normalizar(v.estado) === 'disponible').length;
        $('#resumenNoDisponibles').textContent = vehiculos.filter(v => normalizar(v.estado) !== 'disponible').length;
    }

    function cargarCategorias() {
        const select = $('#filtroCategoria');
        const actual = select.value;
        const categorias = [...new Set(vehiculos.map(v => v.categoria).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'es'));

        select.innerHTML = '<option value="">Todas las categorías</option>' +
            categorias.map(c => `<option value="${escapar(c)}">${escapar(c)}</option>`).join('');
        select.value = actual;
    }

    function renderizarTabla() {
        const cuerpo = $('#tablaFlota');
        const filtrados = obtenerFiltrados();
        $('#cantidadResultados').textContent = `${filtrados.length} resultado${filtrados.length === 1 ? '' : 's'}`;

        if (!filtrados.length) {
            cuerpo.innerHTML = '<tr><td colspan="8" class="estado-vacio">No se encontraron vehículos con los filtros seleccionados.</td></tr>';
            return;
        }

        cuerpo.innerHTML = filtrados.map(v => {
            const imagen = resolverImagen(v.imagen);
            const imagenHtml = imagen
                ? `<img class="vehiculo-info__imagen" src="${escapar(imagen)}" alt="${escapar(v.marca)} ${escapar(v.modelo)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';"><span class="vehiculo-info__sin-imagen" style="display:none"><i class="fa-solid fa-car"></i></span>`
                : '<span class="vehiculo-info__sin-imagen"><i class="fa-solid fa-car"></i></span>';

            return `
                <tr>
                    <td>#${escapar(v.idVehiculo)}</td>
                    <td>
                        <div class="vehiculo-info">
                            ${imagenHtml}
                            <div>
                                <strong>${escapar(v.marca)} ${escapar(v.modelo)}</strong>
                                <small>${escapar(v.transmision || 'Sin transmisión')}</small>
                            </div>
                        </div>
                    </td>
                    <td>${escapar(v.categoria)}</td>
                    <td>${escapar(v.pasajeros)}</td>
                    <td>S/ ${Number(v.precioDia || 0).toFixed(2)}</td>
                    <td><span class="badge-estado ${claseEstado(v.estado)}">${escapar(v.estado || 'Sin estado')}</span></td>
                    <td>${escapar(v.transmision)}</td>
                    <td>
                        <div class="acciones-tabla">
                            <button class="boton-icono editar" type="button" data-accion="editar" data-id="${v.idVehiculo}" title="Editar vehículo"><i class="fa-solid fa-pen"></i></button>
                            <button class="boton-icono eliminar" type="button" data-accion="eliminar" data-id="${v.idVehiculo}" title="Eliminar vehículo"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    }

    async function cargarVehiculos() {
        const cuerpo = $('#tablaFlota');
        cuerpo.innerHTML = '<tr><td colspan="8" class="estado-vacio">Cargando vehículos...</td></tr>';

        try {
            vehiculos = await window.CarmovoAdminApi.listarVehiculos();
            marcarApi(true);
            renderizarResumen();
            cargarCategorias();
            renderizarTabla();
        } catch (error) {
            console.error(error);
            marcarApi(false);
            cuerpo.innerHTML = '<tr><td colspan="8" class="estado-vacio"><i class="fa-solid fa-triangle-exclamation"></i>No se pudo conectar con el backend. Ejecuta Spring Boot en el puerto 8080.</td></tr>';
        }
    }

    function abrirModal(vehiculo = null) {
        vehiculoEditandoId = vehiculo?.idVehiculo ?? null;
        $('#tituloModalVehiculo').textContent = vehiculo ? 'Editar vehículo' : 'Registrar vehículo';
        $('#btnGuardarVehiculo').innerHTML = vehiculo
            ? '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios'
            : '<i class="fa-solid fa-plus"></i> Registrar vehículo';

        $('#vehiculoMarca').value = vehiculo?.marca ?? '';
        $('#vehiculoModelo').value = vehiculo?.modelo ?? '';
        $('#vehiculoCategoria').value = vehiculo?.categoria ?? '';
        $('#vehiculoPrecio').value = vehiculo?.precioDia ?? '';
        $('#vehiculoPasajeros').value = vehiculo?.pasajeros ?? '';
        $('#vehiculoTransmision').value = vehiculo?.transmision ?? 'Automático';
        $('#vehiculoEstado').value = vehiculo?.estado ?? 'Disponible';
        $('#vehiculoImagen').value = vehiculo?.imagen ?? '';

        $('#modalVehiculo').classList.add('abierto');
        document.body.style.overflow = 'hidden';
        setTimeout(() => $('#vehiculoMarca').focus(), 50);
    }

    function cerrarModal() {
        $('#modalVehiculo').classList.remove('abierto');
        document.body.style.overflow = '';
        $('#formVehiculo').reset();
        vehiculoEditandoId = null;
    }

    async function guardarVehiculo(evento) {
        evento.preventDefault();

        const datos = {
            marca: $('#vehiculoMarca').value.trim(),
            modelo: $('#vehiculoModelo').value.trim(),
            categoria: $('#vehiculoCategoria').value,
            precioDia: Number($('#vehiculoPrecio').value),
            pasajeros: Number($('#vehiculoPasajeros').value),
            transmision: $('#vehiculoTransmision').value,
            estado: $('#vehiculoEstado').value,
            imagen: $('#vehiculoImagen').value.trim() || null
        };

        const boton = $('#btnGuardarVehiculo');
        boton.disabled = true;
        const contenidoOriginal = boton.innerHTML;
        boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        try {
            if (vehiculoEditandoId) {
                await window.CarmovoAdminApi.actualizarVehiculo(vehiculoEditandoId, datos);
                notificar('Vehículo actualizado correctamente.');
            } else {
                await window.CarmovoAdminApi.crearVehiculo(datos);
                notificar('Vehículo registrado correctamente.');
            }

            cerrarModal();
            await cargarVehiculos();
        } catch (error) {
            console.error(error);
            marcarApi(false);
            notificar('No se pudo guardar el vehículo. Revisa el backend y los datos.', 'error');
        } finally {
            boton.disabled = false;
            boton.innerHTML = contenidoOriginal;
        }
    }

    async function eliminarVehiculo(id) {
        const vehiculo = vehiculos.find(v => String(v.idVehiculo) === String(id));
        if (!vehiculo) return;

        const confirmar = window.confirm(`¿Eliminar ${vehiculo.marca} ${vehiculo.modelo}? Esta acción no se puede deshacer.`);
        if (!confirmar) return;

        try {
            await window.CarmovoAdminApi.eliminarVehiculo(id);
            notificar('Vehículo eliminado correctamente.');
            await cargarVehiculos();
        } catch (error) {
            console.error(error);
            notificar('No se pudo eliminar el vehículo.', 'error');
        }
    }

    function prepararEventos() {
        $('#btnNuevoVehiculo').addEventListener('click', () => abrirModal());
        $('#btnCerrarModal').addEventListener('click', cerrarModal);
        $('#btnCancelarVehiculo').addEventListener('click', cerrarModal);
        $('#formVehiculo').addEventListener('submit', guardarVehiculo);
        $('#buscarVehiculo').addEventListener('input', renderizarTabla);
        $('#filtroEstado').addEventListener('change', renderizarTabla);
        $('#filtroCategoria').addEventListener('change', renderizarTabla);
        $('#btnRecargarFlota').addEventListener('click', cargarVehiculos);

        $('#modalVehiculo').addEventListener('click', evento => {
            if (evento.target.id === 'modalVehiculo') cerrarModal();
        });

        $('#tablaFlota').addEventListener('click', evento => {
            const boton = evento.target.closest('[data-accion]');
            if (!boton) return;
            const id = boton.dataset.id;

            if (boton.dataset.accion === 'editar') {
                const vehiculo = vehiculos.find(v => String(v.idVehiculo) === String(id));
                if (vehiculo) abrirModal(vehiculo);
            }

            if (boton.dataset.accion === 'eliminar') {
                eliminarVehiculo(id);
            }
        });

        document.addEventListener('keydown', evento => {
            if (evento.key === 'Escape' && $('#modalVehiculo').classList.contains('abierto')) cerrarModal();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        prepararEventos();
        cargarVehiculos();
    });
})();
