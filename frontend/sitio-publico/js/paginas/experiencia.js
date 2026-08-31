document.addEventListener('DOMContentLoaded', () => {
    // 1. Elementos del DOM
    const historiasItems = document.querySelectorAll('.historia-item');
    const modalStory = document.getElementById('modal-historias');
    const btnCerrarStory = document.getElementById('btnCerrarStory');
    
    const storyTitle = document.getElementById('story-title');
    const storyImg = document.getElementById('story-img');
    const storyList = document.getElementById('story-list');

    //  Base de datos de Historias (Incluyendo "Sierra")
    const datosHistorias = {
        tips: {
            titulo: "Tips de Ruta ",
            imagen: "../recursos/imagenes/experiencias/historia1.jpg",
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
            imagen: "../recursos/imagenes/experiencias/historia2.jpg",
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
            imagen: "../recursos/imagenes/experiencias/historia3.avif",
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
            imagen: "../recursos/imagenes/experiencias/historia5.png",
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
            imagen: "../recursos/imagenes/experiencias/historia4.jpg",
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

    //  Función para abrir el modal y cargar contenido
    historiasItems.forEach(item => {
        item.addEventListener('click', () => {
            const storyKey = item.getAttribute('data-story');
            const data = datosHistorias[storyKey];

            if (data && modalStory) {
                // Llenar datos
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
            }
        });
    });

    //  Lógica para cerrar el modal
    const cerrarModalStory = () => {
        if (!modalStory) return;
        modalStory.classList.remove('activo');
        // Pequeño retraso para que se vea la transición antes de ocultarlo del DOM
        setTimeout(() => modalStory.classList.add('oculto'), 300);
    };

  
    if (btnCerrarStory) {
        btnCerrarStory.addEventListener('click', cerrarModalStory);
    }
    
  
    window.addEventListener('click', (e) => {
        if (e.target === modalStory) {
            cerrarModalStory();
        }
    });
});