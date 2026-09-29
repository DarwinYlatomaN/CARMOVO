document.addEventListener('DOMContentLoaded', () => {
    inicializarCatalogoVehiculos();
    crearEstructuraModalTecnico();
});

window.autosGlobales = [];

async function inicializarCatalogoVehiculos() {
    const contenedorAutos = document.getElementById('contenedor-autos');
    const contenedorCategorias = document.getElementById('contenedor-categorias');

    if (!contenedorAutos) return;

    try {
        const respuesta = await fetch('http://localhost:8080/api/v1/vehiculos');
        if (!respuesta.ok) throw new Error('Error al conectar con el servidor');

        const vehiculos = await respuesta.json();
        window.autosGlobales = Array.isArray(vehiculos) ? vehiculos : [];

        const categorias = [
            'Todos',
            ...new Set(window.autosGlobales.map(auto => auto.categoria).filter(Boolean))
        ];

        if (contenedorCategorias) {
            contenedorCategorias.innerHTML = '';

            categorias.forEach((categoria, index) => {
                const boton = document.createElement('button');
                boton.textContent = categoria;
                boton.dataset.categoria = categoria;
                boton.className = index === 0 ? 'pestana activo' : 'pestana';

                boton.addEventListener('click', () => {
                    contenedorCategorias.querySelectorAll('.pestana')
                        .forEach(item => item.classList.remove('activo'));
                    boton.classList.add('activo');

                    const lista = categoria === 'Todos'
                        ? window.autosGlobales
                        : window.autosGlobales.filter(auto => auto.categoria === categoria);

                    renderizarAutos(lista, contenedorAutos);
                });

                contenedorCategorias.appendChild(boton);
            });
        }

        contenedorAutos.addEventListener('click', manejarAccionesCatalogo);
        renderizarAutos(window.autosGlobales, contenedorAutos);
    } catch (error) {
        console.error('Error al cargar los vehículos:', error);
        contenedorAutos.innerHTML = '<p style="color: #ff5a36; text-align: center; grid-column: 1/-1;">No se pudo conectar con la base de datos de Carmovo.</p>';
    }
}

function manejarAccionesCatalogo(evento) {
    const botonInfo = evento.target.closest('[data-accion="info"]');
    if (botonInfo) {
        const vehiculo = buscarVehiculoReal(botonInfo.dataset.idVehiculo);
        if (vehiculo) abrirModalTecnico(vehiculo);
        return;
    }

    const botonReserva = evento.target.closest('[data-accion="reservar"]');
    if (botonReserva) {
        const vehiculo = buscarVehiculoReal(botonReserva.dataset.idVehiculo);
        if (vehiculo) prepararReservaVehiculo(vehiculo);
    }
}

function buscarVehiculoReal(idVehiculo) {
    const id = Number(idVehiculo);
    return window.autosGlobales.find(auto => Number(auto.idVehiculo) === id) || null;
}

function prepararReservaVehiculo(auto, datosAdicionales = {}) {
    if (!auto || !auto.idVehiculo) {
        alert('No se pudo identificar el vehículo seleccionado.');
        return;
    }

    if (auto.estado && auto.estado !== 'Disponible') {
        alert('Este vehículo no se encuentra disponible para reservar.');
        return;
    }

    const seleccion = {
        idVehiculo: Number(auto.idVehiculo),
        id: Number(auto.idVehiculo),
        marca: auto.marca || '',
        modelo: auto.modelo || '',
        nombre: `${auto.marca || ''} ${auto.modelo || ''}`.trim(),
        tipo: auto.tipo || auto.categoria || 'Vehículo',
        categoria: auto.categoria || '',
        pasajeros: auto.pasajeros || 5,
        transmision: auto.transmision || '',
        imagen: auto.imagen || '',
        precioDia: Number(auto.precioDia || 0),
        estado: auto.estado || 'Disponible',
        ...datosAdicionales
    };

    localStorage.setItem('autoReserva', JSON.stringify(seleccion));

    if (!datosAdicionales.esOferta) {
        localStorage.removeItem('ofertaActiva');
    }

    window.location.href = '/reservas';
}

window.prepararReservaVehiculo = prepararReservaVehiculo;

