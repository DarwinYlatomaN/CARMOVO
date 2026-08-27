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

            botones.forEach(item => {
                item.classList.remove('activo');
            });
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
                if (cantidadVisible === 0) {
                    sinResultados.style.display = 'block';
                } else {
                    sinResultados.style.display = 'none';
                }
            }
        });
    });
}

function inicializarBotonesReserva() {
    const botones = document.querySelectorAll('.btn-reservar-oferta');

    botones.forEach(boton => {
        boton.addEventListener('click', () => {
            const id = Number(boton.dataset.id);

            if (typeof autosDB === 'undefined' || !Array.isArray(autosDB)) {
                alert('No se pudo cargar la información de los vehículos.');
                return;
            }

            const auto = autosDB.find(vehiculo => vehiculo.id === id);

            if (!auto) {
                alert('No se encontró el vehículo seleccionado.');
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

            const descuento = descuentos[id] || 0;
            const precioNormal = Number(auto.precio);
            const precioOferta = Number((precioNormal * (1 - descuento / 100)).toFixed(2));

            const autoSeleccionado = {
                id: auto.id,
                nombre: auto.nombre,
                tipo: auto.tipo,
                categoria: auto.categoria,
                pasajeros: auto.pasajeros,
                caracteristicaExtra: auto.caracteristicaExtra,
                imagen: auto.imagen,
                precioOriginal: precioNormal,
                precioOferta: precioOferta,
                precio: precioOferta,
                descuento: descuento,
                esOferta: true
            };

            localStorage.setItem('autoReserva', JSON.stringify(autoSeleccionado));
            localStorage.setItem('ofertaActiva', 'true');
            window.location.href = 'reservas.html';
        });
    });
}