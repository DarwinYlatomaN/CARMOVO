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
            pagina: 'gestion-alquileres',
            permiso: 'ADMIN_ALQUILERES',
            texto: 'Alquileres',
            icono: 'fa-calendar-check',
            ruta: '/admin/gestion-alquileres'
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
        }
        ,{
            pagina: 'gestion-administradores',
            permiso: 'ADMIN_ADMINISTRADORES',
            texto: 'Administradores',
            icono: 'fa-user-shield',
            ruta: '/admin/gestion-administradores'
        }
    ];

    const opcionesSitio = [
        { permiso: 'WEB_INICIO', texto: 'Inicio', ruta: '/home' },
        { permiso: 'WEB_CATEGORIAS', texto: 'Categorías', ruta: '/categorias' },
        { permiso: 'WEB_OFERTAS', texto: 'Ofertas', ruta: '/ofertas' },
        { permiso: 'WEB_EXPERIENCIA', texto: 'Experiencia', ruta: '/experiencia' },
        { permiso: 'WEB_RESERVAS', texto: 'Reservas', ruta: '/reservas' },
        { permiso: 'WEB_SOPORTE', texto: 'Soporte', ruta: '/soporte' },
        { permiso: 'WEB_MI_CUENTA', texto: 'Mi cuenta', ruta: '/miCuenta' }
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
        const enlaces = opcionesMenu.filter(opcion => autorizada(opcion.permiso)).map(opcion => `
            <li>
                <a class="barra-lateral__enlace ${paginaActual === opcion.pagina ? 'activo' : ''}"
                   href="${opcion.ruta}">
                    <i class="fa-solid ${opcion.icono}"></i>
                    <span>${opcion.texto}</span>
                </a>
            </li>
        `).join('');

        const enlacesSitio = opcionesSitio.filter(opcion => autorizada(opcion.permiso)).map(opcion => `
            <li><a class="barra-lateral__enlace" href="${opcion.ruta}">
                <i class="fa-solid fa-arrow-up-right-from-square"></i><span>${opcion.texto}</span>
            </a></li>
        `).join('');

        contenedor.className = 'barra-lateral';

        contenedor.innerHTML = `
            <div class="barra-lateral__marca">
                <img class="barra-lateral__logo"
                     src="${RUTA_LOGO}"
                     alt="Carmovo">

                <div class="barra-lateral__marca-texto">
                    <strong>CARMOVO</strong>
                    <span>${sesion?.principal ? 'Administrador principal' : 'Administrador secundario'}</span>
                </div>
            </div>

            <nav class="barra-lateral__seccion"
                 aria-label="Men\u00fa de administraci\u00f3n">

                <span class="barra-lateral__etiqueta">
                    Administraci\u00f3n
                </span>

                <ul class="barra-lateral__menu">${enlaces}</ul>
                ${enlacesSitio ? `<span class="barra-lateral__etiqueta" style="margin-top:20px;display:block">Sitio web autorizado</span>
                <ul class="barra-lateral__menu">${enlacesSitio}</ul>` : ''}
            </nav>

            <div class="barra-lateral__pie">
                <div class="barra-lateral__sesion">
                    <i class="fa-solid fa-circle-user"></i>

                    <div>
                        <strong>${escapar(sesion?.nombreCompleto || 'Administrador')}</strong>
                        <span>${escapar(sesion?.correo || '')}</span>
                    </div>
                </div>

                <button class="barra-lateral__salir"
                        id="btnCerrarSesionAdmin"
                        type="button">

                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Cerrar sesi\u00f3n</span>
                </button>

                ${autorizada('WEB_INICIO') ? `<a class="barra-lateral__volver" href="${RUTA_HOME}">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Volver al sitio web</span>
                </a>` : ''}
            </div>
        `;

        document.getElementById('btnCerrarSesionAdmin')
            ?.addEventListener('click', cerrarSesion);
    }

    async function cerrarSesion() {
        const boton = document.getElementById('btnCerrarSesionAdmin');

        if (boton) {
            boton.disabled = true;
        }

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

    window.addEventListener('carmovo:sesion-admin', () => construirBarraLateral());

    window.CarmovoAdminSidebar = {
        iniciar() {
            construirBarraLateral();
            configurarMenuMovil();
        }
    };
})();
