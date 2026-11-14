(function () {
    const $ = selector => document.querySelector(selector);
    const api = window.CarmovoAdminApi;
    let secundarios = [];
    let permisosDisponibles = {};
    let editando = null;

    function escapar(valor) {
        return String(valor ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
    }
    function avisar(mensaje, error = false) {
        const elemento = $('#ga-mensaje');
        elemento.textContent = mensaje;
        elemento.className = error ? 'ga-mensaje error' : 'ga-mensaje';
        elemento.hidden = false;
        elemento.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function pintarListado() {
        $('#ga-conteo').textContent = `${secundarios.length} cuenta(s) secundaria(s)`;
        $('#ga-filas').innerHTML = secundarios.length ? secundarios.map(u => `
            <tr><td><strong>${escapar(u.nombres)} ${escapar(u.apellidos)}</strong></td>
            <td>${escapar(u.correo)}</td>
            <td><span class="ga-etiqueta ${u.estado ? 'ga-estado-activo' : 'ga-estado-inactivo'}">${u.estado ? 'Activo' : 'Inactivo'}</span></td>
            <td>${(u.permisos || []).length} página(s) asignada(s)</td>
            <td><div class="ga-acciones-tabla"><button type="button" data-editar="${u.idUsuario}">Editar permisos</button>
            ${u.estado ? `<button type="button" data-desactivar="${u.idUsuario}">Desactivar</button>` : ''}</div></td></tr>
        `).join('') : '<tr><td colspan="5">Todavía no hay administradores secundarios.</td></tr>';
    }
    function pintarPermisos() {
        for (const [selector, prefijo] of [['#ga-permisos-panel','ADMIN_'],['#ga-permisos-sitio','WEB_']]) {
            $(selector).innerHTML = Object.entries(permisosDisponibles)
                .filter(([codigo]) => codigo.startsWith(prefijo))
                .map(([codigo,nombre]) => `<label class="ga-permiso"><input type="checkbox" name="permiso" value="${escapar(codigo)}">${escapar(nombre.replace('Sitio: ',''))}</label>`).join('');
        }
    }
    function abrir(usuario = null) {
        editando = usuario?.idUsuario || null;
        const formulario = $('#ga-form'); formulario.reset();
        formulario.elements.nombres.value = usuario?.nombres || '';
        formulario.elements.apellidos.value = usuario?.apellidos || '';
        formulario.elements.correo.value = usuario?.correo || '';
        formulario.elements.estado.checked = usuario?.estado ?? true;
        formulario.elements.contrasena.required = !usuario;
        $('#ga-aviso-clave').textContent = usuario ? '(dejar en blanco para conservar)' : '(mínimo 8 caracteres)';
        $('#ga-titulo-form').textContent = usuario ? 'Editar administrador secundario' : 'Nuevo administrador secundario';
        $('#ga-guardar').textContent = usuario ? 'Guardar cambios' : 'Crear administrador';
        for (const input of formulario.querySelectorAll('[name=permiso]')) input.checked = (usuario?.permisos || []).includes(input.value);
        $('#ga-contenedor-form').hidden = false;
        $('#ga-contenedor-form').scrollIntoView({ behavior: 'smooth' });
    }
    function cerrar() { $('#ga-contenedor-form').hidden = true; editando = null; }
    async function cargar() {
        try {
            [secundarios, permisosDisponibles] = await Promise.all([api.listarAdministradores(),api.obtenerPermisosAdministradores()]);
            pintarListado(); pintarPermisos();
        } catch (error) { avisar(error.message || 'Error al cargar administradores.', true); }
    }
    async function guardar(evento) {
        evento.preventDefault();
        const f = evento.currentTarget;
        const permisos = [...f.querySelectorAll('[name=permiso]:checked')].map(input => input.value);
        if (!permisos.length) { avisar('Selecciona al menos una página.', true); return; }
        const datos = {
            nombres: f.elements.nombres.value.trim(),
            apellidos: f.elements.apellidos.value.trim(),
            correo: f.elements.correo.value.trim(),
            contrasena: f.elements.contrasena.value,
            estado: f.elements.estado.checked,
            permisos
        };
        const btn = $('#ga-guardar');btn.disabled=true;
        try {
            if (editando) await api.actualizarAdministrador(editando, datos);
            else await api.crearAdministrador(datos);
            cerrar(); await cargar(); avisar('Cuenta y permisos guardados correctamente.');
        } catch (error) { avisar(error.message || 'No se pudieron guardar los cambios.', true); }
        finally {btn.disabled=false;}
    }
    async function desactivar(id) {
        const usuario = secundarios.find(u => u.idUsuario === id);
        if (!usuario || !window.confirm(`¿Desactivar el acceso de ${usuario.correo}?`)) return;
        try { await api.desactivarAdministrador(id); await cargar(); avisar('Cuenta desactivada.'); }
        catch (error) { avisar(error.message || 'No se pudo desactivar la cuenta.', true); }
    }
    document.addEventListener('DOMContentLoaded', () => {
        $('#ga-nuevo')?.addEventListener('click', () => abrir());
        $('#ga-cerrar')?.addEventListener('click', cerrar);
        $('#ga-cancelar')?.addEventListener('click', cerrar);
        $('#ga-form')?.addEventListener('submit', guardar);
        $('#ga-filas')?.addEventListener('click', e => {
            const edicion = e.target.closest('[data-editar]');
            const desactivacion = e.target.closest('[data-desactivar]');
            if (edicion) abrir(secundarios.find(u => u.idUsuario === Number(edicion.dataset.editar)));
            if (desactivacion) desactivar(Number(desactivacion.dataset.desactivar));
        });
        cargar();
    });
})();
