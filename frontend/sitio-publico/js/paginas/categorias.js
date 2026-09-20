document.addEventListener('DOMContentLoaded', () => {
    cargarVehiculosDesdeAPI();
});

async function cargarVehiculosDesdeAPI() {
    const contenedor = document.getElementById('contenedorVehiculos');
    
    // Si no existe el contenedor en esta página, detenemos la función
    if (!contenedor) return;

    try {
        // Hacemos la petición a la API que acabas de probar
        const respuesta = await fetch('http://localhost:8080/api/v1/vehiculos');
        const vehiculos = await respuesta.json();

        // Limpiamos el contenedor (por si había autos de prueba "hardcodeados")
        contenedor.innerHTML = '';

        // Recorremos cada vehículo que trajo la base de datos
        vehiculos.forEach(vehiculo => {
            const tarjetaHTML = `
                <div class="tarjeta-vehiculo">
                    <img src="../recursos/imagenes/vehiculos/${vehiculo.imagen}" alt="${vehiculo.marca} ${vehiculo.modelo}">
                    <div class="info-vehiculo">
                        <h3>${vehiculo.marca} ${vehiculo.modelo}</h3>
                        <p class="categoria">${vehiculo.categoria}</p>
                        <div class="caracteristicas">
                            <span><i class="fa-solid fa-users"></i> ${vehiculo.pasajeros} Pasajeros</span>
                            <span><i class="fa-solid fa-gears"></i> ${vehiculo.transmision}</span>
                        </div>
                        <div class="precio-reserva">
                            <span class="precio">$${vehiculo.precioDia} / día</span>
                            <button class="btn-reservar" ${vehiculo.estado !== 'Disponible' ? 'disabled' : ''}>
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
        contenedor.innerHTML = '<p>No se pudieron cargar los vehículos en este momento.</p>';
    }
}