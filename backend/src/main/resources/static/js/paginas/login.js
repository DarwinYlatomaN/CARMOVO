document.addEventListener('DOMContentLoaded', () => {
    const btnMostrarPassword = document.getElementById('btnMostrarPassword');
    const inputPassword = document.getElementById('password');
    const formularioLogin = document.getElementById('formularioLogin');

    if (btnMostrarPassword && inputPassword) {
        btnMostrarPassword.addEventListener('click', () => {
            const tipoActual = inputPassword.getAttribute('type');
            const icono = btnMostrarPassword.querySelector('i');

            if (tipoActual === 'password') {
                inputPassword.setAttribute('type', 'text');
                icono.classList.remove('fa-eye');
                icono.classList.add('fa-eye-slash');
            } else {
                inputPassword.setAttribute('type', 'password');
                icono.classList.remove('fa-eye-slash');
                icono.classList.add('fa-eye');
            }
        });
    }

    function mostrarError(mensaje) {
        let errorLogin = document.getElementById('errorLoginMsg');
        if (!errorLogin) {
            errorLogin = document.createElement('div');
            errorLogin.id = 'errorLoginMsg';
            errorLogin.style.color = '#ef4444';
            errorLogin.style.fontSize = '0.9rem';
            errorLogin.style.fontWeight = '600';
            errorLogin.style.textAlign = 'center';
            errorLogin.style.padding = '10px';
            errorLogin.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            errorLogin.style.border = '1px solid #ef4444';
            errorLogin.style.borderRadius = '8px';

            const btnSubmit = formularioLogin.querySelector('button[type="submit"]');
            formularioLogin.insertBefore(errorLogin, btnSubmit);
        }
        errorLogin.textContent = mensaje;
    }

    if (formularioLogin) {
        formularioLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const correo = document.getElementById('correo').value.trim();
            const password = inputPassword.value;
            const btnSubmit = formularioLogin.querySelector('button[type="submit"]');

            if (correo === '' || password === '') {
                mostrarError('Completa tu correo y contraseña.');
                return;
            }

            if (!window.CarmovoClienteApi) {
                mostrarError('No se pudo cargar el servicio de clientes de CARMOVO.');
                return;
            }

            try {
                if (btnSubmit) btnSubmit.disabled = true;

                const usuario = await window.CarmovoClienteApi.iniciarSesion(correo, password);
                const nombreCompleto = `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim();

                const sesion = {
                    logueado: true,
                    idUsuario: usuario.idUsuario,
                    nombre: nombreCompleto || usuario.correo,
                    nombres: usuario.nombres || '',
                    apellidos: usuario.apellidos || '',
                    correo: usuario.correo,
                    telefono: usuario.telefono || '',
                    perfil: usuario.nombrePerfil || 'Cliente'
                };

                localStorage.setItem('carmovo_sesion', JSON.stringify(sesion));
                localStorage.setItem('usuarioCarmovoLogueado', 'true');
                localStorage.removeItem('carmovo_usuarios');

                window.location.href = '/reservas';
            } catch (error) {
                mostrarError(error.message || 'Correo o contraseña incorrectos.');
            } finally {
                if (btnSubmit) btnSubmit.disabled = false;
            }
        });
    }
});