function obtenerEstilosDinamicos(categoria, transmision) {
    const estilos = {
        claseEtiqueta: 'naranja',
        etiqueta: 'Recomendado',
        iconoExtra: 'fa-gear'
    };

    if (transmision && transmision.toLowerCase().includes('mec')) {
        estilos.iconoExtra = 'fa-gear';
    } else if (transmision && transmision.toLowerCase().includes('auto')) {
        estilos.iconoExtra = 'fa-wand-magic-sparkles';
    }

    switch (categoria) {
        case 'Económicos':
            estilos.claseEtiqueta = 'azul';
            estilos.etiqueta = 'Ciudad';
            break;
        case 'Sedán':
        case 'Sedanes':
            estilos.claseEtiqueta = 'verde';
            estilos.etiqueta = 'Confort';
            break;
        case 'SUVs':
            estilos.claseEtiqueta = 'morada';
            estilos.etiqueta = 'Familiar';
            break;
        case 'Pick-ups 4x4':
            estilos.claseEtiqueta = 'naranja';
            estilos.etiqueta = 'Trabajo/Mina';
            estilos.iconoExtra = 'fa-mountain';
            break;
        case 'Todoterreno':
            estilos.claseEtiqueta = 'naranja';
            estilos.etiqueta = 'Aventura';
            estilos.iconoExtra = 'fa-mountain';
            break;
        case 'Híbridos':
            estilos.claseEtiqueta = 'verde';
            estilos.etiqueta = 'Eco';
            estilos.iconoExtra = 'fa-leaf';
            break;
        case 'Premium / Lujo':
            estilos.claseEtiqueta = 'morada';
            estilos.etiqueta = 'VIP';
            estilos.iconoExtra = 'fa-gem';
            break;
    }

    return estilos;
}

