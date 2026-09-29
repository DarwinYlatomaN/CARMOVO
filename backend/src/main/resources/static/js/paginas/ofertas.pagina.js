document.addEventListener('DOMContentLoaded', () => {
    inicializarFiltrosOfertas();
    inicializarBotonesReserva();
});

function inicializarFiltrosOfertas() {
    const botones = document.querySelectorAll('.filtro-oferta');
    const tarjetas = document.querySelectorAll('.tarjeta-oferta');
    const sinResultados = document.getElementById('sinResultadosOfertas');

    botones.forEach(boton => {
        boton.addEventListener('click', () => {
            const categoria = boton.dataset.categoria;

            botones.forEach(item => item.classList.remove('activo'));
            boton.classList.add('activo');

            let cantidadVisible = 0;

            tarjetas.forEach(tarjeta => {
                const categoriaTarjeta = tarjeta.dataset.categoria;
                const mostrar = categoria === 'Todos' || categoriaTarjeta === categoria;

                if (mostrar) {
                    tarjeta.classList.remove('oculta');
                    cantidadVisible++;
                } else {
                    tarjeta.classList.add('oculta');
                }
            });

            if (sinResultados) {
                sinResultados.style.display = cantidadVisible === 0 ? 'block' : 'none';
            }
        });
    });
}

function normalizarTextoOferta(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

async function obtenerVehiculosReales() {
    const respuesta = await fetch('http://localhost:8080/api/v1/vehiculos');
    if (!respuesta.ok) throw new Error('No se pudo consultar la flota actual');

    const datos = await respuesta.json();
    return Array.isArray(datos) ? datos : [];
}

function construirSeleccionReal(vehiculo, datosOferta = {}) {
    return {
        idVehiculo: Number(vehiculo.idVehiculo),
        id: Number(vehiculo.idVehiculo),
        marca: vehiculo.marca || '',
        modelo: vehiculo.modelo || '',
        nombre: `${vehiculo.marca || ''} ${vehiculo.modelo || ''}`.trim(),
        tipo: vehiculo.tipo || vehiculo.categoria || 'Vehículo',
        categoria: vehiculo.categoria || '',
        pasajeros: vehiculo.pasajeros || 5,
        transmision: vehiculo.transmision || '',
        imagen: vehiculo.imagen || '',
        precioDia: Number(vehiculo.precioDia || 0),
        precio: Number(vehiculo.precioDia || 0),
        estado: vehiculo.estado || '',
        ...datosOferta
    };
}

function inicializarBotonesReserva() {
    const botones = document.querySelectorAll('.btn-reservar-oferta');

    botones.forEach(boton => {
        boton.addEventListener('click', async () => {
            const idCatalogo = Number(boton.dataset.id);

            if (typeof autosDB === 'undefined' || !Array.isArray(autosDB)) {
                alert('No se pudo identificar el vehículo de esta oferta.');
                return;
            }

            const autoOferta = autosDB.find(vehiculo => Number(vehiculo.id) === idCatalogo);
            if (!autoOferta) {
                alert('No se encontró el vehículo asociado a esta oferta.');
                return;
            }

            const textoOriginal = boton.innerHTML;
            boton.disabled = true;
            boton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando disponibilidad...';

            try {
                const vehiculosReales = await obtenerVehiculosReales();
                const nombreOferta = normalizarTextoOferta(autoOferta.nombre);

                const vehiculoReal = vehiculosReales.find(vehiculo =>
                    normalizarTextoOferta(`${vehiculo.marca || ''} ${vehiculo.modelo || ''}`) === nombreOferta
                );

                if (!vehiculoReal) {
                    alert(`El ${autoOferta.nombre} no forma parte de la flota actual registrada en PostgreSQL.`);
                    return;
                }

                if (vehiculoReal.estado !== 'Disponible') {
                    alert(`El ${autoOferta.nombre} existe en la flota, pero actualmente no está disponible.`);
                    return;
                }

                const descuentos = {
                    1: 15,
                    6: 20,
                    12: 15,
                    16: 20,
                    26: 10,
                    23: 20
                };

                const descuento = descuentos[idCatalogo] || 0;
                const seleccion = construirSeleccionReal(vehiculoReal, {
                    descuento,
                    esOferta: true,
                    ofertaNombreReferencia: autoOferta.nombre
                });

                localStorage.setItem('autoReserva', JSON.stringify(seleccion));
                localStorage.setItem('ofertaActiva', 'true');
                window.location.href = '/reservas';
            } catch (error) {
                console.error('Error al validar la oferta con la flota real:', error);
                alert('No se pudo verificar la disponibilidad del vehículo en este momento.');
            } finally {
                boton.disabled = false;
                boton.innerHTML = textoOriginal;
            }
        });
    });
}
