document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener los elementos de la pantalla
    const selectorAuto = document.getElementById('selector-auto');
    const inputDias = document.getElementById('dias-alquiler');
    
    const resumenImagen = document.getElementById('resumen-imagen');
    const resumenNombre = document.getElementById('resumen-nombre');
    const resumenTipo = document.getElementById('resumen-tipo');
    const resumenTarifaBase = document.getElementById('resumen-tarifa-base');
    const resumenImpuestos = document.getElementById('resumen-impuestos');
    const resumenTotal = document.getElementById('resumen-total');
    const etiquetaDias = document.getElementById('etiqueta-dias');

    // 2. Llenar el <select> con los autos de tu base de datos (autosDB)
    if (typeof autosDB !== 'undefined') {
        autosDB.forEach(auto => {
            const option = document.createElement('option');
            option.value = auto.nombre; 
            option.textContent = `${auto.nombre} (S/ ${auto.precio}/día)`;
            // Guardamos datos ocultos en la opción para usarlos al calcular
            option.dataset.precio = auto.precio;
            option.dataset.tipo = auto.tipo;
            option.dataset.imagen = auto.imagen;
            selectorAuto.appendChild(option);
        });
    }

    // 3. Revisar si el usuario viene de la página de Categorías
    let autoActual = null;
    const autoGuardado = localStorage.getItem('autoReserva');
    
    if (autoGuardado) {
        autoActual = JSON.parse(autoGuardado);
        // Hacemos que el selector muestre el auto que traemos guardado
        if (selectorAuto) {
            selectorAuto.value = autoActual.nombre;
        }
    }

    // 4. Función para hacer los cálculos matemáticos y pintar los textos
    function actualizarResumen() {
        // Obtenemos los días elegidos (si está vacío, asume 1)
        const dias = parseInt(inputDias.value) || 1;
        
        // Si el usuario elige un auto nuevo desde el <select>
        if (selectorAuto.value !== "") {
            const opcionSeleccionada = selectorAuto.options[selectorAuto.selectedIndex];
            autoActual = {
                nombre: opcionSeleccionada.value,
                precio: parseFloat(opcionSeleccionada.dataset.precio),
                tipo: opcionSeleccionada.dataset.tipo,
                imagen: opcionSeleccionada.dataset.imagen
            };
        }

        // Si no hay ningún auto seleccionado, no hacemos cálculos
        if (!autoActual) return;

        // Pintamos la información del auto en la derecha
        resumenNombre.textContent = autoActual.nombre;
        resumenTipo.textContent = autoActual.tipo;
        resumenImagen.src = autoActual.imagen;
        etiquetaDias.textContent = `Tarifa base (${dias} días)`;

        // Matemáticas: Multiplicar y calcular IGV
        const tarifaBase = autoActual.precio * dias;
        const costoSeguro = 120.00; // El seguro lo dejamos fijo por ahora
        const impuestos = tarifaBase * 0.18; // 18% de IGV
        const total = tarifaBase + costoSeguro + impuestos;

        // Pintar los montos con 2 decimales (.toFixed(2))
        resumenTarifaBase.textContent = `S/ ${tarifaBase.toFixed(2)}`;
        resumenImpuestos.textContent = `S/ ${impuestos.toFixed(2)}`;
        resumenTotal.textContent = `S/ ${total.toFixed(2)}`;
    }

    // 5. Decirle al navegador que actualice todo cada vez que cambiamos algo
    selectorAuto.addEventListener('change', actualizarResumen);
    inputDias.addEventListener('input', actualizarResumen);

    // 6. Ejecutar la función por primera vez al cargar la página
    actualizarResumen();
});