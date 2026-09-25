(function () {
    const LOGIN = 'login-admin.html';

    function irAlLogin() {
        if (!window.location.pathname.endsWith(`/${LOGIN}`)) {
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

            window.dispatchEvent(new CustomEvent('carmovo:sesion-admin', { detail: sesion }));
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
