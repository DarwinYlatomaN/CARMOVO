(function () {
    const formulario = document.getElementById('formLoginAdmin');
    const correo = document.getElementById('correoAdmin');
    const contrasena = document.getElementById('contrasenaAdmin');
    const botonMostrar = document.getElementById('btnMostrarContrasenaAdmin');
    const mensaje = document.getElementById('mensajeLoginAdmin');
    const botonIngresar = document.getElementById('btnIngresarAdmin');

    const sesionExistente = window.CarmovoAdminApi?.obtenerSesionLocal();
    if (sesionExistente?.token && sesionExistente?.perfil === 'Administrador') {
        window.CarmovoAdminApi.validarSesion()
            .then(() => window.location.replace('tablero.html'))
            .catch(() => window.CarmovoAdminApi.limpiarSesionLocal());
    }

    botonMostrar?.addEventListener('click', () => {
        const mostrar = contrasena.type === 'password';
        contrasena.type = mostrar ? 'text' : 'password';
        const icono = botonMostrar.querySelector('i');
        icono?.classList.toggle('fa-eye', !mostrar);
        icono?.classList.toggle('fa-eye-slash', mostrar);
    });

    formulario?.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        ocultarMensaje();

        const email = correo.value.trim();
        const clave = contrasena.value;

        if (!email || !clave) {
            mostrarMensaje('Completa el correo y la contraseña.', 'error');
            return;
        }

        cambiarCarga(true);

        try {
            const sesion = await window.CarmovoAdminApi.iniciarSesion(email, clave);
            mostrarMensaje(`Bienvenido, ${sesion.nombreCompleto}.`, 'exito');
            setTimeout(() => window.location.replace('tablero.html'), 350);
        } catch (error) {
            mostrarMensaje(error.message || 'No se pudo iniciar sesión.', 'error');
        } finally {
            cambiarCarga(false);
        }
    });

    function mostrarMensaje(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = `login-admin__mensaje visible ${tipo}`;
    }

    function ocultarMensaje() {
        mensaje.textContent = '';
        mensaje.className = 'login-admin__mensaje';
    }

    function cambiarCarga(cargando) {
        botonIngresar.disabled = cargando;
        botonIngresar.innerHTML = cargando
            ? '<i class="fa-solid fa-spinner fa-spin"></i> Validando...'
            : '<i class="fa-solid fa-right-to-bracket"></i> Ingresar al panel';
    }
})();
