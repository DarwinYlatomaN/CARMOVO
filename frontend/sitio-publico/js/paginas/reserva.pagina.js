document.addEventListener('DOMContentLoaded', () => {
    const pantallaBloqueo = document.getElementById('pantalla-bloqueo-sesion');
    const btnCerrarBloqueo = document.getElementById('btn-cerrar-bloqueo');
    const selectorAuto = document.getElementById('selector-auto');
    const inputFechaInicio = document.getElementById('fecha-inicio');
    const inputFechaFin = document.getElementById('fecha-fin');

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
    const inputFechaNacimiento = document.getElementById('nacimiento');
    const inputLicencia = document.getElementById('licencia');
    const inputCategoria = document.getElementById('categoria');
    const inputVenceLicencia = document.getElementById('fecha-vence-licencia');
    const inputCorreo = document.getElementById('correo');
    const inputTelefono = document.getElementById('telefono');
    const selectDepartamento = document.getElementById('departamento');
    const selectProvincia = document.getElementById('provincia');
    const selectDistrito = document.getElementById('distrito');

    const selectRecogida = document.getElementById('lugar-recogida');
    const selectEntrega = document.getElementById('lugar-entrega');
    const resumenTextoRecogida = document.getElementById('resumen-texto-recogida');
    const resumenTextoEntrega = document.getElementById('resumen-texto-entrega');

    let autoActual = null;
    let totalPagar = 0;
    let enviandoReserva = false;
    let perfilClienteActual = null;

    if (typeof Culqi !== 'undefined') {
        Culqi.publicKey = 'pk_test_TU_LLAVE_PUBLICA_AQUI';
    }

    function fechaLocalISO(fecha) {
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${anio}-${mes}-${dia}`;
    }

    function configurarFechas() {
        if (!inputFechaInicio || !inputFechaFin) return;

        const hoy = new Date();
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const hoyISO = fechaLocalISO(hoy);
        const mananaISO = fechaLocalISO(manana);

        inputFechaInicio.min = hoyISO;
        inputFechaFin.min = hoyISO;

        if (!inputFechaInicio.value) inputFechaInicio.value = hoyISO;
        if (!inputFechaFin.value) inputFechaFin.value = mananaISO;

        inputFechaInicio.addEventListener('change', () => {
            inputFechaFin.min = inputFechaInicio.value || hoyISO;
            if (inputFechaFin.value && inputFechaFin.value < inputFechaInicio.value) {
                inputFechaFin.value = inputFechaInicio.value;
            }
            actualizarResumen();
        });

        inputFechaFin.addEventListener('change', actualizarResumen);
    }

    function obtenerDias() {
        if (!inputFechaInicio?.value || !inputFechaFin?.value) return 1;

        const inicio = new Date(`${inputFechaInicio.value}T00:00:00`);
        const fin = new Date(`${inputFechaFin.value}T00:00:00`);
        const diferencia = Math.floor((fin - inicio) / 86400000);
        return Math.max(1, diferencia);
    }

    function obtenerSesionCliente() {
        try {
            const raw = localStorage.getItem('carmovo_sesion');
            if (!raw) return null;
            const sesion = JSON.parse(raw);
            if (!sesion?.logueado || !sesion?.idUsuario) return null;
            return sesion;
        } catch (error) {
            console.error('No se pudo leer la sesión del cliente:', error);
            return null;
        }
    }

    async function completarDatosDesdePerfil() {
        const sesion = obtenerSesionCliente();
        if (!sesion) return;

        const asignar = (campo, valor) => {
            if (campo && valor && !campo.value) {
                campo.value = valor;
                campo.classList.add('campo-lleno');
            }
        };

        const mostrarUbicacionPerfil = (campo, valor, etiqueta) => {
            if (!campo) return;
            campo.value = valor || '';
            campo.placeholder = valor ? '' : `${etiqueta}: sin registrar`;
            campo.readOnly = true;
            if (valor) campo.classList.add('campo-lleno');
            else campo.classList.remove('campo-lleno');
        };

        // Primero mostramos los datos básicos de sesión para que la interfaz responda de inmediato.
        asignar(inputNombre, sesion.nombres);
        asignar(inputApellidos, sesion.apellidos);
        asignar(inputCorreo, sesion.correo);
        asignar(inputTelefono, sesion.telefono);

        if (!window.CarmovoClienteApi) {
            mostrarUbicacionPerfil(selectDepartamento, '', 'Departamento');
            mostrarUbicacionPerfil(selectProvincia, '', 'Provincia');
            mostrarUbicacionPerfil(selectDistrito, '', 'Distrito');
            return;
        }

        try {
            const perfil = await window.CarmovoClienteApi.obtenerPerfil(sesion.idUsuario);
            perfilClienteActual = perfil;
            asignar(inputNombre, perfil.nombres);
            asignar(inputApellidos, perfil.apellidos);
            asignar(inputCorreo, perfil.correo);
            asignar(inputTelefono, perfil.telefono);
            asignar(inputDNI, perfil.documento);
            asignar(inputFechaNacimiento, perfil.fechaNacimiento);
            asignar(inputDomicilio, perfil.domicilio);
            asignar(inputLicencia, perfil.numeroLicencia);
            asignar(inputCategoria, perfil.categoriaLicencia);
            asignar(inputVenceLicencia, perfil.vencimientoLicencia);
            mostrarUbicacionPerfil(selectDepartamento, perfil.departamento, 'Departamento');
            mostrarUbicacionPerfil(selectProvincia, perfil.provincia, 'Provincia');
            mostrarUbicacionPerfil(selectDistrito, perfil.distrito, 'Distrito');
        } catch (error) {
            console.error('No se pudo cargar el perfil del cliente desde PostgreSQL:', error);
            mostrarUbicacionPerfil(selectDepartamento, '', 'Departamento');
            mostrarUbicacionPerfil(selectProvincia, '', 'Provincia');
            mostrarUbicacionPerfil(selectDistrito, '', 'Distrito');
        }
    }

    if (btnCerrarBloqueo) {
        btnCerrarBloqueo.addEventListener('click', () => {
            pantallaBloqueo?.classList.add('oculto');
        });
    }

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

            const autosBackend = await respuesta.json();

            if (selectorAuto) {
                selectorAuto.innerHTML = '<option value="">-- Selecciona un auto --</option>';
                autosBackend.forEach(auto => {
                    const option = document.createElement('option');
                    option.value = auto.idVehiculo;
                    option.textContent = `${auto.marca} ${auto.modelo} (S/ ${Number(auto.precioDia).toFixed(2)}/día)`;
                    option.dataset.precio = auto.precioDia;
                    option.dataset.tipo = auto.tipo || auto.categoria;
                    option.dataset.categoria = auto.categoria || '';
                    option.dataset.imagen = auto.imagen || '';
                    option.dataset.marca = auto.marca;
                    option.dataset.modelo = auto.modelo;
                    option.dataset.estado = auto.estado || '';

                    if (auto.estado && auto.estado !== 'Disponible') {
                        option.disabled = true;
                        option.textContent += ' - No disponible';
                    }

                    selectorAuto.appendChild(option);
                });
            }

            seleccionarAutoStorage();
        } catch (error) {
            console.error('Error al cargar vehículos desde la BD:', error);
        }
    }

    function seleccionarAutoStorage() {
        const autoGuardado = localStorage.getItem('autoReserva');
        if (!autoGuardado || !selectorAuto) return;

        try {
            const auto = JSON.parse(autoGuardado);
            const idGuardado = Number(auto.idVehiculo ?? auto.id);
            const nombreGuardado = `${auto.marca || ''} ${auto.modelo || ''}`.trim().toLowerCase();

            const opcion = Array.from(selectorAuto.options).find(opt => {
                if (!opt.value) return false;
                if (Number(opt.value) === idGuardado) return true;

                const nombreOpcion = `${opt.dataset.marca || ''} ${opt.dataset.modelo || ''}`.trim().toLowerCase();
                return nombreGuardado && nombreOpcion === nombreGuardado;
            });

            if (opcion && !opcion.disabled) {
                selectorAuto.value = opcion.value;
                actualizarResumen();
            } else if (idGuardado || nombreGuardado) {
                localStorage.removeItem('autoReserva');
                console.warn('El vehículo seleccionado anteriormente ya no está disponible en la flota actual.');
            }
        } catch (error) {
            console.error('Error leyendo la selección de vehículo:', error);
            localStorage.removeItem('autoReserva');
        }
    }

    function actualizarResumen() {
        const dias = obtenerDias();

        if (selectorAuto && selectorAuto.value !== '') {
            const opcion = selectorAuto.options[selectorAuto.selectedIndex];
            if (opcion && opcion.value !== '') {
                autoActual = {
                    idVehiculo: Number(opcion.value),
                    id: Number(opcion.value),
                    nombre: `${opcion.dataset.marca} ${opcion.dataset.modelo}`,
                    marca: opcion.dataset.marca,
                    modelo: opcion.dataset.modelo,
                    tipo: opcion.dataset.tipo,
                    categoria: opcion.dataset.categoria,
                    imagen: opcion.dataset.imagen,
                    precio: Number(opcion.dataset.precio),
                    estado: opcion.dataset.estado
                };
            }
        } else {
            autoActual = null;
        }

        if (!autoActual) return;

        if (resumenNombre) resumenNombre.textContent = autoActual.nombre;
        if (resumenTipo) resumenTipo.textContent = autoActual.tipo;

        if (resumenImagen) {
            const nombreActual = autoActual.nombre.toLowerCase();
            let rutaImagen = '../recursos/imagenes/home/logo-carmovo4.jpg';

            const carpetasNuevas = {
                'crossovers': 'crossovers',
                'furgonetas': 'furgonetas',
                'hibridos': 'hibridos',
                'premium / lujo': 'premiumLujo',
                'eventos': 'eventos'
            };

            const normalizarCategoria = (texto) =>
                String(texto || '')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .trim()
                    .toLowerCase();

            const categoriaNormalizada = normalizarCategoria(autoActual.categoria);
            const carpetaNueva = carpetasNuevas[categoriaNormalizada];
            const imagenBD = String(autoActual.imagen || '').trim();

            // Los 25 vehículos nuevos toman la imagen registrada en PostgreSQL.
            if (carpetaNueva && imagenBD) {
                if (/^(https?:|data:|blob:)/i.test(imagenBD)) {
                    rutaImagen = imagenBD;
                } else if (imagenBD.startsWith('../recursos/')) {
                    rutaImagen = imagenBD;
                } else if (imagenBD.startsWith('recursos/')) {
                    rutaImagen = `../${imagenBD}`;
                } else {
                    rutaImagen = `../recursos/imagenes/${carpetaNueva}/${imagenBD}`;
                }
            } else {
                // Vehículos antiguos: conservar exactamente la lógica que ya funciona.
                if (typeof autosDB !== 'undefined' && Array.isArray(autosDB)) {
                    const referenciaVisual = autosDB.find(
                        auto => auto.nombre.toLowerCase() === nombreActual
                    );

                    if (referenciaVisual?.imagen) {
                        rutaImagen = referenciaVisual.imagen;
                    }
                }
            }

            resumenImagen.src = rutaImagen;

            resumenImagen.onerror = () => {
                resumenImagen.onerror = null;
                resumenImagen.src = '../recursos/imagenes/home/logo-carmovo4.jpg';
            };
        }

        if (etiquetaDias) etiquetaDias.textContent = `Tarifa base (${dias} ${dias === 1 ? 'día' : 'días'})`;

        const tarifaBase = autoActual.precio * dias;
        const costoSeguro = 120.00;
        const impuestos = tarifaBase * 0.18;
        totalPagar = tarifaBase + costoSeguro + impuestos;

        if (resumenTarifaBase) resumenTarifaBase.textContent = `S/ ${tarifaBase.toFixed(2)}`;
        if (resumenImpuestos) resumenImpuestos.textContent = `S/ ${impuestos.toFixed(2)}`;
        if (resumenTotal) resumenTotal.textContent = `S/ ${totalPagar.toFixed(2)}`;

        document.querySelectorAll('.monto-dinamico-modal')
            .forEach(span => span.textContent = `S/ ${totalPagar.toFixed(2)}`);
    }

    if (selectorAuto) selectorAuto.addEventListener('change', actualizarResumen);

    // Los datos del conductor se cargan desde el perfil persistido en PostgreSQL.
    // En Reservas son solo de lectura; cualquier corrección se realiza desde Mi Cuenta.

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
            input.addEventListener('input', function () { procesarEstiloCampo(this); });
            input.addEventListener('change', function () { procesarEstiloCampo(this); });
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

        if (inputFechaInicio?.value && inputFechaFin?.value && inputFechaFin.value < inputFechaInicio.value) {
            inputFechaInicio.classList.add('input-error');
            inputFechaFin.classList.add('input-error');
            formularioValido = false;
        }

        if (!formularioValido) {
            alertaErrores?.classList.remove('oculto');
            setTimeout(() => {
                alertaErrores?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } else {
            alertaErrores?.classList.add('oculto');
        }

        return formularioValido;
    }

    const btnValidar = document.getElementById('btn-validar-conductor');
    const btnProcesarPago = document.getElementById('btn-procesar-pago');
    const seccionPagos = document.getElementById('seccion-metodos-pago');

    if (btnValidar) {
        btnValidar.addEventListener('click', function () {
            const sesion = obtenerSesionCliente();
            if (!sesion) {
                pantallaBloqueo?.classList.remove('oculto');
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
                btnProcesarPago?.classList.remove('oculto');
            }, 700);
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

            const nombreCompleto = `${inputNombre?.value || ''} ${inputApellidos?.value || ''}`.trim();
            if (nombreCompleto !== '') {
                document.querySelectorAll('.titular-auto-relleno').forEach(input => input.value = nombreCompleto);
            }

            const modalId = this.getAttribute('data-modal');
            const modalSeleccionado = modalId ? document.getElementById(modalId) : null;
            if (modalSeleccionado) {
                modalSeleccionado.classList.remove('oculto');
                modalSeleccionado.classList.add('activo');
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

    const btnCerrarExito = document.querySelector('.btn-cerrar-exito');
    if (btnCerrarExito) {
        btnCerrarExito.addEventListener('click', function () {
            // La reserva ya fue registrada correctamente. Evitamos dejar al usuario
            // atrapado en el modal y lo llevamos a Mi Cuenta para revisar su estado.
            const modalExito = document.getElementById('modal-pago-exito');
            modalExito?.classList.remove('activo');
            modalExito?.classList.add('oculto');
            window.location.href = 'miCuenta.html';
        });
    }

    document.querySelectorAll('.btn-abrir-qr').forEach(btn => {
        btn.addEventListener('click', function () {
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

    function textoOpcion(select) {
        if (!select?.value) return '';
        return select.options[select.selectedIndex]?.text?.trim() || select.value;
    }

    function normalizarMetodoPago(metodo) {
        const metodos = {
            tarjeta: 'Tarjeta',
            paypal: 'PayPal',
            yape: 'Yape',
            plin: 'Plin'
        };
        return metodos[metodo] || metodo;
    }

    function obtenerReferenciaPago(metodoPago) {
        if (metodoPago === 'yape') {
            return document.getElementById('operacion-yape')?.value?.trim() || '';
        }
        if (metodoPago === 'plin') {
            return document.getElementById('operacion-plin')?.value?.trim() || '';
        }
        return '';
    }

    function validarDatosPago(metodoPago) {
        if (metodoPago === 'yape' || metodoPago === 'plin') {
            const referencia = obtenerReferenciaPago(metodoPago);
            if (!referencia) {
                alert(`Ingresa el número de operación de ${normalizarMetodoPago(metodoPago)}.`);
                const campo = document.getElementById(metodoPago === 'yape' ? 'operacion-yape' : 'operacion-plin');
                campo?.focus();
                return false;
            }
        }
        return true;
    }

    function estadoPagoInicial(metodoPago) {
        return metodoPago === 'yape' || metodoPago === 'plin' ? 'En revisión' : 'Pendiente';
    }

    window.enviarReservaBackend = async (metodoPago, tokenCulqi = null) => {
        if (enviandoReserva) return;
        if (!autoActual) {
            alert('Debe seleccionar un vehículo.');
            return;
        }
        if (!validarFormulario()) return;

        const sesion = obtenerSesionCliente();
        if (!sesion) {
            pantallaBloqueo?.classList.remove('oculto');
            return;
        }

        if (!perfilClienteActual?.departamento || !perfilClienteActual?.provincia || !perfilClienteActual?.distrito) {
            alert('Completa Departamento, Provincia y Distrito en Mi Cuenta antes de realizar una reserva.');
            return;
        }

        if (!validarDatosPago(metodoPago)) return;

        const referenciaPago = obtenerReferenciaPago(metodoPago);

        const reservaData = {
            idUsuario: Number(sesion.idUsuario),
            vehiculoId: autoActual.idVehiculo,
            fechaInicio: inputFechaInicio.value,
            fechaFin: inputFechaFin.value,
            lugarRecogida: textoOpcion(selectRecogida),
            lugarEntrega: textoOpcion(selectEntrega),
            metodoPago: normalizarMetodoPago(metodoPago),
            referenciaPago: referenciaPago || null,
            tokenPago: tokenCulqi,
            conductor: {
                nombre: inputNombre.value.trim(),
                apellidos: inputApellidos.value.trim(),
                dni: inputDNI.value.trim(),
                correo: inputCorreo.value.trim(),
                telefono: inputTelefono.value.trim(),
                fechaNacimiento: inputFechaNacimiento?.value || null,
                licencia: inputLicencia.value.trim(),
                categoriaLicencia: inputCategoria.value.trim(),
                vencimientoLicencia: inputVenceLicencia.value,
                domicilio: inputDomicilio?.value.trim() || '',
                departamento: perfilClienteActual?.departamento || '',
                provincia: perfilClienteActual?.provincia || '',
                distrito: perfilClienteActual?.distrito || ''
            }
        };

        enviandoReserva = true;

        try {
            const res = await fetch('http://localhost:8080/api/v1/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reservaData)
            });

            const tipoContenido = res.headers.get('content-type') || '';
            const respuesta = tipoContenido.includes('application/json')
                ? await res.json()
                : await res.text();

            if (!res.ok) {
                const mensaje = typeof respuesta === 'string'
                    ? respuesta
                    : respuesta?.message || respuesta?.error || 'No se pudo registrar la reserva.';
                throw new Error(mensaje);
            }

            const alquiler = respuesta;
            if (typeof alquiler?.total === 'number') {
                totalPagar = alquiler.total;
                if (resumenTotal) resumenTotal.textContent = `S/ ${Number(alquiler.total).toFixed(2)}`;
            }

            localStorage.removeItem('autoReserva');
            localStorage.setItem('ultimaReservaCarmovo', JSON.stringify({
                idAlquiler: alquiler.idAlquiler,
                estado: alquiler.estado,
                total: alquiler.total,
                vehiculo: alquiler.vehiculo,
                fechaInicio: alquiler.fechaInicio,
                fechaFin: alquiler.fechaFin,
                metodoPago: normalizarMetodoPago(metodoPago),
                estadoPago: estadoPagoInicial(metodoPago),
                referenciaPago: referenciaPago || null
            }));

            document.querySelectorAll('.modal-pago').forEach(m => m.classList.add('oculto'));
            const modalExito = document.getElementById('modal-pago-exito');
            const nombreExito = document.getElementById('nombre-exito');
            const textoValidacion = modalExito?.querySelector('.texto-validacion');

            if (nombreExito) nombreExito.textContent = inputNombre.value.split(' ')[0];
            if (textoValidacion) {
                const estadoPago = estadoPagoInicial(metodoPago);
                const detalleReferencia = referenciaPago
                    ? `<br>Referencia: <strong>${referenciaPago}</strong>.`
                    : '';
                textoValidacion.innerHTML = `Reserva #${alquiler.idAlquiler} registrada como <strong>${alquiler.estado}</strong>.<br>Pago: <strong>${estadoPago}</strong>${detalleReferencia}<br>Total calculado por el servidor: S/ ${Number(alquiler.total).toFixed(2)}.`;
            }
            if (modalExito) {
                modalExito.classList.remove('oculto');
                modalExito.classList.add('activo');
            }
        } catch (error) {
            console.error('Error al confirmar reserva:', error);
            alert(error.message || 'Hubo un problema al procesar tu reserva.');
        } finally {
            enviandoReserva = false;
            document.querySelectorAll('.btn-guardar-modal').forEach(boton => {
                boton.style.pointerEvents = '';
                if (boton.dataset.textoOriginal) {
                    boton.innerHTML = boton.dataset.textoOriginal;
                }
            });
        }
    };

    document.querySelectorAll('.btn-guardar-modal').forEach(boton => {
        boton.addEventListener('click', function () {
            const texto = this.textContent.toLowerCase();

            if (texto.includes('tarjeta')) {
                if (typeof Culqi !== 'undefined') {
                    Culqi.settings({
                        title: 'Carmovo Alquileres',
                        currency: 'PEN',
                        description: `Reserva: ${autoActual?.nombre || 'Vehículo'}`,
                        amount: Math.round(totalPagar * 100)
                    });

                    Culqi.options({
                        lang: 'auto',
                        installments: false,
                        paymentMethods: { tarjeta: true, yape: false, bancaMovil: false }
                    });

                    Culqi.open();
                } else {
                    alert('Culqi no está cargado.');
                }
                return;
            }

            let metodo = 'tarjeta';
            if (texto.includes('yape')) metodo = 'yape';
            if (texto.includes('plin')) metodo = 'plin';
            if (texto.includes('pay-pal') || texto.includes('paypal')) metodo = 'paypal';

            if (!validarDatosPago(metodo)) return;

            if (!this.dataset.textoOriginal) {
                this.dataset.textoOriginal = this.innerHTML;
            }
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
            this.style.pointerEvents = 'none';
            window.enviarReservaBackend(metodo);
        });
    });


    document.querySelectorAll('.input-comprobante').forEach(input => {
        input.addEventListener('change', function () {
            const archivo = this.files?.[0];
            const previewId = this.dataset.preview;
            const preview = previewId ? document.getElementById(previewId) : null;
            if (!archivo || !preview) return;

            if (!archivo.type.startsWith('image/')) {
                alert('Selecciona una imagen válida como comprobante.');
                this.value = '';
                preview.classList.add('oculto');
                return;
            }

            const lector = new FileReader();
            lector.onload = evento => {
                preview.src = evento.target.result;
                preview.classList.remove('oculto');
            };
            lector.readAsDataURL(archivo);
        });
    });

    configurarFechas();
    completarDatosDesdePerfil();
    cargarVehiculosBackend();
});

window.culqi = function () {
    if (Culqi.token) {
        const tokenCulqi = Culqi.token.id;
        window.enviarReservaBackend('tarjeta', tokenCulqi);
    } else {
        console.error(Culqi.error);
        alert(Culqi.error?.user_message || 'No se pudo generar el token de pago.');
    }
};
