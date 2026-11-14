(function () {
    const LOGIN = '/admin/login';

    function irAlLogin() {
        if (window.location.pathname !== LOGIN) {
            window.location.replace(LOGIN);
        }
    }

    async function validar() {
        const sesionLocal = window.CarmovoAdminApi?.obtenerSesionLocal();

        if (!sesionLocal?.token || sesionLocal?.perfil !== 'Administrador') {
            window.CarmovoAdminApi?.limpiarSesionLocal();
            irAlLogin();
            return false;
        }

        try {
            const sesion = await window.CarmovoAdminApi.validarSesion();

            if (sesion.perfil !== 'Administrador') {
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
                'gestion-administradores': 'ADMIN_ADMINISTRADORES'
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
