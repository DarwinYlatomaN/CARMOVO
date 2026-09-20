document.addEventListener('DOMContentLoaded', () => {
    inicializarCatalogoVehiculos();
    crearEstructuraModalTecnico(); // Crea el modal dinámicamente si no existe
});

async function inicializarCatalogoVehiculos() {
    const contenedorAutos = document.getElementById('contenedor-autos');
    const contenedorCategorias = document.getElementById('contenedor-categorias');

    if (!contenedorAutos) return;

    try {
        const respuesta = await fetch('http://localhost:8080/api/v1/vehiculos');
        if (!respuesta.ok) throw new Error('Error al conectar con el servidor');

        const autosDB = await respuesta.json();
        const categoriasDB = ["Todos", ...new Set(autosDB.map(auto => auto.categoria))];

        if (contenedorCategorias) {
            contenedorCategorias.innerHTML = '';
            categoriasDB.forEach((categoria, index) => {
                const boton = document.createElement('button');
                boton.textContent = categoria;
                boton.className = index === 0 ? 'pestana activo' : 'pestana';
                
                boton.addEventListener('click', (e) => {
                    document.querySelectorAll('.pestana').forEach(p => p.classList.remove('activo'));
                    e.target.classList.add('activo');

                    if (categoria === 'Todos') {
                        renderizarAutos(autosDB, contenedorAutos);
                    } else {
                        const autosFiltrados = autosDB.filter(auto => auto.categoria === categoria);
                        renderizarAutos(autosFiltrados, contenedorAutos);
                    }
                });

                contenedorCategorias.appendChild(boton);
            });
        }

        renderizarAutos(autosDB, contenedorAutos);

    } catch (error) {
        console.error("Error al cargar los vehículos:", error);
        contenedorAutos.innerHTML = '<p style="color: #ff5a36; text-align: center; grid-column: 1/-1;">No se pudo conectar con la base de datos de Carmovo.</p>';
    }
}

function renderizarAutos(listaAutos, contenedor) {
    contenedor.innerHTML = '';

    if (listaAutos.length === 0) {
        contenedor.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #8b95a5;">No hay vehículos disponibles en esta categoría.</p>';
        return;
    }

    listaAutos.forEach(auto => {
        const tipo = auto.tipo || 'Vehículo Confiable';
        const rating = auto.rating || '4.8';
        const pasajeros = auto.pasajeros || 5;
        const caracteristicaExtra = auto.caracteristicaExtra || auto.transmision || 'Automático';
        const iconoExtra = auto.iconoExtra || 'fa-gear';
        const etiqueta = auto.etiqueta || 'Disponible';
        const claseEtiqueta = auto.claseEtiqueta || 'naranja';
        const precio = auto.precioDia ? Number(auto.precioDia).toFixed(2) : '150.00';

        const tarjetaHTML = `
            <div class="tarjeta-vehiculo">
                <div class="imagen-contenedor">
                    <span class="etiqueta-badge ${claseEtiqueta}">${etiqueta}</span>
                    <img src="../recursos/imagenes/vehiculos/${auto.imagen}" alt="${auto.marca} ${auto.modelo}" onerror="this.src='../recursos/imagenes/carrusel/camioneta1.jpg'">
                    <div class="rating-badge">
                        <i class="fa-solid fa-star"></i> ${rating}
                    </div>
                </div>
                
                <div class="info-vehiculo">
                    <span class="subtipo-auto">${tipo}</span>
                    <h3>${auto.marca} ${auto.modelo}</h3>
                    
                    <div class="caracteristicas-grid">
                        <span><i class="fa-solid fa-users"></i> ${pasajeros} Pasajeros</span>
                        <span><i class="fa-solid ${iconoExtra}"></i> ${caracteristicaExtra}</span>
                    </div>

                    <!-- Botón de Información Técnica -->
                    <button type="button" class="btn-info-tecnica" onclick='abrirModalTecnico(${JSON.stringify(auto)})'>
                        <i class="fa-solid fa-circle-info"></i> Información Técnica
                    </button>

                    <div class="precio-reserva" style="margin-top: 15px;">
                        <div class="caja-precio">
                            <span class="etiqueta-precio">Precio por día</span>
                            <span class="precio">$${precio}</span>
                        </div>
                        <a href="reservas.html" class="boton-accion-naranja">
                            ${auto.estado === 'Disponible' ? 'Reservar' : 'No disponible'}
                        </a>
                    </div>
                </div>
            </div>
        `;
        contenedor.innerHTML += tarjetaHTML;
    });
}

// -------------------------------------------------------------------------
// MODAL DINÁMICO DE INFORMACIÓN TÉCNICA
// -------------------------------------------------------------------------
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
                    <a href="reservas.html" class="boton-accion-naranja" style="padding: 10px 20px;">Ir a Reservar</a>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Eventos para cerrar el modal
    const modal = document.getElementById('modalTecnico');
    const btnCerrar = document.getElementById('modalCerrarTecnico');
    
    document.getElementById('cerrarModalTecnico').addEventListener('click', () => {
        modal.classList.remove('activo');
        setTimeout(() => modal.classList.add('oculto'), 300);
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
    if (!modal) return;

    document.getElementById('modalCategoria').textContent = auto.categoria;
    document.getElementById('modalTitulo').textContent = `${auto.marca} ${auto.modelo}`;
    document.getElementById('modalDescripcion').textContent = auto.descripcion || "Vehículo en excelentes condiciones, equipado con tecnología de punta, confort garantizado y revisiones al día para tu total seguridad en rutas del Perú.";
    document.getElementById('modalTransmision').textContent = auto.transmision || 'Automática';
    document.getElementById('modalPasajeros').textContent = auto.pasajeros || 5;

    modal.classList.remove('oculto');
    setTimeout(() => modal.classList.add('activo'), 10);
};