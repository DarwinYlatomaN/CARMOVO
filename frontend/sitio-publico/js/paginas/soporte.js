document.addEventListener('DOMContentLoaded', () => {

    /* 
     LÓGICA DEL ACORDEÓN (PREGUNTAS FRECUENTES)
      */
    const botonesPregunta = document.querySelectorAll('.pregunta-faq');

    botonesPregunta.forEach(boton => {
        boton.addEventListener('click', () => {
            const itemActual = boton.parentElement;
            const respuesta = itemActual.querySelector('.respuesta-faq');
            
            if (itemActual.classList.contains('activo')) {
                itemActual.classList.remove('activo');
                respuesta.style.maxHeight = null;
            } else {
                document.querySelectorAll('.item-faq.activo').forEach(itemAbierto => {
                    itemAbierto.classList.remove('activo');
                    itemAbierto.querySelector('.respuesta-faq').style.maxHeight = null;
                });

                itemActual.classList.add('activo');
                respuesta.style.maxHeight = respuesta.scrollHeight + "px";
            }
        });
    });

    /*
        BASE DE DATOS Y LÓGICA: MODAL DE CATEGORÍAS DE AYUDA
       */
    const datosCategorias = {
        requisitos: {
            titulo: "Requisitos de Alquiler",
            iconoClass: "fa-regular fa-id-card",
            descripcion: "Para alquilar un vehículo con Carmovo, debes cumplir con los siguientes requisitos indispensables:",
            detalles: [
                "Edad mínima de 21 años (conductores menores de 25 años pagan tarifa joven).",
                "Licencia de conducir vigente (Brevete) con al menos 1 año de antigüedad.",
                "Documento de Identidad (DNI) o Pasaporte original y vigente.",
                "Tarjeta de crédito física a nombre del titular para el depósito de garantía (bloqueo de fondos)."
            ]
        },
        pagos: {
            titulo: "Pagos y Facturación",
            iconoClass: "fa-regular fa-credit-card",
            descripcion: "Opciones de pago flexibles y políticas de facturación claras:",
            detalles: [
                "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, Amex).",
                "El pago del alquiler se realiza por adelantado al momento de recoger el vehículo.",
                "Emitimos Boleta o Factura electrónica según tu requerimiento.",
                "Las devoluciones de depósitos de garantía pueden tardar entre 5 y 15 días hábiles, dependiendo de tu banco."
            ]
        },
        seguros: {
            titulo: "Seguros y Coberturas",
            iconoClass: "fa-solid fa-shield-halved",
            descripcion: "Protege tu viaje con nuestras opciones de cobertura:",
            detalles: [
                "Seguro Básico (CDW): Incluido en todas las tarifas. Cubre daños por colisión con un deducible aplicable.",
                "Protección Premium: Reduce el deducible a cero y cubre llantas y parabrisas.",
                "Protección contra Robo (TP): Cubre el valor del vehículo en caso de robo total.",
                "El seguro se invalida si se conduce bajo efectos del alcohol, drogas o en vías no pavimentadas."
            ]
        },
        viaje: {
            titulo: "Durante el Viaje",
            iconoClass: "fa-solid fa-route",
            descripcion: "Reglas y recomendaciones mientras tienes el vehículo en tu poder:",
            detalles: [
                "Límites de kilometraje: Verifica si tu tarifa incluye kilometraje libre o limitado.",
                "Las multas de tránsito generadas durante el periodo de alquiler son responsabilidad exclusiva del conductor.",
                "No está permitido sacar el vehículo fuera del territorio nacional sin autorización previa.",
                "En caso de fallas mecánicas, no intentes reparar el auto; comunícate con nuestra línea de asistencia."
            ]
        },
        cancelaciones: {
            titulo: "Cancelaciones y Modificaciones",
            iconoClass: "fa-solid fa-calendar-xmark",
            descripcion: "Nuestra política de flexibilidad para cambios de planes:",
            detalles: [
                "Cancelación gratuita hasta 48 horas antes del recojo programado.",
                "Cancelaciones con menos de 48 horas de anticipación incurren en una penalidad de 1 día de alquiler.",
                "Las modificaciones de fecha y vehículo están sujetas a disponibilidad y posibles cambios de tarifa.",
                "Si no te presentas (No Show), se cobrará el valor total de la reserva."
            ]
        },
        combustible: {
            titulo: "Políticas de Combustible",
            iconoClass: "fa-solid fa-gas-pump",
            descripcion: "Evita cargos extra entregando el vehículo con el nivel correcto:",
            detalles: [
                "Política Lleno a Lleno: Entregamos el auto con tanque lleno y debes devolverlo igual.",
                "Si devuelves el vehículo con menos combustible, se cobrará el faltante más una tasa de servicio de repostaje.",
                "Opción de Prepago: Puedes pagar el tanque por adelantado a un precio descontado y devolverlo vacío.",
                "Asegúrate de cargar el tipo de combustible correcto (Gasolina o Diésel) indicado en el tapón."
            ]
        }
    };

    const tarjetasCategoria = document.querySelectorAll('.tarjeta-ayuda');
    const modalCat = document.getElementById('modal-categoria');
    const btnCerrarCat = document.getElementById('btnCerrarCategoria');
    const modalCatIcono = document.getElementById('modal-cat-icono');
    const modalCatTitulo = document.getElementById('modal-cat-titulo');
    const modalCatDesc = document.getElementById('modal-cat-descripcion');
    const modalCatDetalles = document.getElementById('modal-cat-detalles');

    tarjetasCategoria.forEach(tarjeta => {
        tarjeta.addEventListener('click', () => {
            const claveCat = tarjeta.getAttribute('data-categoria');
            const info = datosCategorias[claveCat];

            if (info && modalCat) {
                modalCatIcono.innerHTML = `<i class="${info.iconoClass}"></i>`;
                modalCatTitulo.textContent = info.titulo;
                modalCatDesc.textContent = info.descripcion;
                
                modalCatDetalles.innerHTML = '';
                info.detalles.forEach(detalle => {
                    const li = document.createElement('li');
                    li.textContent = detalle;
                    modalCatDetalles.appendChild(li);
                });

                modalCat.classList.remove('oculto');
                modalCat.classList.add('activo');
            }
        });
    });

    /* 
       BASE DE DATOS Y LÓGICA: MODAL DE GUÍAS RÁPIDAS
      */
    const datosGuias = {
        choque: {
            titulo: "¿Qué hacer en caso de choque?",
            iconoClass: "fa-solid fa-car-burst",
            descripcion: "Sigue estos pasos fundamentales de seguridad y protocolo legal inmediatamente después del choque:",
            pasos: [
                "Mantén la calma y enciende inmediatamente las luces de emergencia (intermitentes).",
                "Verifica la seguridad de todos los ocupantes y comunícate al 106 si hay heridos.",
                "Toma fotografías y videos detallados de la escena, posición de los vehículos, placas y daños.",
                "Llama a nuestra línea de Asistencia SOS Carmovo (+51 999 888 777) para enviar al procurador.",
                "Solicita el nombre, DNI, teléfono y compañía aseguradora del otro conductor.",
                "Espera a la Policía Nacional para sentar la denuncia y realizar el dosaje etílico obligatorio."
            ]
        },
        llanta: {
            titulo: "¿Cómo cambiar una llanta?",
            iconoClass: "fa-solid fa-wrench",
            descripcion: "Guía paso a paso para reemplazar la rueda de repuesto de forma segura en la carretera:",
            pasos: [
                "Estaciona el vehículo en una superficie plana y firme, apaga el motor y pon el freno de mano.",
                "Coloca el triángulo de seguridad a 30 metros detrás del auto.",
                "Saca la rueda de repuesto, la gata hidráulica y la llave de ruedas.",
                "Afloja ligeramente las tuercas de la llanta pinchada antes de elevar el auto.",
                "Coloca la gata en el punto de apoyo reforzado y eleva el auto.",
                "Cambia la llanta, coloca las tuercas a mano, baja el vehículo y aprieta fuertemente en forma de cruz."
            ]
        },
        llave: {
            titulo: "¿Perdiste la llave del auto?",
            iconoClass: "fa-solid fa-key",
            descripcion: "Procedimiento de seguridad para solicitar un duplicado oficial y asistencia de inmediato:",
            pasos: [
                "Verifica minuciosamente tu equipaje y los últimos lugares visitados.",
                "Asegúrate de que el vehículo haya quedado con los seguros activados y estacionado en zona segura.",
                "Llama de inmediato a nuestro equipo de soporte e indica tu ubicación exacta y número de DNI.",
                "Un técnico especializado se desplazará hasta tu ubicación con el duplicado codificado.",
                "Deberás presentar tu DNI original y el contrato de alquiler para validar tu identidad."
            ]
        }
    };

    const tarjetasGuia = document.querySelectorAll('.tarjeta-guia');
    const modalGuia = document.getElementById('modal-guia');
    const btnCerrarGuia = document.getElementById('btnCerrarGuia');
    const modalGuiaIcono = document.getElementById('modal-guia-icono');
    const modalGuiaTitulo = document.getElementById('modal-guia-titulo');
    const modalGuiaDesc = document.getElementById('modal-guia-descripcion');
    const modalGuiaPasos = document.getElementById('modal-guia-pasos');

    tarjetasGuia.forEach(tarjeta => {
        tarjeta.addEventListener('click', () => {
            const claveGuia = tarjeta.getAttribute('data-guia');
            const guia = datosGuias[claveGuia];

            if (guia && modalGuia) {
                modalGuiaIcono.innerHTML = `<i class="${guia.iconoClass}"></i>`;
                modalGuiaTitulo.textContent = guia.titulo;
                modalGuiaDesc.textContent = guia.descripcion;
                
                modalGuiaPasos.innerHTML = '';
                guia.pasos.forEach(paso => {
                    const li = document.createElement('li');
                    li.textContent = paso;
                    modalGuiaPasos.appendChild(li);
                });

                modalGuia.classList.remove('oculto');
                modalGuia.classList.add('activo');
            }
        });
    });

    /* 
        FUNCIONES GLOBALES DE CIERRE DE MODALES
      */
    const cerrarModales = () => {
        if (modalCat) {
            modalCat.classList.remove('activo');
            setTimeout(() => modalCat.classList.add('oculto'), 300);
        }
        if (modalGuia) {
            modalGuia.classList.remove('activo');
            setTimeout(() => modalGuia.classList.add('oculto'), 300);
        }
    };

    if (btnCerrarGuia) btnCerrarGuia.addEventListener('click', cerrarModales);
    if (btnCerrarCat) btnCerrarCat.addEventListener('click', cerrarModales);

    window.addEventListener('click', (e) => {
        if (e.target === modalGuia || e.target === modalCat) {
            cerrarModales();
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModales();
        }
    });
    /* 
       5. LÓGICA DEL MODAL DE RECLAMOS
     */
    const modalReclamo = document.getElementById('modal-reclamo');
    const btnAbrirReclamo = document.getElementById('btnAbrirReclamo');
    const btnCerrarReclamo = document.getElementById('btnCerrarReclamo');
    const formReclamo = document.getElementById('form-reclamo');

    // Abrir modal
    if (btnAbrirReclamo && modalReclamo) {
        btnAbrirReclamo.addEventListener('click', (e) => {
            e.preventDefault();
            modalReclamo.classList.remove('oculto');
            modalReclamo.classList.add('activo');
        });
    }

    // Cerrar modal
    const cerrarModalReclamo = () => {
        if (!modalReclamo) return;
        modalReclamo.classList.remove('activo');
        setTimeout(() => modalReclamo.classList.add('oculto'), 300);
    };

    if (btnCerrarReclamo) {
        btnCerrarReclamo.addEventListener('click', cerrarModalReclamo);
    }

    // Simular envío del formulario
    if (formReclamo) {
        formReclamo.addEventListener('submit', (e) => {
            e.preventDefault(); // Evita que la página recargue
            alert("Tu solicitud ha sido registrada correctamente. Nuestro equipo de soporte te contactará en las próximas 48 horas.");
            cerrarModalReclamo();
            formReclamo.reset(); 
        });
    }

    // Asegurar que se cierre si el usuario hace clic afuera 
    window.addEventListener('click', (e) => {
        if (e.target === modalReclamo) cerrarModalReclamo();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalReclamo && modalReclamo.classList.contains('activo')) {
            cerrarModalReclamo();
        }
    });
});