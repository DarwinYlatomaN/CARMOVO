
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
        contrasena: ['usuarioContrasena', 'errorUsuarioContrasena'],
        documento: ['usuarioDocumento', 'errorUsuarioDocumento'],
        fechaNacimiento: ['usuarioFechaNacimiento', 'errorUsuarioFechaNacimiento'],
        departamento: ['usuarioDepartamento', 'errorUsuarioDepartamento'],
        provincia: ['usuarioProvincia', 'errorUsuarioProvincia'],
        distrito: ['usuarioDistrito', 'errorUsuarioDistrito'],
        domicilio: ['usuarioDomicilio', 'errorUsuarioDomicilio'],
        numeroLicencia: ['usuarioLicencia', 'errorUsuarioLicencia'],
        categoriaLicencia: ['usuarioCategoria', 'errorUsuarioCategoria'],
        vencimientoLicencia: ['usuarioVencimiento', 'errorUsuarioVencimiento'],
        aceptaPoliticas: ['usuarioAcepta', 'errorUsuarioAcepta']
    };

    const RUTA_UBIGEOS = '/data/UBIGEOS_2022_1891_distritos.csv';
    let ubigeos = null;
    const esPerfilCliente = () => {
        const perfil = perfiles.find(p => String(p.idPerfil) === $('#usuarioPerfil').value);
        return normalizar(perfil?.nombre) === 'cliente';
    };
    function hoyISO() {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 10);
    }
    function edad(fecha) {
        const n = new Date(`${fecha}T00:00:00`);
        const h = new Date();
        let e = h.getFullYear() - n.getFullYear();
        if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--;
        return e;
    }

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

        // Datos de la cuenta del cliente (los mismos que pide "Crear cuenta" en la web).
        const cliente = esPerfilCliente();
        if (cliente || datos.documento) {
            if (!/^\d{8}$/.test(datos.documento || '')) error('documento', 'El DNI debe tener 8 dígitos.');
        }
        if (cliente) {
            if (!datos.telefono) error('telefono', 'El celular es obligatorio.');
            if (!datos.fechaNacimiento) error('fechaNacimiento', 'Indica la fecha de nacimiento.');
            else if (edad(datos.fechaNacimiento) < 18) error('fechaNacimiento', 'El cliente debe tener al menos 18 años.');
            if (!datos.departamento) error('departamento', 'Selecciona el departamento.');
            if (!datos.provincia) error('provincia', 'Selecciona la provincia.');
            if (!datos.distrito) error('distrito', 'Selecciona el distrito.');
            if (!datos.domicilio || datos.domicilio.length < 5) error('domicilio', 'Escribe el domicilio.');
            if (!/^[A-Z]?\d{8,9}$/.test(datos.numeroLicencia || '')) error('numeroLicencia', 'Escribe el número de licencia (ej.: Q12345678).');
            if (!datos.categoriaLicencia) error('categoriaLicencia', 'Selecciona la categoría.');
            if (!datos.vencimientoLicencia) error('vencimientoLicencia', 'Indica la fecha de vencimiento.');
            else if (datos.vencimientoLicencia < hoyISO()) error('vencimientoLicencia', 'La licencia está vencida.');
            if (!usuarioEditandoId && !datos.aceptaPoliticas) error('aceptaPoliticas', 'El cliente debe aceptar los términos y la política de privacidad.');
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
        } else if (mensajeNormalizado.includes('dni')) {
            mostrarErrorCampo('documento', mensaje);
        } else if (mensajeNormalizado.includes('licencia')) {
            mostrarErrorCampo('numeroLicencia', mensaje);
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
            perfiles = perfilesRespuesta.filter(perfil => normalizar(perfil.nombre) !== 'administrador');

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

        $('#usuarioDocumento').value = usuario?.documento ?? '';
        $('#usuarioFechaNacimiento').value = usuario?.fechaNacimiento ?? '';
        $('#usuarioDomicilio').value = usuario?.domicilio ?? '';
        $('#usuarioLicencia').value = usuario?.numeroLicencia ?? '';
        $('#usuarioCategoria').value = usuario?.categoriaLicencia ?? '';
        $('#usuarioVencimiento').value = usuario?.vencimientoLicencia ?? '';
        $('#usuarioFechaNacimiento').max = hoyISO();
        if (!editando) {
            const cliente = perfiles.find(p => normalizar(p.nombre) === 'cliente');
            if (cliente) $('#usuarioPerfil').value = String(cliente.idPerfil);
        }
        $('#usuarioAcepta').checked = false;
        $('#usuarioAcepta').closest('label').classList.remove('pol-acepto--ok');
        $('#campoAceptaUsuario').hidden = editando || !esPerfilCliente();
        ultimoDni = usuario?.documento || '';
        estadoDni('');
        document.querySelectorAll('#formUsuario .autocompletado').forEach(i => i.classList.remove('autocompletado'));
        cargarUbigeos().then(() => ponerUbicacion(usuario?.departamento, usuario?.provincia, usuario?.distrito));

        $('#usuarioContrasena').value = '';
        $('#usuarioContrasena').required = !editando;

        $('#ayudaContrasena').textContent = editando
            ? 'Déjala vacía para conservar la contraseña actual. Si escribes una nueva, debe tener al menos 8 caracteres.'
            : 'Obligatoria para crear un usuario. Debe tener al menos 8 caracteres.';

        $('#modalUsuario').classList.add('abierto');
        document.body.style.overflow = 'hidden';

        setTimeout(() => (editando ? $('#usuarioNombres') : $('#usuarioDocumento')).focus(), 50);
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
            contrasena: contrasena || null,
            documento: $('#usuarioDocumento').value.trim() || null,
            fechaNacimiento: $('#usuarioFechaNacimiento').value || null,
            departamento: $('#usuarioDepartamento').value || null,
            provincia: $('#usuarioProvincia').value || null,
            distrito: $('#usuarioDistrito').value || null,
            domicilio: $('#usuarioDomicilio').value.trim() || null,
            numeroLicencia: $('#usuarioLicencia').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || null,
            categoriaLicencia: $('#usuarioCategoria').value || null,
            vencimientoLicencia: $('#usuarioVencimiento').value || null,
            aceptaPoliticas: $('#usuarioAcepta').checked
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

        const confirmar = await window.CarmovoDialogo.confirmar({
            titulo: `¿Eliminar a ${nombreCompleto}?`,
            mensaje: 'Si ya tiene alquileres, su cuenta se desactivará en lugar de eliminarse para conservar su historial.',
            aceptar: 'Eliminar', tipo: 'peligro'
        });

        if (!confirmar) return;

        try {
            const resultado = await window.CarmovoAdminApi.eliminarUsuario(id);

            notificar(resultado?.message || 'Usuario eliminado correctamente.');
            await cargarDatos();

        } catch (error) {
            console.error(error);

            notificar(
                error.message || 'No se pudo eliminar el usuario.',
                'error'
            );
        }
    }

    // ------------------------------------------------------------ ubicación (mismo catálogo que "Crear cuenta")
    async function cargarUbigeos() {
        if (ubigeos) return ubigeos;
        try {
            const texto = await (await fetch(RUTA_UBIGEOS)).text();
            const lineas = texto.replace(/^\uFEFF/, '').split(/\r?\n/);
            const cab = lineas[0].split(';').map(c => c.trim().toUpperCase());
            const [iDep, iProv, iDist] = ['NOMBDEP', 'NOMBPROV', 'NOMBDIST'].map(c => cab.indexOf(c));
            ubigeos = new Map();
            lineas.slice(1).forEach(l => {
                const c = l.split(';');
                const dep = c[iDep]?.trim(), prov = c[iProv]?.trim(), dist = c[iDist]?.trim();
                if (!dep || !prov || !dist) return;
                if (!ubigeos.has(dep)) ubigeos.set(dep, new Map());
                const provincias = ubigeos.get(dep);
                if (!provincias.has(prov)) provincias.set(prov, []);
                provincias.get(prov).push(dist);
            });
        } catch (error) {
            ubigeos = new Map();
            notificar('No se pudo cargar la lista de departamentos.', 'error');
        }
        const sel = $('#usuarioDepartamento');
        sel.innerHTML = '<option value="">Selecciona un departamento</option>' +
            [...ubigeos.keys()].sort().map(d => `<option value="${escapar(d)}">${escapar(d)}</option>`).join('');
        return ubigeos;
    }

    function opciones(select, lista, vacio) {
        select.innerHTML = `<option value="">${vacio}</option>` +
            lista.map(v => `<option value="${escapar(v)}">${escapar(v)}</option>`).join('');
        select.disabled = !lista.length;
    }

    function alCambiarDepartamento() {
        const provincias = ubigeos?.get($('#usuarioDepartamento').value);
        opciones($('#usuarioProvincia'), provincias ? [...provincias.keys()].sort() : [], provincias ? 'Selecciona una provincia' : 'Selecciona primero un departamento');
        opciones($('#usuarioDistrito'), [], 'Selecciona primero una provincia');
    }

    function alCambiarProvincia() {
        const distritos = ubigeos?.get($('#usuarioDepartamento').value)?.get($('#usuarioProvincia').value);
        opciones($('#usuarioDistrito'), distritos ? [...distritos].sort() : [], distritos ? 'Selecciona un distrito' : 'Selecciona primero una provincia');
    }

    /** Coloca la ubicación guardada aunque esté escrita con otras mayúsculas o tildes. */
    function ponerUbicacion(dep, prov, dist) {
        const elegir = (select, valor) => {
            if (!valor) { select.value = ''; return; }
            const opcion = [...select.options].find(o => normalizar(o.value) === normalizar(valor));
            select.value = opcion ? opcion.value : '';
        };
        elegir($('#usuarioDepartamento'), dep);
        alCambiarDepartamento();
        elegir($('#usuarioProvincia'), prov);
        alCambiarProvincia();
        elegir($('#usuarioDistrito'), dist);
    }

    // ------------------------------------------------------------ DNI → nombres (RENIEC)
    let ultimoDni = '';
    function estadoDni(texto, tipo = '') {
        const caja = $('#estadoDniUsuario');
        caja.textContent = texto || '';
        caja.className = `estado-dni ${tipo}`;
        caja.hidden = !texto;
    }

    async function consultarDni(forzar = false) {
        const dni = $('#usuarioDocumento').value.trim();
        if (!/^\d{8}$/.test(dni)) {
            if (forzar) estadoDni('Escribe los 8 dígitos del DNI.', 'error');
            return;
        }
        if (dni === ultimoDni && !forzar) return;
        ultimoDni = dni;
        const nombres = $('#usuarioNombres'), apellidos = $('#usuarioApellidos');
        const puedeEscribir = forzar || !nombres.value.trim() || !apellidos.value.trim()
            || (nombres.classList.contains('autocompletado') && apellidos.classList.contains('autocompletado'));
        estadoDni('Buscando en RENIEC…');
        $('#btnBuscarDniUsuario').disabled = true;
        try {
            const r = await window.CarmovoAdminApi.consultarDni(dni);
            if (!r?.nombres) throw new Error('No se encontró ese DNI.');
            if ($('#usuarioDocumento').value.trim() !== dni) return;
            if (puedeEscribir) {
                nombres.value = r.nombres;
                apellidos.value = r.apellidos;
                [nombres, apellidos].forEach(i => { i.classList.add('autocompletado'); limpiarErrorCampo(i === nombres ? 'nombres' : 'apellidos'); });
            }
            estadoDni(`✓ ${r.nombreCompleto}`, 'ok');
        } catch (error) {
            estadoDni(`${error.message || 'No se pudo consultar el DNI.'} Puedes escribir los nombres a mano.`, 'error');
        } finally {
            $('#btnBuscarDniUsuario').disabled = false;
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

        $('#usuarioDepartamento').addEventListener('change', alCambiarDepartamento);
        $('#usuarioProvincia').addEventListener('change', alCambiarProvincia);
        $('#usuarioPerfil').addEventListener('change', () => {
            $('#campoAceptaUsuario').hidden = Boolean(usuarioEditandoId) || !esPerfilCliente();
        });
        ['usuarioDocumento', 'usuarioTelefono'].forEach(id => $(`#${id}`).addEventListener('input', e => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, id === 'usuarioDocumento' ? 8 : 9);
            if (id === 'usuarioDocumento') {
                if (e.target.value.length === 8) consultarDni();
                else estadoDni('');
            }
        }));
        $('#btnBuscarDniUsuario').addEventListener('click', () => consultarDni(true));
        ['usuarioNombres', 'usuarioApellidos'].forEach(id => $(`#${id}`).addEventListener('input', e => e.target.classList.remove('autocompletado')));
        $('#usuarioLicencia').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9); });
        window.CarmovoPoliticas?.vincular($('#usuarioAcepta'), { tipo: 'cliente' });

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