function normalizarTexto(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function resolverImagenVehiculo(auto) {
    const carpetas = {
        'economicos': 'economicos',
        'sedan': 'sedanes',
        'sedanes': 'sedanes',
        'suvs': 'SUVs',
        'pick-ups 4x4': 'pickups',
        'minivans': 'minivans',
        'todoterreno': 'todoTerreno',

        // Nuevas categorías de la flota
        'crossovers': 'crossovers',
        'furgonetas': 'furgonetas',
        'hibridos': 'hibridos',
        'premium / lujo': 'premiumLujo',
        'eventos': 'eventos'
    };

    // La base de datos es ahora la fuente principal de la imagen.
    const imagenBD = String(auto.imagen || '').trim();

    if (imagenBD) {

        // Imagen externa o generada.
        if (/^(https?:|data:|blob:)/i.test(imagenBD)) {
            return imagenBD;
        }

        // Si PostgreSQL ya contiene una ruta completa relativa.
        if (imagenBD.startsWith('../recursos/')) {
            return imagenBD;
        }

        if (imagenBD.startsWith('recursos/')) {
            return `../${imagenBD}`;
        }

        // Si PostgreSQL contiene solamente el nombre del archivo.
        const carpeta = carpetas[normalizarTexto(auto.categoria)];

        if (carpeta) {
            return `../recursos/imagenes/${carpeta}/${imagenBD}`;
        }
    }

    // Compatibilidad con los vehículos antiguos del catálogo.
    const nombreReal = normalizarTexto(
        `${auto.marca || ''} ${auto.modelo || ''}`
    );

    if (typeof autosDB !== 'undefined' && Array.isArray(autosDB)) {
        const referencia = autosDB.find(
            item => normalizarTexto(item.nombre) === nombreReal
        );

        if (referencia && referencia.imagen) {
            const rutaAnterior = String(referencia.imagen).trim();

            if (rutaAnterior.startsWith('../recursos/')) {
                return rutaAnterior;
            }
        }
    }

    // Imagen de respaldo.
    return '../recursos/imagenes/carrusel/camioneta2.jpg';
}

function renderizarAutos(listaAutos, contenedor) {
    contenedor.innerHTML = '';

    if (!listaAutos.length) {
        contenedor.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #8b95a5;">No hay vehículos disponibles en esta categoría.</p>';
        return;
    }

    listaAutos.forEach(auto => {
        const diseño = obtenerEstilosDinamicos(auto.categoria, auto.transmision);
        const tipo = auto.tipo || 'Vehículo Confiable';
        const pasajeros = auto.pasajeros || 5;
        const precio = Number(auto.precioDia || 0).toFixed(2);
        const disponible = auto.estado === 'Disponible';
        const imagen = resolverImagenVehiculo(auto);

        const tarjetaHTML = `
            <div class="tarjeta-vehiculo" data-id-vehiculo="${auto.idVehiculo}">
                <div class="imagen-contenedor">
                    <span class="etiqueta-badge ${diseño.claseEtiqueta}">${diseño.etiqueta}</span>
                    <img src="${imagen}" alt="${auto.marca} ${auto.modelo}" onerror="this.src='../recursos/imagenes/carrusel/camioneta2.jpg'">
                    <div class="rating-badge">
                        <i class="fa-solid fa-star"></i> 4.8
                    </div>
                </div>

                <div class="info-vehiculo">
                    <span class="subtipo-auto">${tipo}</span>
                    <h3>${auto.marca} ${auto.modelo}</h3>

                    <div class="caracteristicas-grid">
                        <span><i class="fa-solid fa-users"></i> ${pasajeros} Pasajeros</span>
                        <span><i class="fa-solid ${diseño.iconoExtra}"></i> ${auto.transmision || 'Automático'}</span>
                    </div>

                    <button type="button" class="btn-info-tecnica" data-accion="info" data-id-vehiculo="${auto.idVehiculo}">
                        <i class="fa-solid fa-circle-info"></i> Información Técnica
                    </button>

                    <div class="precio-reserva" style="margin-top: 15px;">
                        <div class="caja-precio">
                            <span class="etiqueta-precio">Precio por día</span>
                            <span class="precio">S/ ${precio}</span>
                        </div>
                        <button type="button"
                                class="boton-accion-naranja"
                                data-accion="reservar"
                                data-id-vehiculo="${auto.idVehiculo}"
                                ${disponible ? '' : 'disabled'}
                                ${disponible ? '' : 'style="background:#374151; color:#9ca3af; cursor:not-allowed;"'}>
                            ${disponible ? 'Reservar' : 'Ocupado'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        contenedor.insertAdjacentHTML('beforeend', tarjetaHTML);
    });
}

function crearEstructuraModalTecnico() {
    if (document.getElementById('modalTecnico')) return;

    const modalHTML = `
        <div id="modalTecnico" class="modal-cuenta oculto">
            <div class="modal-cuenta-contenido" style="max-width: 550px;">
                <button type="button" class="btn-cerrar-modal" id="cerrarModalTecnico"><i class="fa-solid fa-xmark"></i></button>
                <span id="modalCategoria" style="color: var(--color-naranja); font-weight: 700; text-transform: uppercase; font-size: 0.8rem;"></span>
                <h3 id="modalTitulo" style="font-size: 1.8rem; margin: 5px 0 15px 0;"></h3>

                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h4 style="color: #fff; margin-bottom: 8px; font-size: 1rem;"><i class="fa-solid fa-gauge-high"></i> Especificaciones y Descripción</h4>
                    <p id="modalDescripcion" style="color: var(--texto-gris); font-size: 0.95rem; line-height: 1.6;"></p>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 15px;">
                    <div>
                        <span style="font-size: 0.8rem; color: var(--texto-gris);">Transmisión: <strong id="modalTransmision" style="color:#fff"></strong></span><br>
                        <span style="font-size: 0.8rem; color: var(--texto-gris);">Capacidad: <strong id="modalPasajeros" style="color:#fff"></strong> pasajeros</span>
                    </div>
                    <button type="button" id="modalReservarVehiculo" class="boton-accion-naranja" style="padding: 10px 20px;">Ir a Reservar</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('modalTecnico');
    const btnReservar = document.getElementById('modalReservarVehiculo');

    document.getElementById('cerrarModalTecnico').addEventListener('click', () => {
        modal.classList.remove('activo');
        setTimeout(() => modal.classList.add('oculto'), 300);
    });

    btnReservar.addEventListener('click', () => {
        const vehiculo = buscarVehiculoReal(btnReservar.dataset.idVehiculo);
        if (vehiculo) prepararReservaVehiculo(vehiculo);
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('activo');
            setTimeout(() => modal.classList.add('oculto'), 300);
        }
    });
}

window.abrirModalTecnico = function(auto) {
    const modal = document.getElementById('modalTecnico');
    if (!modal || !auto) return;

    document.getElementById('modalCategoria').textContent = auto.categoria || '';
    document.getElementById('modalTitulo').textContent = `${auto.marca || ''} ${auto.modelo || ''}`.trim();
    document.getElementById('modalDescripcion').textContent = auto.descripcion || 'Vehículo en excelentes condiciones, equipado con tecnología de punta, confort garantizado y revisiones al día para tu total seguridad en rutas del Perú.';
    document.getElementById('modalTransmision').textContent = auto.transmision || 'Automática';
    document.getElementById('modalPasajeros').textContent = auto.pasajeros || 5;

    const btnReservar = document.getElementById('modalReservarVehiculo');
    if (btnReservar) {
        btnReservar.dataset.idVehiculo = auto.idVehiculo;
        btnReservar.disabled = auto.estado !== 'Disponible';
        btnReservar.textContent = auto.estado === 'Disponible' ? 'Ir a Reservar' : 'No disponible';
    }

    modal.classList.remove('oculto');
    setTimeout(() => modal.classList.add('activo'), 10);
};
