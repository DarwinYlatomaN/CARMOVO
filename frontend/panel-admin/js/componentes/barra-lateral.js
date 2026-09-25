(function () {
    const opcionesMenu = [
        { pagina: 'tablero', texto: 'Tablero', icono: 'fa-chart-pie', archivo: 'tablero.html' },
        { pagina: 'gestion-flota', texto: 'Gestión de flota', icono: 'fa-car-side', archivo: 'gestion-flota.html' },
        { pagina: 'gestion-alquileres', texto: 'Alquileres', icono: 'fa-calendar-check', archivo: 'gestion-alquileres.html' },
        { pagina: 'gestion-usuarios', texto: 'Usuarios', icono: 'fa-users', archivo: 'gestion-usuarios.html' },
        { pagina: 'gestion-pagos', texto: 'Pagos e ingresos', icono: 'fa-wallet', archivo: 'gestion-pagos.html' },
        { pagina: 'monitoreo-flota', texto: 'Monitoreo', icono: 'fa-location-dot', archivo: 'monitoreo-flota.html' },
        { pagina: 'reportes', texto: 'Reportes', icono: 'fa-chart-column', archivo: 'reportes.html' },
        { pagina: 'registro-auditoria', texto: 'Auditoría', icono: 'fa-clipboard-list', archivo: 'registro-auditoria.html' }
    ];

    function obtenerSesion() {
        return window.CarmovoAdminApi?.obtenerSesionLocal?.() || null;
    }

    function construirBarraLateral() {
        const contenedor = document.getElementById('barraLateral');
        if (!contenedor) return;

        const paginaActual = document.body.dataset.pagina || '';
        const sesion = obtenerSesion();
        const enlaces = opcionesMenu.map(opcion => `
            <li>
                <a class="barra-lateral__enlace ${paginaActual === opcion.pagina ? 'activo' : ''}"
                   href="${opcion.archivo}">
                    <i class="fa-solid ${opcion.icono}"></i>
                    <span>${opcion.texto}</span>
                </a>
            </li>
        `).join('');

        contenedor.className = 'barra-lateral';
        contenedor.innerHTML = `
            <div class="barra-lateral__marca">
                <img class="barra-lateral__logo" src="../../sitio-publico/recursos/imagenes/home/logo-carmovo4.jpg" alt="Carmovo">
                <div class="barra-lateral__marca-texto">
                    <strong>CARMOVO</strong>
                    <span>Administrador</span>
                </div>
            </div>

            <nav class="barra-lateral__seccion" aria-label="Menú de administración">
                <span class="barra-lateral__etiqueta">Administración</span>
                <ul class="barra-lateral__menu">${enlaces}</ul>
            </nav>

            <div class="barra-lateral__pie">
                <div class="barra-lateral__sesion">
                    <i class="fa-solid fa-circle-user"></i>
                    <div>
                        <strong>${escapar(sesion?.nombreCompleto || 'Administrador')}</strong>
                        <span>${escapar(sesion?.correo || '')}</span>
                    </div>
                </div>
                <button class="barra-lateral__salir" id="btnCerrarSesionAdmin" type="button">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Cerrar sesión</span>
                </button>
                <a class="barra-lateral__volver" href="../../sitio-publico/html/home.html">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Volver al sitio web</span>
                </a>
            </div>
        `;

        document.getElementById('btnCerrarSesionAdmin')?.addEventListener('click', cerrarSesion);
    }

    async function cerrarSesion() {
        const boton = document.getElementById('btnCerrarSesionAdmin');
        if (boton) boton.disabled = true;

        try {
            await window.CarmovoAdminApi?.cerrarSesion();
        } finally {
            window.location.replace('login-admin.html');
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

    window.CarmovoAdminSidebar = {
        iniciar() {
            construirBarraLateral();
            configurarMenuMovil();
        }
    };
})();
