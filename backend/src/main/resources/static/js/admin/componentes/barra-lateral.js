(function () {
    const opcionesMenu = [
        {
            pagina: 'tablero',
            permiso: 'ADMIN_TABLERO',
            texto: 'Tablero',
            icono: 'fa-chart-pie',
            ruta: '/admin/tablero'
        },
        {
            pagina: 'gestion-flota',
            permiso: 'ADMIN_FLOTA',
            texto: 'Gesti\u00f3n de flota',
            icono: 'fa-car-side',
            ruta: '/admin/gestion-flota'
        },
        {
            pagina: 'mantenimiento',
            permiso: 'ADMIN_FLOTA',
            texto: 'Mantenimiento',
            icono: 'fa-screwdriver-wrench',
            ruta: '/admin/mantenimiento'
        },
        {
            pagina: 'categorias',
            permiso: 'ADMIN_FLOTA',
            texto: 'Categor\u00edas',
            icono: 'fa-layer-group',
            ruta: '/admin/categorias'
        },
        {
            pagina: 'gestion-alquileres',
            permiso: 'ADMIN_ALQUILERES',
            texto: 'Alquileres',
            icono: 'fa-calendar-check',
            ruta: '/admin/gestion-alquileres'
        },
        {
            pagina: 'mis-servicios',
            permiso: 'ADMIN_SERVICIOS',
            texto: 'Mis servicios',
            icono: 'fa-route',
            ruta: '/admin/mis-servicios'
        },
        {
            pagina: 'gestion-usuarios',
            permiso: 'ADMIN_USUARIOS',
            texto: 'Usuarios',
            icono: 'fa-users',
            ruta: '/admin/gestion-usuarios'
        },
        {
            pagina: 'gestion-pagos',
            permiso: 'ADMIN_PAGOS',
            texto: 'Pagos e ingresos',
            icono: 'fa-wallet',
            ruta: '/admin/gestion-pagos'
        },
        {
            pagina: 'monitoreo-flota',
            permiso: 'ADMIN_MONITOREO',
            texto: 'Monitoreo',
            icono: 'fa-location-dot',
            ruta: '/admin/monitoreo-flota'
        },
        {
            pagina: 'reportes',
            permiso: 'ADMIN_REPORTES',
            texto: 'Reportes',
            icono: 'fa-chart-column',
            ruta: '/admin/reportes'
        },
        {
            pagina: 'registro-auditoria',
            permiso: 'ADMIN_AUDITORIA',
            texto: 'Auditor\u00eda',
            icono: 'fa-clipboard-list',
            ruta: '/admin/registro-auditoria'
        },
        {
            pagina: 'portal-web',
            permiso: 'ADMIN_PORTAL',
            texto: 'Portal web',
            icono: 'fa-globe',
            ruta: '/admin/portal-web'
        }
        ,{
            pagina: 'gestion-administradores',
            permiso: 'ADMIN_ADMINISTRADORES',
            texto: 'Empleados',
            icono: 'fa-id-badge',
            ruta: '/admin/gestion-administradores'
        },
        {
            pagina: 'conductores',
            permiso: 'ADMIN_ADMINISTRADORES',
            texto: 'Conductores',
            icono: 'fa-user-tie',
            ruta: '/admin/conductores'
        },
        {
            pagina: 'roles-permisos',
            permiso: 'ADMIN_ADMINISTRADORES',
            texto: 'Roles y permisos',
            icono: 'fa-shield-halved',
            ruta: '/admin/roles-permisos'
        }
    ];

    const GRUPOS_MENU = [
        { titulo: 'General', paginas: ['tablero'] },
        { titulo: 'Operaci\u00f3n', paginas: ['gestion-alquileres', 'mis-servicios', 'gestion-pagos', 'monitoreo-flota'] },
        { titulo: 'Flota', paginas: ['gestion-flota', 'mantenimiento', 'categorias'] },
        { titulo: 'Clientes y sitio web', paginas: ['gestion-usuarios', 'portal-web'] },
        { titulo: 'Control', paginas: ['reportes', 'registro-auditoria'] },
        { titulo: 'Personal', paginas: ['gestion-administradores', 'conductores', 'roles-permisos'] }
    ];

    const RUTA_LOGIN = '/admin/login';
    const RUTA_HOME = '/home';
    const RUTA_LOGO = '/recursos/imagenes/home/logo-carmovo-transparente.png';

    function obtenerSesion() {
        return window.CarmovoAdminApi?.obtenerSesionLocal?.() || null;
    }

    function construirBarraLateral() {
        const contenedor = document.getElementById('barraLateral');
        if (!contenedor) return;

        const paginaActual = document.body.dataset.pagina || '';
        const sesion = obtenerSesion();

        const autorizada = permiso => !!sesion?.principal || (sesion?.permisos || []).includes(permiso);
        const enlace = opcion => `
            <li>
                <a class="barra-lateral__enlace ${paginaActual === opcion.pagina ? 'activo' : ''}"
                   href="${opcion.ruta}">
                    <i class="fa-solid ${opcion.icono}"></i>
                    <span>${opcion.texto}</span>
                </a>
            </li>`;

        // El menú se ordena por áreas de trabajo; un grupo sin módulos permitidos no se muestra.
        const grupos = GRUPOS_MENU.map(grupo => {
            const opciones = grupo.paginas
                .map(pagina => opcionesMenu.find(o => o.pagina === pagina))
                .filter(o => o && autorizada(o.permiso));
            return opciones.length ? `
                <span class="barra-lateral__etiqueta">${grupo.titulo}</span>
                <ul class="barra-lateral__menu">${opciones.map(enlace).join('')}</ul>` : '';
        }).join('');

        contenedor.className = 'barra-lateral';

        contenedor.innerHTML = `
            <div class="barra-lateral__marca">
                <img class="barra-lateral__logo"
                     src="${RUTA_LOGO}"
                     alt="Carmovo">

                <div class="barra-lateral__marca-texto">
                    <strong>CARMOVO</strong>
                    <span>${sesion?.principal ? 'Administrador principal' : escapar(sesion?.perfil || 'Personal')}</span>
                </div>
            </div>

            <nav class="barra-lateral__seccion"
                 aria-label="Men\u00fa de administraci\u00f3n">

                ${grupos}
            </nav>

        `;

        construirMenuPerfil(sesion);
    }

    async function cerrarSesion() {
        try {
            await window.CarmovoAdminApi?.cerrarSesion();
        } finally {
            window.CarmovoAdminApi?.limpiarSesionLocal();
            window.location.replace(RUTA_LOGIN);
        }
    }

    function configurarMenuMovil() {
        const boton = document.getElementById('btnMenuAdmin');
        const overlay = document.getElementById('overlayAdmin');

        boton?.addEventListener('click', () => {
            document.body.classList.toggle('menu-abierto');
        });

        overlay?.addEventListener('click', () => {
            document.body.classList.remove('menu-abierto');
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 980) {
                document.body.classList.remove('menu-abierto');
            }
        });
    }

    function escapar(valor) {
        return String(valor ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    // ======================================================================
    // MENÚ DE PERFIL (esquina superior derecha): Mi perfil, contraseña, salir
    // ======================================================================
    let perfil = null;

    function iniciales(nombre) {
        const p = String(nombre || '').trim().split(/\s+/).filter(Boolean);
        if (!p.length) return 'AD';
        return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
    }

    function avatarHtml(datos, clase) {
        return datos?.foto
            ? `<img class="${clase}" src="${escapar(datos.foto)}" alt="">`
            : `<span class="${clase}">${escapar(iniciales(datos?.nombreCompleto))}</span>`;
    }

    function construirMenuPerfil(sesion) {
        const cabecera = document.querySelector('.cabecera-admin');
        if (!cabecera || !sesion) return;
        let derecha = cabecera.querySelector('.cabecera-admin__derecha');
        if (!derecha) {
            derecha = document.createElement('div');
            derecha.className = 'cabecera-admin__derecha';
            cabecera.appendChild(derecha);
        }
        derecha.querySelectorAll('.perfil-admin, .mp').forEach(e => e.remove());
        const datos = perfil || { nombreCompleto: sesion.nombreCompleto, correo: sesion.correo };
        const rol = sesion.principal ? 'Administrador principal' : (sesion.perfil || 'Personal');
        const menu = document.createElement('div');
        menu.className = 'mp';
        menu.innerHTML = `
            <button type="button" class="mp__boton" aria-haspopup="true" aria-expanded="false" aria-label="Menú de mi cuenta">
                ${avatarHtml(datos, 'mp__avatar')}
                <span class="mp__datos"><strong>${escapar(datos.nombreCompleto || datos.correo || 'Mi cuenta')}</strong><small>${escapar(rol)}</small></span>
                <i class="fa-solid fa-chevron-down mp__flecha"></i>
            </button>
            <div class="mp__panel" role="menu" hidden>
                <div class="mp__cabeza">${avatarHtml(datos, 'mp__avatar mp__avatar--grande')}
                    <div><strong>${escapar(datos.nombreCompleto || '')}</strong><small>${escapar(datos.correo || '')}</small><span class="mp__rol">${escapar(rol)}</span></div></div>
                <button type="button" role="menuitem" data-mp="perfil"><i class="fa-solid fa-user-pen"></i> Mi perfil</button>
                <button type="button" role="menuitem" data-mp="contrasena"><i class="fa-solid fa-key"></i> Cambiar contraseña</button>
                <a role="menuitem" href="${RUTA_HOME}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> Ver sitio web</a>
                <button type="button" role="menuitem" data-mp="salir" class="mp__salir"><i class="fa-solid fa-arrow-right-from-bracket"></i> Cerrar sesión</button>
            </div>`;
        derecha.appendChild(menu);
        const boton = menu.querySelector('.mp__boton');
        const panel = menu.querySelector('.mp__panel');
        const abrir = si => { panel.hidden = !si; boton.setAttribute('aria-expanded', String(si)); };
        boton.addEventListener('click', e => { e.stopPropagation(); abrir(panel.hidden); });
        document.addEventListener('click', e => { if (!menu.contains(e.target)) abrir(false); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') abrir(false); });
        panel.addEventListener('click', e => {
            const b = e.target.closest('[data-mp]');
            if (!b) return;
            abrir(false);
            if (b.dataset.mp === 'perfil') abrirMiPerfil();
            if (b.dataset.mp === 'contrasena') abrirContrasena();
            if (b.dataset.mp === 'salir') cerrarSesion();
        });
    }

    async function cargarPerfil() {
        try {
            perfil = await window.CarmovoAdminApi.miPerfil();
            const sesion = obtenerSesion();
            if (sesion && perfil?.nombreCompleto && sesion.nombreCompleto !== perfil.nombreCompleto) {
                window.CarmovoAdminApi.guardarSesionLocal({ ...sesion, nombreCompleto: perfil.nombreCompleto });
            }
            construirMenuPerfil(obtenerSesion());
        } catch (_) { /* se muestra con los datos de la sesión */ }
    }

    // ---------------------------------------------------------------- ventanas
    function ventana(titulo, ayuda, cuerpo) {
        document.getElementById('mp-ventana')?.remove();
        const v = document.createElement('div');
        v.id = 'mp-ventana';
        v.className = 'mp-ventana';
        v.setAttribute('role', 'dialog');
        v.setAttribute('aria-modal', 'true');
        v.innerHTML = `<div class="mp-ventana__caja">
            <div class="mp-ventana__cabecera"><div><h2>${titulo}</h2><p>${ayuda}</p></div>
                <button type="button" class="mp-ventana__cerrar" data-cerrar aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button></div>
            ${cuerpo}</div>`;
        document.body.appendChild(v);
        const cerrar = () => v.remove();
        v.addEventListener('click', e => { if (e.target === v || e.target.closest('[data-cerrar]')) cerrar(); });
        document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { cerrar(); document.removeEventListener('keydown', esc); } });
        setTimeout(() => v.querySelector('input:not([type=file])')?.focus(), 60);
        return v;
    }

    function error(v, texto) {
        const caja = v.querySelector('.mp-error');
        caja.textContent = texto || '';
        caja.hidden = !texto;
        if (texto) caja.classList.remove('ok');
    }

    function exito(v, texto) {
        const caja = v.querySelector('.mp-error');
        caja.textContent = texto;
        caja.hidden = false;
        caja.classList.add('ok');
    }

    async function abrirMiPerfil() {
        try { perfil = await window.CarmovoAdminApi.miPerfil(); } catch (_) { /* usa lo que haya */ }
        const d = perfil || {};
        const v = ventana('Mi perfil', 'Tus datos dentro del panel. El correo es tu usuario para entrar y no se cambia aquí.', `
            <form class="mp-form" novalidate>
                <div class="mp-foto">
                    <div class="mp-foto__vista">${avatarHtml(d, 'mp__avatar mp__avatar--foto')}</div>
                    <div>
                        <label class="mp-boton mp-boton--suave"><i class="fa-solid fa-camera"></i> ${d.foto ? 'Cambiar foto' : 'Subir foto'}
                            <input type="file" accept="image/jpeg,image/png,image/webp" hidden data-foto></label>
                        ${d.foto ? '<button type="button" class="mp-boton mp-boton--texto" data-quitar-foto>Quitar foto</button>' : ''}
                        <small>JPG, PNG o WEBP · máximo 2 MB</small>
                    </div>
                </div>
                <div class="mp-grid">
                    <label>Nombres <input name="nombres" maxlength="100" value="${escapar(d.nombres || '')}" required></label>
                    <label>Apellidos <input name="apellidos" maxlength="100" value="${escapar(d.apellidos || '')}" required></label>
                    <label>Celular <input name="telefono" inputmode="numeric" maxlength="9" value="${escapar(d.telefono || '')}" placeholder="9XXXXXXXX"></label>
                    <label>Correo <input value="${escapar(d.correo || '')}" disabled></label>
                </div>
                <p class="mp-error" hidden></p>
                <div class="mp-pie">
                    <button type="button" class="mp-boton mp-boton--suave" data-cerrar>Cerrar</button>
                    <button type="submit" class="mp-boton">Guardar cambios</button>
                </div>
            </form>`);
        const form = v.querySelector('form');
        form.telefono.addEventListener('input', () => { form.telefono.value = form.telefono.value.replace(/\D/g, '').slice(0, 9); });
        v.querySelector('[data-foto]').addEventListener('change', async e => {
            const archivo = e.target.files[0];
            e.target.value = '';
            if (!archivo) return;
            if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) return error(v, 'Solo se aceptan imágenes JPG, PNG o WEBP.');
            if (archivo.size > 2 * 1024 * 1024) return error(v, 'La foto pesa más de 2 MB.');
            try {
                perfil = await window.CarmovoAdminApi.subirFotoPerfil(archivo);
                construirMenuPerfil(obtenerSesion());
                abrirMiPerfil();
            } catch (err) { error(v, err.message); }
        });
        v.querySelector('[data-quitar-foto]')?.addEventListener('click', async () => {
            try {
                perfil = await window.CarmovoAdminApi.quitarFotoPerfil();
                construirMenuPerfil(obtenerSesion());
                abrirMiPerfil();
            } catch (err) { error(v, err.message); }
        });
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const datos = { nombres: form.nombres.value.trim(), apellidos: form.apellidos.value.trim(), telefono: form.telefono.value.trim() };
            if (datos.nombres.length < 2 || datos.apellidos.length < 2) return error(v, 'Completa tus nombres y apellidos.');
            if (datos.telefono && !/^9\d{8}$/.test(datos.telefono)) return error(v, 'El celular debe tener 9 dígitos y empezar con 9.');
            const b = form.querySelector('[type=submit]');
            b.disabled = true;
            try {
                perfil = await window.CarmovoAdminApi.actualizarMiPerfil(datos);
                const sesion = obtenerSesion();
                window.CarmovoAdminApi.guardarSesionLocal({ ...sesion, nombreCompleto: perfil.nombreCompleto });
                construirBarraLateral();
                exito(v, 'Datos actualizados.');
            } catch (err) {
                error(v, err.message);
            } finally {
                b.disabled = false;
            }
        });
    }

    function abrirContrasena() {
        const v = ventana('Cambiar contraseña', 'Por seguridad, primero escribe tu contraseña actual.', `
            <form class="mp-form" novalidate autocomplete="off">
                <label>Contraseña actual <span class="mp-clave"><input name="actual" type="password" autocomplete="current-password" required>
                    <button type="button" data-ver aria-label="Mostrar"><i class="fa-solid fa-eye"></i></button></span></label>
                <label>Nueva contraseña <span class="mp-clave"><input name="nueva" type="password" autocomplete="new-password" required>
                    <button type="button" data-ver aria-label="Mostrar"><i class="fa-solid fa-eye"></i></button></span></label>
                <ul class="mp-reglas">
                    <li data-regla="largo">Entre 8 y 72 caracteres</li>
                    <li data-regla="letra">Al menos una letra</li>
                    <li data-regla="numero">Al menos un número</li>
                </ul>
                <label>Repite la nueva contraseña <span class="mp-clave"><input name="confirmacion" type="password" autocomplete="new-password" required>
                    <button type="button" data-ver aria-label="Mostrar"><i class="fa-solid fa-eye"></i></button></span></label>
                <p class="mp-error" hidden></p>
                <div class="mp-pie">
                    <button type="button" class="mp-boton mp-boton--suave" data-cerrar>Cancelar</button>
                    <button type="submit" class="mp-boton">Cambiar contraseña</button>
                </div>
            </form>`);
        const form = v.querySelector('form');
        v.querySelectorAll('[data-ver]').forEach(b => b.addEventListener('click', () => {
            const i = b.previousElementSibling;
            i.type = i.type === 'password' ? 'text' : 'password';
            b.innerHTML = `<i class="fa-solid ${i.type === 'password' ? 'fa-eye' : 'fa-eye-slash'}"></i>`;
        }));
        const reglas = () => {
            const n = form.nueva.value;
            const ok = { largo: n.length >= 8 && n.length <= 72, letra: /\p{L}/u.test(n), numero: /\d/.test(n) };
            Object.entries(ok).forEach(([k, val]) => v.querySelector(`[data-regla="${k}"]`).classList.toggle('cumple', val));
            return Object.values(ok).every(Boolean);
        };
        form.nueva.addEventListener('input', reglas);
        form.addEventListener('submit', async e => {
            e.preventDefault();
            if (!form.actual.value) return error(v, 'Escribe tu contraseña actual.');
            if (!reglas()) return error(v, 'La nueva contraseña no cumple las reglas.');
            if (form.nueva.value !== form.confirmacion.value) return error(v, 'Las contraseñas nuevas no coinciden.');
            if (form.nueva.value === form.actual.value) return error(v, 'La nueva contraseña debe ser distinta de la actual.');
            const b = form.querySelector('[type=submit]');
            b.disabled = true;
            try {
                await window.CarmovoAdminApi.cambiarMiContrasena({
                    actual: form.actual.value, nueva: form.nueva.value, confirmacion: form.confirmacion.value
                });
                form.reset();
                reglas();
                exito(v, 'Listo. Usa tu nueva contraseña la próxima vez que inicies sesión.');
            } catch (err) {
                error(v, err.message);
            } finally {
                b.disabled = false;
            }
        });
    }

    window.addEventListener('carmovo:sesion-admin', () => construirBarraLateral());

    window.CarmovoAdminSidebar = {
        iniciar() {
            construirBarraLateral();
            configurarMenuMovil();
            cargarPerfil();
        }
    };
})();
