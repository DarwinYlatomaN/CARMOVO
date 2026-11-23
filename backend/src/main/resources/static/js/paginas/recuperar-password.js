/* =========================================================
   CARMOVO - Recuperar contraseña
   Paso 1 (sin token): el cliente pide el enlace con su correo.
   Paso 2 (con ?token=...): el cliente crea su nueva contraseña.
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const api = window.CarmovoClienteApi;
    const token = new URLSearchParams(window.location.search).get('token');

    const formCorreo = document.getElementById('formularioRecuperacion');
    const formNueva = document.getElementById('formularioNuevaContrasena');
    const mensajeExito = document.getElementById('mensajeExito');
    const textoExito = document.getElementById('textoExito');
    const mensajeError = document.getElementById('mensajeError');
    const titulo = document.querySelector('.titulo-recuperacion');
    const subtitulo = document.querySelector('.subtitulo-recuperacion');

    function mostrarError(texto) {
        mensajeError.textContent = texto;
        mensajeError.hidden = !texto;
    }

    function mostrarExito(texto) {
        if (texto) textoExito.textContent = texto;
        mensajeExito.classList.remove('mensaje-exito-oculto');
        mensajeExito.classList.add('mensaje-exito-visible');
        if (subtitulo) subtitulo.style.display = 'none';
    }

    async function conBoton(boton, textoCargando, accion) {
        const original = boton.innerHTML;
        boton.disabled = true;
        boton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${textoCargando}`;
        try {
            await accion();
        } finally {
            boton.disabled = false;
            boton.innerHTML = original;
        }
    }

    if (token) {
        formCorreo.hidden = true;
        formNueva.hidden = false;
        if (titulo) titulo.textContent = 'Crea tu nueva contraseña';
        if (subtitulo) subtitulo.textContent = 'Elige una contraseña de al menos 8 caracteres.';
        document.getElementById('nuevaContrasena').focus();
    }

    formCorreo?.addEventListener('submit', async (e) => {
        e.preventDefault();
        mostrarError('');
        const correo = document.getElementById('correoRecuperacion').value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            mostrarError('Ingresa un correo electrónico válido.');
            return;
        }
        await conBoton(formCorreo.querySelector('button'), 'Enviando...', async () => {
            try {
                const respuesta = await api.solicitarRecuperacion(correo);
                formCorreo.hidden = true;
                mostrarExito(respuesta?.message);
            } catch (error) {
                mostrarError(error.message || 'No se pudo enviar el enlace. Inténtalo nuevamente.');
            }
        });
    });

    formNueva?.addEventListener('submit', async (e) => {
        e.preventDefault();
        mostrarError('');
        const nueva = document.getElementById('nuevaContrasena').value;
        const confirmar = document.getElementById('confirmarContrasena').value;

        if (nueva.length < 8 || nueva.length > 72) {
            mostrarError('La contraseña debe tener entre 8 y 72 caracteres.');
            return;
        }
        if (nueva !== confirmar) {
            mostrarError('Las contraseñas no coinciden.');
            return;
        }

        await conBoton(formNueva.querySelector('button'), 'Guardando...', async () => {
            try {
                const respuesta = await api.restablecerContrasena(token, nueva);
                formNueva.hidden = true;
                mostrarExito(respuesta?.message || 'Tu contraseña fue actualizada.');
                history.replaceState(null, '', '/recuperar-password');
                setTimeout(() => { window.location.href = '/login'; }, 2500);
            } catch (error) {
                mostrarError(error.message || 'No se pudo cambiar la contraseña.');
            }
        });
    });
});
