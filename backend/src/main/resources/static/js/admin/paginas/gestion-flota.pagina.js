
(function () {
    let vehiculos = [];
    let vehiculoEditandoId = null;

    const $ = selector => document.querySelector(selector);
    const normalizar = valor => String(valor || '').trim().toLowerCase();

    const camposFormulario = {
        marca: 'vehiculoMarca',
        modelo: 'vehiculoModelo',
        categoria: 'vehiculoCategoria',
        precioDia: 'vehiculoPrecio',
        pasajeros: 'vehiculoPasajeros',
        transmision: 'vehiculoTransmision',
        estado: 'vehiculoEstado',
        imagen: 'vehiculoImagen'
    };

    const mensajesFormulario = {
        marca: 'errorVehiculoMarca',
        modelo: 'errorVehiculoModelo',
        categoria: 'errorVehiculoCategoria',
        precioDia: 'errorVehiculoPrecio',
        pasajeros: 'errorVehiculoPasajeros',
        transmision: 'errorVehiculoTransmision',
        estado: 'errorVehiculoEstado',
        imagen: 'errorVehiculoImagen'
    };

    const patronLetras = /^\p{L}+(?: +\p{L}+)*$/u;

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

    function marcarApi(conectada) {
        const estado = $('#estadoApi');
        if (!estado) return;

        estado.classList.remove('conectado', 'desconectado');
        estado.classList.add(conectada ? 'conectado' : 'desconectado');

        const texto = estado.querySelector('span');

        if (texto) {
            texto.textContent = conectada
                ? 'API conectada'
                : 'API desconectada';
        }
    }

    function notificar(mensaje, tipo = 'exito') {
        const caja = $('#notificacionAdmin');
        if (!caja) return;

        caja.textContent = mensaje;
        caja.className = `notificacion-admin visible ${tipo}`;

        clearTimeout(notificar.temporizador);

        notificar.temporizador = setTimeout(() => {
            caja.classList.remove('visible');
        }, 3000);
    }

    function resolverImagen(ruta) {
        if (!ruta) return '';

        const valor = String(ruta).trim();

        if (/^(https?:|data:|blob:)/i.test(valor)) {
            return valor;
        }

        if (valor.startsWith('../recursos/')) {
            return '/' + valor.slice('../recursos/'.length);
        }

        if (valor.startsWith('recursos/')) {
            return '/' + valor.slice('recursos/'.length);
        }

        if (valor.startsWith('/recursos/')) {
            return valor.slice('/recursos'.length);
        }

        return valor;
    }

    function limpiarErrorCampo(nombre) {
        const campo = document.getElementById(camposFormulario[nombre]);
        const mensaje = document.getElementById(mensajesFormulario[nombre]);

        if (campo) {
            campo.removeAttribute('aria-invalid');
            campo.setCustomValidity('');
        }

        if (mensaje) {
            mensaje.textContent = '';
            mensaje.hidden = true;
        }
    }

    function mostrarErrorCampo(nombre, texto) {
        const campo = document.getElementById(camposFormulario[nombre]);
        const mensaje = document.getElementById(mensajesFormulario[nombre]);

        if (!campo || !mensaje) return;

        campo.setAttribute('aria-invalid', 'true');
        mensaje.textContent = texto;
        mensaje.hidden = false;
    }

    function limpiarErroresFormulario() {
        Object.keys(camposFormulario).forEach(limpiarErrorCampo);
    }

    function mostrarErroresFormulario(errores) {
        let primerCampo = null;

        Object.entries(errores).forEach(([nombre, mensaje]) => {
            if (!Object.hasOwn(camposFormulario, nombre)) return;

            mostrarErrorCampo(nombre, mensaje);

            if (!primerCampo) {
                primerCampo = document.getElementById(camposFormulario[nombre]);
            }
        });

        if (primerCampo) {
            primerCampo.focus();
        }

        return Boolean(primerCampo);
    }

    function validarNombreVehiculo(nombre, etiqueta, maximo) {
        const valor = document.getElementById(camposFormulario[nombre]).value.trim();
        const cantidadLetras = (valor.match(/\p{L}/gu) || []).length;

        if (!valor) {
            return `La ${etiqueta} es obligatoria.`;
        }

        if (valor.length > maximo) {
            return `La ${etiqueta} no puede superar los ${maximo} caracteres.`;
        }

        if (!patronLetras.test(valor) || cantidadLetras < 3) {
            return `La ${etiqueta} debe contener al menos 3 letras y no puede incluir números ni símbolos.`;
        }

        return null;
    }

    function validarImagen(valor) {
        if (!valor) return null;

        if (valor.length > 255) {
            return 'La ruta o URL de imagen no puede superar los 255 caracteres.';
        }

        if (/^https?:\/\//i.test(valor)) {
            try {
                const url = new URL(valor);

                if (
                    !['http:', 'https:'].includes(url.protocol) ||
                    !url.hostname ||
                    /\s/.test(valor)
                ) {
                    return 'Ingresa una URL HTTP(S) válida.';
                }

                return null;
            } catch (_) {
                return 'Ingresa una URL HTTP(S) válida.';
            }
        }

        const patronRuta =
            /^(?:(?:\.\.\/)?recursos\/[A-Za-z0-9_./-]+|\/recursos\/[A-Za-z0-9_./-]+|\/[A-Za-z0-9_./-]+)$/;

        if (
            !patronRuta.test(valor) ||
            valor.includes('..\\') ||
            valor.includes('/../') ||
            valor.endsWith('/..')
        ) {
            return 'Ingresa una URL HTTP(S) o una ruta local de imagen válida.';
        }

        return null;
    }

    function validarFormulario() {
        const errores = {};

        const errorMarca = validarNombreVehiculo('marca', 'marca', 60);
        const errorModelo = validarNombreVehiculo('modelo', 'modelo', 80);

        if (errorMarca) errores.marca = errorMarca;
        if (errorModelo) errores.modelo = errorModelo;

        const categoria = $('#vehiculoCategoria').value;

        const categoriasPermitidas = [
            'Económicos',
            'Sedanes',
            'SUVs',
            'Pick-ups 4x4',
            'Minivans',
            'Todoterreno',
            'Crossovers',
            'Furgonetas',
            'Híbridos',
            'Premium / Lujo',
            'Eventos'
        ];

        if (!categoriasPermitidas.includes(categoria)) {
            errores.categoria = 'Selecciona una categoría válida.';
        }

        const precioTexto = $('#vehiculoPrecio').value.trim();
        const precio = Number(precioTexto);

        if (!precioTexto) {
            errores.precioDia = 'El precio por día es obligatorio.';
        } else if (
            !Number.isFinite(precio) ||
            precio < 0.01 ||
            !/^\d+(?:\.\d{1,2})?$/.test(precioTexto)
        ) {
            errores.precioDia =
                'El precio debe ser mayor que cero y tener como máximo 2 decimales.';
        } else if (precioTexto.split('.')[0].length > 10) {
            errores.precioDia =
                'El precio no puede superar los 10 dígitos enteros.';
        }

        const pasajerosTexto = $('#vehiculoPasajeros').value.trim();
        const pasajeros = Number(pasajerosTexto);

        if (!pasajerosTexto) {
            errores.pasajeros = 'La cantidad de pasajeros es obligatoria.';
        } else if (
            !/^\d+$/.test(pasajerosTexto) ||
            !Number.isInteger(pasajeros) ||
            pasajeros < 1 ||
            pasajeros > 5
        ) {
            errores.pasajeros =
                'La cantidad de pasajeros debe ser un número entero entre 1 y 5.';
        }

        const transmision = $('#vehiculoTransmision').value;

        if (!['Automático', 'Mecánico'].includes(transmision)) {
            errores.transmision = 'Selecciona una transmisión válida.';
        }

        const estado = $('#vehiculoEstado').value;

        if (
            !['Disponible', 'Alquilado', 'Reservado', 'Mantenimiento']
                .includes(estado)
        ) {
            errores.estado = 'Selecciona un estado válido.';
        }

        const errorImagen = validarImagen($('#vehiculoImagen').value.trim());

        if (errorImagen) {
            errores.imagen = errorImagen;
        }

        return errores;
    }

    function obtenerFiltrados() {
        const texto = normalizar($('#buscarVehiculo').value);
        const estado = normalizar($('#filtroEstado').value);
        const categoria = normalizar($('#filtroCategoria').value);

        return vehiculos.filter(v => {
            const coincideTexto = !texto ||
                [v.idVehiculo, v.marca, v.modelo, v.categoria, v.transmision]
                    .some(valor => normalizar(valor).includes(texto));

            const coincideEstado = !estado ||
                normalizar(v.estado) === estado;

            const coincideCategoria = !categoria ||
                normalizar(v.categoria) === categoria;

            return coincideTexto && coincideEstado && coincideCategoria;
        });
    }

    function renderizarResumen() {
        $('#resumenTotal').textContent = vehiculos.length;

        $('#resumenDisponibles').textContent = vehiculos.filter(
            v => normalizar(v.estado) === 'disponible'
        ).length;

        $('#resumenNoDisponibles').textContent = vehiculos.filter(
            v => normalizar(v.estado) !== 'disponible'
        ).length;
    }

    function cargarCategorias() {
        const select = $('#filtroCategoria');
        const actual = select.value;

        const categorias = [...new Set(
            vehiculos.map(v => v.categoria).filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, 'es'));

        select.innerHTML =
            '<option value="">Todas las categorías</option>' +
            categorias.map(
                categoria => `<option value="${escapar(categoria)}">${escapar(categoria)}</option>`
            ).join('');

        select.value = actual;
    }

    function renderizarTabla() {
        const cuerpo = $('#tablaFlota');
        const filtrados = obtenerFiltrados();

        $('#cantidadResultados').textContent =
            `${filtrados.length} resultado${filtrados.length === 1 ? '' : 's'}`;

        if (!filtrados.length) {
            cuerpo.innerHTML = `
                <tr>
                    <td colspan="8" class="estado-vacio">
                        No se encontraron vehículos con los filtros seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        cuerpo.innerHTML = filtrados.map(v => {
            const imagen = resolverImagen(v.imagen);

            const imagenHtml = imagen
                ? `<img class="vehiculo-info__imagen"
                         src="${escapar(imagen)}"
                         alt="${escapar(v.marca)} ${escapar(v.modelo)}"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
                   <span class="vehiculo-info__sin-imagen" style="display:none">
                       <i class="fa-solid fa-car"></i>
                   </span>`
                : `<span class="vehiculo-info__sin-imagen">
                       <i class="fa-solid fa-car"></i>
                   </span>`;

            return `
                <tr>
                    <td>#${escapar(v.idVehiculo)}</td>

                    <td>
                        <div class="vehiculo-info">
                            ${imagenHtml}

                            <div>
                                <strong>
                                    ${escapar(v.marca)} ${escapar(v.modelo)}
                                </strong>

                                <small>
                                    ${escapar(v.transmision || 'Sin transmisión')}
                                </small>
                            </div>
                        </div>
                    </td>

                    <td>${escapar(v.categoria)}</td>
                    <td>${escapar(v.pasajeros)}</td>
                    <td>S/ ${Number(v.precioDia || 0).toFixed(2)}</td>

                    <td>
                        <span class="badge-estado ${claseEstado(v.estado)}">
                            ${escapar(v.estado || 'Sin estado')}
                        </span>
                    </td>

                    <td>${escapar(v.transmision)}</td>

                    <td>
                        <div class="acciones-tabla">
                            <button
                                class="boton-icono editar"
                                type="button"
                                data-accion="editar"
                                data-id="${escapar(v.idVehiculo)}"
                                title="Editar vehículo"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                class="boton-icono eliminar"
                                type="button"
                                data-accion="eliminar"
                                data-id="${escapar(v.idVehiculo)}"
                                title="Eliminar vehículo"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async function cargarVehiculos() {
        const cuerpo = $('#tablaFlota');

        cuerpo.innerHTML = `
            <tr>
                <td colspan="8" class="estado-vacio">
                    Cargando vehículos...
                </td>
            </tr>
        `;

        try {
            vehiculos = await window.CarmovoAdminApi.listarVehiculos();

            marcarApi(true);
            renderizarResumen();
            cargarCategorias();
            renderizarTabla();

        } catch (error) {
            console.error(error);
            marcarApi(false);

            cuerpo.innerHTML = `
                <tr>
                    <td colspan="8" class="estado-vacio">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        No se pudo cargar la flota.
                        Comprueba la conexión con Spring Boot.
                    </td>
                </tr>
            `;
        }
    }

    function abrirModal(vehiculo = null) {
        vehiculoEditandoId = vehiculo?.idVehiculo ?? null;

        limpiarErroresFormulario();

        $('#tituloModalVehiculo').textContent = vehiculo
            ? 'Editar vehículo'
            : 'Registrar vehículo';

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

        limpiarErroresFormulario();

        vehiculoEditandoId = null;
    }

    async function guardarVehiculo(evento) {
        evento.preventDefault();

        limpiarErroresFormulario();

        const erroresLocales = validarFormulario();

        if (Object.keys(erroresLocales).length > 0) {
            mostrarErroresFormulario(erroresLocales);

            notificar(
                'Revisa los campos señalados antes de guardar.',
                'error'
            );

            return;
        }

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

        boton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        try {
            if (vehiculoEditandoId !== null) {
                await window.CarmovoAdminApi.actualizarVehiculo(
                    vehiculoEditandoId,
                    datos
                );

                notificar('Vehículo actualizado correctamente.');

            } else {
                await window.CarmovoAdminApi.crearVehiculo(datos);

                notificar('Vehículo registrado correctamente.');
            }

            cerrarModal();
            await cargarVehiculos();

        } catch (error) {
            console.error(error);

            if (error.status === 400) {
                const erroresBackend = error.errores || {};

                if (Object.keys(erroresBackend).length > 0) {
                    const erroresMostrados =
                        mostrarErroresFormulario(erroresBackend);

                    notificar(
                        erroresMostrados
                            ? 'Corrige los campos señalados.'
                            : error.message,
                        'error'
                    );
                } else {
                    notificar(
                        error.message || 'Los datos ingresados no son válidos.',
                        'error'
                    );
                }

            } else {
                if (error.status === undefined) {
                    marcarApi(false);
                }

                notificar(
                    error.message ||
                    'No se pudo guardar el vehículo. Inténtalo nuevamente.',
                    'error'
                );
            }

        } finally {
            boton.disabled = false;
            boton.innerHTML = contenidoOriginal;
        }
    }

    async function eliminarVehiculo(id) {
        const vehiculo = vehiculos.find(
            v => String(v.idVehiculo) === String(id)
        );

        if (!vehiculo) return;

        const confirmar = window.confirm(
            `¿Eliminar ${vehiculo.marca} ${vehiculo.modelo}? Esta acción no se puede deshacer.`
        );

        if (!confirmar) return;

        try {
            await window.CarmovoAdminApi.eliminarVehiculo(id);

            notificar('Vehículo eliminado correctamente.');
            await cargarVehiculos();

        } catch (error) {
            console.error(error);

            notificar(
                'No se pudo eliminar el vehículo.',
                'error'
            );
        }
    }

    function prepararEventos() {
        $('#btnNuevoVehiculo').addEventListener(
            'click',
            () => abrirModal()
        );

        $('#btnCerrarModal').addEventListener('click', cerrarModal);
        $('#btnCancelarVehiculo').addEventListener('click', cerrarModal);

        $('#formVehiculo').addEventListener('submit', guardarVehiculo);

        Object.entries(camposFormulario).forEach(([nombre, id]) => {
            const campo = document.getElementById(id);

            if (!campo) return;

            const evento = campo.tagName === 'SELECT'
                ? 'change'
                : 'input';

            campo.addEventListener(evento, () => {
                limpiarErrorCampo(nombre);
            });
        });

        $('#buscarVehiculo').addEventListener('input', renderizarTabla);
        $('#filtroEstado').addEventListener('change', renderizarTabla);
        $('#filtroCategoria').addEventListener('change', renderizarTabla);
        $('#btnRecargarFlota').addEventListener('click', cargarVehiculos);

        $('#modalVehiculo').addEventListener('click', evento => {
            if (evento.target.id === 'modalVehiculo') {
                cerrarModal();
            }
        });

        $('#tablaFlota').addEventListener('click', evento => {
            const boton = evento.target.closest('[data-accion]');
            if (!boton) return;

            const id = boton.dataset.id;

            if (boton.dataset.accion === 'editar') {
                const vehiculo = vehiculos.find(
                    v => String(v.idVehiculo) === String(id)
                );

                if (vehiculo) {
                    abrirModal(vehiculo);
                }
            }

            if (boton.dataset.accion === 'eliminar') {
                eliminarVehiculo(id);
            }
        });

        document.addEventListener('keydown', evento => {
            if (
                evento.key === 'Escape' &&
                $('#modalVehiculo').classList.contains('abierto')
            ) {
                cerrarModal();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        prepararEventos();
        cargarVehiculos();
    });
})();
