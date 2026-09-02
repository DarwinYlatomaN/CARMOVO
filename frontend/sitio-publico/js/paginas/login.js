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

    if (formularioLogin) {
        formularioLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const correo = document.getElementById('correo').value.trim();
            const password = inputPassword.value.trim();

            if (correo === '' || password === '') {
                return;
            }

            let usuariosDB = JSON.parse(localStorage.getItem('carmovo_usuarios')) || [];
            const usuarioValido = usuariosDB.find(u => u.correo === correo && u.password === password);

            if (usuarioValido) {
                const sesion = { logueado: true, nombre: usuarioValido.nombre, correo: usuarioValido.correo };
                localStorage.setItem('carmovo_sesion', JSON.stringify(sesion));
                localStorage.setItem('usuarioCarmovoLogueado', 'true');
                
                window.location.href = 'reservas.html';
            } else {
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
                errorLogin.textContent = 'Correo o contraseña incorrectos';
            }
        });
    }
});