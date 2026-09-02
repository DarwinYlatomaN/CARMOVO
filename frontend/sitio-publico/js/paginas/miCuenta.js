document.addEventListener('DOMContentLoaded', () => {
    const sesionActual = JSON.parse(localStorage.getItem('carmovo_sesion'));

    if (!sesionActual || !sesionActual.logueado) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('lbl-nombre-completo').textContent = sesionActual.nombre || 'Sin registrar';
    document.getElementById('lbl-correo').textContent = sesionActual.correo || 'Sin registrar';
    document.getElementById('lbl-telefono').textContent = sesionActual.telefono || 'Sin registrar';
    document.getElementById('lbl-documento').textContent = sesionActual.documento || 'Sin registrar';
    document.getElementById('lbl-nacimiento').textContent = sesionActual.nacimiento || 'Sin registrar';
    document.getElementById('lbl-licencia').textContent = sesionActual.licencia || 'Sin registrar';
    document.getElementById('lbl-categoria').textContent = sesionActual.categoria || 'Sin registrar';
    document.getElementById('lbl-vence').textContent = sesionActual.venceLicencia || 'Sin registrar';
    document.getElementById('lbl-domicilio').textContent = sesionActual.domicilio || 'Sin registrar';

    const btnEditarPerfil = document.getElementById('btn-editar-perfil');
    const modalEditarCuenta = document.getElementById('modal-editar-cuenta');
    const formEditarCuenta = document.getElementById('form-editar-cuenta');
    const modalExito = document.getElementById('modal-exito-actualizacion');
    const botonesCerrar = document.querySelectorAll('.btn-cerrar-modal, .btn-cerrar-exito-cuenta');

    if (btnEditarPerfil && modalEditarCuenta) {
        btnEditarPerfil.addEventListener('click', () => {
            const partesNombre = sesionActual.nombre ? sesionActual.nombre.split(' ') : [''];
            const nombreStr = partesNombre[0] || '';
            const apellidosStr = partesNombre.slice(1).join(' ') || '';

            document.getElementById('edit-nombre').value = nombreStr;
            document.getElementById('edit-apellidos').value = apellidosStr;
            document.getElementById('edit-correo').value = sesionActual.correo || '';
            document.getElementById('edit-telefono').value = sesionActual.telefono || '';
            document.getElementById('edit-nacimiento').value = sesionActual.nacimiento || '';
            document.getElementById('edit-documento').value = sesionActual.documento || '';
            document.getElementById('edit-licencia').value = sesionActual.licencia || '';
            document.getElementById('edit-categoria').value = sesionActual.categoria || '';
            document.getElementById('edit-vence').value = sesionActual.venceLicencia || '';
            document.getElementById('edit-domicilio').value = sesionActual.domicilio || '';

            modalEditarCuenta.classList.remove('oculto');
            modalEditarCuenta.classList.add('activo');
        });
    }

    botonesCerrar.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            modalEditarCuenta.classList.add('oculto');
            modalEditarCuenta.classList.remove('activo');
            if (modalExito) {
                modalExito.classList.add('oculto');
                modalExito.classList.remove('activo');
            }
        });
    });

    if (formEditarCuenta) {
        formEditarCuenta.addEventListener('submit', (e) => {
            e.preventDefault();

            const nombre = document.getElementById('edit-nombre').value.trim();
            const apellidos = document.getElementById('edit-apellidos').value.trim();
            const nombreCompleto = `${nombre} ${apellidos}`.trim();
            
            sesionActual.nombre = nombreCompleto;
            sesionActual.correo = document.getElementById('edit-correo').value.trim();
            sesionActual.telefono = document.getElementById('edit-telefono').value.trim();
            sesionActual.nacimiento = document.getElementById('edit-nacimiento').value;
            sesionActual.documento = document.getElementById('edit-documento').value.trim();
            sesionActual.licencia = document.getElementById('edit-licencia').value.trim();
            sesionActual.categoria = document.getElementById('edit-categoria').value.trim();
            sesionActual.venceLicencia = document.getElementById('edit-vence').value;
            sesionActual.domicilio = document.getElementById('edit-domicilio').value.trim();

            localStorage.setItem('carmovo_sesion', JSON.stringify(sesionActual));

            let usuariosDB = JSON.parse(localStorage.getItem('carmovo_usuarios')) || [];
            const index = usuariosDB.findIndex(u => u.correo === sesionActual.correo);
            if (index !== -1) {
                usuariosDB[index] = { ...usuariosDB[index], ...sesionActual };
            }
            localStorage.setItem('carmovo_usuarios', JSON.stringify(usuariosDB));

            document.getElementById('lbl-nombre-completo').textContent = sesionActual.nombre;
            document.getElementById('lbl-correo').textContent = sesionActual.correo;
            document.getElementById('lbl-telefono').textContent = sesionActual.telefono;
            document.getElementById('lbl-documento').textContent = sesionActual.documento;
            document.getElementById('lbl-nacimiento').textContent = sesionActual.nacimiento;
            document.getElementById('lbl-licencia').textContent = sesionActual.licencia;
            document.getElementById('lbl-categoria').textContent = sesionActual.categoria;
            document.getElementById('lbl-vence').textContent = sesionActual.venceLicencia;
            document.getElementById('lbl-domicilio').textContent = sesionActual.domicilio;

            modalEditarCuenta.classList.add('oculto');
            modalEditarCuenta.classList.remove('activo');

            if (modalExito) {
                modalExito.classList.remove('oculto');
                modalExito.classList.add('activo');
            }

            const botonLogin = document.querySelector('.boton-login');
            if (botonLogin) {
                const primerNombre = nombreCompleto.split(' ')[0];
                botonLogin.innerHTML = `<i class="fa-solid fa-user"></i> Hola, ${primerNombre}`;
            }
        });
    }
});