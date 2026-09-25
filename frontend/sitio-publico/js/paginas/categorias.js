document.addEventListener('DOMContentLoaded', () => {
    cargarVehiculosDesdeAPI();
    crearEstructuraModalTecnico(); 
});

async function cargarVehiculosDesdeAPI() {
    const contenedor = document.getElementById('contenedorVehiculos');
    
    if (!contenedor) return;

    try {
        const respuesta = await fetch('http://localhost:8080/api/v1/vehiculos');
        const vehiculos = await respuesta.json();

        contenedor.innerHTML = '';

        if (vehiculos.length === 0) {
            contenedor.innerHTML = '<p style="text-align: center; color: #8b95a5; grid-column: 1/-1;">No hay vehículos disponibles en este momento.</p>';
            return;
        }

        vehiculos.forEach(vehiculo => {

            const tipo = vehiculo.tipo || 'Vehículo Confiable';
            const rating = vehiculo.rating || '4.8';
            const etiqueta = vehiculo.etiqueta || 'Recomendado';
            const claseEtiqueta = vehiculo.claseEtiqueta || 'naranja';
            const precio = vehiculo.precioDia ? Number(vehiculo.precioDia).toFixed(2) : '0.00';

            const tarjetaHTML = `
                <div class="tarjeta-vehiculo">
                    <div class="imagen-contenedor">
                        <span class="etiqueta-badge ${claseEtiqueta}">${etiqueta}</span>
                        <img src="../recursos/imagenes/vehiculos/${vehiculo.imagen}" alt="${vehiculo.marca} ${vehiculo.modelo}" onerror="this.src='../recursos/imagenes/carrusel/camioneta1.jpg'">
                        <div class="rating-badge">
                            <i class="fa-solid fa-star"></i> ${rating}
                        </div>
                    </div>
                    
                    <div class="info-vehiculo">
                        <span class="subtipo-auto">${tipo}</span>
                        <h3>${vehiculo.marca} ${vehiculo.modelo}</h3>
                        <p style="color: var(--color-naranja); font-size: 0.85rem; font-weight: 600; margin-bottom: 12px; text-transform: uppercase;">
                            ${vehiculo.categoria}
                        </p>
                        
                        <div class="caracteristicas-grid">
                            <span><i class="fa-solid fa-users"></i> ${vehiculo.pasajeros} Pasajeros</span>
                            <span><i class="fa-solid fa-gears"></i> ${vehiculo.transmision}</span>
                        </div>

                        <!-- Botón de Información Técnica -->
                        <button type="button" class="btn-info-tecnica" onclick='abrirModalTecnico(${JSON.stringify(vehiculo)})'>
                            <i class="fa-solid fa-circle-info"></i> Información Técnica
                        </button>

                        <div class="precio-reserva" style="margin-top: 15px;">
                            <div class="caja-precio">
                                <span class="etiqueta-precio">Precio por día</span>
                                <span class="precio">$${precio}</span>
                            </div>
                            <button class="boton-accion-naranja" ${vehiculo.estado !== 'Disponible' ? 'disabled style="background: #374151; color: #9ca3af; cursor: not-allowed; box-shadow: none;"' : ''} onclick="window.location.href='reservas.html'">
                                ${vehiculo.estado === 'Disponible' ? 'Reservar' : 'No Disponible'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            contenedor.innerHTML += tarjetaHTML;
        });

    } catch (error) {
        console.error("Error al cargar los vehículos:", error);
        contenedor.innerHTML = '<p style="color: #ff5a36; text-align: center; grid-column: 1/-1;">No se pudieron cargar los vehículos en este momento.</p>';
    }
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
                    <a href="reservas.html" class="boton-accion-naranja" style="padding: 10px 20px;">Ir a Reservar</a>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('modalTecnico');
    
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