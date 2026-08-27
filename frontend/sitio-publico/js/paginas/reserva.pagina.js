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
            console.error('Error al leer autoReserva:', error);
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

    const desglosePrecio = document.querySelector('.desglose-precio');
    let filaPrecioRegular = null;
    let filaDescuento = null;

    if (desglosePrecio) {
        filaPrecioRegular = document.getElementById('fila-precio-regular');
        filaDescuento = document.getElementById('fila-descuento-oferta');

        if (!filaPrecioRegular) {
            filaPrecioRegular = document.createElement('div');
            filaPrecioRegular.id = 'fila-precio-regular';
            filaPrecioRegular.className = 'precio-item';
            filaPrecioRegular.innerHTML = `
                <span>Precio regular</span>
                <span id="resumen-precio-regular">S/ 0.00</span>
            `;
            desglosePrecio.insertBefore(filaPrecioRegular, desglosePrecio.firstElementChild);
        }

        if (!filaDescuento) {
            filaDescuento = document.createElement('div');
            filaDescuento.id = 'fila-descuento-oferta';
            filaDescuento.className = 'precio-item';
            filaDescuento.innerHTML = `
                <span>Descuento de oferta</span>
                <span id="resumen-descuento-oferta">- S/ 0.00</span>
            `;
            desglosePrecio.insertBefore(filaDescuento, desglosePrecio.firstElementChild.nextSibling);
        }
    }

    const resumenPrecioRegular = document.getElementById('resumen-precio-regular');
    const resumenDescuentoOferta = document.getElementById('resumen-descuento-oferta');

    function mostrarInformacionOferta(mostrar, precioRegular, descuento, dias) {
        if (!filaPrecioRegular || !filaDescuento) {
            return;
        }

        if (mostrar) {
            filaPrecioRegular.style.display = 'flex';
            filaDescuento.style.display = 'flex';

            const totalRegular = precioRegular * dias;
            const montoDescuento = totalRegular - (precioRegular * (1 - descuento / 100) * dias);

            if (resumenPrecioRegular) {
                resumenPrecioRegular.textContent = `S/ ${totalRegular.toFixed(2)}`;
            }

            if (resumenDescuentoOferta) {
                resumenDescuentoOferta.textContent = `- S/ ${montoDescuento.toFixed(2)} (${descuento}%)`;
            }
        } else {
            filaPrecioRegular.style.display = 'none';
            filaDescuento.style.display = 'none';
        }
    }

    function actualizarResumen() {
        const dias = Math.max(1, parseInt(inputDias?.value) || 1);

        if (selectorAuto && selectorAuto.value !== '') {
            const opcion = selectorAuto.options[selectorAuto.selectedIndex];

            if (opcion) {
                const esLaOfertaGuardada =
                    autoActual &&
                    autoActual.esOferta === true &&
                    autoActual.nombre === opcion.value;

                if (!esLaOfertaGuardada) {
                    autoActual = {
                        id: Number(opcion.dataset.id),
                        nombre: opcion.value,
                        tipo: opcion.dataset.tipo,
                        imagen: opcion.dataset.imagen,
                        precio: Number(opcion.dataset.precio),
                        precioOriginal: Number(opcion.dataset.precio),
                        precioOferta: Number(opcion.dataset.precio),
                        descuento: 0,
                        esOferta: false
                    };

                    localStorage.setItem('autoReserva', JSON.stringify(autoActual));
                }
            }
        }

        if (!autoActual) {
            return;
        }

        if (resumenNombre) {
            resumenNombre.textContent = autoActual.nombre;
        }

        if (resumenTipo) {
            resumenTipo.textContent = autoActual.tipo;
        }

        if (resumenImagen && autoActual.imagen) {
            resumenImagen.src = autoActual.imagen;
            resumenImagen.alt = autoActual.nombre;
        }

        if (etiquetaDias) {
            etiquetaDias.textContent = `Tarifa base (${dias} ${dias === 1 ? 'día' : 'días'})`;
        }

        const precioOriginal = Number(autoActual.precioOriginal ?? autoActual.precio);
        const descuento = Number(autoActual.descuento || 0);
        let precioPorDia;

        if (autoActual.esOferta === true && descuento > 0) {
            precioPorDia = Number(autoActual.precioOferta);
        } else {
            precioPorDia = precioOriginal;
        }

        const tarifaBase = precioPorDia * dias;
        const costoSeguro = 120.00;
        const impuestos = tarifaBase * 0.18;
        const total = tarifaBase + costoSeguro + impuestos;

        if (resumenTarifaBase) {
            resumenTarifaBase.textContent = `S/ ${tarifaBase.toFixed(2)}`;
        }

        if (resumenImpuestos) {
            resumenImpuestos.textContent = `S/ ${impuestos.toFixed(2)}`;
        }

        if (resumenTotal) {
            resumenTotal.textContent = `S/ ${total.toFixed(2)}`;
        }

        mostrarInformacionOferta(
            autoActual.esOferta === true && descuento > 0,
            precioOriginal,
            descuento,
            dias
        );
    }

    if (selectorAuto) {
        selectorAuto.addEventListener('change', () => {
            const opcion = selectorAuto.options[selectorAuto.selectedIndex];

            if (!opcion || opcion.value === '') {
                return;
            }

            autoActual = {
                id: Number(opcion.dataset.id),
                nombre: opcion.value,
                tipo: opcion.dataset.tipo,
                imagen: opcion.dataset.imagen,
                precio: Number(opcion.dataset.precio),
                precioOriginal: Number(opcion.dataset.precio),
                precioOferta: Number(opcion.dataset.precio),
                descuento: 0,
                esOferta: false
            };

            localStorage.setItem('autoReserva', JSON.stringify(autoActual));
            localStorage.removeItem('ofertaActiva');

            actualizarResumen();
        });
    }

    if (inputDias) {
        inputDias.addEventListener('input', actualizarResumen);
        inputDias.addEventListener('change', actualizarResumen);
    }

    actualizarResumen();

    const radiosPago = document.querySelectorAll('input[name="pago"]');
    const modales = document.querySelectorAll('.modal-pago');
    const botonesCerrar = document.querySelectorAll('.btn-cerrar-modal');
    const botonesConfirmar = document.querySelectorAll('.btn-guardar-modal, .btn-confirmar-pago');
    const modalExito = document.getElementById('modal-pago-exito');
    const btnCerrarExito = document.querySelector('.btn-cerrar-exito');

    function cerrarTodosLosModales() {
        modales.forEach(modal => {
            modal.classList.remove('activo');
            modal.classList.add('oculto');
        });
    }

    radiosPago.forEach(radio => {
        radio.addEventListener('click', function () {
            cerrarTodosLosModales();

            const campoNombre = document.getElementById('nombre');
            const campoApellidos = document.getElementById('apellidos');

            const nombre = campoNombre ? campoNombre.value : '';
            const apellidos = campoApellidos ? campoApellidos.value : '';
            const nombreCompleto = `${nombre} ${apellidos}`.trim();

            if (nombreCompleto !== '') {
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
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            cerrarTodosLosModales();
        });
    });

    botonesConfirmar.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            cerrarTodosLosModales();

            if (modalExito) {
                modalExito.classList.remove('oculto');
                modalExito.classList.add('activo');
            }
        });
    });

    if (btnCerrarExito) {
        btnCerrarExito.addEventListener('click', function (e) {
            e.preventDefault();
            cerrarTodosLosModales();
        });
    }

    modales.forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                cerrarTodosLosModales();
            }
        });
    });

    const inputsArchivo = document.querySelectorAll('.input-archivo');

    inputsArchivo.forEach(input => {
        input.addEventListener('change', function (event) {
            const archivo = event.target.files[0];
            const imagenPreview = this.nextElementSibling;

            if (archivo && archivo.type.startsWith('image/')) {
                const lector = new FileReader();

                lector.onload = function (e) {
                    if (imagenPreview && imagenPreview.classList.contains('vista-previa-imagen')) {
                        imagenPreview.src = e.target.result;
                        imagenPreview.classList.remove('oculto');
                    }
                };

                lector.readAsDataURL(archivo);
            } else {
                if (imagenPreview && imagenPreview.classList.contains('vista-previa-imagen')) {
                    imagenPreview.src = '';
                    imagenPreview.classList.add('oculto');
                }
            }
        });
    });

    const btnValidar = document.getElementById('btn-validar-conductor');

    if (btnValidar) {
        btnValidar.addEventListener('click', function () {
            const boton = this;
            const icono = boton.querySelector('i');
            const texto = boton.querySelector('span');

            const campoNombre = document.getElementById('nombre');
            const campoDocumento = document.getElementById('documento');

            const nombre = campoNombre ? campoNombre.value : '';
            const documento = campoDocumento ? campoDocumento.value : '';

            if (nombre.trim() === '' || documento.trim() === '') {
                alert('Por favor, completa al menos tu nombre y DNI para validar.');
                return;
            }

            boton.classList.add('cargando');

            if (icono) {
                icono.className = 'fa-solid fa-spinner fa-spin';
            }

            if (texto) {
                texto.textContent = 'Verificando datos...';
            }

            setTimeout(() => {
                boton.classList.remove('cargando');
                boton.classList.add('validado');

                if (icono) {
                    icono.className = 'fa-solid fa-check-double';
                }

                if (texto) {
                    texto.textContent = 'Datos Validados';
                }
            }, 1500);
        });
    }
});