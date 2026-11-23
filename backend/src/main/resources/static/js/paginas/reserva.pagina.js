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
        const opcionesThymeleaf = selectorAuto
            ? selectorAuto.querySelectorAll('option[data-vehiculo-thymeleaf="true"]')
            : [];

        // Spring MVC ya entrega la flota desde PostgreSQL al renderizar la vista.
        // La API queda como respaldo para conservar compatibilidad con el frontend original.
        if (opcionesThymeleaf.length > 0) {
            seleccionarAutoStorage();
            return;
        }

        try {
            const respuesta = await fetch('/api/v1/vehiculos');
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

            // Fotos subidas desde el panel, enlaces o rutas absolutas: se usan tal cual.
            if (/^(https?:|data:|blob:|\/)/i.test(imagenBD)) {
                rutaImagen = imagenBD;
            } else if (carpetaNueva && imagenBD) {
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

        // Vista previa: el monto definitivo lo calcula el servidor al iniciar el pago.
        const conChofer = !!document.getElementById('con-chofer')?.checked;
        const tarifaBase = autoActual.precio * dias;
        const costoChofer = conChofer ? 80 * dias : 0;
        const costoSeguro = 120.00;
        const impuestos = (tarifaBase + costoChofer) * 0.18;
        totalPagar = tarifaBase + costoChofer + costoSeguro + impuestos;

        const filaChofer = document.getElementById('fila-chofer');
        if (filaChofer) {
            filaChofer.hidden = !conChofer;
            document.getElementById('resumen-chofer').textContent = `S/ ${costoChofer.toFixed(2)}`;
            document.getElementById('etiqueta-chofer').textContent =
                `Servicio con chofer (${dias} ${dias === 1 ? 'día' : 'días'})`;
        }

        if (resumenTarifaBase) resumenTarifaBase.textContent = `S/ ${tarifaBase.toFixed(2)}`;
        if (resumenImpuestos) resumenImpuestos.textContent = `S/ ${impuestos.toFixed(2)}`;
        if (resumenTotal) resumenTotal.textContent = `S/ ${totalPagar.toFixed(2)}`;

        document.querySelectorAll('.monto-dinamico-modal')
            .forEach(span => span.textContent = `S/ ${totalPagar.toFixed(2)}`);

        cotizarEnServidor(conChofer);
    }

    // El precio definitivo (incluidas las ofertas vigentes del Portal web) lo calcula el servidor.
    let temporizadorCotizacion = null;
    function avisoChofer(texto) {
        const caja = document.getElementById('aviso-chofer');
        if (!caja) return;
        caja.textContent = texto;
        caja.hidden = !texto;
    }

    function cotizarEnServidor(conChofer) {
        clearTimeout(temporizadorCotizacion);
        if (!autoActual || !inputFechaInicio?.value || !inputFechaFin?.value || !window.CarmovoClienteApi?.pasarela) return;
        const pedido = `${autoActual.idVehiculo}|${inputFechaInicio.value}|${inputFechaFin.value}|${conChofer}`;
        temporizadorCotizacion = setTimeout(async () => {
            try {
                const c = await window.CarmovoClienteApi.pasarela('cotizacion', {
                    vehiculoId: String(autoActual.idVehiculo), fechaInicio: inputFechaInicio.value,
                    fechaFin: inputFechaFin.value, conChofer: String(conChofer)
                });
                const actual = `${autoActual?.idVehiculo}|${inputFechaInicio.value}|${inputFechaFin.value}|${!!document.getElementById('con-chofer')?.checked}`;
                if (!c || actual !== pedido) return;
                const dias = Number(c.dias);
                totalPagar = Number(c.total);
                if (etiquetaDias) {
                    etiquetaDias.textContent = `Tarifa base (${dias} ${dias === 1 ? 'día' : 'días'})` +
                        (c.descuento ? ` · oferta -${c.descuento}%` : '');
                }
                if (resumenTarifaBase) resumenTarifaBase.textContent = `S/ ${Number(c.tarifaBase).toFixed(2)}`;
                if (resumenImpuestos) resumenImpuestos.textContent = `S/ ${Number(c.igv).toFixed(2)}`;
                if (resumenTotal) resumenTotal.textContent = `S/ ${totalPagar.toFixed(2)}`;
                const chofer = document.getElementById('resumen-chofer');
                if (chofer) chofer.textContent = `S/ ${Number(c.chofer).toFixed(2)}`;
                document.querySelectorAll('.monto-dinamico-modal')
                    .forEach(span => span.textContent = `S/ ${totalPagar.toFixed(2)}`);
                avisoChofer('');
            } catch (error) {
                // Sin choferes libres en esas fechas: se avisa y se quita la opción.
                const mensaje = String(error?.message || '');
                if (conChofer && /chofer/i.test(mensaje)) {
                    const casilla = document.getElementById('con-chofer');
                    if (casilla) casilla.checked = false;
                    aplicarModoChofer();
                    actualizarResumen();
                    avisoChofer(mensaje);
                }
                // Sin sesión o fechas no válidas: se conserva la vista previa local.
            }
        }, 350);
    }

    if (selectorAuto) selectorAuto.addEventListener('change', actualizarResumen);
    document.getElementById('con-chofer')?.addEventListener('change', actualizarResumen);

    // ---------------------------------------------------------------- boleta o factura
    const datosFactura = document.getElementById('datos-factura');
    const inputRuc = document.getElementById('factura-ruc');
    const estadoRuc = document.getElementById('factura-ruc-estado');
    const errorFactura = document.getElementById('error-factura');

    function tipoComprobante() {
        return document.querySelector('input[name="tipo-comprobante"]:checked')?.value || 'BOLETA';
    }

    /** RUC: 11 dígitos, prefijo 10/15/17/20 y dígito verificador (módulo 11). */
    function rucValido(ruc) {
        if (!/^(10|15|17|20)\d{9}$/.test(ruc)) return false;
        const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        const suma = pesos.reduce((t, p, i) => t + p * Number(ruc[i]), 0);
        let digito = 11 - (suma % 11);
        if (digito === 10) digito = 0;
        if (digito === 11) digito = 1;
        return digito === Number(ruc[10]);
    }

    document.querySelectorAll('input[name="tipo-comprobante"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const esFactura = tipoComprobante() === 'FACTURA';
            if (datosFactura) datosFactura.hidden = !esFactura;
            if (errorFactura) errorFactura.hidden = true;
            if (esFactura) setTimeout(() => inputRuc?.focus(), 50);
        });
    });

    inputRuc?.addEventListener('input', () => {
        inputRuc.value = inputRuc.value.replace(/\D/g, '').slice(0, 11);
        if (!estadoRuc) return;
        if (inputRuc.value.length < 11) {
            estadoRuc.textContent = inputRuc.value ? `${11 - inputRuc.value.length} dígitos más` : '';
            estadoRuc.className = 'mensaje-campo';
        } else if (rucValido(inputRuc.value)) {
            estadoRuc.textContent = '✓ RUC válido';
            estadoRuc.className = 'mensaje-campo ok';
        } else {
            estadoRuc.textContent = 'RUC inválido: revisa los números';
            estadoRuc.className = 'mensaje-campo error';
        }
    });

    function datosFacturacion() {
        if (tipoComprobante() !== 'FACTURA') return { tipoComprobante: 'BOLETA' };
        return {
            tipoComprobante: 'FACTURA',
            ruc: inputRuc?.value.trim() || '',
            razonSocial: document.getElementById('factura-razon')?.value.trim() || '',
            direccionFiscal: document.getElementById('factura-direccion')?.value.trim() || ''
        };
    }

    function validarFacturacion() {
        const datos = datosFacturacion();
        let mensaje = '';
        if (datos.tipoComprobante === 'FACTURA') {
            if (!rucValido(datos.ruc)) mensaje = 'El RUC no es válido: debe tener 11 dígitos y empezar con 10, 15, 17 o 20.';
            else if (datos.razonSocial.length < 3) mensaje = 'Ingresa la razón social para la factura.';
            else if (datos.direccionFiscal.length < 5) mensaje = 'Ingresa la dirección fiscal para la factura.';
        }
        if (errorFactura) {
            errorFactura.textContent = mensaje;
            errorFactura.hidden = !mensaje;
            if (mensaje) errorFactura.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return !mensaje;
    }

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

    // Términos y privacidad: se abre el documento completo y solo se marca al leerlo y aceptarlo.
    const casillaPoliticas = document.getElementById('acepta-politicas');
    window.CarmovoPoliticas?.vincular(casillaPoliticas, { tipo: 'cliente' });

    // Con chofer de la agencia el cliente no maneja: su licencia deja de ser obligatoria.
    function aplicarModoChofer() {
        const conChofer = !!document.getElementById('con-chofer')?.checked;
        [inputLicencia, inputCategoria, inputVenceLicencia].forEach(input => {
            if (!input) return;
            input.required = !conChofer;
            input.classList.remove('input-error');
            const grupo = input.closest('.grupo-input');
            if (grupo) grupo.hidden = conChofer;
        });
        const titulo = document.getElementById('titulo-datos-conductor');
        if (titulo) titulo.textContent = conChofer ? 'Datos del titular de la reserva' : 'Datos del conductor';
        const radio = document.querySelector(`input[name="quien-maneja"][value="${conChofer ? 'agencia' : 'yo'}"]`);
        if (radio && !radio.checked) radio.checked = true;
    }
    document.getElementById('con-chofer')?.addEventListener('change', aplicarModoChofer);
    // "¿Quién manejará?": Yo manejo (como siempre) o Chofer de la agencia.
    document.querySelectorAll('input[name="quien-maneja"]').forEach(radio => radio.addEventListener('change', () => {
        const casilla = document.getElementById('con-chofer');
        if (!casilla) return;
        casilla.checked = radio.value === 'agencia' && radio.checked;
        if (radio.value === 'agencia') avisoChofer('');
        casilla.dispatchEvent(new Event('change'));
    }));
    aplicarModoChofer();

    function desmarcarMetodos() {
        radiosPago.forEach(radio => radio.checked = false);
    }

    // Cada método abre la pasarela de pago simulada (pasarela-simulada.js).
    radiosPago.forEach(radio => {
        radio.addEventListener('click', function (e) {
            e.preventDefault();

            if (!validarFormulario()) {
                desmarcarMetodos();
                return;
            }
            if (!autoActual) {
                alert('Debe seleccionar un vehículo.');
                return;
            }
            if (!validarFacturacion()) {
                desmarcarMetodos();
                return;
            }
            if (!casillaPoliticas?.checked) {
                desmarcarMetodos();
                const etiqueta = document.getElementById('campo-acepto-reserva');
                etiqueta?.classList.add('pol-acepto--error');
                etiqueta?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            if (!window.PasarelaSimulada) {
                alert('No se pudo cargar la pasarela de pago.');
                return;
            }

            const radioElegido = this;
            setTimeout(() => { radioElegido.checked = true; }, 0);

            const nombreCompleto = `${inputNombre?.value || ''} ${inputApellidos?.value || ''}`.trim();

            window.PasarelaSimulada.abrir({
                metodo: this.dataset.metodo || this.value,
                total: totalPagar,
                concepto: `Alquiler ${autoActual?.nombre || 'de vehículo'}`,
                titular: nombreCompleto,
                celular: inputTelefono?.value || '',
                correo: inputCorreo?.value || '',
                // El servidor recalcula el monto con estos datos (no confía en el navegador).
                reserva: {
                    vehiculoId: autoActual.idVehiculo,
                    fechaInicio: inputFechaInicio.value,
                    fechaFin: inputFechaFin.value,
                    conChofer: !!document.getElementById('con-chofer')?.checked
                },
                onAprobado: (resultado) => window.enviarReservaBackend(resultado.metodo, resultado),
                onCancelado: desmarcarMetodos
            });
        });
    });

    const btnCerrarExito = document.querySelector('.btn-cerrar-exito');
    if (btnCerrarExito) {
        btnCerrarExito.addEventListener('click', function () {
            // La reserva y el comprobante ya fueron registrados: vamos a Mi Cuenta.
            const modalExito = document.getElementById('modal-pago-exito');
            modalExito?.classList.remove('activo');
            modalExito?.classList.add('oculto');
            window.location.href = '/miCuenta#comprobante';
        });
    }

    function textoOpcion(select) {
        if (!select?.value) return '';
        return select.options[select.selectedIndex]?.text?.trim() || select.value;
    }

    function normalizarMetodoPago(metodo) {
        const metodos = {
            tarjeta: 'Tarjeta',
            efectivo: 'Efectivo',
            yape: 'Yape',
            plin: 'Plin',
            transferencia: 'Transferencia'
        };
        return metodos[metodo] || metodo;
    }

    function estadoPagoInicial() {
        // La pasarela simulada solo llama al backend cuando el pago fue aprobado.
        return 'Pagado';
    }

    // Devuelve una promesa: si falla lanza el error para que la pasarela
    // muestre el mensaje y permita reintentar el registro.
    window.enviarReservaBackend = async (metodoPago, resultadoPago = {}) => {
        if (enviandoReserva) throw new Error('La reserva ya se está registrando.');
        if (!autoActual) throw new Error('Debe seleccionar un vehículo.');
        if (!validarFormulario()) throw new Error('Revisa los datos del conductor.');

        const sesion = obtenerSesionCliente();
        if (!sesion) {
            pantallaBloqueo?.classList.remove('oculto');
            throw new Error('Debes iniciar sesión para continuar.');
        }

        if (!perfilClienteActual?.departamento || !perfilClienteActual?.provincia || !perfilClienteActual?.distrito) {
            throw new Error('Completa Departamento, Provincia y Distrito en Mi Cuenta antes de realizar una reserva.');
        }

        const referenciaPago = resultadoPago.referencia || null;

        const reservaData = {
            idUsuario: Number(sesion.idUsuario),
            vehiculoId: autoActual.idVehiculo,
            fechaInicio: inputFechaInicio.value,
            fechaFin: inputFechaFin.value,
            lugarRecogida: textoOpcion(selectRecogida),
            lugarEntrega: textoOpcion(selectEntrega),
            metodoPago: normalizarMetodoPago(metodoPago),
            // El servidor valida este código de pago (monto, dueño y uso único).
            codigoIntento: resultadoPago.codigoIntento,
            conChofer: !!document.getElementById('con-chofer')?.checked,
            aceptaPoliticas: !!casillaPoliticas?.checked,
            ...datosFacturacion(),
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
            // El token JWT identifica al cliente: el servidor ignora cualquier idUsuario ajeno.
            const respuesta = await window.CarmovoClienteApi.crearReserva(reservaData);

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
                estadoPago: resultadoPago.estado || estadoPagoInicial(),
                referenciaPago
            }));

            const modalExito = document.getElementById('modal-pago-exito');
            const nombreExito = document.getElementById('nombre-exito');
            const textoValidacion = modalExito?.querySelector('.texto-validacion');

            if (nombreExito) nombreExito.textContent = inputNombre.value.split(' ')[0];
            if (textoValidacion) {
                const total = `S/ ${Number(alquiler.total).toFixed(2)}`;
                const mensajes = {
                    APROBADO: `Tu pago con ${normalizarMetodoPago(metodoPago)} fue aprobado (ref. <strong>${referenciaPago || '—'}</strong>).<br>Total: ${total}. Tu comprobante ya está disponible en Mi Cuenta.`,
                    EN_REVISION: `Registramos tu operación ${normalizarMetodoPago(metodoPago)} N° <strong>${referenciaPago || '—'}</strong>. Tu pago está <strong>en revisión</strong>.<br>Caja lo verificará y te avisaremos por correo si se aprueba o se rechaza. Total: ${total}.`,
                    PENDIENTE: `Paga <strong>${total}</strong> en efectivo en nuestra oficina presentando el código <strong>${referenciaPago || '—'}</strong>.<br>Tienes hasta las 12:00 del día de recojo; si no, la reserva se cancelará automáticamente.`
                };
                textoValidacion.innerHTML = `Reserva #${alquiler.idAlquiler} registrada.<br>` +
                    (mensajes[resultadoPago.estado] || `Total: ${total}.`);
            }
            if (modalExito) {
                modalExito.classList.remove('oculto');
                modalExito.classList.add('activo');
            }
            return alquiler;
        } finally {
            enviandoReserva = false;
        }
    };

    configurarFechas();
    completarDatosDesdePerfil();
    cargarVehiculosBackend();
});

