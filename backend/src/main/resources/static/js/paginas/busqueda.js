document.addEventListener('DOMContentLoaded', async () => {
    const sesionActual = JSON.parse(localStorage.getItem('carmovo_sesion'));
    const botonLogin = document.querySelector('.boton-login');

    if (sesionActual && sesionActual.logueado && botonLogin) {
        const nombreSesion = sesionActual.nombre || sesionActual.nombres || 'Cliente';
        const primerNombre = nombreSesion.split(' ')[0];

        botonLogin.innerHTML = `<i class="fa-solid fa-user"></i> Hola, ${primerNombre}`;
        botonLogin.href = '/miCuenta';

        if (!document.getElementById('btn-cerrar-sesion-carmovo')) {
            const btnCerrar = document.createElement('a');
            btnCerrar.id = 'btn-cerrar-sesion-carmovo';
            btnCerrar.href = '#';
            btnCerrar.className = 'boton-cerrar-sesion';
            btnCerrar.style.marginLeft = '15px';
            btnCerrar.style.color = '#ef4444';
            btnCerrar.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Salir';

            btnCerrar.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.CarmovoClienteApi) {
                    window.CarmovoClienteApi.cerrarSesion();
                } else {
                    localStorage.removeItem('carmovo_sesion');
                    localStorage.removeItem('usuarioCarmovoLogueado');
                }
                window.location.href = '/home';
            });

            botonLogin.parentNode.insertBefore(btnCerrar, botonLogin.nextSibling);
        }
    }

    const btnMenu = document.getElementById('btnMenu');
    const navPrincipal = document.getElementById('navegacionPrincipal');

    if (btnMenu && navPrincipal) {
        btnMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            navPrincipal.classList.toggle('nav-activa');
        });

        document.addEventListener('click', (e) => {
            if (!navPrincipal.contains(e.target) && !btnMenu.contains(e.target)) {
                navPrincipal.classList.remove('nav-activa');
            }
        });
    }

    const inputBusqueda = document.getElementById('inputBusqueda');
    const formBusqueda = document.getElementById('formBusqueda');
    const modalResultados = document.getElementById('modalResultados');
    const listaCoincidencias = document.getElementById('listaCoincidencias');
    const errorBusqueda = document.getElementById('errorBusqueda');

    let vehiculosBusqueda = [];
    let buscadorDisponible = false;

    const quitarAcentos = (texto) => String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    function resolverImagenBusqueda(vehiculo) {
        const propia = String(vehiculo.imagen || '').trim();
        if (/^(https?:|\/)/i.test(propia)) return propia;

        const nombreReal = quitarAcentos(`${vehiculo.marca || ''} ${vehiculo.modelo || ''}`).trim();

        if (typeof autosDB !== 'undefined' && Array.isArray(autosDB)) {
            const referencia = autosDB.find(auto => quitarAcentos(auto.nombre).trim() === nombreReal);
            if (referencia && referencia.imagen) return referencia.imagen;
        }

        return '../recursos/imagenes/carrusel/camioneta2.jpg';
    }

    if (inputBusqueda && modalResultados && listaCoincidencias) {
        try {
            const respuesta = await fetch('/api/v1/vehiculos');
            if (!respuesta.ok) throw new Error('No se pudo consultar la flota');

            const datos = await respuesta.json();
            vehiculosBusqueda = (Array.isArray(datos) ? datos : []).map(auto => ({
                idVehiculo: Number(auto.idVehiculo),
                nombre: `${auto.marca || ''} ${auto.modelo || ''}`.trim(),
                tipo: auto.tipo || auto.categoria || 'Vehículo',
                categoria: auto.categoria || '',
                precio: Number(auto.precioDia || 0),
                imagen: resolverImagenBusqueda(auto),
                estado: auto.estado || ''
            }));
            buscadorDisponible = true;
        } catch (error) {
            console.error('Carmovo: no se pudo cargar el buscador desde PostgreSQL.', error);
            if (errorBusqueda) {
                errorBusqueda.textContent = 'No se pudo consultar la flota en este momento.';
            }
        }

        function buscarAutos(texto) {
            const termino = quitarAcentos(texto.trim());
            if (!termino || !buscadorDisponible) return [];

            return vehiculosBusqueda.filter(auto =>
                quitarAcentos(auto.nombre).includes(termino) ||
                quitarAcentos(auto.tipo).includes(termino) ||
                quitarAcentos(auto.categoria).includes(termino)
            ).slice(0, 6);
        }

        function irAResultado(auto) {
            sessionStorage.setItem('carmovo_busqueda', JSON.stringify({
                idVehiculo: auto.idVehiculo,
                categoria: auto.categoria,
                nombre: auto.nombre
            }));

            window.location.href =
                '/categorias?categoria=' + encodeURIComponent(auto.categoria) +
                '&auto=' + encodeURIComponent(auto.nombre);
        }

        function pintarResultados(resultados) {
            listaCoincidencias.innerHTML = '';

            if (!resultados.length) {
                modalResultados.classList.add('oculto');
                return;
            }

            resultados.forEach(auto => {
                const li = document.createElement('li');
                li.className = 'item-coincidencia';
                li.innerHTML = `
                    <img src="${auto.imagen}" alt="${auto.nombre}" onerror="this.src='../recursos/imagenes/carrusel/camioneta2.jpg'">
                    <div>
                        <strong>${auto.nombre}</strong>
                        <span>${auto.categoria} · S/ ${auto.precio.toFixed(2)} / día</span>
                    </div>
                `;
                li.addEventListener('click', () => irAResultado(auto));
                listaCoincidencias.appendChild(li);
            });

            modalResultados.classList.remove('oculto');
        }

        function ejecutarBusqueda() {
            if (!buscadorDisponible) {
                if (errorBusqueda) errorBusqueda.textContent = 'No se pudo consultar la flota en este momento.';
                return;
            }

            const resultados = buscarAutos(inputBusqueda.value);

            if (!resultados.length) {
                if (errorBusqueda) {
                    errorBusqueda.textContent = inputBusqueda.value.trim()
                        ? 'No encontramos vehículos disponibles con ese nombre.'
                        : 'Escribe el auto que buscas.';
                }
                modalResultados.classList.add('oculto');
                return;
            }

            if (errorBusqueda) errorBusqueda.textContent = '';
            irAResultado(resultados[0]);
        }

        inputBusqueda.addEventListener('input', () => {
            if (errorBusqueda) errorBusqueda.textContent = '';
            pintarResultados(buscarAutos(inputBusqueda.value));
        });

        inputBusqueda.addEventListener('focus', () => {
            if (inputBusqueda.value.trim()) {
                pintarResultados(buscarAutos(inputBusqueda.value));
            }
        });

        inputBusqueda.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                ejecutarBusqueda();
            }
        });

        if (formBusqueda) {
            const botonBuscar = formBusqueda.querySelector('.boton-buscar');
            if (botonBuscar) {
                botonBuscar.addEventListener('click', (e) => {
                    e.preventDefault();
                    ejecutarBusqueda();
                });
            }
        }

        document.addEventListener('click', (e) => {
            if (!modalResultados.contains(e.target) && e.target !== inputBusqueda) {
                modalResultados.classList.add('oculto');
            }
        });
    }

    const contenedorCategorias = document.getElementById('contenedor-categorias');
    const contenedorAutos = document.getElementById('contenedor-autos');

    if (contenedorCategorias && contenedorAutos) {
        const params = new URLSearchParams(window.location.search);
        const categoriaBuscada = params.get('categoria');
        const autoBuscado = params.get('auto');

        if (categoriaBuscada) {
            setTimeout(() => {
                const pestanas = contenedorCategorias.querySelectorAll('button, .pestana, [data-categoria]');
                pestanas.forEach(pestana => {
                    if (pestana.textContent.trim() === categoriaBuscada) {
                        pestana.click();
                    }
                });

                if (autoBuscado) {
                    setTimeout(() => {
                        const tarjetas = contenedorAutos.querySelectorAll('.tarjeta-vehiculo, .tarjeta-auto, article, .card-auto');
                        tarjetas.forEach(tarjeta => {
                            const titulo = tarjeta.querySelector('h3');
                            if (titulo && titulo.textContent.trim() === autoBuscado) {
                                tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                tarjeta.classList.add('resaltado-busqueda');
                            }
                        });
                    }, 500);
                }
            }, 500);
        }
    }
});
// =====================================================
// CARMOVO - FORMULARIO DE RESERVAS DE HOME
// =====================================================

