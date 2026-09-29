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
            btnCerrar.className = 'enlace-telefono';
            btnCerrar.style.marginLeft = '15px';
            btnCerrar.style.color = '#ef4444';
            btnCerrar.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Salir';

            btnCerrar.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('carmovo_sesion');
                localStorage.removeItem('usuarioCarmovoLogueado');
                window.location.reload();
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
        const nombreReal = quitarAcentos(`${vehiculo.marca || ''} ${vehiculo.modelo || ''}`).trim();

        if (typeof autosDB !== 'undefined' && Array.isArray(autosDB)) {
            const referencia = autosDB.find(auto => quitarAcentos(auto.nombre).trim() === nombreReal);
            if (referencia && referencia.imagen) return referencia.imagen;
        }

        return '../recursos/imagenes/carrusel/camioneta2.jpg';
    }

    if (inputBusqueda && modalResultados && listaCoincidencias) {
        try {
            const respuesta = await fetch('http://localhost:8080/api/v1/vehiculos');
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
