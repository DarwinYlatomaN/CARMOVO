document.addEventListener('DOMContentLoaded', () => {

    const sesionActual = JSON.parse(localStorage.getItem('carmovo_sesion'));
    const botonLogin = document.querySelector('.boton-login');

    if (sesionActual && sesionActual.logueado) {
        if (botonLogin) {
            const primerNombre = sesionActual.nombre.split(' ')[0];
            botonLogin.innerHTML = `<i class="fa-solid fa-user"></i> Hola, ${primerNombre}`;
            botonLogin.href = 'miCuenta.html';

            const btnCerrar = document.createElement('a');
            btnCerrar.href = '#';
            btnCerrar.className = 'enlace-telefono';
            btnCerrar.style.marginLeft = '15px';
            btnCerrar.style.color = '#ef4444';
            btnCerrar.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> Salir`;

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

    if (inputBusqueda && modalResultados && listaCoincidencias) {

        if (typeof autosDB === 'undefined') {
            console.warn('Carmovo: falta cargar "db.js" antes de "principal.js" para que el buscador funcione en esta página.');
        } else {

            const quitarAcentos = (texto) =>
                texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

            function buscarAutos(texto) {
                const termino = quitarAcentos(texto.trim());
                if (!termino) return [];
                return autosDB.filter(auto =>
                    quitarAcentos(auto.nombre).includes(termino) ||
                    quitarAcentos(auto.tipo).includes(termino) ||
                    quitarAcentos(auto.categoria).includes(termino)
                ).slice(0, 6);
            }

            function irAResultado(auto) {
                sessionStorage.setItem('carmovo_busqueda', JSON.stringify({
                    categoria: auto.categoria,
                    nombre: auto.nombre
                }));
                window.location.href =
                    'categorias.html?categoria=' + encodeURIComponent(auto.categoria) +
                    '&auto=' + encodeURIComponent(auto.nombre);
            }

            function pintarResultados(resultados) {
                listaCoincidencias.innerHTML = '';

                if (resultados.length === 0) {
                    modalResultados.classList.add('oculto');
                    return;
                }

                resultados.forEach(auto => {
                    const li = document.createElement('li');
                    li.className = 'item-coincidencia';
                    li.innerHTML = `
                        <img src="${auto.imagen}" alt="${auto.nombre}">
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
                const resultados = buscarAutos(inputBusqueda.value);

                if (resultados.length === 0) {
                    if (errorBusqueda) {
                        errorBusqueda.textContent = inputBusqueda.value.trim()
                            ? 'No encontramos vehículos con ese nombre.'
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
    }

    
    const contenedorCategorias = document.getElementById('contenedor-categorias');
    const contenedorAutos = document.getElementById('contenedor-autos');

    if (contenedorCategorias && contenedorAutos) {
        const params = new URLSearchParams(window.location.search);
        const categoriaBuscada = params.get('categoria');
        const autoBuscado = params.get('auto');

        if (categoriaBuscada) {
            setTimeout(() => {
                const pestañas = contenedorCategorias.querySelectorAll('button, .pestaña, [data-categoria]');
                pestañas.forEach(pestaña => {
                    if (pestaña.textContent.trim() === categoriaBuscada) {
                        pestaña.click();
                    }
                });

                if (autoBuscado) {
                    setTimeout(() => {
                        const nodos = contenedorAutos.querySelectorAll('*');
                        nodos.forEach(nodo => {
                            if (nodo.children.length === 0 && nodo.textContent.trim() === autoBuscado) {
                                const tarjeta = nodo.closest('.tarjeta-auto, article, .card-auto') || nodo;
                                tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                tarjeta.classList.add('resaltado-busqueda');
                            }
                        });
                    }, 400);
                }
            }, 300);
        }
    }
});s