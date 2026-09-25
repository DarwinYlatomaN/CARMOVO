(function () {
    function resolverContenedor(referencia) {
        if (typeof referencia === 'string') {
            return document.querySelector(referencia);
        }
        return referencia || null;
    }

    function renderBarras(referencia, elementos, opciones = {}) {
        const contenedor = resolverContenedor(referencia);
        if (!contenedor) return;

        const datos = Array.isArray(elementos) ? elementos : [];
        const valores = datos.map(item => Number(item.valor) || 0);
        const maximo = Math.max(...valores, 0);
        const formato = typeof opciones.formatoValor === 'function'
            ? opciones.formatoValor
            : valor => String(valor);

        contenedor.replaceChildren();

        if (!datos.length || maximo <= 0) {
            const vacio = document.createElement('div');
            vacio.className = 'widget-grafico__vacio';
            vacio.textContent = opciones.mensajeVacio || 'No hay información suficiente para este gráfico.';
            contenedor.appendChild(vacio);
            return;
        }

        const lista = document.createElement('div');
        lista.className = 'widget-grafico__lista';

        datos.forEach(item => {
            const valor = Number(item.valor) || 0;
            const porcentaje = maximo > 0 ? Math.max(0, Math.min(100, (valor / maximo) * 100)) : 0;

            const fila = document.createElement('div');
            fila.className = 'widget-grafico__fila';

            const encabezado = document.createElement('div');
            encabezado.className = 'widget-grafico__encabezado';

            const etiqueta = document.createElement('span');
            etiqueta.textContent = item.etiqueta || 'Sin etiqueta';

            const valorElemento = document.createElement('strong');
            valorElemento.textContent = formato(valor, item);

            encabezado.append(etiqueta, valorElemento);

            const barra = document.createElement('div');
            barra.className = 'widget-grafico__barra';

            const relleno = document.createElement('div');
            relleno.className = 'widget-grafico__relleno';
            relleno.style.setProperty('--widget-porcentaje', `${porcentaje}%`);
            relleno.title = `${item.etiqueta || ''}: ${formato(valor, item)}`;

            barra.appendChild(relleno);
            fila.append(encabezado, barra);
            lista.appendChild(fila);
        });

        contenedor.appendChild(lista);
    }

    window.CarmovoWidgetGrafico = { renderBarras };
})();
