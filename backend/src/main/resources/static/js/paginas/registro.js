document.addEventListener('DOMContentLoaded', () => {
    function configurarTogglePassword(btnId, inputId) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        if (btn && input) {
            btn.addEventListener('click', () => {
                const tipoActual = input.getAttribute('type');
                const icono = btn.querySelector('i');
                if (tipoActual === 'password') {
                    input.setAttribute('type', 'text');
                    icono.classList.remove('fa-eye');
                    icono.classList.add('fa-eye-slash');
                } else {
                    input.setAttribute('type', 'password');
                    icono.classList.remove('fa-eye-slash');
                    icono.classList.add('fa-eye');
                }
            });
        }
    }

    configurarTogglePassword('btnMostrarPassword1', 'contrasena');
    configurarTogglePassword('btnMostrarPassword2', 'confirmarContrasena');

    const formularioRegistro = document.getElementById('formularioRegistro');
    const inputPassword1 = document.getElementById('contrasena');
    const inputPassword2 = document.getElementById('confirmarContrasena');
    const mensajeError = document.getElementById('mensajeErrorRegistro');

    function mostrarError(mensaje) {
        mensajeError.textContent = mensaje;
        mensajeError.style.display = 'block';
    }

    if (formularioRegistro) {
        formularioRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombres = document.getElementById('nombres').value.trim();
            const apellidos = document.getElementById('apellidos').value.trim();
            const correo = document.getElementById('correo').value.trim();
            const telefono = document.getElementById('telefono').value.trim();
            const documento = document.getElementById('documento').value.trim();
            const nacimiento = document.getElementById('fechaNacimiento').value;
            const departamento = document.getElementById('departamento').value.trim();
            const provincia = document.getElementById('provincia').value.trim();
            const distrito = document.getElementById('distrito').value.trim();
            const domicilio = document.getElementById('domicilio').value.trim();
            const licencia = document.getElementById('numeroLicencia').value.trim();
            const categoria = document.getElementById('categoriaLicencia').value.trim();
            const venceLicencia = document.getElementById('vencimientoLicencia').value;
            const pass1 = inputPassword1.value;
            const pass2 = inputPassword2.value;
            const btnSubmit = formularioRegistro.querySelector('button[type="submit"]');

            inputPassword1.parentElement.classList.remove('campo-input-error');
            inputPassword2.parentElement.classList.remove('campo-input-error');
            mensajeError.style.display = 'none';

            if (pass1 !== pass2) {
                inputPassword1.parentElement.classList.add('campo-input-error');
                inputPassword2.parentElement.classList.add('campo-input-error');
                mostrarError('Las contraseñas no coinciden.');
                return;
            }

            if (pass1.length < 8) {
                inputPassword1.parentElement.classList.add('campo-input-error');
                mostrarError('La contraseña debe tener al menos 8 caracteres.');
                return;
            }

            if (!nombres || !apellidos || !correo || !pass1 || !telefono || !documento || !nacimiento || !departamento || !provincia || !distrito || !domicilio || !licencia || !categoria || !venceLicencia) {
                mostrarError('Completa todos los campos obligatorios.');
                return;
            }

            if (!window.CarmovoClienteApi) {
                mostrarError('No se pudo cargar el servicio de clientes de CARMOVO.');
                return;
            }

            try {
                if (btnSubmit) btnSubmit.disabled = true;

                const usuario = await window.CarmovoClienteApi.registrar({
                    nombres,
                    apellidos,
                    correo,
                    contrasena: pass1,
                    telefono,
                    documento,
                    fechaNacimiento: nacimiento,
                    departamento,
                    provincia,
                    distrito,
                    domicilio,
                    numeroLicencia: licencia,
                    categoriaLicencia: categoria,
                    vencimientoLicencia: venceLicencia
                });

                const nombreCompleto = `${usuario.nombres || nombres} ${usuario.apellidos || apellidos}`.trim();
                const sesion = {
                    logueado: true,
                    idUsuario: usuario.idUsuario,
                    nombre: nombreCompleto,
                    nombres: usuario.nombres || nombres,
                    apellidos: usuario.apellidos || apellidos,
                    correo: usuario.correo || correo,
                    telefono: usuario.telefono || telefono,
                    perfil: usuario.nombrePerfil || 'Cliente'
                };

                // PostgreSQL es la fuente de verdad del perfil completo.
                // En el navegador solo conservamos los datos mínimos de sesión.
                localStorage.setItem('carmovo_sesion', JSON.stringify(sesion));
                localStorage.setItem('usuarioCarmovoLogueado', 'true');
                localStorage.removeItem('carmovo_usuarios');

                window.location.href = '/miCuenta';
            } catch (error) {
                mostrarError(error.message || 'No se pudo registrar la cuenta.');
            } finally {
                if (btnSubmit) btnSubmit.disabled = false;
            }
        });
    }
});
