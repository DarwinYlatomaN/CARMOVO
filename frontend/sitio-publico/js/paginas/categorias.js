document.addEventListener('DOMContentLoaded', () => {
    
    // ... AQUÍ ARRIBA ESTARÁ TU CÓDIGO EXISTENTE DE RENDERIZAR AUTOS ...

    /* =========================================================================
       NUEVO: LEER LA URL Y FILTRAR AUTOMÁTICAMENTE
       ========================================================================= */
    // 1. Obtenemos el parámetro 'categoria' de la URL (ej: ?categoria=Económicos)
    const parametros = new URLSearchParams(window.location.search);
    const categoriaSolicitada = parametros.get('categoria');

    if (categoriaSolicitada) {
        // 2. Buscamos el botón de filtro en categorias.html que coincida con ese nombre.
        // OJO: Cambia '.filtro-categoria' por la clase real que tengan tus botones de filtro en categorias.html
        const botonFiltro = document.querySelector(`[data-categoria="${categoriaSolicitada}"]`);
        
        if (botonFiltro) {
            // 3. Retrasamos un poquitito el clic (50 milisegundos) para asegurar 
            // que los autos ya se hayan pintado en el HTML.
            setTimeout(() => {
                botonFiltro.click(); // ¡Esto simula que el usuario hizo clic en el filtro!
            }, 50);
        }
    }
});