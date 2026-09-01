
    document.addEventListener('DOMContentLoaded', () => {
        const btnMenu = document.getElementById('btnMenu');
        const menuNavegacion = document.getElementById('navegacionPrincipal');

        if (btnMenu && menuNavegacion) {
            btnMenu.addEventListener('click', (e) => {
                e.preventDefault(); 
                menuNavegacion.classList.toggle('activo');
            });
        }
    });
