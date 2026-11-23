/* =========================================================
   CARMOVO · Empleados
   El administrador principal crea cuentas del personal y les
   asigna UN rol. Los módulos de cada rol se definen en
   "Roles y permisos". La cuenta principal no se puede
   desactivar ni cambiar de rol.
   ========================================================= */
(() => {
    'use strict';

    const api = () => window.CarmovoAdminApi;
    const $ = (id) => document.getElementById(id);

    let empleados = [];
    let roles = [];
    let nombresModulos = {};
    let editando = null;

    // /admin/conductores reutiliza esta pantalla mostrando solo a los choferes de la agencia.
    const MODO_CONDUCTORES = document.body.dataset.pagina === 'conductores';
    const DIA = 86400000;
    const esRolConductor = (nombre) => String(nombre || '').toLowerCase() === 'conductor';
    const rolConductor = () => roles.find(r => esRolConductor(r.nombre));

    function diasParaVencer(fecha) {
        if (!fecha) return null;
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        return Math.round((new Date(`${fecha}T00:00:00`) - hoy) / DIA);
    }

    function fechaCorta(fecha) {
        if (!fecha) return '';
        const [a, m, d] = String(fecha).split('-');
        return `${d}/${m}/${a}`;
    }

    const CLASE_ROL = {
        'administrador': 'ga-rol-administrador',
        'agente de reservas': 'ga-rol-agente',
        'cajero': 'ga-rol-cajero',
        'conductor': 'ga-rol-conductor'
    };

    function esc(v) {
        return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function iniciales(nombres, apellidos) {
        return `${(nombres || '?')[0] || ''}${(apellidos || '')[0] || ''}`.toUpperCase();
    }

    function chipRol(e) {
        const clase = e.principal ? 'ga-rol-principal' : (CLASE_ROL[String(e.rol || '').toLowerCase()] || 'ga-rol-agente');
        return `<span class="ga-chip ${clase}">${e.principal ? '<i class="fa-solid fa-crown"></i>' : ''}${esc(e.rol)}</span>`;
    }

    function avisar(texto, error = false) {
        const caja = $('ga-mensaje');
        caja.textContent = texto;
        caja.classList.toggle('error', error);
        caja.hidden = false;
        clearTimeout(avisar.t);
        avisar.t = setTimeout(() => { caja.hidden = true; }, 5000);
    }

    function modulosPanel(permisos) {
        return (permisos || []).filter(c => c.startsWith('ADMIN_') && c !== 'ADMIN_ADMINISTRADORES');
    }

    // ------------------------------------------------------------ tabla
    function pintarResumen() {
        const caja = $('ga-resumen');
        if (MODO_CONDUCTORES) {
            const choferes = empleados.filter(e => !e.principal && esRolConductor(e.rol));
            const activos = choferes.filter(e => e.estado);
            const dias = activos.map(e => diasParaVencer(e.vencimientoLicencia));
            const porVencer = dias.filter(d => d !== null && d >= 0 && d <= 30).length;
            const vencidas = dias.filter(d => d === null || d < 0).length;
            caja.innerHTML = `
                <div class="ga-resumen__item"><span>Conductores activos</span><strong>${activos.length}</strong></div>
                <div class="ga-resumen__item"><span>Inactivos</span><strong>${choferes.length - activos.length}</strong></div>
                <div class="ga-resumen__item ${porVencer ? 'ga-resumen__item--alerta' : ''}"><span>Licencia vence en 30 días</span><strong>${porVencer}</strong></div>
                <div class="ga-resumen__item ${vencidas ? 'ga-resumen__item--alerta' : ''}"><span>Licencia vencida o sin registrar</span><strong>${vencidas}</strong></div>`;
            return;
        }
        const activos = empleados.filter(e => e.estado);
        const porRol = roles.map(r => ({ nombre: r.nombre, total: r.empleados }));
        caja.innerHTML = `
            <div class="ga-resumen__item"><span>Empleados activos</span><strong>${activos.length}</strong></div>
            ${porRol.map(r => `<div class="ga-resumen__item"><span>${esc(r.nombre)}</span><strong>${r.total}</strong></div>`).join('')}`;
    }

    function filtrados() {
        const texto = $('ga-buscar').value.trim().toLowerCase();
        const rol = $('ga-filtro-rol').value;
        const estado = $('ga-filtro-estado').value;
        return empleados.filter(e => {
            const coincideTexto = !texto ||
                `${e.nombres} ${e.apellidos} ${e.correo} ${e.documento || ''} ${e.telefono || ''} ${e.numeroLicencia || ''}`.toLowerCase().includes(texto);
            const coincideRol = !rol || String(e.idPerfil) === rol;
            const coincideEstado = !estado || String(!!e.estado) === estado;
            if (MODO_CONDUCTORES) return coincideTexto && coincideEstado && !e.principal && esRolConductor(e.rol);
            return coincideTexto && coincideRol && coincideEstado;
        });
    }

    function chipVencimiento(fecha) {
        const d = diasParaVencer(fecha);
        if (d === null) return '<span class="ga-chip ga-vence-mal">Sin licencia</span>';
        if (d < 0) return `<span class="ga-chip ga-vence-mal">Vencida · ${fechaCorta(fecha)}</span>`;
        if (d <= 30) return `<span class="ga-chip ga-vence-pronto">Vence en ${d} ${d === 1 ? 'día' : 'días'}</span>`;
        return `<span class="ga-chip ga-vence-ok">Vigente · ${fechaCorta(fecha)}</span>`;
    }

    function botonesFila(e) {
        return `<td><div class="ga-acciones-tabla">
                    <button type="button" data-accion="editar" data-id="${e.idUsuario}" title="Editar" aria-label="Editar a ${esc(e.nombres)}"><i class="fa-solid fa-pen"></i></button>
                    ${e.principal
                        ? `<button type="button" disabled title="La cuenta principal no se puede desactivar" aria-label="Cuenta protegida"><i class="fa-solid fa-lock"></i></button>`
                        : `<button type="button" class="${e.estado ? 'apagar' : 'encender'}" data-accion="${e.estado ? 'desactivar' : 'activar'}" data-id="${e.idUsuario}"
                              title="${e.estado ? 'Desactivar acceso' : 'Activar acceso'}" aria-label="${e.estado ? 'Desactivar' : 'Activar'} a ${esc(e.nombres)}">
                              <i class="fa-solid fa-power-off"></i></button>`}
                </div></td>`;
    }

    function pintarTablaConductores(lista) {
        $('ga-filas').innerHTML = lista.length ? lista.map(e => `
            <tr>
                <td><div class="ga-persona"><span class="ga-avatar">${esc(iniciales(e.nombres, e.apellidos))}</span>
                    <div><strong>${esc(e.nombres)} ${esc(e.apellidos)}</strong><small>${esc(e.correo)}</small>
                    <span class="ga-dato-extra">${e.documento ? `DNI ${esc(e.documento)}` : 'Sin DNI'}${e.telefono ? ` · Cel. ${esc(e.telefono)}` : ''}</span></div></div></td>
                <td><div class="ga-licencia-dato"><strong>${esc(e.numeroLicencia || '—')}</strong><small>${e.categoriaLicencia ? `Categoría ${esc(e.categoriaLicencia)}` : 'Completa la licencia'}</small></div></td>
                <td>${chipVencimiento(e.vencimientoLicencia)}</td>
                <td><span class="ga-chip ${e.estado ? 'ga-estado-activo' : 'ga-estado-inactivo'}">● ${e.estado ? 'Activo' : 'Inactivo'}</span></td>
                ${botonesFila(e)}
            </tr>`).join('')
            : `<tr><td colspan="5" class="ga-vacio">${empleados.some(e => esRolConductor(e.rol))
                ? 'No hay conductores que coincidan con la búsqueda.'
                : 'Aún no hay conductores. Usa "Registrar conductor" para agregar al primero.'}</td></tr>`;
    }

    function pintarTabla() {
        const lista = filtrados();
        if (MODO_CONDUCTORES) return pintarTablaConductores(lista);
        $('ga-filas').innerHTML = lista.length ? lista.map(e => {
            const modulos = e.principal ? 'Todos los módulos' :
                (modulosPanel(e.permisos).length ? `${modulosPanel(e.permisos).length} módulos del panel` : 'Sin módulos del panel');
            return `
            <tr class="${e.principal ? 'ga-fila-principal' : ''}">
                <td><div class="ga-persona"><span class="ga-avatar">${esc(iniciales(e.nombres, e.apellidos))}</span>
                    <div><strong>${esc(e.nombres)} ${esc(e.apellidos)}</strong><small>${esc(e.correo)}</small>
                    ${e.documento || e.telefono ? `<span class="ga-dato-extra">${e.documento ? `DNI ${esc(e.documento)}` : ''}${e.documento && e.telefono ? ' · ' : ''}${e.telefono ? `Cel. ${esc(e.telefono)}` : ''}</span>` : ''}</div></div></td>
                <td>${chipRol(e)}</td>
                <td><span class="ga-chip ${e.estado ? 'ga-estado-activo' : 'ga-estado-inactivo'}">● ${e.estado ? 'Activo' : 'Inactivo'}</span></td>
                <td><span class="ga-modulos-texto">${modulos}</span></td>
                ${botonesFila(e)}
            </tr>`;
        }).join('') : '<tr><td colspan="5" class="ga-vacio">No hay empleados que coincidan con la búsqueda.</td></tr>';
    }

    // ------------------------------------------------------------ formulario
    function pintarModulosDelRol() {
        const idPerfil = Number($('ga-rol').value);
        const rol = roles.find(r => r.idPerfil === idPerfil);
        const caja = $('ga-modulos');
        if (editando?.principal) {
            caja.innerHTML = '';
            return;
        }
        const modulos = modulosPanel(rol?.permisos);
        caja.innerHTML = `<span class="ga-modulos__titulo">Este rol podrá entrar a:</span>` +
            (modulos.length
                ? modulos.map(c => `<span class="ga-chip">${esc(nombresModulos[c] || c)}</span>`).join('')
                : '<span class="ga-chip">Ningún módulo del panel todavía</span>');
    }

    function esConductor() {
        const rol = roles.find(r => r.idPerfil === Number($('ga-rol').value));
        return !editando?.principal && String(rol?.nombre || '').toLowerCase() === 'conductor';
    }

    function mostrarLicencia() {
        const form = $('ga-form');
        const tieneDatos = !!(form.numeroLicencia.value || form.categoriaLicencia.value);
        $('ga-licencia').hidden = !(esConductor() || tieneDatos);
    }

    // ------------------------------------------------------------ DNI → nombres (RENIEC)
    let ultimoDniConsultado = '';
    let nombresAutomaticos = null;

    function estadoDni(texto, tipo = '') {
        const caja = $('ga-dni-estado');
        caja.textContent = texto || '';
        caja.className = `ga-dni-estado ${tipo}`;
        caja.hidden = !texto;
    }

    async function consultarDni(forzar = false) {
        const form = $('ga-form');
        const dni = form.documento.value.trim();
        if (!/^\d{8}$/.test(dni)) {
            if (forzar) estadoDni('Escribe los 8 dígitos del DNI.', 'error');
            return;
        }
        if (dni === ultimoDniConsultado && !forzar) return;
        ultimoDniConsultado = dni;
        // Solo se sobrescriben los nombres si están vacíos o los puso la consulta anterior.
        const puedeEscribir = () => !form.nombres.value.trim() || !form.apellidos.value.trim() ||
            (nombresAutomaticos && form.nombres.value === nombresAutomaticos.nombres && form.apellidos.value === nombresAutomaticos.apellidos);
        estadoDni('Buscando en RENIEC…');
        $('ga-buscar-dni').disabled = true;
        try {
            const r = await api().consultarDni(dni);
            if (form.documento.value.trim() !== dni) return;
            if (!r?.nombres) throw new Error('No se encontró ese DNI.');
            if (puedeEscribir() || forzar) {
                form.nombres.value = r.nombres;
                form.apellidos.value = r.apellidos;
                nombresAutomaticos = { nombres: r.nombres, apellidos: r.apellidos };
                [form.nombres, form.apellidos].forEach(i => i.classList.add('autocompletado'));
            }
            estadoDni(`✓ ${r.nombreCompleto}`, 'ok');
        } catch (error) {
            estadoDni(`${error.message || 'No se pudo consultar el DNI.'} Puedes escribir los nombres a mano.`, 'error');
        } finally {
            $('ga-buscar-dni').disabled = false;
        }
    }

    function abrirFormulario(empleado = null) {
        editando = empleado;
        const form = $('ga-form');
        form.reset();
        $('ga-error-form').hidden = true;

        const palabra = MODO_CONDUCTORES ? 'conductor' : 'empleado';
        $('ga-titulo-form').textContent = empleado ? `Editar ${palabra}` : (MODO_CONDUCTORES ? 'Registrar conductor' : 'Nuevo empleado');
        $('ga-subtitulo-form').textContent = empleado
            ? 'Actualiza los datos. Deja la contraseña vacía para conservar la actual.'
            : (MODO_CONDUCTORES
                ? 'Chofer de la agencia: verá en su celular los alquileres con chofer que se le asignen.'
                : 'Recibirá acceso al panel con los módulos de su rol.');
        $('ga-aviso-clave').textContent = empleado ? '(opcional)' : '(mínimo 8 caracteres)';
        $('ga-guardar').textContent = empleado ? 'Guardar cambios' : (MODO_CONDUCTORES ? 'Registrar conductor' : 'Crear empleado');

        const principal = !!empleado?.principal;
        $('ga-campo-rol').hidden = principal || MODO_CONDUCTORES;
        // La aceptación se pide una sola vez; queda guardada con fecha y hora.
        const yaAcepto = !!empleado?.politicasAceptadas;
        $('ga-campo-acepto').hidden = yaAcepto;
        $('ga-campo-acepto').classList.remove('ga-acepto--ok');
        $('ga-campo-estado').hidden = principal;
        $('ga-aviso-principal').hidden = !principal;

        if (empleado) {
            form.nombres.value = empleado.nombres || '';
            form.apellidos.value = empleado.apellidos || '';
            form.correo.value = empleado.correo || '';
            form.estado.checked = !!empleado.estado;
            form.documento.value = empleado.documento || '';
            form.telefono.value = empleado.telefono || '';
            form.fechaNacimiento.value = empleado.fechaNacimiento || '';
            form.domicilio.value = empleado.domicilio || '';
            form.distrito.value = empleado.distrito || '';
            form.numeroLicencia.value = empleado.numeroLicencia || '';
            form.categoriaLicencia.value = empleado.categoriaLicencia || '';
            form.vencimientoLicencia.value = empleado.vencimientoLicencia || '';
            if (empleado.idPerfil) form.idPerfil.value = String(empleado.idPerfil);
        } else {
            const primero = (MODO_CONDUCTORES && rolConductor()) || roles.find(r => r.editable) || roles[0];
            if (primero) form.idPerfil.value = String(primero.idPerfil);
        }

        pintarModulosDelRol();
        $('ga-modulos').hidden = MODO_CONDUCTORES;
        mostrarLicencia();
        ultimoDniConsultado = empleado?.documento || '';
        nombresAutomaticos = null;
        estadoDni('');
        form.querySelectorAll('.autocompletado').forEach(i => i.classList.remove('autocompletado'));
        $('ga-modal').hidden = false;
        setTimeout(() => (empleado ? form.nombres : form.documento).focus(), 50);
    }

    function cerrarFormulario() {
        $('ga-modal').hidden = true;
        editando = null;
    }

    function errorFormulario(texto) {
        const caja = $('ga-error-form');
        caja.textContent = texto;
        caja.hidden = !texto;
    }

    async function guardar(evento) {
        evento.preventDefault();
        const form = $('ga-form');
        const datos = {
            nombres: form.nombres.value.trim(),
            apellidos: form.apellidos.value.trim(),
            correo: form.correo.value.trim(),
            contrasena: form.contrasena.value,
            estado: form.estado.checked,
            idPerfil: Number(form.idPerfil.value) || null,
            documento: form.documento.value.trim(),
            telefono: form.telefono.value.trim(),
            fechaNacimiento: form.fechaNacimiento.value || null,
            domicilio: form.domicilio.value.trim(),
            distrito: form.distrito.value.trim(),
            numeroLicencia: form.numeroLicencia.value.trim().toUpperCase(),
            categoriaLicencia: form.categoriaLicencia.value,
            vencimientoLicencia: form.vencimientoLicencia.value || null,
            aceptaPoliticas: form.aceptaPoliticas.checked
        };

        if (!datos.nombres || !datos.apellidos) return errorFormulario('Completa nombres y apellidos.');
        if (!/^\d{8}$/.test(datos.documento)) return errorFormulario('El DNI debe tener 8 dígitos.');
        if (!datos.fechaNacimiento) return errorFormulario('Indica la fecha de nacimiento.');
        const edad = (Date.now() - new Date(`${datos.fechaNacimiento}T00:00:00`)) / (365.25 * 86400000);
        if (edad < 18 || edad > 80) return errorFormulario('El empleado debe tener entre 18 y 80 años.');
        if (!/^9\d{8}$/.test(datos.telefono)) return errorFormulario('El celular debe tener 9 dígitos y empezar con 9.');
        if (datos.domicilio.length < 5) return errorFormulario('Escribe el domicilio.');
        if (esConductor() || datos.numeroLicencia) {
            if (!/^[A-Z]?\d{8,9}$/.test(datos.numeroLicencia)) return errorFormulario('El número de licencia debe ser una letra y el DNI (ej.: Q12345678).');
            if (!datos.categoriaLicencia) return errorFormulario('Selecciona la categoría de la licencia.');
            if (!datos.vencimientoLicencia || datos.vencimientoLicencia <= new Date().toISOString().slice(0, 10))
                return errorFormulario('La licencia debe estar vigente.');
        } else {
            delete datos.numeroLicencia; delete datos.categoriaLicencia; delete datos.vencimientoLicencia;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) return errorFormulario('Ingresa un correo válido.');
        if (!editando && datos.contrasena.length < 8) return errorFormulario('La contraseña temporal debe tener al menos 8 caracteres.');
        if (datos.contrasena && (datos.contrasena.length < 8 || datos.contrasena.length > 72))
            return errorFormulario('La contraseña debe tener entre 8 y 72 caracteres.');
        if (!editando?.principal && !datos.idPerfil) return errorFormulario('Selecciona el rol del empleado.');
        if (!datos.contrasena) delete datos.contrasena;
        if (!editando?.politicasAceptadas && !datos.aceptaPoliticas)
            return errorFormulario('Marca la casilla de aceptación de términos y política de privacidad.');

        const boton = $('ga-guardar');
        boton.disabled = true;
        try {
            if (editando) {
                await api().actualizarAdministrador(editando.idUsuario, datos);
                avisar(MODO_CONDUCTORES ? 'Conductor actualizado correctamente.' : 'Empleado actualizado correctamente.');
            } else {
                await api().crearAdministrador(datos);
                avisar(MODO_CONDUCTORES
                    ? 'Conductor registrado. Ya puede entrar a "Mis servicios" con su correo.'
                    : 'Empleado creado. Ya puede iniciar sesión en el panel.');
            }
            cerrarFormulario();
            await cargar();
        } catch (error) {
            errorFormulario(error.message || 'No se pudo guardar el empleado.');
        } finally {
            boton.disabled = false;
        }
    }

    async function cambiarEstado(id, activar) {
        const empleado = empleados.find(e => e.idUsuario === id);
        if (!empleado) return;
        if (!activar && !window.confirm(`¿Desactivar el acceso de ${empleado.nombres} ${empleado.apellidos}? Ya no podrá entrar al panel.`)) return;
        try {
            if (activar) await api().activarAdministrador(id);
            else await api().desactivarAdministrador(id);
            avisar(activar ? 'Acceso activado.' : 'Acceso desactivado.');
            await cargar();
        } catch (error) {
            avisar(error.message || 'No se pudo cambiar el estado.', true);
        }
    }

    // ------------------------------------------------------------ carga
    async function cargar() {
        try {
            const [lista, listaRoles, modulos] = await Promise.all([
                api().listarAdministradores(),
                api().listarRoles(),
                api().listarModulosRoles()
            ]);
            empleados = lista || [];
            roles = listaRoles || [];
            nombresModulos = { ...(modulos?.panel || {}), ...(modulos?.sitio || {}) };

            const opciones = roles.map(r => `<option value="${r.idPerfil}">${esc(r.nombre)}</option>`).join('');
            $('ga-rol').innerHTML = opciones;
            const filtroActual = $('ga-filtro-rol').value;
            $('ga-filtro-rol').innerHTML = '<option value="">Todos los roles</option>' + opciones;
            $('ga-filtro-rol').value = filtroActual;

            if (MODO_CONDUCTORES) {
                const hayRol = !!rolConductor();
                $('ga-nuevo').disabled = !hayRol;
                $('ga-sin-rol')?.remove();
                if (!hayRol) {
                    $('ga-resumen').insertAdjacentHTML('beforebegin',
                        '<p class="ga-sin-rol" id="ga-sin-rol"><i class="fa-solid fa-triangle-exclamation"></i> No existe el rol "Conductor". Créalo en Roles y permisos para poder registrar choferes.</p>');
                }
            }
            pintarResumen();
            pintarTabla();
        } catch (error) {
            $('ga-filas').innerHTML = '<tr><td colspan="5" class="ga-vacio">No se pudieron cargar los empleados.</td></tr>';
            avisar(error.message || 'Error al cargar los empleados.', true);
        }
    }

    function prepararModoConductores() {
        if (!MODO_CONDUCTORES) return;
        $('ga-titulo-cabecera').textContent = 'Conductores';
        $('fechaAdmin').textContent = 'Choferes de la agencia';
        $('ga-titulo').textContent = 'Conductores';
        $('ga-descripcion').textContent = 'Choferes de la agencia para los alquileres "con chofer". Registra su licencia y asígnalos desde Alquileres.';
        $('ga-nuevo-texto').textContent = 'Registrar conductor';
        $('ga-filtro-rol').hidden = true;
        $('ga-buscar').placeholder = 'Buscar por nombre, DNI, celular o licencia';
        $('ga-cabecera-tabla').innerHTML = '<tr><th>Conductor</th><th>Licencia</th><th>Vencimiento</th><th>Estado</th><th class="ga-col-acciones">Acciones</th></tr>';
        const enlace = $('ga-enlace-roles');
        enlace.href = '/admin/gestion-alquileres';
        enlace.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Asignar a alquileres';
    }

    function preparar() {
        prepararModoConductores();
        window.CarmovoPoliticas?.vincular($('ga-form').aceptaPoliticas, { tipo: 'empleado' });
        $('ga-form').aceptaPoliticas.addEventListener('change', e =>
            $('ga-campo-acepto').classList.toggle('ga-acepto--ok', e.target.checked));
        $('ga-nuevo').addEventListener('click', () => abrirFormulario());
        $('ga-cerrar').addEventListener('click', cerrarFormulario);
        $('ga-cancelar').addEventListener('click', cerrarFormulario);
        $('ga-form').addEventListener('submit', guardar);
        $('ga-rol').addEventListener('change', () => { pintarModulosDelRol(); mostrarLicencia(); });
        ['documento', 'telefono'].forEach(n => $('ga-form')[n].addEventListener('input', e => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, n === 'documento' ? 8 : 9);
            if (n === 'documento') {
                if (e.target.value.length === 8) consultarDni();
                else estadoDni('');
            }
        }));
        $('ga-buscar-dni').addEventListener('click', () => consultarDni(true));
        ['nombres', 'apellidos'].forEach(n => $('ga-form')[n].addEventListener('input', e => e.target.classList.remove('autocompletado')));
        $('ga-modal').addEventListener('click', e => { if (e.target.id === 'ga-modal') cerrarFormulario(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('ga-modal').hidden) cerrarFormulario(); });
        ['ga-buscar', 'ga-filtro-rol', 'ga-filtro-estado'].forEach(id =>
            $(id).addEventListener(id === 'ga-buscar' ? 'input' : 'change', pintarTabla));

        $('ga-filas').addEventListener('click', e => {
            const boton = e.target.closest('button[data-accion]');
            if (!boton) return;
            const id = Number(boton.dataset.id);
            if (boton.dataset.accion === 'editar') abrirFormulario(empleados.find(x => x.idUsuario === id));
            if (boton.dataset.accion === 'desactivar') cambiarEstado(id, false);
            if (boton.dataset.accion === 'activar') cambiarEstado(id, true);
        });
        cargar();
    }

    document.addEventListener('DOMContentLoaded', preparar);
})();
