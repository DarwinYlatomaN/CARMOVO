document.addEventListener('DOMContentLoaded', () => {
    
    const selectorAuto = document.getElementById('selector-auto');
    const inputDias = document.getElementById('dias-alquiler');
    
    const resumenImagen = document.getElementById('resumen-imagen');
    const resumenNombre = document.getElementById('resumen-nombre');
    const resumenTipo = document.getElementById('resumen-tipo');
    const resumenTarifaBase = document.getElementById('resumen-tarifa-base');
    const resumenImpuestos = document.getElementById('resumen-impuestos');
    const resumenTotal = document.getElementById('resumen-total');
    const etiquetaDias = document.getElementById('etiqueta-dias');

    const resumenRecogida = document.querySelector('.detalle-item:nth-child(1) .detalle-valor');
    const resumenEntrega = document.querySelector('.detalle-item:nth-child(2) .detalle-valor');

    function actualizarUbicacionesResumen() {
        
        const sedeRecogidaGuardada = localStorage.getItem('sedeRecogida');
        const sedeEntregaGuardada = localStorage.getItem('sedeEntrega');

        if (resumenRecogida && sedeRecogidaGuardada) {
            resumenRecogida.textContent = sedeRecogidaGuardada;
        }
        if (resumenEntrega && sedeEntregaGuardada) {
            resumenEntrega.textContent = sedeEntregaGuardada;
        }
    }

  
    actualizarUbicacionesResumen();

    

    // Llenar el  con autosDB
    if (typeof autosDB !== 'undefined') {
        autosDB.forEach(auto => {
            const option = document.createElement('option');
            option.value = auto.nombre; 
            option.textContent = `${auto.nombre} (S/ ${auto.precio}/día) `;
            option.classList.add("opcion-verde");
            option.dataset.precio = auto.precio;
            option.dataset.tipo = auto.tipo;
            option.dataset.imagen = auto.imagen;
            if (selectorAuto) selectorAuto.appendChild(option);
        });
    }

    
    let autoActual = null;
    const autoGuardado = localStorage.getItem('autoReserva');
    
    if (autoGuardado) {
        autoActual = JSON.parse(autoGuardado);
        if (selectorAuto) {
            selectorAuto.value = autoActual.nombre;
        }
    }

    
    function actualizarResumen() {
        const dias = parseInt(inputDias.value) || 1;
        
        if (selectorAuto && selectorAuto.value !== "") {
            const opcionSeleccionada = selectorAuto.options[selectorAuto.selectedIndex];
            if(opcionSeleccionada) {
                autoActual = {
                    nombre: opcionSeleccionada.value,
                    precio: parseFloat(opcionSeleccionada.dataset.precio),
                    tipo: opcionSeleccionada.dataset.tipo,
                    imagen: opcionSeleccionada.dataset.imagen
                };
            }
        }

        if (!autoActual) return;

        if(resumenNombre) resumenNombre.textContent = autoActual.nombre;
        if(resumenTipo) resumenTipo.textContent = autoActual.tipo;
        if(resumenImagen) resumenImagen.src = autoActual.imagen;
        if(etiquetaDias) etiquetaDias.textContent = `Tarifa base (${dias} días)`;

        const tarifaBase = autoActual.precio * dias;
        const costoSeguro = 120.00;
        const impuestos = tarifaBase * 0.18; 
        const total = tarifaBase + costoSeguro + impuestos;

        if(resumenTarifaBase) resumenTarifaBase.textContent = `S/ ${tarifaBase.toFixed(2)}`;
        if(resumenImpuestos) resumenImpuestos.textContent = `S/ ${impuestos.toFixed(2)}`;
        if(resumenTotal) resumenTotal.textContent = `S/ ${total.toFixed(2)}`;
    }

    if (selectorAuto) selectorAuto.addEventListener('change', actualizarResumen);
    if (inputDias) inputDias.addEventListener('input', actualizarResumen);

    actualizarResumen();

   
    
    const radiosPago = document.querySelectorAll('input[name="pago"]');
    const modales = document.querySelectorAll('.modal-pago');
    const botonesCerrar = document.querySelectorAll('.btn-cerrar-modal');
    const botonesConfirmar = document.querySelectorAll('.btn-guardar-modal, .btn-confirmar-pago');
    const modalExito = document.getElementById('modal-pago-exito');
    const btnCerrarExito = document.querySelector('.btn-cerrar-exito');

    // Función segura para cerrar modales
    function cerrarTodosLosModales() {
        modales.forEach(modal => {
            modal.classList.remove('activo');
            modal.classList.add('oculto');
        });
    }

    
    radiosPago.forEach(radio => {
        radio.addEventListener('click', function() {
            
            cerrarTodosLosModales(); 
            
            
            const campoNombre = document.getElementById('nombre');
            const campoApellidos = document.getElementById('apellidos');
            
            
            const nombre = campoNombre ? campoNombre.value : "";
            const apellidos = campoApellidos ? campoApellidos.value : "";
            const nombreCompleto = `${nombre} ${apellidos}`.trim();
            
            
            if (nombreCompleto !== "") {
                const inputsTitular = document.querySelectorAll('.titular-auto-relleno');
                inputsTitular.forEach(input => {
                    input.value = nombreCompleto;
                });
                
                const spanNombreExito = document.getElementById('nombre-exito');
                if (spanNombreExito) {
                    spanNombreExito.textContent = nombreCompleto;
                }
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
        btn.addEventListener('click', function(e) {
            e.preventDefault(); 
            cerrarTodosLosModales();
        });
    });

    
    botonesConfirmar.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            cerrarTodosLosModales(); 
            
            if (modalExito) {
                modalExito.classList.remove('oculto');
                modalExito.classList.add('activo');
            }
        });
    });

  
    if (btnCerrarExito) {
        btnCerrarExito.addEventListener('click', function(e) {
            e.preventDefault();
            cerrarTodosLosModales();
        });
    }

    
    modales.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                cerrarTodosLosModales();
            }
        });
    });
    
    const inputsArchivo = document.querySelectorAll('.input-archivo');

    inputsArchivo.forEach(input => {
        input.addEventListener('change', function(event) {
            const archivo = event.target.files[0];
            
            
            const imagenPreview = this.nextElementSibling; 

            
            if (archivo && archivo.type.startsWith('image/')) {
                const lector = new FileReader();
                
                lector.onload = function(e) {
                    if (imagenPreview && imagenPreview.classList.contains('vista-previa-imagen')) {
                        imagenPreview.src = e.target.result; 
                        imagenPreview.classList.remove('oculto'); 
                    }
                };
                
                lector.readAsDataURL(archivo);
            } else {
                // Si el usuario cancela o sube otra cosa, la volvemos a ocultar
                if (imagenPreview && imagenPreview.classList.contains('vista-previa-imagen')) {
                    imagenPreview.src = "";
                    imagenPreview.classList.add('oculto');
                }
            }
        });
    });
   
    const btnValidar = document.getElementById('btn-validar-conductor');
    
    if (btnValidar) {
        btnValidar.addEventListener('click', function() {
            const boton = this;
            const icono = boton.querySelector('i');
            const texto = boton.querySelector('span');

            
            const nombre = document.getElementById('nombre').value;
            const documento = document.getElementById('documento').value;
            
            if (nombre.trim() === "" || documento.trim() === "") {
                alert("Por favor, completa al menos tu nombre y DNI para validar.");
                return;
            }

            
            boton.classList.add('cargando');
            icono.className = 'fa-solid fa-spinner fa-spin'; 
            texto.textContent = 'Verificando datos...';

            
            setTimeout(() => {
                boton.classList.remove('cargando');
                boton.classList.add('validado');
                icono.className = 'fa-solid fa-check-double'; 
                texto.textContent = 'Datos Validados';
            }, 1500);
        });
    }
});