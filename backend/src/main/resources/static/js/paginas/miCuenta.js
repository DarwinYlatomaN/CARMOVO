document.addEventListener('DOMContentLoaded', async () => {
    let sesionActual = null;
    let perfilActual = null;

    try {
        sesionActual = JSON.parse(localStorage.getItem('carmovo_sesion'));
    } catch (_) {
        sesionActual = null;
    }

    if (!sesionActual || !sesionActual.logueado || !sesionActual.idUsuario) {
        window.location.href = '/login';
        return;
    }

    if (!window.CarmovoClienteApi) {
        alert('No se pudo cargar el servicio de clientes de CARMOVO.');
        return;
    }

    const btnEditarPerfil = document.getElementById('btn-editar-perfil');
    const modalEditarCuenta = document.getElementById('modal-editar-cuenta');
    const formEditarCuenta = document.getElementById('form-editar-cuenta');
    const modalExito = document.getElementById('modal-exito-actualizacion');
    const botonesCerrar = document.querySelectorAll('.btn-cerrar-modal, .btn-cerrar-exito-cuenta');

    function texto(valor) {
        return valor == null || String(valor).trim() === '' ? 'Sin registrar' : String(valor).trim();
    }

    function formatearFecha(fechaISO) {
        if (!fechaISO) return 'Sin registrar';
        const partes = fechaISO.split('-');
        if (partes.length !== 3) return fechaISO;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function guardarSesionBasica(usuario) {
        const nombreCompleto = `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim();
        sesionActual = {
            logueado: true,
            idUsuario: usuario.idUsuario,
            nombre: nombreCompleto || usuario.correo,
            nombres: usuario.nombres || '',
            apellidos: usuario.apellidos || '',
            correo: usuario.correo || '',
            telefono: usuario.telefono || '',
            perfil: usuario.nombrePerfil || 'Cliente'
        };
        localStorage.setItem('carmovo_sesion', JSON.stringify(sesionActual));
        localStorage.setItem('usuarioCarmovoLogueado', 'true');
    }

    function renderizarPerfil(usuario) {
        const nombreCompleto = `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim();

        document.getElementById('lbl-nombre-completo').textContent = texto(nombreCompleto);
        document.getElementById('lbl-correo').textContent = texto(usuario.correo);
        document.getElementById('lbl-telefono').textContent = texto(usuario.telefono);
        document.getElementById('lbl-documento').textContent = texto(usuario.documento);
        document.getElementById('lbl-nacimiento').textContent = formatearFecha(usuario.fechaNacimiento);
        document.getElementById('lbl-licencia').textContent = texto(usuario.numeroLicencia);
        document.getElementById('lbl-categoria').textContent = texto(usuario.categoriaLicencia);
        document.getElementById('lbl-vence').textContent = formatearFecha(usuario.vencimientoLicencia);
        document.getElementById('lbl-departamento').textContent = texto(usuario.departamento);
        document.getElementById('lbl-provincia').textContent = texto(usuario.provincia);
        document.getElementById('lbl-distrito').textContent = texto(usuario.distrito);
        document.getElementById('lbl-domicilio').textContent = texto(usuario.domicilio);
    }

    function rellenarFormularioPerfil(usuario) {
        document.getElementById('edit-nombre').value = usuario.nombres || '';
        document.getElementById('edit-apellidos').value = usuario.apellidos || '';
        document.getElementById('edit-correo').value = usuario.correo || '';
        document.getElementById('edit-telefono').value = usuario.telefono || '';
        document.getElementById('edit-nacimiento').value = usuario.fechaNacimiento || '';
        document.getElementById('edit-documento').value = usuario.documento || '';
        document.getElementById('edit-licencia').value = usuario.numeroLicencia || '';
        document.getElementById('edit-categoria').value = usuario.categoriaLicencia || '';
        document.getElementById('edit-vence').value = usuario.vencimientoLicencia || '';
        document.getElementById('edit-departamento').value = usuario.departamento || '';
        document.getElementById('edit-provincia').value = usuario.provincia || '';
        document.getElementById('edit-distrito').value = usuario.distrito || '';
        document.getElementById('edit-domicilio').value = usuario.domicilio || '';
    }

    function configurarEstadoAlquiler(alquiler) {
        const cajaEstado = document.querySelector('.caja-estado-actual');
        const tituloEstado = document.getElementById('texto-estado-reserva');
        const mensaje = document.getElementById('mensaje-verificador');
        const vehiculo = document.getElementById('cuenta-vehiculo');
        const fechas = document.getElementById('cuenta-fechas');
        const metodoPago = document.getElementById('cuenta-metodo-pago');
        const total = document.getElementById('cuenta-total');

        if (!alquiler) {
            tituloEstado.textContent = 'Sin reservas registradas';
            mensaje.textContent = 'Cuando realices una reserva, su estado aparecerá aquí.';
            vehiculo.textContent = 'Sin registrar';
            fechas.textContent = 'Sin registrar';
            metodoPago.textContent = 'Sin registrar';
            total.textContent = 'S/ 0.00';
            cajaEstado.classList.remove('pendiente', 'aceptado', 'rechazado');
            cajaEstado.classList.add('pendiente');
            return;
        }

        const estado = alquiler.estado || 'Pendiente';
        tituloEstado.textContent = estado;
        vehiculo.textContent = texto(alquiler.vehiculo);
        fechas.textContent = `${formatearFecha(alquiler.fechaInicio)} - ${formatearFecha(alquiler.fechaFin)}`;
        metodoPago.textContent = texto(alquiler.metodoPago);
        total.textContent = `S/ ${Number(alquiler.total || 0).toFixed(2)}`;

        cajaEstado.classList.remove('pendiente', 'aceptado', 'rechazado');

        if (estado === 'Cancelado') {
            cajaEstado.classList.add('rechazado');
            mensaje.textContent = 'La reserva fue cancelada.';
        } else if (estado === 'Confirmado' || estado === 'En curso' || estado === 'Finalizado') {
            cajaEstado.classList.add('aceptado');
            mensaje.textContent = estado === 'Confirmado'
                ? 'Tu reserva fue confirmada por CARMOVO.'
                : estado === 'En curso'
                    ? 'Tu alquiler se encuentra actualmente en curso.'
                    : 'Tu alquiler ha finalizado.';
        } else {
            cajaEstado.classList.add('pendiente');
            mensaje.textContent = 'Tu reserva está registrada y se encuentra pendiente de confirmación.';
        }
    }

    async function cargarPerfil() {
        const sesionLegacy = { ...sesionActual };

        try {
            perfilActual = await window.CarmovoClienteApi.obtenerPerfil(sesionActual.idUsuario);

            // Migración controlada desde la etapa anterior: si este usuario se registró antes de
            // agregar las nuevas columnas, aprovechamos los datos completos que aún estén en
            // localStorage y los persistimos una sola vez en PostgreSQL.
            const perfilIncompleto = !perfilActual.documento
                || !perfilActual.fechaNacimiento
                || !perfilActual.departamento
                || !perfilActual.provincia
                || !perfilActual.distrito
                || !perfilActual.domicilio
                || !perfilActual.numeroLicencia
                || !perfilActual.categoriaLicencia
                || !perfilActual.vencimientoLicencia;

            const legacyCompleto = sesionLegacy.documento
                && sesionLegacy.nacimiento
                && sesionLegacy.departamento
                && sesionLegacy.provincia
                && sesionLegacy.distrito
                && sesionLegacy.domicilio
                && sesionLegacy.licencia
                && sesionLegacy.categoria
                && sesionLegacy.venceLicencia;

            if (perfilIncompleto && legacyCompleto) {
                try {
                    perfilActual = await window.CarmovoClienteApi.actualizarPerfil(sesionActual.idUsuario, {
                        nombres: perfilActual.nombres || sesionLegacy.nombres,
                        apellidos: perfilActual.apellidos || sesionLegacy.apellidos,
                        correo: perfilActual.correo || sesionLegacy.correo,
                        telefono: perfilActual.telefono || sesionLegacy.telefono,
                        documento: sesionLegacy.documento,
                        fechaNacimiento: sesionLegacy.nacimiento,
                        departamento: sesionLegacy.departamento,
                        provincia: sesionLegacy.provincia,
                        distrito: sesionLegacy.distrito,
                        domicilio: sesionLegacy.domicilio,
                        numeroLicencia: sesionLegacy.licencia,
                        categoriaLicencia: sesionLegacy.categoria,
                        vencimientoLicencia: sesionLegacy.venceLicencia
                    });
                } catch (migracionError) {
                    console.warn('No se pudieron migrar automáticamente los datos antiguos del perfil:', migracionError);
                }
            }

            renderizarPerfil(perfilActual);
            guardarSesionBasica(perfilActual);
        } catch (error) {
            console.error('No se pudo cargar el perfil desde PostgreSQL:', error);
            renderizarPerfil({
                nombres: sesionActual.nombres,
                apellidos: sesionActual.apellidos,
                correo: sesionActual.correo,
                telefono: sesionActual.telefono
            });
        }
    }

    async function cargarUltimoAlquiler() {
        try {
            const alquiler = await window.CarmovoClienteApi.obtenerUltimoAlquiler(sesionActual.idUsuario);
            configurarEstadoAlquiler(alquiler);
        } catch (error) {
            console.error('No se pudo cargar el último alquiler:', error);
            configurarEstadoAlquiler(null);
        }
    }

    if (btnEditarPerfil && modalEditarCuenta) {
        btnEditarPerfil.addEventListener('click', () => {
            if (!perfilActual) return;
            rellenarFormularioPerfil(perfilActual);
            modalEditarCuenta.classList.remove('oculto');
            modalEditarCuenta.classList.add('activo');
        });
    }

    botonesCerrar.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modalEditarCuenta?.classList.add('oculto');
            modalEditarCuenta?.classList.remove('activo');
            modalExito?.classList.add('oculto');
            modalExito?.classList.remove('activo');
        });
    });

    if (formEditarCuenta) {
        formEditarCuenta.addEventListener('submit', async (e) => {
            e.preventDefault();

            const botonGuardar = formEditarCuenta.querySelector('button[type="submit"]');
            const datos = {
                nombres: document.getElementById('edit-nombre').value.trim(),
                apellidos: document.getElementById('edit-apellidos').value.trim(),
                correo: document.getElementById('edit-correo').value.trim(),
                telefono: document.getElementById('edit-telefono').value.trim(),
                fechaNacimiento: document.getElementById('edit-nacimiento').value,
                documento: document.getElementById('edit-documento').value.trim(),
                numeroLicencia: document.getElementById('edit-licencia').value.trim(),
                categoriaLicencia: document.getElementById('edit-categoria').value.trim(),
                vencimientoLicencia: document.getElementById('edit-vence').value,
                departamento: document.getElementById('edit-departamento').value.trim(),
                provincia: document.getElementById('edit-provincia').value.trim(),
                distrito: document.getElementById('edit-distrito').value.trim(),
                domicilio: document.getElementById('edit-domicilio').value.trim()
            };

            try {
                if (botonGuardar) botonGuardar.disabled = true;
                perfilActual = await window.CarmovoClienteApi.actualizarPerfil(sesionActual.idUsuario, datos);
                renderizarPerfil(perfilActual);
                guardarSesionBasica(perfilActual);

                modalEditarCuenta.classList.add('oculto');
                modalEditarCuenta.classList.remove('activo');
                modalExito?.classList.remove('oculto');
                modalExito?.classList.add('activo');

                const botonLogin = document.querySelector('.boton-login');
                if (botonLogin) {
                    const primerNombre = perfilActual.nombres?.split(' ')[0] || 'Cliente';
                    botonLogin.innerHTML = `<i class="fa-solid fa-user"></i> Hola, ${primerNombre}`;
                }
            } catch (error) {
                alert(error.message || 'No se pudo actualizar el perfil.');
            } finally {
                if (botonGuardar) botonGuardar.disabled = false;
            }
        });
    }

    await cargarPerfil();
    await cargarUltimoAlquiler();
});
