// La lógica activa del catálogo está centralizada en app-categorias.js.
// Este archivo se conserva por compatibilidad con la estructura original del proyecto.
document.addEventListener('DOMContentLoaded', () => {
    const contenedorAutos = document.getElementById('contenedor-autos');

    if (contenedorAutos && typeof inicializarCatalogoVehiculos !== 'function') {
        console.error('Carmovo: no se pudo inicializar el catálogo de vehículos desde PostgreSQL.');
    }
});
