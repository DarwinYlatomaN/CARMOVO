document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formularioRecuperacion');
    const mensajeExito = document.getElementById('mensajeExito');

    if (formulario) {
        formulario.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const correo = document.getElementById('correoRecuperacion').value.trim();

            if (correo === '') {
                return;
            }

            formulario.style.display = 'none';
            
            mensajeExito.classList.remove('mensaje-exito-oculto');
            mensajeExito.classList.add('mensaje-exito-visible');
            
            const subtitulo = document.querySelector('.subtitulo-recuperacion');
            if (subtitulo) {
                subtitulo.style.display = 'none';
            }
        });
    }
});