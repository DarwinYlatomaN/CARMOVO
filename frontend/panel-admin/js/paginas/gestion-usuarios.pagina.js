(function () {
    const $ = selector => document.querySelector(selector);
    let usuarios = [];
    let perfiles = [];
    let usuarioEditandoId = null;

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
        const caja = $('#notificacionUsuario');
        caja.textContent = mensaje;
        caja.className = `notificacion-usuario visible ${tipo}`;

        clearTimeout(notificar.temporizador);
        notificar.temporizador = setTimeout(() => {
            caja.className = 'notificacion-usuario';
        }, 3500);
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

            const coincidePerfil = !idPerfil || String(usuario.idPerfil) === String(idPerfil);
            const coincideEstado = !estado || (estado === 'activo' ? usuario.estado === true : usuario.estado === false);

            return coincideTexto && coincidePerfil && coincideEstado;
        });
    }

    function renderizarResumen() {
        $('#resumenUsuariosTotal').textContent = usuarios.length;
        $('#resumenUsuariosActivos').textContent = usuarios.filter(usuario => usuario.estado === true).length;
        $('#resumenUsuariosInactivos').textContent = usuarios.filter(usuario => usuario.estado === false).length;
        $('#resumenPerfiles').textContent = perfiles.length;
    }

    function renderizarPerfiles() {
        const filtro = $('#filtroPerfil');
        const formulario = $('#usuarioPerfil');
        const valorFiltro = filtro.value;
        const valorFormulario = formulario.value;

        filtro.innerHTML = '<option value="">Todos los perfiles</option>' + perfiles
            .map(perfil => `<option value="${perfil.idPerfil}">${escapar(perfil.nombre)}</option>`)
            .join('');

        formulario.innerHTML = '<option value="" disabled>Seleccionar perfil</option>' + perfiles
            .map(perfil => `<option value="${perfil.idPerfil}">${escapar(perfil.nombre)}</option>`)
            .join('');

        if (perfiles.some(perfil => String(perfil.idPerfil) === String(valorFiltro))) {
            filtro.value = valorFiltro;
        }

        if (perfiles.some(perfil => String(perfil.idPerfil) === String(valorFormulario))) {
            formulario.value = valorFormulario;
        }
    }

    function renderizarTabla() {
        const cuerpo = $('#tablaUsuarios');
        const filtrados = obtenerFiltrados();
        $('#cantidadUsuarios').textContent = `${filtrados.length} resultado${filtrados.length === 1 ? '' : 's'}`;

        if (!filtrados.length) {
            cuerpo.innerHTML = '<tr><td colspan="7" class="estado-vacio">No se encontraron usuarios con los filtros seleccionados.</td></tr>';
            return;
        }

        cuerpo.innerHTML = filtrados.map(usuario => {
            const nombreCompleto = `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim();
            const estadoClase = usuario.estado ? 'activo' : 'inactivo';
            const estadoTexto = usuario.estado ? 'Activo' : 'Inactivo';

            return `
                <tr>
                    <td>#${escapar(usuario.idUsuario)}</td>
                    <td>
                        <div class="usuario-identidad">
                            <span class="usuario-identidad__avatar">${escapar(iniciales(usuario))}</span>
                            <div>
                                <strong>${escapar(nombreCompleto)}</strong>
                                <small>${escapar(usuario.nombrePerfil || 'Sin perfil')}</small>
                            </div>
                        </div>
                    </td>
                    <td>${escapar(usuario.correo)}</td>
                    <td>${escapar(usuario.telefono || '—')}</td>
                    <td><span class="badge-perfil">${escapar(usuario.nombrePerfil || 'Sin perfil')}</span></td>
                    <td><span class="badge-estado ${estadoClase}">${estadoTexto}</span></td>
                    <td>
                        <div class="acciones-usuario">
                            <button class="boton-usuario-icono editar" type="button" data-accion="editar" data-id="${usuario.idUsuario}" title="Editar usuario" aria-label="Editar usuario">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="boton-usuario-icono eliminar" type="button" data-accion="eliminar" data-id="${usuario.idUsuario}" title="Eliminar usuario" aria-label="Eliminar usuario">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    }

    async function cargarDatos() {
        const cuerpo = $('#tablaUsuarios');
        cuerpo.innerHTML = '<tr><td colspan="7" class="estado-vacio">Cargando usuarios...</td></tr>';

        try {
            const [usuariosRespuesta, perfilesRespuesta] = await Promise.all([
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
                        No se pudo cargar Gestión de Usuarios. Verifica Spring Boot y que las tablas de usuarios/perfiles existan en PostgreSQL.
                    </td>
                </tr>`;
            notificar(error.message || 'No se pudo conectar con el backend.', 'error');
        }
    }

    function abrirModal(usuario = null) {
        usuarioEditandoId = usuario?.idUsuario ?? null;
        const editando = Boolean(usuario);

        $('#tituloModalUsuario').textContent = editando ? 'Editar usuario' : 'Registrar usuario';
        $('#btnGuardarUsuario').innerHTML = editando
            ? '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios'
            : '<i class="fa-solid fa-user-plus"></i> Registrar usuario';

        $('#usuarioNombres').value = usuario?.nombres ?? '';
        $('#usuarioApellidos').value = usuario?.apellidos ?? '';
        $('#usuarioCorreo').value = usuario?.correo ?? '';
        $('#usuarioTelefono').value = usuario?.telefono ?? '';
        $('#usuarioPerfil').value = usuario?.idPerfil ? String(usuario.idPerfil) : '';
        $('#usuarioEstado').value = usuario?.estado === false ? 'false' : 'true';
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
        usuarioEditandoId = null;
    }

    async function guardarUsuario(evento) {
        evento.preventDefault();

        const contrasena = $('#usuarioContrasena').value;
        const datos = {
            nombres: $('#usuarioNombres').value.trim(),
            apellidos: $('#usuarioApellidos').value.trim(),
            correo: $('#usuarioCorreo').value.trim(),
            telefono: $('#usuarioTelefono').value.trim() || null,
            idPerfil: Number($('#usuarioPerfil').value),
            estado: $('#usuarioEstado').value === 'true',
            contrasena: contrasena || null
        };

        if (!usuarioEditandoId && contrasena.length < 8) {
            notificar('La contraseña debe tener al menos 8 caracteres.', 'error');
            $('#usuarioContrasena').focus();
            return;
        }

        if (usuarioEditandoId && contrasena && contrasena.length < 8) {
            notificar('La nueva contraseña debe tener al menos 8 caracteres.', 'error');
            $('#usuarioContrasena').focus();
            return;
        }

        const boton = $('#btnGuardarUsuario');
        const contenidoOriginal = boton.innerHTML;
        boton.disabled = true;
        boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

        try {
            if (usuarioEditandoId) {
                await window.CarmovoAdminApi.actualizarUsuario(usuarioEditandoId, datos);
                notificar('Usuario actualizado correctamente.');
            } else {
                await window.CarmovoAdminApi.crearUsuario(datos);
                notificar('Usuario registrado correctamente.');
            }

            cerrarModal();
            await cargarDatos();
        } catch (error) {
            console.error(error);
            notificar(error.message || 'No se pudo guardar el usuario.', 'error');
        } finally {
            boton.disabled = false;
            boton.innerHTML = contenidoOriginal;
        }
    }

    async function eliminarUsuario(id) {
        const usuario = usuarios.find(item => String(item.idUsuario) === String(id));
        if (!usuario) return;

        const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`.trim();
        const confirmar = window.confirm(`¿Eliminar a ${nombreCompleto}? Esta acción eliminará su cuenta del sistema.`);
        if (!confirmar) return;

        try {
            await window.CarmovoAdminApi.eliminarUsuario(id);
            notificar('Usuario eliminado correctamente.');
            await cargarDatos();
        } catch (error) {
            console.error(error);
            notificar(error.message || 'No se pudo eliminar el usuario.', 'error');
        }
    }

    function alternarContrasena() {
        const input = $('#usuarioContrasena');
        const icono = $('#btnVerContrasena i');
        const visible = input.type === 'text';

        input.type = visible ? 'password' : 'text';
        icono.className = visible ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    }

    function prepararEventos() {
        $('#btnNuevoUsuario').addEventListener('click', () => abrirModal());
        $('#btnCerrarModalUsuario').addEventListener('click', cerrarModal);
        $('#btnCancelarUsuario').addEventListener('click', cerrarModal);
        $('#formUsuario').addEventListener('submit', guardarUsuario);
        $('#btnVerContrasena').addEventListener('click', alternarContrasena);
        $('#buscarUsuario').addEventListener('input', renderizarTabla);
        $('#filtroPerfil').addEventListener('change', renderizarTabla);
        $('#filtroEstadoUsuario').addEventListener('change', renderizarTabla);
        $('#btnRecargarUsuarios').addEventListener('click', cargarDatos);

        $('#modalUsuario').addEventListener('click', evento => {
            if (evento.target.id === 'modalUsuario') cerrarModal();
        });

        $('#tablaUsuarios').addEventListener('click', evento => {
            const boton = evento.target.closest('[data-accion]');
            if (!boton) return;

            const id = boton.dataset.id;
            if (boton.dataset.accion === 'editar') {
                const usuario = usuarios.find(item => String(item.idUsuario) === String(id));
                if (usuario) abrirModal(usuario);
            }

            if (boton.dataset.accion === 'eliminar') {
                eliminarUsuario(id);
            }
        });

        document.addEventListener('keydown', evento => {
            if (evento.key === 'Escape' && $('#modalUsuario').classList.contains('abierto')) {
                cerrarModal();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        prepararEventos();
        cargarDatos();
    });
})();
