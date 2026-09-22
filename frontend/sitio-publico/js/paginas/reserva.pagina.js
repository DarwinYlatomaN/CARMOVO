document.addEventListener('DOMContentLoaded', () => {

    const pantallaBloqueo = document.getElementById('pantalla-bloqueo-sesion');
    const btnCerrarBloqueo = document.getElementById('btn-cerrar-bloqueo');
    const selectorAuto = document.getElementById('selector-auto');
    const inputDias = document.getElementById('dias-alquiler');
    
 
    const resumenImagen = document.getElementById('resumen-imagen');
    const resumenNombre = document.getElementById('resumen-nombre');
    const resumenTipo = document.getElementById('resumen-tipo');
    const resumenTarifaBase = document.getElementById('resumen-tarifa-base');
    const resumenImpuestos = document.getElementById('resumen-impuestos');
    const resumenTotal = document.getElementById('resumen-total');
    const etiquetaDias = document.getElementById('etiqueta-dias');


    const inputDNI = document.getElementById('documento');
    const inputNombre = document.getElementById('nombre');
    const inputApellidos = document.getElementById('apellidos');
    const inputDomicilio = document.getElementById('domicilio');
    const inputFechaNacimiento = document.getElementById('fecha-nacimiento') || document.getElementById('fecha_nacimiento');
    const inputLicencia = document.getElementById('licencia');
    const inputCategoria = document.getElementById('categoria');
    const inputVenceLicencia = document.getElementById('fecha-vence-licencia');
    const inputCorreo = document.getElementById('correo');

    let autoActual = null;
    let totalPagar = 0; 

   
    if (typeof Culqi !== 'undefined') {
        Culqi.publicKey = 'pk_test_TU_LLAVE_PUBLICA_AQUI';
    }

  
    if (btnCerrarBloqueo) {
        btnCerrarBloqueo.addEventListener('click', () => {
            pantallaBloqueo.classList.add('oculto');
        });
    }

  
    const selectRecogida = document.getElementById('lugar-recogida');
    const selectEntrega = document.getElementById('lugar-entrega');
    const resumenTextoRecogida = document.getElementById('resumen-texto-recogida');
    const resumenTextoEntrega = document.getElementById('resumen-texto-entrega');

    if (selectRecogida && resumenTextoRecogida) {
        selectRecogida.addEventListener('change', (e) => {
            resumenTextoRecogida.textContent = e.target.options[e.target.selectedIndex].text;
        });
    }
    if (selectEntrega && resumenTextoEntrega) {
        selectEntrega.addEventListener('change', (e) => {
            resumenTextoEntrega.textContent = e.target.options[e.target.selectedIndex].text;
        });
    }


    async function cargarVehiculosBackend() {
        try {
            const respuesta = await fetch('http://localhost:8080/api/v1/vehiculos');
            if (!respuesta.ok) throw new Error('Error al conectar con el servidor');
            
            const autosDB = await respuesta.json();
            
            if (selectorAuto) {
                selectorAuto.innerHTML = '<option value="">-- Selecciona un auto --</option>';
                autosDB.forEach(auto => {
                    const option = document.createElement('option');
                    option.value = auto.idVehiculo; 
                    option.textContent = `${auto.marca} ${auto.modelo} (S/ ${Number(auto.precioDia).toFixed(2)}/día)`;
                    option.dataset.precio = auto.precioDia;
                    option.dataset.tipo = auto.categoria;
                    option.dataset.imagen = auto.imagen;
                    option.dataset.marca = auto.marca;
                    option.dataset.modelo = auto.modelo;
                    selectorAuto.appendChild(option);
                });
            }
            seleccionarAutoStorage();
        } catch (error) {
            console.error("Error al cargar vehículos desde la BD:", error);
        }
    }

    function seleccionarAutoStorage() {
        const autoGuardado = localStorage.getItem('autoReserva');
        if (autoGuardado && selectorAuto) {
            try {
                const auto = JSON.parse(autoGuardado);
                const opcion = Array.from(selectorAuto.options).find(opt => 
                    opt.value == auto.id || opt.text.includes(auto.marca)
                );
                
                if (opcion) {
                    selectorAuto.value = opcion.value;
                    actualizarResumen();
                }
            } catch (error) {
                console.error("Error leyendo localStorage", error);
            }
        }
    }

   
    function actualizarResumen() {
        const dias = Math.max(1, parseInt(inputDias?.value) || 1);

        if (selectorAuto && selectorAuto.value !== '') {
            const opcion = selectorAuto.options[selectorAuto.selectedIndex];
            if (opcion && opcion.value !== '') {
                autoActual = {
                    id: Number(opcion.value),
                    nombre: `${opcion.dataset.marca} ${opcion.dataset.modelo}`,
                    tipo: opcion.dataset.tipo,
                    imagen: opcion.dataset.imagen,
                    precio: Number(opcion.dataset.precio)
                };
            }
        }

        if (!autoActual) return;

        if (resumenNombre) resumenNombre.textContent = autoActual.nombre;
        if (resumenTipo) resumenTipo.textContent = autoActual.tipo;
        if (resumenImagen) {
            resumenImagen.src = `../recursos/imagenes/vehiculos/${autoActual.imagen}`;
            resumenImagen.onerror = () => resumenImagen.src = '../recursos/imagenes/home/logo-carmovo4.jpg'; 
        }
        if (etiquetaDias) etiquetaDias.textContent = `Tarifa base (${dias} ${dias === 1 ? 'día' : 'días'})`;

        const tarifaBase = autoActual.precio * dias;
        const costoSeguro = 120.00; 
        const impuestos = tarifaBase * 0.18;
        totalPagar = tarifaBase + costoSeguro + impuestos;

        if (resumenTarifaBase) resumenTarifaBase.textContent = `S/ ${tarifaBase.toFixed(2)}`;
        if (resumenImpuestos) resumenImpuestos.textContent = `S/ ${impuestos.toFixed(2)}`;
        if (resumenTotal) resumenTotal.textContent = `S/ ${totalPagar.toFixed(2)}`;

        document.querySelectorAll('.monto-dinamico-modal').forEach(span => span.textContent = `S/ ${totalPagar.toFixed(2)}`);
    }

    if (selectorAuto) selectorAuto.addEventListener('change', actualizarResumen);
    if (inputDias) inputDias.addEventListener('input', actualizarResumen);

    //  INTEGRACIÓN API RENIEC 
    if (inputDNI) {
        inputDNI.addEventListener('input', async (e) => {
            const dni = e.target.value.trim();
            
            if (dni.length === 8) {
                console.log("Consultando DNI a través de Spring Boot:", dni); 
                
                try {
                    const res = await fetch(`http://localhost:8080/api/v1/reniec/${dni}`);
                    
                    if (res.ok) {
                        const data = await res.json();
                        console.log("Datos recibidos:", data);
                        
                        if (data.success === true && data.data) {
                            const nombreCompleto = data.data.nombre_completo || "";
                            
                            // Autocompletar Nombres y Apellidos
                            if (inputNombre && inputApellidos) {
                                const partes = nombreCompleto.split(',');
                                if (partes.length >= 2) {
                                    inputApellidos.value = partes[0].trim();
                                    inputNombre.value = partes[1].trim();
                                } else {
                                    inputNombre.value = nombreCompleto;
                                }
                                inputNombre.classList.add('campo-lleno');
                                inputApellidos.classList.add('campo-lleno');
                            }

                           
                            if (inputDomicilio && data.data.direccion) {
                                inputDomicilio.value = data.data.direccion;
                                inputDomicilio.classList.add('campo-lleno');
                            }

                      
                            if (inputFechaNacimiento && data.data.fecha_nacimiento) {
                                inputFechaNacimiento.value = data.data.fecha_nacimiento;
                                inputFechaNacimiento.classList.add('campo-lleno');
                            }

                        } else {
                            alert("DNI no encontrado en el padrón.");
                        }
                    } else {
                        console.error("El backend no pudo resolver el DNI");
                    }
                } catch (error) { 
                    console.error('Error al conectar con el backend:', error); 
                }
            }
        });
    }

    if (inputLicencia) {
        inputLicencia.addEventListener('blur', () => {
            const brevete = inputLicencia.value.trim();
            if (brevete.length >= 8) {
                setTimeout(() => {
                    if(inputCategoria) { inputCategoria.value = "A-I"; inputCategoria.classList.add('campo-lleno'); }
                    if(inputVenceLicencia) {
                        const f = new Date(); f.setFullYear(f.getFullYear() + 3);
                        inputVenceLicencia.value = f.toISOString().split('T')[0];
                        inputVenceLicencia.classList.add('campo-lleno');
                    }
                }, 800);
            }
        });
    }

  
    const formularioReserva = document.getElementById('formFinalizarReserva');
    if (formularioReserva) {
        const inputsTodos = formularioReserva.querySelectorAll('input, select');
        
        const procesarEstiloCampo = (campo) => {
            if (campo.type !== 'radio' && campo.name !== 'pago') {
                if (campo.value.trim() !== '') {
                    campo.classList.add('campo-lleno');
                    campo.classList.remove('input-error');
                } else {
                    campo.classList.remove('campo-lleno');
                }
            }
        };

        inputsTodos.forEach(input => {
            procesarEstiloCampo(input);
            input.addEventListener('input', function() { procesarEstiloCampo(this); });
            input.addEventListener('change', function() { procesarEstiloCampo(this); });
        });
    }

    const alertaErrores = document.getElementById('alertaErroresFormulario');
    
    function validarFormulario() {
        if (!formularioReserva) return true;
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

    const btnValidar = document.getElementById('btn-validar-conductor');
    const btnProcesarPago = document.getElementById('btn-procesar-pago');
    const seccionPagos = document.getElementById('seccion-metodos-pago');

    if (btnValidar) {
        btnValidar.addEventListener('click', function () {
            if (!localStorage.getItem('usuarioCarmovoLogueado')) {
                if (pantallaBloqueo) pantallaBloqueo.classList.remove('oculto');
                return;
            }

            if (!validarFormulario()) return;

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
                
                if (btnProcesarPago) btnProcesarPago.classList.remove('oculto');
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

  
    const radiosPago = document.querySelectorAll('input[name="pago"]');
    const modales = document.querySelectorAll('.modal-pago');
    const botonesCerrar = document.querySelectorAll('.btn-cerrar-modal');

    function cerrarTodosLosModales() {
        modales.forEach(modal => {
            modal.classList.remove('activo');
            modal.classList.add('oculto');
        });
    }

    radiosPago.forEach(radio => {
        radio.addEventListener('click', function (e) {
            e.preventDefault(); 
            
            if (!validarFormulario()) {
                this.checked = false;
                return;
            }

            this.checked = true;
            cerrarTodosLosModales();

            const nombreCompleto = `${inputNombre ? inputNombre.value : ''} ${inputApellidos ? inputApellidos.value : ''}`.trim();
            if (nombreCompleto !== '') {
                document.querySelectorAll('.titular-auto-relleno').forEach(input => input.value = nombreCompleto);
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

    
    window.enviarReservaBackend = async (metodoPago, tokenCulqi = null) => {
        if (!autoActual) return alert("Debe seleccionar un vehículo");

        const reservaData = {
            vehiculoId: autoActual.id,
            dias: parseInt(inputDias.value),
            lugarRecogida: selectRecogida.value,
            lugarEntrega: selectEntrega.value,
            metodoPago: metodoPago,
            tokenPago: tokenCulqi, 
            total: totalPagar,
            conductor: {
                nombre: inputNombre.value,
                apellidos: inputApellidos.value,
                dni: inputDNI.value,
                correo: inputCorreo.value,
                telefono: document.getElementById('telefono').value,
                licencia: inputLicencia.value,
                categoriaLicencia: inputCategoria.value,
                vencimientoLicencia: inputVenceLicencia.value,
                domicilio: inputDomicilio ? inputDomicilio.value : ''
            }
        };

        try {
            const res = await fetch('http://localhost:8080/api/v1/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reservaData)
            });

            if (res.ok) {
                document.querySelectorAll('.modal-pago').forEach(m => m.classList.add('oculto'));
                const modalExito = document.getElementById('modal-pago-exito');
                document.getElementById('nombre-exito').textContent = inputNombre.value.split(' ')[0];
                modalExito.classList.remove('oculto');
                modalExito.classList.add('activo');
            } else {
                throw new Error("Error procesando la reserva en el servidor");
            }
        } catch (error) {
            console.error("Error al confirmar reserva:", error);
            alert("Hubo un problema al procesar tu reserva. Revisa tu consola.");
        }
    };

    
    document.querySelectorAll('.btn-guardar-modal').forEach(boton => {
        boton.addEventListener('click', function() {
            const texto = this.textContent.toLowerCase();
            
            if (texto.includes('tarjeta')) {
                if (typeof Culqi !== 'undefined') {
                    Culqi.settings({
                        title: 'Carmovo Alquileres',
                        currency: 'PEN',
                        description: `Reserva: ${autoActual.nombre}`,
                        amount: Math.round(totalPagar * 100) 
                    });
                    
                    Culqi.options({
                        lang: 'auto',
                        installments: false,
                        paymentMethods: { tarjeta: true, yape: false, bancaMovil: false }
                    });

                    Culqi.open();
                } else {
                    alert("Culqi no está cargado. Revisa tu etiqueta script en el HTML.");
                }
                return; 
            }

            let metodo = 'tarjeta';
            if (texto.includes('yape')) metodo = 'yape';
            if (texto.includes('plin')) metodo = 'plin';
            if (texto.includes('pay-pal') || texto.includes('paypal')) metodo = 'paypal';
            
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
            this.style.pointerEvents = 'none';
            enviarReservaBackend(metodo);
        });
    });

 
    cargarVehiculosBackend();
});


window.culqi = function() {
    if (Culqi.token) { 
        const tokenCulqi = Culqi.token.id;
        console.log('Se generó el token de Culqi exitosamente:', tokenCulqi);
        window.enviarReservaBackend('tarjeta', tokenCulqi);
    } else { 
        console.error(Culqi.error);
        alert(Culqi.error.user_message);
    }
};