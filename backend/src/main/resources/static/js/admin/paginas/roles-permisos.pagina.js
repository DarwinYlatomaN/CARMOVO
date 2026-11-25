/* =========================================================
   CARMOVO · Roles y permisos
   Matriz módulo × rol. El administrador principal marca qué
   módulos ve cada rol y guarda todos los cambios de una vez.
   ========================================================= */
(() => {
    'use strict';

    const api = () => window.CarmovoAdminApi;
    const $ = (id) => document.getElementById(id);

    const DESCRIPCIONES = {
        ADMIN_TABLERO: 'Indicadores del día',
        ADMIN_FLOTA: 'Vehículos y disponibilidad',
        ADMIN_ALQUILERES: 'Registrar, confirmar y entregar',
        ADMIN_USUARIOS: 'Registrar y editar clientes',
        ADMIN_PAGOS: 'Validar pagos y comprobantes',
        ADMIN_MONITOREO: 'Autos en ruta',
        ADMIN_REPORTES: 'Ingresos y ocupación',
        ADMIN_AUDITORIA: 'Historial de acciones'
    };
    const CLASE_ROL = {
        'administrador': 'ga-rol-administrador',
        'agente de reservas': 'ga-rol-agente',
        'cajero': 'ga-rol-cajero',
        'conductor': 'ga-rol-conductor'
    };

    let roles = [];
    let modulos = { panel: {}, sitio: {} };
    let borrador = new Map(); // idPerfil -> Set de permisos

    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function avisar(texto, error = false) {
        const caja = $('ga-mensaje');
        caja.textContent = texto;
        caja.classList.toggle('error', error);
        caja.hidden = false;
        clearTimeout(avisar.t);
        avisar.t = setTimeout(() => { caja.hidden = true; }, 5000);
    }

    function rolesModificados() {
        return roles.filter(r => {
            if (!r.editable) return false;
            const original = new Set(r.permisos);
            const actual = borrador.get(r.idPerfil);
            if (original.size !== actual.size) return true;
            for (const c of actual) if (!original.has(c)) return true;
            return false;
        });
    }

    function actualizarBarra() {
        const cambiados = rolesModificados();
        $('rp-barra').hidden = cambiados.length === 0;
        $('rp-cambios').textContent = cambiados.length === 1
            ? `Cambios sin guardar en el rol ${cambiados[0].nombre}`
            : `Cambios sin guardar en ${cambiados.length} roles`;
    }

    function celda(rol, codigo) {
        const marcado = borrador.get(rol.idPerfil).has(codigo);
        const id = `rp-${rol.idPerfil}-${codigo}`;
        return `<td><label class="rp-check" for="${id}" title="${rol.editable ? '' : 'El rol Administrador siempre tiene todos los módulos'}">
            <input type="checkbox" id="${id}" data-rol="${rol.idPerfil}" data-codigo="${codigo}"
                   ${marcado ? 'checked' : ''} ${rol.editable ? '' : 'disabled'}
                   aria-label="${esc(rol.nombre)}: ${esc(modulos.panel[codigo] || modulos.sitio[codigo] || codigo)}">
            <span></span></label></td>`;
    }

    function pintar() {
        $('rp-cabecera').innerHTML = `<tr><th>Módulo</th>${roles.map(r => `
            <th><div class="rp-rol">
                <span class="ga-chip ${CLASE_ROL[r.nombre.toLowerCase()] || 'ga-rol-agente'}">${r.editable ? '' : '<i class="fa-solid fa-lock"></i>'}${esc(r.nombre)}</span>
                <small>${r.empleados} ${r.empleados === 1 ? 'cuenta' : 'cuentas'}</small>
                ${r.deFabrica ? '' : `<span class="rp-rol-acciones">
                    <button type="button" data-renombrar="${r.idPerfil}" title="Cambiar nombre" aria-label="Cambiar nombre de ${esc(r.nombre)}"><i class="fa-solid fa-pen"></i></button>
                    <button type="button" data-eliminar-rol="${r.idPerfil}" title="${r.empleados ? 'Tiene empleados: cámbialos de rol para poder eliminarlo' : 'Eliminar rol'}"
                        ${r.empleados ? 'disabled' : ''} aria-label="Eliminar ${esc(r.nombre)}"><i class="fa-solid fa-trash"></i></button></span>`}
            </div></th>`).join('')}</tr>`;

        const filasPanel = Object.entries(modulos.panel).map(([codigo, nombre]) => `
            <tr><td class="rp-modulo"><strong>${esc(nombre)}</strong><small>${esc(DESCRIPCIONES[codigo] || '')}</small></td>
                ${roles.map(r => celda(r, codigo)).join('')}</tr>`).join('');
        const filasSitio = Object.entries(modulos.sitio).map(([codigo, nombre]) => `
            <tr><td class="rp-modulo"><strong>${esc(nombre)}</strong></td>
                ${roles.map(r => celda(r, codigo)).join('')}</tr>`).join('');

        $('rp-cuerpo').innerHTML =
            `<tr class="rp-grupo"><td colspan="${roles.length + 1}">Panel administrativo</td></tr>${filasPanel}` +
            `<tr class="rp-grupo"><td colspan="${roles.length + 1}">Sitio web (al navegar con la sesión del panel)</td></tr>${filasSitio}` +
            `<tr><td class="rp-modulo"><strong>Empleados y Roles y permisos</strong><small>Exclusivo del administrador principal</small></td>
                ${roles.map(() => '<td><i class="fa-solid fa-lock" style="color:#9BB3C3" aria-label="Exclusivo del principal"></i></td>').join('')}</tr>`;
        actualizarBarra();
    }

    function reiniciarBorrador() {
        borrador = new Map(roles.map(r => [r.idPerfil, new Set(r.permisos)]));
    }

    async function guardar() {
        const cambiados = rolesModificados();
        const vacios = cambiados.filter(r => ![...borrador.get(r.idPerfil)].some(c => c.startsWith('ADMIN_')));
        if (vacios.length && !(await window.CarmovoDialogo.confirmar({
            titulo: 'Rol sin módulos',
            mensaje: `El rol ${vacios.map(r => r.nombre).join(', ')} quedará sin módulos del panel y sus empleados no podrán trabajar en él.`,
            aceptar: 'Guardar igual'
        }))) {
            return;
        }
        const boton = $('rp-guardar');
        boton.disabled = true;
        try {
            for (const rol of cambiados) {
                await api().actualizarPermisosRol(rol.idPerfil, [...borrador.get(rol.idPerfil)]);
            }
            avisar('Permisos guardados. Ya se aplican a todos los empleados del rol.');
            await cargar();
        } catch (error) {
            avisar(error.message || 'No se pudieron guardar los permisos.', true);
        } finally {
            boton.disabled = false;
        }
    }

    // ------------------------------------------------------------ crear, renombrar y eliminar roles
    let rolEnEdicion = null;

    async function abrirModal(rol = null) {
        if (rolesModificados().length && !(await window.CarmovoDialogo.confirmar({ titulo: 'Cambios sin guardar', mensaje: 'Tienes cambios de permisos sin guardar. Si continúas, se perderán.', aceptar: 'Continuar' }))) return;
        rolEnEdicion = rol;
        const f = $('rp-form');
        f.reset();
        f.querySelector('.pu-error').hidden = true;
        $('rp-modal-titulo').textContent = rol ? `Cambiar nombre de "${rol.nombre}"` : 'Nuevo rol';
        $('rp-modal-ayuda').textContent = rol ? 'Sus empleados y permisos se mantienen.' : 'Por ejemplo: Supervisor, Recepcionista o Mecánico.';
        $('rp-modal-guardar').textContent = rol ? 'Guardar nombre' : 'Crear rol';
        $('rp-campo-copiar').hidden = !!rol;
        f.copiar.innerHTML = '<option value="">Ningún módulo (lo marco después)</option>' +
            roles.filter(r => r.editable).map(r => `<option value="${r.idPerfil}">${esc(r.nombre)}</option>`).join('');
        f.nombre.value = rol?.nombre || '';
        $('rp-modal').hidden = false;
        setTimeout(() => f.nombre.focus(), 50);
    }

    function cerrarModal() { $('rp-modal').hidden = true; rolEnEdicion = null; }

    async function guardarRol(e) {
        e.preventDefault();
        const f = e.target;
        const error = f.querySelector('.pu-error');
        const mostrar = t => { error.textContent = t; error.hidden = false; };
        const nombre = f.nombre.value.trim().replace(/\s+/g, ' ');
        if (!/^[\p{L}][\p{L} .\-]{1,49}$/u.test(nombre)) return mostrar('El nombre debe tener entre 2 y 50 letras (puede llevar espacios, puntos o guiones).');
        if (nombre.toLowerCase() === 'cliente') return mostrar('Ese nombre está reservado.');
        if (roles.some(r => r.nombre.toLowerCase() === nombre.toLowerCase() && r.idPerfil !== rolEnEdicion?.idPerfil)) {
            return mostrar(`Ya existe un rol llamado ${nombre}.`);
        }
        const boton = $('rp-modal-guardar');
        boton.disabled = true;
        try {
            if (rolEnEdicion) {
                await api().renombrarRol(rolEnEdicion.idPerfil, nombre);
                avisar('Nombre del rol actualizado.');
            } else {
                const base = roles.find(r => String(r.idPerfil) === f.copiar.value);
                await api().crearRol(nombre, base ? base.permisos : []);
                avisar(`Rol ${nombre} creado. Marca sus módulos en la tabla y asígnalo a empleados en "Empleados".`);
            }
            cerrarModal();
            await cargar();
        } catch (err) {
            mostrar(err.message || 'No se pudo guardar el rol.');
        } finally {
            boton.disabled = false;
        }
    }

    async function eliminarRol(id) {
        const rol = roles.find(r => r.idPerfil === id);
        if (!rol || !(await window.CarmovoDialogo.confirmar({ titulo: `¿Eliminar el rol "${rol.nombre}"?`, mensaje: 'Esta acción no se puede deshacer.', aceptar: 'Eliminar', tipo: 'peligro' }))) return;
        try {
            await api().eliminarRol(id);
            avisar('Rol eliminado.');
            await cargar();
        } catch (err) {
            avisar(err.message || 'No se pudo eliminar el rol.', true);
        }
    }

    async function cargar() {
        try {
            const [listaRoles, catalogo] = await Promise.all([api().listarRoles(), api().listarModulosRoles()]);
            roles = listaRoles || [];
            modulos = catalogo || { panel: {}, sitio: {} };
            reiniciarBorrador();
            pintar();
        } catch (error) {
            $('rp-cuerpo').innerHTML = '<tr><td class="ga-vacio">No se pudieron cargar los roles.</td></tr>';
            avisar(error.message || 'Error al cargar los roles.', true);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        $('rp-cuerpo').addEventListener('change', e => {
            const casilla = e.target.closest('input[data-rol]');
            if (!casilla) return;
            const permisos = borrador.get(Number(casilla.dataset.rol));
            if (casilla.checked) permisos.add(casilla.dataset.codigo);
            else permisos.delete(casilla.dataset.codigo);
            actualizarBarra();
        });
        $('rp-descartar').addEventListener('click', () => { reiniciarBorrador(); pintar(); });
        $('rp-nuevo').addEventListener('click', () => abrirModal());
        $('rp-form').addEventListener('submit', guardarRol);
        $('rp-modal').addEventListener('click', e => { if (e.target.id === 'rp-modal' || e.target.closest('[data-cerrar]')) cerrarModal(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('rp-modal').hidden) cerrarModal(); });
        $('rp-cabecera').addEventListener('click', e => {
            const ren = e.target.closest('[data-renombrar]');
            const del = e.target.closest('[data-eliminar-rol]');
            if (ren) abrirModal(roles.find(r => r.idPerfil === Number(ren.dataset.renombrar)));
            if (del) eliminarRol(Number(del.dataset.eliminarRol));
        });
        $('rp-guardar').addEventListener('click', guardar);
        window.addEventListener('beforeunload', e => {
            if (rolesModificados().length) { e.preventDefault(); e.returnValue = ''; }
        });
        cargar();
    });
})();
