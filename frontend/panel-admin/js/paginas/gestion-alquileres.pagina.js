(function () {
    const $ = selector => document.querySelector(selector);
    let alquileres = [];
    let usuarios = [];
    let vehiculos = [];
    let alquilerEditandoId = null;

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
        if (texto) texto.textContent = conectada ? 'API conectada' : 'API desconectada';
    }

    function notificar(mensaje, tipo = 'exito') {
        const caja = $('#notificacionAlquiler');
        caja.textContent = mensaje;
        caja.className = `notificacion-alquiler visible ${tipo}`;
        clearTimeout(notificar.temporizador);
        notificar.temporizador = setTimeout(() => {
            caja.className = 'notificacion-alquiler';
        }, 3500);
    }

    function formatearFecha(fecha) {
        if (!fecha) return '—';
        const [anio, mes, dia] = String(fecha).split('-').map(Number);
        if (!anio || !mes || !dia) return escapar(fecha);
        return new Intl.DateTimeFormat('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(new Date(anio, mes - 1, dia));
    }

    function formatearMoneda(valor) {
        const numero = Number(valor || 0);
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'PEN'
        }).format(numero);
    }

    function claseEstado(estado) {
        return normalizar(estado).replaceAll(' ', '-');
    }

    function obtenerFiltrados() {
        const texto = normalizar($('#buscarAlquiler').value);
        const estado = normalizar($('#filtroEstadoAlquiler').value);

        return alquileres.filter(alquiler => {
            const coincideTexto = !texto || [
                alquiler.idAlquiler,
                alquiler.cliente,
                alquiler.correoCliente,
                alquiler.vehiculo,
                alquiler.categoriaVehiculo,
                alquiler.lugarRecogida,
                alquiler.lugarEntrega
            ].some(valor => normalizar(valor).includes(texto));

            const coincideEstado = !estado || normalizar(alquiler.estado) === estado;
            return coincideTexto && coincideEstado;
        });
    }

    function renderizarResumen() {
        $('#resumenAlquileresTotal').textContent = alquileres.length;
        $('#resumenAlquileresPendientes').textContent = alquileres.filter(a => normalizar(a.estado) === 'pendiente').length;
        $('#resumenAlquileresCurso').textContent = alquileres.filter(a => normalizar(a.estado) === 'en curso').length;
        $('#resumenAlquileresFinalizados').textContent = alquileres.filter(a => normalizar(a.estado) === 'finalizado').length;
    }

    function renderizarTabla() {
        const cuerpo = $('#tablaAlquileres');
        const filtrados = obtenerFiltrados();
        $('#cantidadAlquileres').textContent = `${filtrados.length} resultado${filtrados.length === 1 ? '' : 's'}`;

        if (!filtrados.length) {
            cuerpo.innerHTML = '<tr><td colspan="8" class="estado-vacio">No se encontraron alquileres con los filtros seleccionados.</td></tr>';
            return;
        }

        cuerpo.innerHTML = filtrados.map(alquiler => `
            <tr>
                <td>#${escapar(alquiler.idAlquiler)}</td>
                <td>
                    <div class="alquiler-cliente">
                        <strong>${escapar(alquiler.cliente)}</strong>
                        <small>${escapar(alquiler.correoCliente || '—')}</small>
                    </div>
                </td>
                <td>
                    <div class="alquiler-vehiculo">
                        <strong>${escapar(alquiler.vehiculo)}</strong>
                        <small>${escapar(alquiler.categoriaVehiculo || '—')}</small>
                    </div>
                </td>
                <td>
                    <div class="alquiler-periodo">
                        <strong>${formatearFecha(alquiler.fechaInicio)} → ${formatearFecha(alquiler.fechaFin)}</strong>
                        <small>${escapar(alquiler.dias)} día${Number(alquiler.dias) === 1 ? '' : 's'}</small>
                    </div>
                </td>
                <td>
                    <div class="alquiler-sedes">
                        <strong>${escapar(alquiler.lugarRecogida)}</strong>
                        <small>Entrega: ${escapar(alquiler.lugarEntrega)}</small>
                    </div>
                </td>
                <td><span class="alquiler-total">${formatearMoneda(alquiler.total)}</span></td>
                <td><span class="badge-estado ${claseEstado(alquiler.estado)}">${escapar(alquiler.estado)}</span></td>
                <td>
                    <div class="acciones-alquiler">
                        <button class="boton-alquiler-icono editar" type="button" data-accion="editar" data-id="${alquiler.idAlquiler}" title="Editar alquiler" aria-label="Editar alquiler">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="boton-alquiler-icono eliminar" type="button" data-accion="eliminar" data-id="${alquiler.idAlquiler}" title="Eliminar alquiler" aria-label="Eliminar alquiler">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function cargarSelectClientes() {
        const select = $('#alquilerUsuario');
        const actual = select.value;
        const clientes = usuarios.filter(usuario => usuario.estado === true && normalizar(usuario.nombrePerfil) === 'cliente');

        select.innerHTML = '<option value="" disabled>Seleccionar cliente</option>' + clientes
            .map(usuario => `<option value="${usuario.idUsuario}">${escapar(usuario.nombres)} ${escapar(usuario.apellidos)} — ${escapar(usuario.correo)}</option>`)
            .join('');

        if (clientes.some(usuario => String(usuario.idUsuario) === String(actual))) {
            select.value = actual;
        }
    }

    function cargarSelectVehiculos() {
        const select = $('#alquilerVehiculo');
        const actual = select.value;
        select.innerHTML = '<option value="" disabled>Seleccionar vehículo</option>' + vehiculos
            .map(vehiculo => `<option value="${vehiculo.idVehiculo}">${escapar(vehiculo.marca)} ${escapar(vehiculo.modelo)} — ${escapar(vehiculo.estado)} — ${formatearMoneda(vehiculo.precioDia)}/día</option>`)
            .join('');

        if (vehiculos.some(vehiculo => String(vehiculo.idVehiculo) === String(actual))) {
            select.value = actual;
        }
    }

    async function cargarDatos() {
        const cuerpo = $('#tablaAlquileres');
        cuerpo.innerHTML = '<tr><td colspan="8" class="estado-vacio">Cargando alquileres...</td></tr>';

        try {
            const [alquileresRespuesta, usuariosRespuesta, vehiculosRespuesta] = await Promise.all([
                window.CarmovoAdminApi.listarAlquileres(),
                window.CarmovoAdminApi.listarUsuarios(),
                window.CarmovoAdminApi.listarVehiculos()
            ]);

            alquileres = alquileresRespuesta;
            usuarios = usuariosRespuesta;
            vehiculos = vehiculosRespuesta;
            marcarApi(true);
            cargarSelectClientes();
            cargarSelectVehiculos();
            renderizarResumen();
            renderizarTabla();
        } catch (error) {
            console.error(error);
            marcarApi(false);
            cuerpo.innerHTML = `
                <tr>
                    <td colspan="8" class="estado-vacio">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        No se pudo cargar Gestión de Alquileres. Verifica Spring Boot y que la tabla alquileres exista en PostgreSQL.
                    </td>
                </tr>`;
            notificar(error.message || 'No se pudo conectar con el backend.', 'error');
        }
    }

    function ponerFechaMinima() {
        const hoy = new Date();
        const local = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        $('#alquilerFechaInicio').min = local;
        $('#alquilerFechaFin').min = local;
    }

    function abrirModal(alquiler = null) {
        alquilerEditandoId = alquiler?.idAlquiler ?? null;
        const editando = Boolean(alquiler);

        $('#tituloModalAlquiler').textContent = editando ? `Editar alquiler #${alquiler.idAlquiler}` : 'Registrar alquiler';
        $('#btnGuardarAlquiler').innerHTML = editando
            ? '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios'
            : '<i class="fa-solid fa-calendar-plus"></i> Registrar alquiler';

        $('#formAlquiler').reset();
        cargarSelectClientes();
        cargarSelectVehiculos();
        $('#alquilerEstado').value = 'Pendiente';

        if (alquiler) {
            $('#alquilerUsuario').value = alquiler.idUsuario;
            $('#alquilerVehiculo').value = alquiler.idVehiculo;
            $('#alquilerFechaInicio').value = alquiler.fechaInicio || '';
            $('#alquilerFechaFin').value = alquiler.fechaFin || '';
            $('#alquilerLugarRecogida').value = alquiler.lugarRecogida || '';
            $('#alquilerLugarEntrega').value = alquiler.lugarEntrega || '';
            $('#alquilerMetodoPago').value = alquiler.metodoPago || '';
            $('#alquilerEstado').value = alquiler.estado || 'Pendiente';
            $('#alquilerObservaciones').value = alquiler.observaciones || '';
        }

        $('#modalAlquiler').classList.add('abierto');
    }

    function cerrarModal() {
        $('#modalAlquiler').classList.remove('abierto');
        alquilerEditandoId = null;
    }

    function datosFormulario() {
        return {
            idUsuario: Number($('#alquilerUsuario').value),
            idVehiculo: Number($('#alquilerVehiculo').value),
            fechaInicio: $('#alquilerFechaInicio').value,
            fechaFin: $('#alquilerFechaFin').value,
            lugarRecogida: $('#alquilerLugarRecogida').value,
            lugarEntrega: $('#alquilerLugarEntrega').value,
            metodoPago: $('#alquilerMetodoPago').value || null,
            estado: $('#alquilerEstado').value,
            observaciones: $('#alquilerObservaciones').value.trim() || null
        };
    }

    async function guardarAlquiler(evento) {
        evento.preventDefault();
        const datos = datosFormulario();

        if (!datos.idUsuario || !datos.idVehiculo || !datos.fechaInicio || !datos.fechaFin || !datos.lugarRecogida || !datos.lugarEntrega) {
            notificar('Completa los campos obligatorios.', 'error');
            return;
        }

        if (datos.fechaFin < datos.fechaInicio) {
            notificar('La fecha de fin no puede ser anterior a la fecha de inicio.', 'error');
            return;
        }

        const boton = $('#btnGuardarAlquiler');
        const original = boton.innerHTML;
        boton.disabled = true;
        boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        try {
            if (alquilerEditandoId) {
                await window.CarmovoAdminApi.actualizarAlquiler(alquilerEditandoId, datos);
                notificar('Alquiler actualizado correctamente.');
            } else {
                await window.CarmovoAdminApi.crearAlquiler(datos);
                notificar('Alquiler registrado correctamente.');
            }
            cerrarModal();
            await cargarDatos();
        } catch (error) {
            console.error(error);
            notificar(error.message || 'No se pudo guardar el alquiler.', 'error');
        } finally {
            boton.disabled = false;
            boton.innerHTML = original;
        }
    }

    async function eliminarAlquiler(id) {
        const alquiler = alquileres.find(item => String(item.idAlquiler) === String(id));
        if (!alquiler) return;

        const confirmar = window.confirm(`¿Eliminar el alquiler #${alquiler.idAlquiler} de ${alquiler.cliente}? Solo se permite si está Pendiente o Cancelado.`);
        if (!confirmar) return;

        try {
            await window.CarmovoAdminApi.eliminarAlquiler(id);
            notificar('Alquiler eliminado correctamente.');
            await cargarDatos();
        } catch (error) {
            console.error(error);
            notificar(error.message || 'No se pudo eliminar el alquiler.', 'error');
        }
    }

    function prepararEventos() {
        $('#btnNuevoAlquiler').addEventListener('click', () => abrirModal());
        $('#btnCerrarModalAlquiler').addEventListener('click', cerrarModal);
        $('#btnCancelarAlquiler').addEventListener('click', cerrarModal);
        $('#formAlquiler').addEventListener('submit', guardarAlquiler);
        $('#buscarAlquiler').addEventListener('input', renderizarTabla);
        $('#filtroEstadoAlquiler').addEventListener('change', renderizarTabla);
        $('#btnRecargarAlquileres').addEventListener('click', cargarDatos);

        $('#alquilerFechaInicio').addEventListener('change', () => {
            $('#alquilerFechaFin').min = $('#alquilerFechaInicio').value || $('#alquilerFechaFin').min;
        });

        $('#modalAlquiler').addEventListener('click', evento => {
            if (evento.target.id === 'modalAlquiler') cerrarModal();
        });

        $('#tablaAlquileres').addEventListener('click', evento => {
            const boton = evento.target.closest('[data-accion]');
            if (!boton) return;

            const id = boton.dataset.id;
            if (boton.dataset.accion === 'editar') {
                const alquiler = alquileres.find(item => String(item.idAlquiler) === String(id));
                if (alquiler) abrirModal(alquiler);
            }
            if (boton.dataset.accion === 'eliminar') {
                eliminarAlquiler(id);
            }
        });

        document.addEventListener('keydown', evento => {
            if (evento.key === 'Escape' && $('#modalAlquiler').classList.contains('abierto')) {
                cerrarModal();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        ponerFechaMinima();
        prepararEventos();
        cargarDatos();
    });
})();
