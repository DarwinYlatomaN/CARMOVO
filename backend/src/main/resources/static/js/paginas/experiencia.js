
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. ELEMENTOS DEL MODAL DE HISTORIAS
    // =========================================================

    const historiasItems = document.querySelectorAll('.historia-item');
    const modalStory = document.getElementById('modal-historias');
    const btnCerrarStory = document.getElementById('btnCerrarStory');

    const storyTitle = document.getElementById('story-title');
    const storyImg = document.getElementById('story-img');
    const storyList = document.getElementById('story-list');

    // =========================================================
    // 2. DATOS DE HISTORIAS
    // =========================================================

    const datosHistorias = {
        tips: {
            titulo: "Tips de Ruta ",
            imagen: "/recursos/imagenes/experiencias/historia1.jpg",
            items: [
                "Verifica siempre la presión de los 4 neumáticos y la llanta de repuesto antes de salir.",
                "Mantén una distancia de seguridad del doble de lo habitual en carreteras de un solo carril.",
                "Realiza pausas activas cada 2 horas o 200 km para estirar las piernas y evitar fatiga.",
                "Descarga los mapas de tu ruta en Google Maps para usarlos sin conexión a internet.",
                "Evita manejar de madrugada; el cansancio y la neblina reducen drásticamente la visibilidad.",
                "Respeta estrictamente los límites de velocidad, especialmente al cruzar centros poblados.",
                "Ten a la mano el número de asistencia en ruta de Carmovo y de la policía de carreteras."
            ]
        },
        selva: {
            titulo: "Ruta Selva",
            imagen: "/recursos/imagenes/experiencias/historia2.jpg",
            items: [
                "Usa la tracción 4L (Low) únicamente en terrenos con lodo denso o pendientes muy extremas.",
                "Nunca cruces un río o charco sin evaluar primero su profundidad y la fuerza de la corriente.",
                "Mantén un ritmo constante (sin acelerones bruscos) al subir pendientes de tierra suelta.",
                "Lleva siempre un kit de rescate básico: eslinga, pala pequeña y guantes de trabajo.",
                "Evita frenadas bruscas en barro; usa el freno de motor bajando las marchas suavemente.",
                "Conduce con las ventanas arriba si atraviesas zonas de vegetación densa para evitar ramas.",
                "Lava el chasis a presión al terminar tu ruta para evitar que el lodo seco dañe los componentes."
            ]
        },
        playas: {
            titulo: "Ruta Costa",
            imagen: "/recursos/imagenes/experiencias/historia3.avif",
            items: [
                "Protege la tapicería del auto sacudiendo bien la arena antes de subir y usando toallas.",
                "Estaciona bajo sombra siempre que sea posible o utiliza un parasol para proteger el tablero.",
                "Revisa frecuentemente el líquido refrigerante; el calor del norte exige más al motor.",
                "Jamás manejes por la orilla del mar; la arena mojada es engañosa y la sal corroe el chasis.",
                "Usa siempre gafas de sol polarizadas para reducir el fuerte reflejo de la pista al mediodía.",
                "Lleva una hielera con abundante agua extra en la cabina para mantenerte hidratado.",
                "Ten cuidado con el cruce repentino de animales en tramos desérticos de la Panamericana."
            ]
        },
        equipaje: {
            titulo: "¿Qué llevar? ",
            imagen: "/recursos/imagenes/experiencias/historia5.png",
            items: [
                "Documentos esenciales: DNI, Brevete físico y SOAT (asegúrate de que estén vigentes).",
                "Un botiquín de primeros auxilios básico con pastillas para mareos, vendas y alcohol.",
                "Herramientas indispensables: gata, llave de tuercas, cables pasa corriente y medidor de presión.",
                "Una linterna de cabeza o de mano con pilas extra para emergencias nocturnas.",
                "Cargador de celular para auto (adaptador de 12V/USB) y un cable en buen estado.",
                "Raciones de viaje: agua embotellada y snacks no perecibles (frutos secos, galletas).",
                "Bolsas biodegradables para recolectar toda tu basura durante el recorrido de la ruta."
            ]
        },
        sierra: {
            titulo: "Ruta Andina ",
            imagen: "/recursos/imagenes/experiencias/historia4.jpg",
            items: [
                "Usa siempre el freno de motor (marchas bajas) en descensos prolongados para no recalentar los frenos.",
                "Toca el claxon antes de entrar a curvas ciegas o muy cerradas para alertar a otros conductores.",
                "Mantén tus luces encendidas todo el día; el clima en la sierra cambia rápidamente a lluvia o neblina.",
                "Ten mucho cuidado y reduce la velocidad ante el cruce repentino de ganado en la carretera.",
                "Revisa el líquido refrigerante (anticongelante) y la batería antes de salir, el frío extremo los afecta.",
                "Lleva pastillas para el soroche, bebe mucha agua y evita comidas pesadas para combatir la altura.",
                "Asegúrate de tanquear combustible en ciudades principales; los grifos pueden estar muy distanciados."
            ]
        }
    };

    // =========================================================
    // 3. ABRIR HISTORIAS
    // =========================================================

    historiasItems.forEach(item => {
        item.addEventListener('click', () => {
            const storyKey = item.getAttribute('data-story');
            const data = datosHistorias[storyKey];

            if (!data || !modalStory || !storyTitle || !storyImg || !storyList) {
                return;
            }

            storyTitle.textContent = data.titulo;
            storyImg.src = data.imagen;

            storyList.innerHTML = '';

            data.items.forEach(tip => {
                const li = document.createElement('li');
                li.textContent = tip;
                storyList.appendChild(li);
            });

            modalStory.classList.remove('oculto');
            modalStory.classList.add('activo');
        });
    });

    // =========================================================
    // 4. CERRAR HISTORIAS
    // =========================================================

    const cerrarModalStory = () => {
        if (!modalStory) return;

        modalStory.classList.remove('activo');

        setTimeout(() => {
            if (!modalStory.classList.contains('activo')) {
                modalStory.classList.add('oculto');
            }
        }, 300);
    };

    if (btnCerrarStory) {
        btnCerrarStory.addEventListener('click', cerrarModalStory);
    }

    window.addEventListener('click', (e) => {
        if (e.target === modalStory) {
            cerrarModalStory();
        }
    });

    // =========================================================
    // 5. SELECTOR DINAMICO DE VIBRAS
    // =========================================================

    const botonesMood = Array.from(
        document.querySelectorAll('.botones-mood .btn-mood')
    );

    const resultadoMood = document.getElementById('resultadoMood');
    const moodTitulo = document.getElementById('mood-titulo');
    const moodDescripcion = document.getElementById('mood-desc');
    const moodImagen = document.getElementById('mood-img');

    const destinoElemento = resultadoMood?.querySelector(
        '.mood-tags span:first-child'
    );

    const autoElemento = resultadoMood?.querySelector(
        '.mood-tags span:nth-child(2)'
    );

    const botonAlquilar = resultadoMood?.querySelector(
        '.boton-accion-naranja'
    );

    // La posición de cada configuración corresponde al
    // orden de los cuatro botones del HTML.

    const configuracionesMood = [
        {
            titulo: 'Escapada de Fin de Semana',
            descripcion:
                'Desconéctate del estrés. Disfruta de un viaje corto, cómodo y económico para descubrir nuevos destinos.',
            destino: 'Máncora',
            categorias: ['Económicos']
        },
        {
            titulo: 'Aventura Extrema 4x4',
            descripcion:
                'Descubre rutas de montaña y destinos de aventura con un vehículo preparado para los caminos adecuados a sus capacidades.',
            destino: 'Rutas de montaña',
            categorias: ['Pick-ups 4x4', 'Todoterreno']
        },
        {
            titulo: 'Viaje Familiar',
            descripcion:
                'Comparte momentos especiales con tu familia. Elige un vehículo espacioso y cómodo para disfrutar del recorrido.',
            destino: 'Playas del Norte',
            categorias: ['Minivans']
        },
        {
            titulo: 'Ruta Romántica',
            descripcion:
                'Disfruta de una escapada especial con comodidad, tranquilidad y un vehículo ideal para recorrer la costa.',
            destino: 'Punta Sal',
            categorias: ['Sedanes', 'Sedán']
        }
    ];

    let vehiculosMood = [];
    let vehiculoSeleccionado = null;
    let indiceMoodActual = 0;
    let catalogoCargado = false;

    const normalizarCategoriaMood = (valor) => {
        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    };

    // =========================================================
    // 6. OBTENER IMAGEN DEL VEHICULO
    // =========================================================

    const obtenerImagenMood = (vehiculo) => {
        // Reutilizar la función existente del catálogo.
        if (typeof resolverImagenVehiculo === 'function') {
            return resolverImagenVehiculo(vehiculo);
        }

        const imagen = String(vehiculo.imagen || '').trim();

        if (/^(https?:|data:|blob:)/i.test(imagen)) {
            return imagen;
        }

        if (imagen.startsWith('/')) {
            return imagen;
        }

        if (imagen.startsWith('../')) {
            return imagen;
        }

        if (imagen.startsWith('recursos/')) {
            return '/' + imagen;
        }

        return '/recursos/imagenes/carrusel/camioneta2.jpg';
    };

    // =========================================================
    // 7. ESTADO DEL BOTON DE ALQUILER
    // =========================================================

    const actualizarBotonAlquiler = (habilitado, mensaje) => {
        if (!botonAlquilar) return;

        botonAlquilar.textContent = mensaje;
        botonAlquilar.setAttribute(
            'aria-disabled',
            String(!habilitado)
        );

        botonAlquilar.style.pointerEvents = habilitado
            ? 'auto'
            : 'none';

        botonAlquilar.style.opacity = habilitado
            ? '1'
            : '0.6';

        botonAlquilar.style.cursor = habilitado
            ? 'pointer'
            : 'not-allowed';
    };

    // =========================================================
    // 8. ACTUALIZAR LA TARJETA DE RECOMENDACION
    // =========================================================

    const mostrarMood = (indice) => {
        const configuracion = configuracionesMood[indice];

        if (!configuracion) return;

        indiceMoodActual = indice;
        vehiculoSeleccionado = null;

        botonesMood.forEach((boton, posicion) => {
            const activo = posicion === indice;

            boton.classList.toggle('activo', activo);

            if (activo) {
                boton.setAttribute('aria-current', 'true');
            } else {
                boton.removeAttribute('aria-current');
            }
        });

        if (moodTitulo) {
            moodTitulo.textContent = configuracion.titulo;
        }

        if (moodDescripcion) {
            moodDescripcion.textContent = configuracion.descripcion;
        }

        if (destinoElemento) {
            destinoElemento.innerHTML =
                '<i class="fa-solid fa-location-dot"></i> ' +
                'Destino sugerido: ' + configuracion.destino;
        }

        // Esperar la respuesta de la API antes de recomendar.
        if (!catalogoCargado) {
            if (autoElemento) {
                autoElemento.innerHTML =
                    '<i class="fa-solid fa-car"></i> ' +
                    'Consultando vehículos...';
            }

            if (moodImagen) {
                moodImagen.removeAttribute('src');
                moodImagen.alt = 'Cargando recomendación';
                moodImagen.style.visibility = 'hidden';
            }

            actualizarBotonAlquiler(false, 'Cargando vehículos...');
            return;
        }

        // Buscar únicamente vehículos disponibles de las
        // categorías correspondientes a esta vibra.

        const candidatos = vehiculosMood.filter(vehiculo => {
            const categoriaVehiculo = normalizarCategoriaMood(
                vehiculo.categoria
            );

            const coincideCategoria = configuracion.categorias.some(
                categoria =>
                    normalizarCategoriaMood(categoria) ===
                    categoriaVehiculo
            );

            const estaDisponible =
                normalizarCategoriaMood(vehiculo.estado) ===
                'disponible';

            return coincideCategoria && estaDisponible;
        });

        // No inventar vehículos cuando no existen resultados.
        if (candidatos.length === 0) {
            if (autoElemento) {
                autoElemento.innerHTML =
                    '<i class="fa-solid fa-car"></i> ' +
                    'No hay vehículos disponibles para esta vibra';
            }

            if (moodImagen) {
                moodImagen.removeAttribute('src');
                moodImagen.alt = 'Sin vehículos disponibles';
                moodImagen.style.visibility = 'hidden';
            }

            actualizarBotonAlquiler(
                false,
                'Sin vehículos disponibles'
            );

            return;
        }

        // Elegir el primer vehículo disponible de la categoría.
        const vehiculo = candidatos[0];

        vehiculoSeleccionado = vehiculo;

        const nombreVehiculo = [
            vehiculo.marca,
            vehiculo.modelo
        ].filter(Boolean).join(' ');

        if (autoElemento) {
            autoElemento.innerHTML =
                '<i class="fa-solid fa-car"></i> ' +
                'Auto ideal: ';

            const nombre = document.createElement('strong');
            nombre.textContent = nombreVehiculo || 'Vehículo';
            autoElemento.appendChild(nombre);
        }

        if (moodImagen) {
            moodImagen.style.visibility = 'visible';
            moodImagen.alt = nombreVehiculo || 'Vehículo recomendado';
            moodImagen.src = obtenerImagenMood(vehiculo);
        }

        actualizarBotonAlquiler(true, 'Alquilar este modelo');
    };

    // =========================================================
    // 9. EVENTOS DE LOS CUATRO BOTONES
    // =========================================================

    botonesMood.forEach((boton, indice) => {
        boton.addEventListener('click', (evento) => {
            // Impide que el enlace del HTML nos saque de
            // Experiencias y nos envíe a Categorías.
            evento.preventDefault();

            mostrarMood(indice);
        });
    });

    // =========================================================
    // 10. ALQUILAR EL VEHICULO RECOMENDADO
    // =========================================================

    if (botonAlquilar) {
        botonAlquilar.addEventListener('click', (evento) => {
            evento.preventDefault();

            if (!vehiculoSeleccionado) {
                return;
            }

            // Utilizar la misma función del catálogo para
            // guardar el vehículo real y abrir Reservas.
            if (typeof window.prepararReservaVehiculo === 'function') {
                window.prepararReservaVehiculo(vehiculoSeleccionado);
            } else {
                console.error(
                    'No está disponible la función de preparación de reservas.'
                );

                alert(
                    'No se pudo preparar la reserva. ' +
                    'Actualiza la página e inténtalo nuevamente.'
                );
            }
        });
    }

    // =========================================================
    // 11. CONSULTAR VEHICULOS REALES DE MYSQL
    // =========================================================

    const cargarVehiculosMood = async () => {
        if (!botonesMood.length || !resultadoMood) {
            return;
        }

        mostrarMood(indiceMoodActual);

        try {
            const respuesta = await fetch('/api/v1/vehiculos');

            if (!respuesta.ok) {
                throw new Error(
                    'Error HTTP al consultar vehículos: ' +
                    respuesta.status
                );
            }

            const datos = await respuesta.json();

            if (!Array.isArray(datos)) {
                throw new Error(
                    'La API no devolvió una lista de vehículos.'
                );
            }

            vehiculosMood = datos;
            catalogoCargado = true;

            // Mostrar la vibra que el usuario tenga seleccionada,
            // incluso si cambió de botón durante la carga.
            mostrarMood(indiceMoodActual);

        } catch (error) {
            console.error(
                'No se pudieron cargar las recomendaciones:',
                error
            );

            vehiculosMood = [];
            catalogoCargado = true;

            mostrarMood(indiceMoodActual);

            if (autoElemento) {
                autoElemento.innerHTML =
                    '<i class="fa-solid fa-circle-exclamation"></i> ' +
                    'No se pudo consultar el catálogo de vehículos';
            }

            actualizarBotonAlquiler(
                false,
                'Catálogo no disponible'
            );
        }
    };

    // =========================================================
    // 12. IMAGEN DE RESPALDO
    // =========================================================

    if (moodImagen) {
        moodImagen.addEventListener('error', () => {
            const imagenRespaldo =
                '/recursos/imagenes/carrusel/camioneta2.jpg';

            if (!moodImagen.src.endsWith(imagenRespaldo)) {
                moodImagen.src = imagenRespaldo;
            } else {
                moodImagen.style.visibility = 'hidden';
            }
        });
    }

    // =========================================================
    // 13. INICIALIZACION
    // =========================================================

    cargarVehiculosMood();

});
