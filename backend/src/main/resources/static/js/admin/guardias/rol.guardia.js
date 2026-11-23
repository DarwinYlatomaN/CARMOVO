(function () {
    const LOGIN = '/admin/login';
    // Todo rol que no sea "Cliente" es del personal (incluye los roles creados por el administrador).
    const esPersonal = perfil => !!perfil && String(perfil).trim().toLowerCase() !== 'cliente';

    function irAlLogin() {
        if (window.location.pathname !== LOGIN) {
            window.location.replace(LOGIN);
        }
    }

    async function validar() {
        const sesionLocal = window.CarmovoAdminApi?.obtenerSesionLocal();

        if (!sesionLocal?.token || !esPersonal(sesionLocal?.perfil)) {
            window.CarmovoAdminApi?.limpiarSesionLocal();
            irAlLogin();
            return false;
        }

        try {
            const sesion = await window.CarmovoAdminApi.validarSesion();

            if (!esPersonal(sesion.perfil)) {
                throw new Error('Perfil sin acceso administrativo.');
            }

            const pagina = document.body.dataset.pagina;
            const codigos = {
                'tablero': 'ADMIN_TABLERO',
                'gestion-flota': 'ADMIN_FLOTA',
                'gestion-alquileres': 'ADMIN_ALQUILERES',
                'gestion-usuarios': 'ADMIN_USUARIOS',
                'gestion-pagos': 'ADMIN_PAGOS',
                'monitoreo-flota': 'ADMIN_MONITOREO',
                'reportes': 'ADMIN_REPORTES',
                'registro-auditoria': 'ADMIN_AUDITORIA',
                'gestion-administradores': 'ADMIN_ADMINISTRADORES',
                'roles-permisos': 'ADMIN_ADMINISTRADORES',
                'conductores': 'ADMIN_ADMINISTRADORES',
                'mantenimiento': 'ADMIN_FLOTA',
                'categorias': 'ADMIN_FLOTA',
                'mis-servicios': 'ADMIN_SERVICIOS',
                'portal-web': 'ADMIN_PORTAL'
            };
            if (!sesion.principal && codigos[pagina] && !(sesion.permisos || []).includes(codigos[pagina])) {
                window.location.replace(sesion.rutaInicio || LOGIN);
                return false;
            }

            window.dispatchEvent(
                new CustomEvent('carmovo:sesion-admin', {
                    detail: sesion
                })
            );

            return true;
        } catch (_) {
            window.CarmovoAdminApi?.limpiarSesionLocal();
            irAlLogin();
            return false;
        }
    }

    window.CarmovoAdminGuard = { validar };
    validar();
})();
