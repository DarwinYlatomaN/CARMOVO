document.addEventListener('DOMContentLoaded', () => {

    const pantallaBloqueo = document.getElementById('pantalla-bloqueo-sesion');
    const btnCerrarBloqueo = document.getElementById('btn-cerrar-bloqueo');

    if (btnCerrarBloqueo) {
        btnCerrarBloqueo.addEventListener('click', () => {
            pantallaBloqueo.classList.add('oculto');
        });
    }

    const selectorAuto = document.getElementById('selector-auto');
    const inputDias = document.getElementById('dias-alquiler');
    const selectRecogida = document.getElementById('lugar-recogida');
    const selectEntrega = document.getElementById('lugar-entrega');

    const resumenImagen = document.getElementById('resumen-imagen');
    const resumenNombre = document.getElementById('resumen-nombre');
    const resumenTipo = document.getElementById('resumen-tipo');

    const resumenTarifaBase = document.getElementById('resumen-tarifa-base');
    const resumenImpuestos = document.getElementById('resumen-impuestos');
    const resumenTotal = document.getElementById('resumen-total');
    const etiquetaDias = document.getElementById('etiqueta-dias');

    const resumenTextoRecogida = document.getElementById('resumen-texto-recogida');
    const resumenTextoEntrega = document.getElementById('resumen-texto-entrega');

    if (selectRecogida && resumenTextoRecogida) {
        selectRecogida.addEventListener('change', (e) => {
            const texto = e.target.options[e.target.selectedIndex].text;
            resumenTextoRecogida.textContent = texto;
        });
    }

    if (selectEntrega && resumenTextoEntrega) {
        selectEntrega.addEventListener('change', (e) => {
            const texto = e.target.options[e.target.selectedIndex].text;
            resumenTextoEntrega.textContent = texto;
        });
    }

    if (typeof autosDB !== 'undefined' && selectorAuto) {
        autosDB.forEach(auto => {
            const option = document.createElement('option');
            option.value = auto.nombre;
            option.textContent = `${auto.nombre} (S/ ${auto.precio}/día)`;
            option.dataset.id = auto.id;
            option.dataset.precio = auto.precio;
            option.dataset.tipo = auto.tipo;
            option.dataset.imagen = auto.imagen;
            selectorAuto.appendChild(option);
        });
    }

    let autoActual = null;
    const autoGuardado = localStorage.getItem('autoReserva');

    if (autoGuardado) {
        try {
            autoActual = JSON.parse(autoGuardado);
        } catch (error) {
            autoActual = null;
        }
    }

    if (selectorAuto && autoActual && autoActual.nombre) {
        const opcion = Array.from(selectorAuto.options).find(
            option => option.value === autoActual.nombre
        );

        if (opcion) {
            selectorAuto.value = autoActual.nombre;
        }
    }

    function actualizarResumen() {
        const dias = Math.max(1, parseInt(inputDias?.value) || 1);

        if (selectorAuto && selectorAuto.value !== '') {
            const opcion = selectorAuto.options[selectorAuto.selectedIndex];

            if (opcion) {
                autoActual = {
                    id: Number(opcion.dataset.id),
                    nombre: opcion.value,
                    tipo: opcion.dataset.tipo,
                    imagen: opcion.dataset.imagen,
                    precio: Number(opcion.dataset.precio)
                };
            }
        }

        if (!autoActual) return;

        if (resumenNombre) resumenNombre.textContent = autoActual.nombre;
        if (resumenTipo) resumenTipo.textContent = autoActual.tipo;
        
        if (resumenImagen && autoActual.imagen) {
            resumenImagen.src = autoActual.imagen;
            resumenImagen.alt = autoActual.nombre;
        }

        if (etiquetaDias) {
            etiquetaDias.textContent = `Tarifa base (${dias} ${dias === 1 ? 'día' : 'días'})`;
        }

        const tarifaBase = autoActual.precio * dias;
        const costoSeguro = 120.00;
        const impuestos = tarifaBase * 0.18;
        const total = tarifaBase + costoSeguro + impuestos;

        if (resumenTarifaBase) resumenTarifaBase.textContent = `S/ ${tarifaBase.toFixed(2)}`;
        if (resumenImpuestos) resumenImpuestos.textContent = `S/ ${impuestos.toFixed(2)}`;
        if (resumenTotal) resumenTotal.textContent = `S/ ${total.toFixed(2)}`;

        const montosModales = document.querySelectorAll('.monto-dinamico-modal');
        montosModales.forEach(span => span.textContent = `S/ ${total.toFixed(2)}`);
    }

    if (selectorAuto) selectorAuto.addEventListener('change', actualizarResumen);
    if (inputDias) inputDias.addEventListener('input', actualizarResumen);

    actualizarResumen();

    const radiosPago = document.querySelectorAll('input[name="pago"]');
    const modales = document.querySelectorAll('.modal-pago');
    const botonesCerrar = document.querySelectorAll('.btn-cerrar-modal');
    const formularioReserva = document.getElementById('formFinalizarReserva');
    const alertaErrores = document.getElementById('alertaErroresFormulario');

    function validarFormulario() {
        const inputsRequeridos = formularioReserva.querySelectorAll('input[required], select[required]');
        let formularioValido = true;

        inputsRequeridos.forEach(input => {
            if (input.type !== 'radio' && input.name !== 'pago') {
                if (input.value.trim() === '') {
                    input.classList.add('input-error');
                    formularioValido = false;
                } else {
                    input.classList.remove('input-error');
                }
            }
        });

        if (!formularioValido) {
            if(alertaErrores) alertaErrores.classList.remove('oculto');
            setTimeout(() => {
                if(alertaErrores) alertaErrores.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } else {
            if(alertaErrores) alertaErrores.classList.add('oculto');
        }

        return formularioValido;
    }

    /* 
       GESTIÓN ROBUSTA DE ESTILOS PARA CAMPOS LLENOS 
       */
    if (formularioReserva) {
        const procesarEstiloCampo = (campo) => {
            if (campo && campo.type !== 'radio' && campo.name !== 'pago') {
                if (campo.value && campo.value.trim() !== '') {
                    campo.classList.add('campo-lleno');
                    campo.classList.remove('input-error');
                } else {
                    campo.classList.remove('campo-lleno');
                }
            }
        };

        const actualizarTodosLosCampos = () => {
            const inputsTodos = formularioReserva.querySelectorAll('input, select');
            inputsTodos.forEach(input => procesarEstiloCampo(input));
        };

        // Comprobar al cargar
        actualizarTodosLosCampos();

        // Escuchar múltiples eventos mediante delegación en el formulario
        ['input', 'change', 'blur', 'keyup', 'paste'].forEach(evento => {
            formularioReserva.addEventListener(evento, (e) => {
                if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) {
                    procesarEstiloCampo(e.target);
                }
            });
        });

        // Intervalo de respaldo para autocompletados silenciosos del navegador
        setInterval(actualizarTodosLosCampos, 800);
    }
    

    function cerrarTodosLosModales() {
        modales.forEach(modal => {
            modal.classList.remove('activo');
            modal.classList.add('oculto');
        });
    }

    radiosPago.forEach(radio => {
        radio.addEventListener('click', function (e) {
            e.preventDefault(); 
            
            if (!localStorage.getItem('usuarioCarmovoLogueado')) {
                if (pantallaBloqueo) pantallaBloqueo.classList.remove('oculto');
                return;
            }

            if (!validarFormulario()) {
                this.checked = false;
                return;
            }

            this.checked = true;
            cerrarTodosLosModales();

            const campoNombre = document.getElementById('nombre');
            const campoApellidos = document.getElementById('apellidos');
            const nombreCompleto = `${campoNombre ? campoNombre.value : ''} ${campoApellidos ? campoApellidos.value : ''}`.trim();

            if (nombreCompleto !== '') {
                const inputsTitular = document.querySelectorAll('.titular-auto-relleno');
                inputsTitular.forEach(input => {
                    input.value = nombreCompleto;
                });
            }

            const modalId = this.getAttribute('data-modal');
            if (modalId) {
                const modalSeleccionado = document.getElementById(modalId);
                if (modalSeleccionado) {
                    modalSeleccionado.classList.remove('oculto');
                    modalSeleccionado.classList.add('activo');
                }
            }
        });
    });

    botonesCerrar.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            cerrarTodosLosModales();
            radiosPago.forEach(radio => radio.checked = false);
        });
    });

    const btnValidar = document.getElementById('btn-validar-conductor');
    const btnProcesarPago = document.getElementById('btn-procesar-pago');
    const seccionPagos = document.getElementById('seccion-metodos-pago');

    if (btnValidar) {
        btnValidar.addEventListener('click', function () {
            
            if (!localStorage.getItem('usuarioCarmovoLogueado')) {
                if (pantallaBloqueo) pantallaBloqueo.classList.remove('oculto');
                return;
            }

            if (!validarFormulario()) {
                return; 
            }

            const boton = this;
            const icono = boton.querySelector('i');
            const texto = boton.querySelector('span');

            boton.classList.add('cargando');
            if (icono) icono.className = 'fa-solid fa-spinner fa-spin';
            if (texto) texto.textContent = 'Verificando datos...';

            setTimeout(() => {
                boton.classList.remove('cargando');
                boton.classList.add('validado');
                if (icono) icono.className = 'fa-solid fa-check-double';
                if (texto) texto.textContent = 'Datos Validados';
                
                if (btnProcesarPago) {
                    btnProcesarPago.classList.remove('oculto');
                }
            }, 1500);
        });
    }

    if (btnProcesarPago) {
        btnProcesarPago.addEventListener('click', () => {
            if (seccionPagos) {
                seccionPagos.classList.remove('oculto');
                setTimeout(() => {
                    seccionPagos.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        });
    }

    const botonesAbrirQR = document.querySelectorAll('.btn-abrir-qr');
    botonesAbrirQR.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const contenedorQR = document.getElementById(targetId);
            
            if (contenedorQR) {
                if (contenedorQR.classList.contains('oculto')) {
                    contenedorQR.classList.remove('oculto');
                    this.innerHTML = '<i class="fa-solid fa-eye-slash"></i> Ocultar QR';
                } else {
                    contenedorQR.classList.add('oculto');
                    this.innerHTML = '<i class="fa-solid fa-qrcode"></i> Mostrar QR';
                }
            }
        });
    });
    const inputsComprobante = document.querySelectorAll('.input-comprobante');
    
    inputsComprobante.forEach(input => {
        input.addEventListener('change', function() {
            const previewId = this.getAttribute('data-preview');
            const previewImg = document.getElementById(previewId);
            const labelSpan = this.nextElementSibling.querySelector('span');
            
            if (this.files && this.files[0]) {
                const archivo = this.files[0];
                
                // Reemplazar texto con el nombre del archivo
                labelSpan.textContent = archivo.name;
                
                // Generar previsualización
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    previewImg.classList.remove('oculto');
                }
                reader.readAsDataURL(archivo);
            } else {
                // Resetear si el usuario cancela la selección
                labelSpan.textContent = 'Seleccionar imagen';
                previewImg.src = '';
                previewImg.classList.add('oculto');
            }
        });
    });
});