document.addEventListener('DOMContentLoaded', () => {
    
    // -------------------------------------------------------------------------
    // 1. MENÚ HAMBURGUESA MÓVIL (TOGGLE)
    // -------------------------------------------------------------------------
    const btnMenu = document.getElementById('btnMenu');
    const navegacionPrincipal = document.getElementById('navegacionPrincipal');

    if (btnMenu && navegacionPrincipal) {
        btnMenu.addEventListener('click', (e) => {
            e.preventDefault();
            navegacionPrincipal.classList.toggle('activo');
        });
    }

    
    //  MODAL: RECUPERAR CONTRASEÑA
  
    const enlaceOlvido = document.getElementById('enlaceOlvido');
    const modalRecuperar = document.getElementById('modalRecuperar');
    const cerrarModalRecuperar = document.getElementById('cerrarModalRecuperar');
    const formRecuperar = document.getElementById('formRecuperar');

    if (enlaceOlvido && modalRecuperar) {
        enlaceOlvido.addEventListener('click', (e) => {
            e.preventDefault();
            modalRecuperar.classList.remove('oculto');
            modalRecuperar.classList.add('activo');
        });
    }

    const cerrarRecuperarFn = () => {
        if (modalRecuperar) {
            modalRecuperar.classList.remove('activo');
            setTimeout(() => modalRecuperar.classList.add('oculto'), 300);
        }
    };

    if (cerrarModalRecuperar) cerrarModalRecuperar.addEventListener('click', cerrarRecuperarFn);

    if (formRecuperar) {
        formRecuperar.addEventListener('submit', (e) => {
            e.preventDefault();
            alert("¡Correo enviado con éxito! Revisa tu bandeja de entrada para actualizar tu contraseña.");
            cerrarRecuperarFn();
            formRecuperar.reset();
        });
    }

   
    //  REGISTRO DE USUARIO

    const enlaceRegistro = document.getElementById('enlaceRegistro');
    const modalRegistro = document.getElementById('modalRegistro');
    const cerrarModalRegistro = document.getElementById('cerrarModalRegistro');
    const formRegistro = document.getElementById('formRegistro');

    if (enlaceRegistro && modalRegistro) {
        enlaceRegistro.addEventListener('click', (e) => {
            e.preventDefault();
            modalRegistro.classList.remove('oculto');
            modalRegistro.classList.add('activo');
        });
    }

    const cerrarRegistroFn = () => {
        if (modalRegistro) {
            modalRegistro.classList.remove('activo');
            setTimeout(() => modalRegistro.classList.add('oculto'), 300);
        }
    };

    if (cerrarModalRegistro) cerrarModalRegistro.addEventListener('click', cerrarRegistroFn);

    if (formRegistro) {
        formRegistro.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = formRegistro.querySelectorAll('input');
            const pass1 = inputs[4].value;
            const pass2 = inputs[5].value;

            if (pass1 !== pass2) {
                alert("Las contraseñas no coinciden. Por favor, verifícalas.");
                return;
            }

            alert("¡Registro exitoso! Tu cuenta en Carmovo ha sido creada correctamente.");
            cerrarRegistroFn();
            formRegistro.reset();
        });
    }

    
    //  CIERRE GLOBAL DE MODALES 
    window.addEventListener('click', (e) => {
        if (e.target === modalRecuperar) cerrarRecuperarFn();
        if (e.target === modalRegistro) cerrarRegistroFn();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarRecuperarFn();
            cerrarRegistroFn();
        }
    });

});