document.addEventListener('DOMContentLoaded', () => {

    const formReserva = document.getElementById('formReserva');
    const fechaRecogida = document.getElementById('fechaRecogida');
    const fechaEntrega = document.getElementById('fechaEntrega');

    if (!formReserva || !fechaRecogida || !fechaEntrega) {
        return;
    }

    // Obtener la fecha actual del navegador.
    function obtenerFechaActual() {
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');

        return `${anio}-${mes}-${dia}`;
    }

    function actualizarFechas() {
        const hoy = obtenerFechaActual();

        fechaRecogida.min = hoy;

        // No permitir una fecha de recogida anterior a hoy.
        if (fechaRecogida.value && fechaRecogida.value < hoy) {
            fechaRecogida.value = '';
        }

        // La entrega no puede ser anterior a la recogida.
        const fechaMinimaEntrega = fechaRecogida.value || hoy;
        fechaEntrega.min = fechaMinimaEntrega;

        if (fechaEntrega.value && fechaEntrega.value < fechaMinimaEntrega) {
            fechaEntrega.value = '';
        }
    }

    actualizarFechas();

    fechaRecogida.addEventListener('change', actualizarFechas);

    fechaEntrega.addEventListener('change', actualizarFechas);

    formReserva.addEventListener('submit', (evento) => {

        evento.preventDefault();

        actualizarFechas();

        // Comprobar los campos obligatorios.
        if (!formReserva.reportValidity()) {
            return;
        }

        const recogida = fechaRecogida.value;
        const entrega = fechaEntrega.value;
        const hoy = obtenerFechaActual();

        if (recogida < hoy || entrega < recogida) {
            window.CarmovoDialogo.avisar({ titulo: 'Revisa las fechas', mensaje: 'La recogida no puede ser antes de hoy y la entrega no puede ser antes de la recogida.', tipo: 'advertencia' });
            return;
        }

        const sedes = formReserva.querySelectorAll('select');

        if (sedes.length < 2) {
            return;
        }

        const busqueda = {
            lugarRecogida: sedes[0].value,
            lugarEntrega: sedes[1].value,
            fechaRecogida: recogida,
            fechaEntrega: entrega,
            textoRecogida: sedes[0].options[sedes[0].selectedIndex]?.text.trim() || '',
            textoEntrega: sedes[1].options[sedes[1].selectedIndex]?.text.trim() || ''
        };
        try { sessionStorage.setItem('carmovo_reserva_home', JSON.stringify(busqueda)); } catch (_) { /* sin almacenamiento */ }

        buscarDisponibles(busqueda, formReserva.querySelector('button[type="submit"]'));
    });

});

