
(function () {
    const $ = selector => document.querySelector(selector);

    let alquileres = [];
    let usuarios = [];
    let vehiculos = [];
    let alquilerEditandoId = null;

    const CAMPOS = {
        idUsuario: 'alquilerUsuario',
        idVehiculo: 'alquilerVehiculo',
        fechaInicio: 'alquilerFechaInicio',
        fechaFin: 'alquilerFechaFin',
        lugarRecogida: 'alquilerLugarRecogida',
        lugarEntrega: 'alquilerLugarEntrega',
        metodoPago: 'alquilerMetodoPago',
        estado: 'alquilerEstado',
        observaciones: 'alquilerObservaciones',
        fechasValidas: 'alquilerFechaFin',
        observacionesValidas: 'alquilerObservaciones'
    };

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

    function notificar(mensaje, tipo = 'exito') {
        const caja = $('#notificacionAlquiler');
        if (!caja) return;

        caja.textContent = mensaje;
        caja.className = `notificacion-alquiler visible ${tipo}`;

        clearTimeout(notificar.temporizador);

        notificar.temporizador = setTimeout(() => {
            caja.className = 'notificacion-alquiler';
        }, 3500);
    }

    function mostrarErrorCampo(idCampo, mensaje) {
        const campo = document.getElementById(idCampo);
        const mensajeError = document.getElementById(
            `error${idCampo.charAt(0).toUpperCase()}${idCampo.slice(1)}`
        );

        if (!campo || !mensajeError) return;

        campo.setAttribute('aria-invalid', 'true');
        mensajeError.textContent = mensaje;
        mensajeError.hidden = false;
    }

    function limpiarErrorCampo(idCampo) {
        const campo = document.getElementById(idCampo);
        const mensajeError = document.getElementById(
            `error${idCampo.charAt(0).toUpperCase()}${idCampo.slice(1)}`
        );

        if (campo) {
            campo.removeAttribute('aria-invalid');
        }

        if (mensajeError) {
            mensajeError.textContent = '';
            mensajeError.hidden = true;
        }
    }

    function limpiarErroresFormulario() {
        Object.values(CAMPOS).forEach(limpiarErrorCampo);
    }

    function mostrarErroresBackend(errores) {
        if (!errores || typeof errores !== 'object') {
            return false;
        }

        let encontrados = false;

        Object.entries(errores).forEach(([campo, mensaje]) => {
            const idCampo = CAMPOS[campo];

            if (!idCampo) return;

            mostrarErrorCampo(idCampo, String(mensaje));
            encontrados = true;
        });

        return encontrados;
    }

    function contarPalabras(texto) {
        const contenido = String(texto ?? '').trim();

        if (!contenido) return 0;

        return contenido.split(/\s+/).length;
    }

    function validarFormulario(datos) {
        limpiarErroresFormulario();

        let valido = true;

        function error(campo, mensaje) {
            mostrarErrorCampo(campo, mensaje);
            valido = false;
        }

        if (!Number.isInteger(datos.idUsuario) || datos.idUsuario <= 0) {
            error('alquilerUsuario', 'Debes seleccionar un cliente v\u00e1lido.');
        }

        if (!Number.isInteger(datos.idVehiculo) || datos.idVehiculo <= 0) {
            error('alquilerVehiculo', 'Debes seleccionar un veh\u00edculo v\u00e1lido.');
        }

        if (!datos.fechaInicio) {
            error('alquilerFechaInicio', 'La fecha de inicio es obligatoria.');
        }

        if (!datos.fechaFin) {
            error('alquilerFechaFin', 'La fecha de finalizaci\u00f3n es obligatoria.');
        }

        if (
            datos.fechaInicio &&
            datos.fechaFin &&
            datos.fechaFin < datos.fechaInicio
        ) {
            error(
                'alquilerFechaFin',
                'La fecha de finalizaci\u00f3n no puede ser anterior a la fecha de inicio.'
            );
        }

        if (!datos.lugarRecogida) {
            error('alquilerLugarRecogida', 'Debes seleccionar un lugar de recogida.');
        } else if (datos.lugarRecogida.length > 150) {
            error(
                'alquilerLugarRecogida',
                'El lugar de recogida no puede superar los 150 caracteres.'
            );
        }

        if (!datos.lugarEntrega) {
            error('alquilerLugarEntrega', 'Debes seleccionar un lugar de entrega.');
        } else if (datos.lugarEntrega.length > 150) {
            error(
                'alquilerLugarEntrega',
                'El lugar de entrega no puede superar los 150 caracteres.'
            );
        }

        if (!datos.metodoPago) {
            error('alquilerMetodoPago', 'Debes seleccionar un m\u00e9todo de pago.');
        }

        if (!datos.estado) {
            error('alquilerEstado', 'Debes seleccionar un estado.');
        }

        if (contarPalabras(datos.observaciones) > 200) {
            error(
                'alquilerObservaciones',
                'Las observaciones no pueden superar las 200 palabras.'
            );
        }

        if (!valido) {
            const primerCampoInvalido = $(
                '#formAlquiler [aria-invalid="true"]'
            );

            primerCampoInvalido?.focus();
        }

        return valido;
    }

    function formatearFecha(fecha) {
        if (!fecha) return '\u2014';

        const [anio, mes, dia] = String(fecha)
            .split('-')
            .map(Number);

        if (!anio || !mes || !dia) {
            return escapar(fecha);
        }

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
        const valor = normalizar(estado).replaceAll(' ', '-');

        return [
            'pendiente',
            'confirmado',
            'en-curso',
            'finalizado',
            'cancelado'
        ].includes(valor) ? valor : '';
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

            const coincideEstado = !estado ||
                normalizar(alquiler.estado) === estado;

            return coincideTexto && coincideEstado;
        });
    }

    function renderizarResumen() {
        $('#resumenAlquileresTotal').textContent = alquileres.length;

        $('#resumenAlquileresPendientes').textContent =
            alquileres.filter(
                alquiler => normalizar(alquiler.estado) === 'pendiente'
            ).length;

        $('#resumenAlquileresCurso').textContent =
            alquileres.filter(
                alquiler => normalizar(alquiler.estado) === 'en curso'
            ).length;

        $('#resumenAlquileresFinalizados').textContent =
            alquileres.filter(
                alquiler => normalizar(alquiler.estado) === 'finalizado'
            ).length;
    }

    function renderizarTabla() {
        const cuerpo = $('#tablaAlquileres');
        const filtrados = obtenerFiltrados();

        $('#cantidadAlquileres').textContent =
            `${filtrados.length} resultado${filtrados.length === 1 ? '' : 's'}`;

        if (!filtrados.length) {
            cuerpo.innerHTML = `
                <tr>
                    <td colspan="8" class="estado-vacio">
                        No se encontraron alquileres con los filtros seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        cuerpo.innerHTML = filtrados.map(alquiler => `
            <tr>
                <td>#${escapar(alquiler.idAlquiler)}</td>

                <td>
                    <div class="alquiler-cliente">
                        <strong>${escapar(alquiler.cliente)}</strong>
                        <small>${escapar(alquiler.correoCliente || '\u2014')}</small>
                    </div>
                </td>

                <td>
                    <div class="alquiler-vehiculo">
                        <strong>${escapar(alquiler.vehiculo)}</strong>
                        <small>${escapar(alquiler.categoriaVehiculo || '\u2014')}</small>
                    </div>
                </td>

                <td>
                    <div class="alquiler-periodo">
                        <strong>
                            ${formatearFecha(alquiler.fechaInicio)}
                            \u2014
                            ${formatearFecha(alquiler.fechaFin)}
                        </strong>
                        <small>
                            ${escapar(alquiler.dias)}
                            d\u00eda${Number(alquiler.dias) === 1 ? '' : 's'}
                        </small>
                    </div>
                </td>

                <td>
                    <div class="alquiler-sedes">
                        <strong>${escapar(alquiler.lugarRecogida)}</strong>
                        <small>
                            Entrega: ${escapar(alquiler.lugarEntrega)}
                        </small>
                    </div>
                </td>

                <td>
                    <span class="alquiler-total">
                        ${formatearMoneda(alquiler.total)}
                    </span>
                </td>

                <td>
                    <span class="badge-estado ${claseEstado(alquiler.estado)}">
                        ${escapar(alquiler.estado)}
                    </span>
                </td>

                <td>
                    <div class="acciones-alquiler">
                        <button
                            class="boton-alquiler-icono editar"
                            type="button"
                            data-accion="editar"
                            data-id="${escapar(alquiler.idAlquiler)}"
                            title="Editar alquiler"
                            aria-label="Editar alquiler"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            class="boton-alquiler-icono eliminar"
                            type="button"
                            data-accion="eliminar"
                            data-id="${escapar(alquiler.idAlquiler)}"
                            title="Eliminar alquiler"
                            aria-label="Eliminar alquiler"
                        >
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

        const clientes = usuarios.filter(usuario =>
            usuario.estado === true &&
            normalizar(usuario.nombrePerfil) === 'cliente'
        );

        select.innerHTML =
            '<option value="" disabled>Seleccionar cliente</option>' +
            clientes.map(usuario => `
                <option value="${escapar(usuario.idUsuario)}">
                    ${escapar(usuario.nombres)}
                    ${escapar(usuario.apellidos)}
                    \u2014
                    ${escapar(usuario.correo)}
                </option>
            `).join('');

        if (clientes.some(
            usuario => String(usuario.idUsuario) === String(actual)
        )) {
            select.value = actual;
        } else {
            select.value = '';
        }
    }

    function cargarSelectVehiculos() {
        const select = $('#alquilerVehiculo');
        const actual = select.value;

        select.innerHTML =
            '<option value="" disabled>Seleccionar veh\u00edculo</option>' +
            vehiculos.map(vehiculo => `
                <option value="${escapar(vehiculo.idVehiculo)}">
                    ${escapar(vehiculo.marca)}
                    ${escapar(vehiculo.modelo)}
                    \u2014
                    ${escapar(vehiculo.estado)}
                    \u2014
                    ${formatearMoneda(vehiculo.precioDia)}/d\u00eda
                </option>
            `).join('');

        if (vehiculos.some(
            vehiculo => String(vehiculo.idVehiculo) === String(actual)
        )) {
            select.value = actual;
        } else {
            select.value = '';
        }
    }

    async function cargarDatos() {
        const cuerpo = $('#tablaAlquileres');

        cuerpo.innerHTML = `
            <tr>
                <td colspan="8" class="estado-vacio">
                    Cargando alquileres...
                </td>
            </tr>
        `;

        try {
            const [
                alquileresRespuesta,
                usuariosRespuesta,
                vehiculosRespuesta
            ] = await Promise.all([
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
                        No se pudo cargar Gesti\u00f3n de Alquileres.
                        Verifica que Spring Boot est\u00e9 ejecut\u00e1ndose
                        y que la tabla de alquileres exista en MySQL.
                    </td>
                </tr>
            `;

            notificar(
                error.message || 'No se pudo conectar con el backend.',
                'error'
            );
        }
    }

    function ponerFechaMinima() {
        const hoy = new Date();

        const local = new Date(
            hoy.getTime() - hoy.getTimezoneOffset() * 60000
        ).toISOString().slice(0, 10);

        $('#alquilerFechaInicio').min = local;
        $('#alquilerFechaFin').min = local;
    }

    function actualizarMinimoFechaFin() {
        const fechaInicio = $('#alquilerFechaInicio').value;
        const minimoInicio = $('#alquilerFechaInicio').min;

        $('#alquilerFechaFin').min = fechaInicio || minimoInicio;
    }

    function abrirModal(alquiler = null) {
        alquilerEditandoId = alquiler?.idAlquiler ?? null;

        const editando = Boolean(alquiler);

        $('#tituloModalAlquiler').textContent = editando
            ? `Editar alquiler #${alquiler.idAlquiler}`
            : 'Registrar alquiler';

        $('#btnGuardarAlquiler').innerHTML = editando
            ? '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios'
            : '<i class="fa-solid fa-calendar-plus"></i> Registrar alquiler';

        $('#formAlquiler').reset();
        limpiarErroresFormulario();

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

        actualizarMinimoFechaFin();

        $('#modalAlquiler').classList.add('abierto');
    }

    function cerrarModal() {
        $('#modalAlquiler').classList.remove('abierto');
        alquilerEditandoId = null;
        limpiarErroresFormulario();
    }

    function datosFormulario() {
        return {
            idUsuario: Number($('#alquilerUsuario').value),
            idVehiculo: Number($('#alquilerVehiculo').value),
            fechaInicio: $('#alquilerFechaInicio').value,
            fechaFin: $('#alquilerFechaFin').value,
            lugarRecogida: $('#alquilerLugarRecogida').value,
            lugarEntrega: $('#alquilerLugarEntrega').value,
            metodoPago: $('#alquilerMetodoPago').value,
            estado: $('#alquilerEstado').value,
            observaciones: $('#alquilerObservaciones').value.trim() || null
        };
    }

    async function guardarAlquiler(evento) {
        evento.preventDefault();

        const datos = datosFormulario();

        if (!validarFormulario(datos)) {
            notificar('Revisa los campos se\u00f1alados en el formulario.', 'error');
            return;
        }

        const boton = $('#btnGuardarAlquiler');
        const original = boton.innerHTML;

        boton.disabled = true;
        boton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        try {
            if (alquilerEditandoId !== null) {
                await window.CarmovoAdminApi.actualizarAlquiler(
                    alquilerEditandoId,
                    datos
                );

                notificar('Alquiler actualizado correctamente.');

            } else {
                await window.CarmovoAdminApi.crearAlquiler(datos);

                notificar('Alquiler registrado correctamente.');
            }

            cerrarModal();
            await cargarDatos();

        } catch (error) {
            console.error(error);

            if (error.status === 400 && error.errores) {
                const encontrados = mostrarErroresBackend(error.errores);

                if (encontrados) {
                    $('#formAlquiler [aria-invalid="true"]')?.focus();
                }

                notificar(
                    encontrados
                        ? 'Revisa los campos se\u00f1alados en el formulario.'
                        : error.message || 'Datos de alquiler no v\u00e1lidos.',
                    'error'
                );

            } else if (error.status === 409) {
                mostrarErrorCampo(
                    'alquilerVehiculo',
                    'Este veh\u00edculo tiene un alquiler que coincide con las fechas seleccionadas.'
                );

                notificar(
                    error.message ||
                    'El veh\u00edculo no est\u00e1 disponible para esas fechas.',
                    'error'
                );

            } else {
                notificar(
                    error.message || 'No se pudo guardar el alquiler.',
                    'error'
                );
            }

        } finally {
            boton.disabled = false;
            boton.innerHTML = original;
        }
    }

    async function eliminarAlquiler(id) {
        const alquiler = alquileres.find(
            item => String(item.idAlquiler) === String(id)
        );

        if (!alquiler) return;

        const confirmar = window.confirm(
            `\u00bfEliminar el alquiler #${alquiler.idAlquiler} de ${alquiler.cliente}? Solo se permite si est\u00e1 Pendiente o Cancelado.`
        );

        if (!confirmar) return;

        try {
            await window.CarmovoAdminApi.eliminarAlquiler(id);

            notificar('Alquiler eliminado correctamente.');
            await cargarDatos();

        } catch (error) {
            console.error(error);

            notificar(
                error.message || 'No se pudo eliminar el alquiler.',
                'error'
            );
        }
    }

    function prepararEventos() {
        $('#btnNuevoAlquiler').addEventListener(
            'click',
            () => abrirModal()
        );

        $('#btnCerrarModalAlquiler').addEventListener('click', cerrarModal);
        $('#btnCancelarAlquiler').addEventListener('click', cerrarModal);
        $('#formAlquiler').addEventListener('submit', guardarAlquiler);

        $('#buscarAlquiler').addEventListener('input', renderizarTabla);
        $('#filtroEstadoAlquiler').addEventListener('change', renderizarTabla);
        $('#btnRecargarAlquileres').addEventListener('click', cargarDatos);

        $('#alquilerFechaInicio').addEventListener('change', () => {
            actualizarMinimoFechaFin();
            limpiarErrorCampo('alquilerFechaInicio');
            limpiarErrorCampo('alquilerFechaFin');
        });

        Object.values(CAMPOS).forEach(idCampo => {
            const campo = document.getElementById(idCampo);

            if (!campo) return;

            campo.addEventListener('input', () => {
                limpiarErrorCampo(idCampo);
            });

            campo.addEventListener('change', () => {
                limpiarErrorCampo(idCampo);
            });
        });

        $('#modalAlquiler').addEventListener('click', evento => {
            if (evento.target.id === 'modalAlquiler') {
                cerrarModal();
            }
        });

        $('#tablaAlquileres').addEventListener('click', evento => {
            const boton = evento.target.closest('[data-accion]');

            if (!boton) return;

            const id = boton.dataset.id;

            if (boton.dataset.accion === 'editar') {
                const alquiler = alquileres.find(
                    item => String(item.idAlquiler) === String(id)
                );

                if (alquiler) {
                    abrirModal(alquiler);
                }
            }

            if (boton.dataset.accion === 'eliminar') {
                eliminarAlquiler(id);
            }
        });

        document.addEventListener('keydown', evento => {
            if (
                evento.key === 'Escape' &&
                $('#modalAlquiler').classList.contains('abierto')
            ) {
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
