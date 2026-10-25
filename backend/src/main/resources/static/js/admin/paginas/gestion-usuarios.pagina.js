
(function () {
    const $ = selector => document.querySelector(selector);

    let usuarios = [];
    let perfiles = [];
    let usuarioEditandoId = null;

    const CAMPOS = {
        nombres: ['usuarioNombres', 'errorUsuarioNombres'],
        apellidos: ['usuarioApellidos', 'errorUsuarioApellidos'],
        correo: ['usuarioCorreo', 'errorUsuarioCorreo'],
        telefono: ['usuarioTelefono', 'errorUsuarioTelefono'],
        idPerfil: ['usuarioPerfil', 'errorUsuarioPerfil'],
        estado: ['usuarioEstado', 'errorUsuarioEstado'],
        contrasena: ['usuarioContrasena', 'errorUsuarioContrasena']
    };

    // Celular peruano: exactamente 9 dígitos y empieza con 9.
    const PATRON_CELULAR = /^9[0-9]{8}$/;

    // Solo letras Unicode y espacios simples entre palabras.
    // Se permiten tildes, ñ y nombres compuestos.
    const PATRON_NOMBRE = /^\p{L}+(?: \p{L}+)*$/u;

    function contarLetras(valor) {
        return (valor.match(/\p{L}/gu) || []).length;
    }

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
        const caja = $('#notificacionUsuario');
        if (!caja) return;

        caja.textContent = mensaje;
        caja.className = `notificacion-usuario visible ${tipo}`;

        clearTimeout(notificar.temporizador);

        notificar.temporizador = setTimeout(() => {
            caja.className = 'notificacion-usuario';
        }, 3500);
    }

    function mostrarErrorCampo(nombre, mensaje) {
        const campo = CAMPOS[nombre];
        if (!campo) return;

        const input = document.getElementById(campo[0]);
        const mensajeElemento = document.getElementById(campo[1]);

        if (!input || !mensajeElemento) return;

        input.setAttribute('aria-invalid', 'true');
        mensajeElemento.textContent = mensaje;
        mensajeElemento.hidden = false;
    }

    function limpiarErrorCampo(nombre) {
        const campo = CAMPOS[nombre];
        if (!campo) return;

        const input = document.getElementById(campo[0]);
        const mensajeElemento = document.getElementById(campo[1]);

        if (!input || !mensajeElemento) return;

        input.removeAttribute('aria-invalid');
        mensajeElemento.textContent = '';
        mensajeElemento.hidden = true;
    }

    function limpiarErrores() {
        Object.keys(CAMPOS).forEach(limpiarErrorCampo);
    }

    function enfocarPrimerError() {
        const campo = $('#formUsuario [aria-invalid="true"]');

        if (campo) {
            campo.focus();
        }
    }

    function validarFormulario(datos, contrasena) {
        limpiarErrores();

        let valido = true;

        function error(nombre, mensaje) {
            mostrarErrorCampo(nombre, mensaje);
            valido = false;
        }

        // VALIDACIÓN DE NOMBRES
        if (!datos.nombres) {
            error('nombres', 'Los nombres son obligatorios.');
        } else if (datos.nombres.length > 100) {
            error(
                'nombres',
                'Los nombres no pueden superar los 100 caracteres.'
            );
        } else if (!PATRON_NOMBRE.test(datos.nombres)) {
            error(
                'nombres',
                'Los nombres solo pueden contener letras y espacios, sin números ni símbolos.'
            );
        } else if (contarLetras(datos.nombres) < 3) {
            error(
                'nombres',
                'Los nombres deben contener al menos 3 letras.'
            );
        }

        // VALIDACIÓN DE APELLIDOS
        if (!datos.apellidos) {
            error('apellidos', 'Los apellidos son obligatorios.');
        } else if (datos.apellidos.length > 100) {
            error(
                'apellidos',
                'Los apellidos no pueden superar los 100 caracteres.'
            );
        } else if (!PATRON_NOMBRE.test(datos.apellidos)) {
            error(
                'apellidos',
                'Los apellidos solo pueden contener letras y espacios, sin números ni símbolos.'
            );
        } else if (contarLetras(datos.apellidos) < 3) {
            error(
                'apellidos',
                'Los apellidos deben contener al menos 3 letras.'
            );
        }

        if (!datos.correo) {
            error(
                'correo',
                'El correo electrónico es obligatorio.'
            );
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)
        ) {
            error(
                'correo',
                'Ingresa un correo electrónico válido.'
            );
        } else if (datos.correo.length > 120) {
            error(
                'correo',
                'El correo no puede superar los 120 caracteres.'
            );
        }

        // El celular es opcional para administración,
        // pero si se proporciona debe tener el formato peruano.
        if (datos.telefono && !PATRON_CELULAR.test(datos.telefono)) {
            error(
                'telefono',
                'El celular debe tener exactamente 9 dígitos y comenzar con 9.'
            );
        }

        if (
            !Number.isInteger(datos.idPerfil) ||
            datos.idPerfil <= 0
        ) {
            error('idPerfil', 'Debes seleccionar un perfil.');
        }

        if (!['true', 'false'].includes($('#usuarioEstado').value)) {
            error('estado', 'Debes seleccionar un estado válido.');
        }

        if (!usuarioEditandoId && !contrasena) {
            error(
                'contrasena',
                'La contraseña es obligatoria para un nuevo usuario.'
            );
        } else if (contrasena && contrasena.length < 8) {
            error(
                'contrasena',
                'La contraseña debe tener al menos 8 caracteres.'
            );
        } else if (contrasena.length > 100) {
            error(
                'contrasena',
                'La contraseña no puede superar los 100 caracteres.'
            );
        }

        if (!valido) {
            enfocarPrimerError();
        }

        return valido;
    }

    function mostrarErroresBackend(errores) {
        if (!errores || typeof errores !== 'object') {
            return false;
        }

        let encontrados = false;

        Object.entries(errores).forEach(([nombre, mensajes]) => {
            if (!CAMPOS[nombre]) return;

            const mensaje = Array.isArray(mensajes)
                ? mensajes.join(' ')
                : String(mensajes ?? '');

            if (!mensaje) return;

            mostrarErrorCampo(nombre, mensaje);
            encontrados = true;
        });

        if (encontrados) {
            enfocarPrimerError();
        }

        return encontrados;
    }

    function mostrarConflicto(error) {
        const mensaje = String(
            error.detalle || error.message || ''
        );

        const mensajeNormalizado = normalizar(mensaje);

        if (mensajeNormalizado.includes('correo')) {
            mostrarErrorCampo('correo', mensaje);
        } else if (mensajeNormalizado.includes('telefono')) {
            mostrarErrorCampo('telefono', mensaje);
        } else {
            return false;
        }

        enfocarPrimerError();
        return true;
    }

    function iniciales(usuario) {
        const primera = usuario?.nombres?.trim()?.charAt(0) || '';
        const segunda = usuario?.apellidos?.trim()?.charAt(0) || '';

        return `${primera}${segunda}`.toUpperCase() || 'US';
    }

    function obtenerFiltrados() {
        const texto = normalizar($('#buscarUsuario').value);
        const idPerfil = $('#filtroPerfil').value;
        const estado = $('#filtroEstadoUsuario').value;

        return usuarios.filter(usuario => {
            const coincideTexto = !texto || [
                usuario.idUsuario,
                usuario.nombres,
                usuario.apellidos,
                usuario.correo,
                usuario.telefono,
                usuario.nombrePerfil
            ].some(valor => normalizar(valor).includes(texto));

            const coincidePerfil = !idPerfil ||
                String(usuario.idPerfil) === String(idPerfil);

            const coincideEstado = !estado ||
                (estado === 'activo'
                    ? usuario.estado === true
                    : usuario.estado === false);

            return coincideTexto && coincidePerfil && coincideEstado;
        });
    }

    function renderizarResumen() {
        $('#resumenUsuariosTotal').textContent = usuarios.length;

        $('#resumenUsuariosActivos').textContent = usuarios.filter(
            usuario => usuario.estado === true
        ).length;

        $('#resumenUsuariosInactivos').textContent = usuarios.filter(
            usuario => usuario.estado === false
        ).length;

        $('#resumenPerfiles').textContent = perfiles.length;
    }

    function renderizarPerfiles() {
        const filtro = $('#filtroPerfil');
        const formulario = $('#usuarioPerfil');

        const valorFiltro = filtro.value;
        const valorFormulario = formulario.value;

        filtro.innerHTML =
            '<option value="">Todos los perfiles</option>' +
            perfiles.map(perfil => `
                <option value="${escapar(perfil.idPerfil)}">
                    ${escapar(perfil.nombre)}
                </option>
            `).join('');

        formulario.innerHTML =
            '<option value="" disabled>Seleccionar perfil</option>' +
            perfiles.map(perfil => `
                <option value="${escapar(perfil.idPerfil)}">
                    ${escapar(perfil.nombre)}
                </option>
            `).join('');

        if (perfiles.some(
            perfil => String(perfil.idPerfil) === String(valorFiltro)
        )) {
            filtro.value = valorFiltro;
        }

        if (perfiles.some(
            perfil => String(perfil.idPerfil) === String(valorFormulario)
        )) {
            formulario.value = valorFormulario;
        }
    }

    function renderizarTabla() {
        const cuerpo = $('#tablaUsuarios');
        const filtrados = obtenerFiltrados();

        $('#cantidadUsuarios').textContent =
            `${filtrados.length} resultado${filtrados.length === 1 ? '' : 's'}`;

        if (!filtrados.length) {
            cuerpo.innerHTML = `
                <tr>
                    <td colspan="7" class="estado-vacio">
                        No se encontraron usuarios con los filtros seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        cuerpo.innerHTML = filtrados.map(usuario => {
            const nombreCompleto =
                `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim();

            const estadoClase = usuario.estado ? 'activo' : 'inactivo';
            const estadoTexto = usuario.estado ? 'Activo' : 'Inactivo';

            return `
                <tr>
                    <td>#${escapar(usuario.idUsuario)}</td>

                    <td>
                        <div class="usuario-identidad">
                            <span class="usuario-identidad__avatar">
                                ${escapar(iniciales(usuario))}
                            </span>

                            <div>
                                <strong>${escapar(nombreCompleto)}</strong>
                                <small>
                                    ${escapar(usuario.nombrePerfil || 'Sin perfil')}
                                </small>
                            </div>
                        </div>
                    </td>

                    <td>${escapar(usuario.correo)}</td>

                    <td>${escapar(usuario.telefono || '\u2014')}</td>

                    <td>
                        <span class="badge-perfil">
                            ${escapar(usuario.nombrePerfil || 'Sin perfil')}
                        </span>
                    </td>

                    <td>
                        <span class="badge-estado ${estadoClase}">
                            ${estadoTexto}
                        </span>
                    </td>

                    <td>
                        <div class="acciones-usuario">
                            <button
                                class="boton-usuario-icono editar"
                                type="button"
                                data-accion="editar"
                                data-id="${escapar(usuario.idUsuario)}"
                                title="Editar usuario"
                                aria-label="Editar usuario"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                class="boton-usuario-icono eliminar"
                                type="button"
                                data-accion="eliminar"
                                data-id="${escapar(usuario.idUsuario)}"
                                title="Eliminar usuario"
                                aria-label="Eliminar usuario"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async function cargarDatos() {
        const cuerpo = $('#tablaUsuarios');

        cuerpo.innerHTML = `
            <tr>
                <td colspan="7" class="estado-vacio">
                    Cargando usuarios...
                </td>
            </tr>
        `;

        try {
            const [
                usuariosRespuesta,
                perfilesRespuesta
            ] = await Promise.all([
                window.CarmovoAdminApi.listarUsuarios(),
                window.CarmovoAdminApi.listarPerfiles()
            ]);

            usuarios = usuariosRespuesta;
            perfiles = perfilesRespuesta;

            marcarApi(true);
            renderizarPerfiles();
            renderizarResumen();
            renderizarTabla();

        } catch (error) {
            console.error(error);
            marcarApi(false);

            cuerpo.innerHTML = `
                <tr>
                    <td colspan="7" class="estado-vacio">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        No se pudo cargar Gestión de Usuarios.
                        Verifica que Spring Boot esté ejecutándose
                        y que las tablas de usuarios y perfiles existan en MySQL.
                    </td>
                </tr>
            `;

            notificar(
                error.message || 'No se pudo conectar con el backend.',
                'error'
            );
        }
    }

    function abrirModal(usuario = null) {
        usuarioEditandoId = usuario?.idUsuario ?? null;

        const editando = Boolean(usuario);

        limpiarErrores();

        $('#tituloModalUsuario').textContent = editando
            ? 'Editar usuario'
            : 'Registrar usuario';

        $('#btnGuardarUsuario').innerHTML = editando
            ? '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios'
            : '<i class="fa-solid fa-user-plus"></i> Registrar usuario';

        $('#usuarioNombres').value = usuario?.nombres ?? '';
        $('#usuarioApellidos').value = usuario?.apellidos ?? '';
        $('#usuarioCorreo').value = usuario?.correo ?? '';
        $('#usuarioTelefono').value = usuario?.telefono ?? '';

        $('#usuarioPerfil').value = usuario?.idPerfil
            ? String(usuario.idPerfil)
            : '';

        $('#usuarioEstado').value =
            usuario?.estado === false ? 'false' : 'true';

        $('#usuarioContrasena').value = '';
        $('#usuarioContrasena').required = !editando;

        $('#ayudaContrasena').textContent = editando
            ? 'Déjala vacía para conservar la contraseña actual. Si escribes una nueva, debe tener al menos 8 caracteres.'
            : 'Obligatoria para crear un usuario. Debe tener al menos 8 caracteres.';

        $('#modalUsuario').classList.add('abierto');
        document.body.style.overflow = 'hidden';

        setTimeout(() => $('#usuarioNombres').focus(), 50);
    }

    function cerrarModal() {
        $('#modalUsuario').classList.remove('abierto');
        document.body.style.overflow = '';

        $('#formUsuario').reset();
        $('#usuarioContrasena').type = 'password';
        $('#btnVerContrasena i').className = 'fa-solid fa-eye';

        limpiarErrores();
        usuarioEditandoId = null;
    }

    async function guardarUsuario(evento) {
        evento.preventDefault();

        const contrasena = $('#usuarioContrasena').value;
        const perfilSeleccionado = $('#usuarioPerfil').value;

        const datos = {
            nombres: $('#usuarioNombres').value.trim(),
            apellidos: $('#usuarioApellidos').value.trim(),
            correo: $('#usuarioCorreo').value.trim(),
            telefono: $('#usuarioTelefono').value.trim() || null,
            idPerfil: perfilSeleccionado
                ? Number(perfilSeleccionado)
                : null,
            estado: $('#usuarioEstado').value === 'true',
            contrasena: contrasena || null
        };

        if (!validarFormulario(datos, contrasena)) {
            return;
        }

        const boton = $('#btnGuardarUsuario');
        const contenidoOriginal = boton.innerHTML;

        boton.disabled = true;
        boton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        try {
            if (usuarioEditandoId) {
                await window.CarmovoAdminApi.actualizarUsuario(
                    usuarioEditandoId,
                    datos
                );

                notificar('Usuario actualizado correctamente.');

            } else {
                await window.CarmovoAdminApi.crearUsuario(datos);

                notificar('Usuario registrado correctamente.');
            }

            cerrarModal();
            await cargarDatos();

        } catch (error) {
            console.error(error);

            let mostrado = false;

            if (error.status === 400) {
                mostrado = mostrarErroresBackend(error.errores);
            }

            if (error.status === 409) {
                mostrado = mostrarConflicto(error);
            }

            if (!mostrado) {
                notificar(
                    error.detalle ||
                    error.message ||
                    'No se pudo guardar el usuario.',
                    'error'
                );
            }

        } finally {
            boton.disabled = false;
            boton.innerHTML = contenidoOriginal;
        }
    }

    async function eliminarUsuario(id) {
        const usuario = usuarios.find(
            item => String(item.idUsuario) === String(id)
        );

        if (!usuario) return;

        const nombreCompleto =
            `${usuario.nombres} ${usuario.apellidos}`.trim();

        const confirmar = window.confirm(
            `¿Eliminar a ${nombreCompleto}? Esta acción eliminará su cuenta del sistema.`
        );

        if (!confirmar) return;

        try {
            await window.CarmovoAdminApi.eliminarUsuario(id);

            notificar('Usuario eliminado correctamente.');
            await cargarDatos();

        } catch (error) {
            console.error(error);

            notificar(
                error.message || 'No se pudo eliminar el usuario.',
                'error'
            );
        }
    }

    function alternarContrasena() {
        const input = $('#usuarioContrasena');
        const icono = $('#btnVerContrasena i');

        const visible = input.type === 'text';

        input.type = visible ? 'password' : 'text';

        icono.className = visible
            ? 'fa-solid fa-eye'
            : 'fa-solid fa-eye-slash';
    }

    function prepararEventos() {
        $('#btnNuevoUsuario').addEventListener(
            'click',
            () => abrirModal()
        );

        $('#btnCerrarModalUsuario').addEventListener('click', cerrarModal);
        $('#btnCancelarUsuario').addEventListener('click', cerrarModal);
        $('#formUsuario').addEventListener('submit', guardarUsuario);

        $('#btnVerContrasena').addEventListener(
            'click',
            alternarContrasena
        );

        Object.entries(CAMPOS).forEach(([nombre, campo]) => {
            const input = document.getElementById(campo[0]);
            if (!input) return;

            input.addEventListener('input', () => {
                limpiarErrorCampo(nombre);
            });

            input.addEventListener('change', () => {
                limpiarErrorCampo(nombre);
            });
        });

        $('#buscarUsuario').addEventListener('input', renderizarTabla);
        $('#filtroPerfil').addEventListener('change', renderizarTabla);
        $('#filtroEstadoUsuario').addEventListener('change', renderizarTabla);
        $('#btnRecargarUsuarios').addEventListener('click', cargarDatos);

        $('#modalUsuario').addEventListener('click', evento => {
            if (evento.target.id === 'modalUsuario') {
                cerrarModal();
            }
        });

        $('#tablaUsuarios').addEventListener('click', evento => {
            const boton = evento.target.closest('[data-accion]');
            if (!boton) return;

            const id = boton.dataset.id;

            if (boton.dataset.accion === 'editar') {
                const usuario = usuarios.find(
                    item => String(item.idUsuario) === String(id)
                );

                if (usuario) {
                    abrirModal(usuario);
                }
            }

            if (boton.dataset.accion === 'eliminar') {
                eliminarUsuario(id);
            }
        });

        document.addEventListener('keydown', evento => {
            if (
                evento.key === 'Escape' &&
                $('#modalUsuario').classList.contains('abierto')
            ) {
                cerrarModal();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        prepararEventos();
        cargarDatos();
    });
})();