// =====================================================
// Autos disponibles según las fechas (buscador del inicio)
// =====================================================
async function buscarDisponibles(busqueda, boton) {
    const seccion = document.getElementById('resultadosDisponibles');
    if (!seccion) {
        window.location.href = '/reservas';
        return;
    }
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const soles = n => `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fechaCorta = f => new Date(`${f}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
    const imagen = auto => {
        const img = String(auto.imagen || '').trim();
        if (/^(https:|\/)/i.test(img)) return img;
        if (img.startsWith('recursos/')) return `/${img}`;
        if (typeof autosDB !== 'undefined' && Array.isArray(autosDB)) {
            const ref = autosDB.find(a => String(a.nombre).toLowerCase() === String(auto.nombre).toLowerCase());
            if (ref?.imagen) return ref.imagen;
        }
        return '/recursos/imagenes/home/logo-carmovo-transparente.png';
    };

    const titulo = seccion.querySelector('#disponiblesTitulo');
    const detalle = seccion.querySelector('#disponiblesDetalle');
    const lista = seccion.querySelector('#disponiblesLista');
    seccion.hidden = false;
    titulo.textContent = 'Buscando autos disponibles…';
    detalle.textContent = `${fechaCorta(busqueda.fechaRecogida)} → ${fechaCorta(busqueda.fechaEntrega)} · ${busqueda.textoRecogida}`;
    lista.innerHTML = '<div class="disponibles-cargando"><i class="fa-solid fa-spinner fa-spin"></i></div>';
    seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (boton) boton.disabled = true;

    try {
        const r = await fetch(`/api/v1/vehiculos/disponibles?inicio=${busqueda.fechaRecogida}&fin=${busqueda.fechaEntrega}`);
        const datos = await r.json().catch(() => null);
        if (!r.ok) throw new Error(datos?.detail || datos?.message || 'No se pudo buscar los autos.');
        const autos = Array.isArray(datos) ? datos : [];
        const dias = autos[0]?.dias || Math.max(1, Math.round((new Date(busqueda.fechaEntrega) - new Date(busqueda.fechaRecogida)) / 86400000));
        titulo.textContent = autos.length
            ? `${autos.length} ${autos.length === 1 ? 'auto disponible' : 'autos disponibles'}`
            : 'No hay autos disponibles en esas fechas';
        detalle.textContent = `${fechaCorta(busqueda.fechaRecogida)} → ${fechaCorta(busqueda.fechaEntrega)} · ${dias} ${dias === 1 ? 'día' : 'días'} · Recojo en ${busqueda.textoRecogida}`;
        if (!autos.length) {
            lista.innerHTML = '<p class="disponibles-vacio">Prueba con otras fechas: todos los autos están reservados o en mantenimiento.</p>';
            return;
        }
        lista.innerHTML = autos.map(a => `
            <article class="disponible">
                <div class="disponible__img">
                    <img src="${esc(imagen(a))}" alt="${esc(a.nombre)}" loading="lazy"
                         onerror="this.onerror=null;this.src='/recursos/imagenes/home/logo-carmovo-transparente.png'">
                    ${a.descuento ? `<span class="disponible__oferta">−${esc(a.descuento)}%</span>` : ''}
                </div>
                <div class="disponible__info">
                    <span class="disponible__categoria">${esc(a.categoria)}</span>
                    <h3>${esc(a.nombre)}</h3>
                    <p class="disponible__datos"><span><i class="fa-solid fa-user-group"></i> ${esc(a.pasajeros)}</span>
                        <span><i class="fa-solid fa-gears"></i> ${esc(a.transmision)}</span></p>
                    <div class="disponible__precio">
                        <div>${a.descuento ? `<s>${soles(a.precioDia)}</s>` : ''}<strong>${soles(a.precioFinal)}</strong><small> / día</small></div>
                        <small>Total ${dias} ${dias === 1 ? 'día' : 'días'}: <b>${soles(a.total)}</b> <span>(incluye seguro e IGV)</span></small>
                    </div>
                    <button type="button" class="disponible__reservar" data-id="${esc(a.idVehiculo)}">Reservar <i class="fa-solid fa-arrow-right"></i></button>
                </div>
            </article>`).join('');
        lista.querySelectorAll('.disponible__reservar').forEach(b => b.addEventListener('click', () => {
            const a = autos.find(x => String(x.idVehiculo) === b.dataset.id);
            try {
                localStorage.setItem('autoReserva', JSON.stringify({
                    idVehiculo: a.idVehiculo, id: a.idVehiculo, nombre: a.nombre, marca: a.marca, modelo: a.modelo,
                    categoria: a.categoria, tipo: a.categoria, imagen: a.imagen, precioDia: a.precioDia, precio: a.precioDia
                }));
            } catch (_) { /* sin almacenamiento */ }
            window.location.href = '/reservas';
        }));
    } catch (error) {
        titulo.textContent = 'No se pudo completar la búsqueda';
        lista.innerHTML = `<p class="disponibles-vacio">${esc(error.message)}</p>`;
    } finally {
        if (boton) boton.disabled = false;
    }
}
