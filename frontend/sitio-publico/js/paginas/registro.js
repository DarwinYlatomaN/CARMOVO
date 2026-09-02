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

    configurarTogglePassword('btnMostrarPassword1', 'passwordRegistro');
    configurarTogglePassword('btnMostrarPassword2', 'passwordConfirmar');

    const formularioRegistro = document.getElementById('formularioRegistro');
    const inputPassword1 = document.getElementById('passwordRegistro');
    const inputPassword2 = document.getElementById('passwordConfirmar');
    const mensajeError = document.getElementById('mensajeErrorRegistro');

    if (formularioRegistro) {
        formularioRegistro.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('nombreCompleto').value.trim();
            const correo = document.getElementById('correoRegistro').value.trim();
            const telefono = document.getElementById('telefonoRegistro').value.trim();
            const documento = document.getElementById('documentoRegistro').value.trim();
            const nacimiento = document.getElementById('nacimientoRegistro').value;
            const domicilio = document.getElementById('domicilioRegistro').value.trim();
            const licencia = document.getElementById('licenciaRegistro').value.trim();
            const categoria = document.getElementById('categoriaRegistro').value.trim();
            const venceLicencia = document.getElementById('venceLicenciaRegistro').value;
            const pass1 = inputPassword1.value;
            const pass2 = inputPassword2.value;

            inputPassword1.parentElement.classList.remove('campo-input-error');
            inputPassword2.parentElement.classList.remove('campo-input-error');
            mensajeError.style.display = 'none';

            if (pass1 !== pass2) {
                inputPassword1.parentElement.classList.add('campo-input-error');
                inputPassword2.parentElement.classList.add('campo-input-error');
                mensajeError.textContent = 'Las contraseñas no coinciden';
                mensajeError.style.display = 'block';
                return;
            }

            if (!nombre || !correo || !pass1 || !telefono || !documento || !nacimiento || !domicilio || !licencia || !categoria || !venceLicencia) {
                return;
            }

            let usuariosDB = JSON.parse(localStorage.getItem('carmovo_usuarios')) || [];
            
            const existe = usuariosDB.find(u => u.correo === correo);
            if (existe) {
                mensajeError.textContent = 'Este correo ya está registrado. Inicia sesión.';
                mensajeError.style.display = 'block';
                return;
            }

            const nuevoUsuario = { 
                nombre, correo, password: pass1, 
                telefono, documento, nacimiento, 
                domicilio, licencia, categoria, venceLicencia 
            };
            
            usuariosDB.push(nuevoUsuario);
            localStorage.setItem('carmovo_usuarios', JSON.stringify(usuariosDB));

            const sesion = { 
                logueado: true, nombre, correo, 
                telefono, documento, nacimiento, 
                domicilio, licencia, categoria, venceLicencia 
            };
            
            localStorage.setItem('carmovo_sesion', JSON.stringify(sesion));
            localStorage.setItem('usuarioCarmovoLogueado', 'true');
            
            window.location.href = 'miCuenta.html'; 
        });
    }
});