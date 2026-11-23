
(function () {
    function colocarFecha() {
        const elemento = document.getElementById('fechaAdmin');
        if (!elemento) return;

        const fecha = new Intl.DateTimeFormat('es-PE', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(new Date());

        elemento.textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
    }

    function colocarAdministrador(sesion) {
        if (!sesion) return;

        document.querySelectorAll('.perfil-admin__nombre').forEach(elemento => {
            elemento.textContent = sesion.nombreCompleto || sesion.correo || 'Administrador';
        });

        document.querySelectorAll('.perfil-admin__rol').forEach(elemento => {
            elemento.textContent = sesion.principal ? 'Administrador principal' : (sesion.perfil || 'Personal');
        });

        const iniciales = obtenerIniciales(sesion.nombreCompleto || 'Administrador');

        document.querySelectorAll('.perfil-admin__avatar').forEach(elemento => {
            elemento.textContent = iniciales;
        });
    }

    function obtenerIniciales(nombre) {
        const partes = String(nombre || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!partes.length) return 'AD';

        if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();

        return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.CarmovoAdminSidebar?.iniciar();
        colocarFecha();
        colocarAdministrador(window.CarmovoAdminApi?.obtenerSesionLocal?.());
    });

    function ocultarEnlacesNoAutorizados(sesion) {
        if (!sesion || sesion.principal) return;
        const rutas = {
            '/admin/tablero': 'ADMIN_TABLERO',
            '/admin/gestion-flota': 'ADMIN_FLOTA',
            '/admin/gestion-alquileres': 'ADMIN_ALQUILERES',
            '/admin/gestion-usuarios': 'ADMIN_USUARIOS',
            '/admin/gestion-pagos': 'ADMIN_PAGOS',
            '/admin/monitoreo-flota': 'ADMIN_MONITOREO',
            '/admin/reportes': 'ADMIN_REPORTES',
            '/admin/registro-auditoria': 'ADMIN_AUDITORIA',
            '/admin/gestion-administradores': 'ADMIN_ADMINISTRADORES',
            '/admin/roles-permisos': 'ADMIN_ADMINISTRADORES',
            '/admin/mantenimiento': 'ADMIN_FLOTA',
            '/admin/categorias': 'ADMIN_FLOTA',
            '/admin/mis-servicios': 'ADMIN_SERVICIOS',
            '/admin/portal-web': 'ADMIN_PORTAL'
        };
        document.querySelectorAll('a[href^="/admin/"]').forEach(enlace => {
            if (rutas[enlace.getAttribute('href')] &&
                !(sesion.permisos || []).includes(rutas[enlace.getAttribute('href')])) {
                enlace.hidden = true;
                enlace.style.display = 'none';
            }
        });
    }

    window.addEventListener('carmovo:sesion-admin', evento => {
        colocarAdministrador(evento.detail);
        ocultarEnlacesNoAutorizados(evento.detail);
    });
})();
