document.addEventListener('DOMContentLoaded', () => {
    let contenedorCategorias = document.querySelector('#contenedor-categorias');
    let contenedorAutos = document.querySelector('#contenedor-autos');
    
    if(!contenedorCategorias || !contenedorAutos) return;

    function renderizarCategorias() {
        contenedorCategorias.innerHTML = '';
        
        categoriasDB.forEach(categoria => {
            const boton = document.createElement('button');
            boton.classList.add('btn-pestaña');
            
            
            if (categoria === 'Todos') {
                boton.classList.add('activo');
            }
            
            boton.textContent = categoria;

            boton.addEventListener('click', (e) => {
                // CORRECCIÓN 2: Se usa querySelectorAll
                document.querySelectorAll('.btn-pestaña').forEach(btn => btn.classList.remove('activo'));
                e.target.classList.add('activo');
                filtrarAutos(categoria);
            });
            
            contenedorCategorias.appendChild(boton);
        });
    }

    function renderizarAutos(arregloAutos) {
        contenedorAutos.innerHTML = '';
        
        if (arregloAutos.length === 0) {
          
            contenedorAutos.innerHTML = `
             <div style="grid-column:1 / -1; text-align:center; padding:40px 20px;">
                 <i class="fa-solid fa-car-side" style="font-size:3rem; color: var(--borde-oscuro);margin-bottom:15px;"></i>
                 <h3 style="color:var(--texto-blanco); font-size:1.2rem; margin-bottom: 10px;">No hay vehículos disponibles</h3>
                 <p style="color:var(--texto-gris);">Lo sentimos, no encontramos autos para esta categoría en este momento.</p>
             </div>               
            `;
            return;
        }
        
        arregloAutos.forEach(auto => {
            const tarjetaHTML = `
                <div class="tarjeta-auto">
                    <div class="tarjeta-top">
                        <span class="etiqueta ${auto.claseEtiqueta}">${auto.etiqueta}</span>
                        <button class="btn-favorito" aria-label="Añadir a favoritos"><i class="fa-regular fa-heart"></i></button>
                    </div>
                    <img src="${auto.imagen}" alt="${auto.nombre}" class="imagen-auto">
                    
                    <div class="info-auto">
                        <h3>${auto.nombre}</h3>
                        <p class="tipo-auto">${auto.tipo}</p>
                        
                        <div class="precio-y-rating">
                            <div class="precio">S/ ${auto.precio}<span>/día</span></div>
                            <div class="rating"><i class="fa-solid fa-star"></i> <span>${auto.rating}</span></div>
                        </div>
                        
                        <div class="caracteristicas">
                            <div class="caracteristica-item"><i class="fa-solid fa-user"></i> ${auto.pasajeros} Pasajeros</div>
                            <div class="caracteristica-item"><i class="fa-solid ${auto.iconoExtra}"></i> ${auto.caracteristicaExtra}</div>
                        </div>
                        
                        <button class="btn-detalles">Ver Información Técnica</button>
                         <button class="btn-detalles">Reservar</button>
                    </div>
                    </div>
                </div>
            `;
            
            contenedorAutos.insertAdjacentHTML('beforeend', tarjetaHTML);
        });
    }

    function filtrarAutos(categoriaSeleccionada) {
      
        contenedorAutos.style.opacity = '0.5';
        
        setTimeout(() => {
            if (categoriaSeleccionada === "Todos") {
                renderizarAutos(autosDB);
            } else {
                const autosFiltrados = autosDB.filter(auto => auto.categoria === categoriaSeleccionada);
                renderizarAutos(autosFiltrados);
            }
            
            contenedorAutos.style.opacity = '1';
        }, 150);
    }

    renderizarCategorias();
    renderizarAutos(autosDB.slice(0, 24));
});