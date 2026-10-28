
document.addEventListener('DOMContentLoaded', async () => {
    let sesionActual = null;
    let perfilActual = null;

    const RUTA_UBIGEOS = '/data/UBIGEOS_2022_1891_distritos.csv';

    const PATRON_NOMBRES = /^(?=(?:[^\p{L}]*\p{L}){3})\p{L}+(?: \p{L}+)*$/u;
    const PATRON_CORREO = /^[A-Za-z0-9._%+-]+@gmail\.com$/i;
    const PATRON_CELULAR = /^9[0-9]{8}$/;
    const PATRON_DNI = /^[0-9]{8}$/;
    const PATRON_LICENCIA = /^[A-Za-z]-?[0-9]{6,12}E?$/i;

    const CATEGORIAS_VALIDAS = [
        'A-I',
        'A-IIA',
        'A-IIB',
        'A-IIIA',
        'A-IIIB',
        'A-IIIC'
    ];

    const CAMPOS_PERFIL = [
        'nombre',
        'apellidos',
        'correo',
        'telefono',
        'nacimiento',
        'documento',
        'licencia',
        'categoria',
        'vence',
        'departamento',
        'provincia',
        'distrito',
        'domicilio'
    ];

    let catalogoUbigeos = new Map();
    let catalogoCargado = false;
    let promesaUbigeos = null;
    let cargandoFormulario = false;

    const btnEditarPerfil = document.getElementById('btn-editar-perfil');
    const modalEditarCuenta = document.getElementById('modal-editar-cuenta');
    const formEditarCuenta = document.getElementById('form-editar-cuenta');
    const modalExito = document.getElementById('modal-exito-actualizacion');

    const selectDepartamento = document.getElementById('edit-departamento');
    const selectProvincia = document.getElementById('edit-provincia');
    const selectDistrito = document.getElementById('edit-distrito');

    function campo(nombre) {
        return document.getElementById(`edit-${nombre}`);
    }

    function valor(nombre) {
        return campo(nombre)?.value.trim() || '';
    }

    function texto(valorTexto) {
        return valorTexto == null || String(valorTexto).trim() === ''
            ? 'Sin registrar'
            : String(valorTexto).trim();
    }

    function normalizarUbicacion(valorTexto) {
        return String(valorTexto ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .replace(/\s+/g, ' ')
            .toUpperCase();
    }

    function formatearFecha(fechaISO) {
        if (!fechaISO) return 'Sin registrar';

        const partes = String(fechaISO).split('-');

        if (partes.length !== 3) {
            return String(fechaISO);
        }

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function fechaActualISO() {
        const hoy = new Date();

        return [
            hoy.getFullYear(),
            String(hoy.getMonth() + 1).padStart(2, '0'),
            String(hoy.getDate()).padStart(2, '0')
        ].join('-');
    }

    function fechaValidaISO(fecha) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return false;
        }

        const [anio, mes, dia] = fecha.split('-').map(Number);
        const comprobacion = new Date(anio, mes - 1, dia);

        return comprobacion.getFullYear() === anio &&
            comprobacion.getMonth() === mes - 1 &&
            comprobacion.getDate() === dia;
    }

    function calcularEdad(fechaISO) {
        const [anio, mes, dia] = fechaISO.split('-').map(Number);
        const hoy = new Date();

        let edad = hoy.getFullYear() - anio;

        if (
            hoy.getMonth() + 1 < mes ||
            (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)
        ) {
            edad--;
        }

        return edad;
    }

    // =========================================================
    // MENSAJES DE ERROR DENTRO DEL MODAL
    // =========================================================

    function obtenerMensajeGeneral() {
        if (!formEditarCuenta) return null;

        let mensaje = document.getElementById('error-general-perfil');

        if (!mensaje) {
            mensaje = document.createElement('div');
            mensaje.id = 'error-general-perfil';
            mensaje.setAttribute('role', 'alert');
            mensaje.setAttribute('aria-live', 'assertive');

            mensaje.style.cssText = [
                'display:none',
                'padding:12px 14px',
                'margin:0 0 16px',
                'border:1px solid #ef7777',
                'border-radius:9px',
                'background:rgba(239,68,68,.12)',
                'color:#ffb3b3',
                'font-size:13px',
                'font-weight:600',
                'line-height:1.6',
                'white-space:normal',
                'overflow-wrap:anywhere'
            ].join(';');

            formEditarCuenta.prepend(mensaje);
        }

        return mensaje;
    }

    function mostrarErrorGeneral(mensaje) {
        const elemento = obtenerMensajeGeneral();

        if (!elemento) return;

        elemento.textContent = mensaje;
        elemento.style.display = 'block';

        elemento.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }

    function limpiarErrorGeneral() {
        const elemento = document.getElementById('error-general-perfil');

        if (!elemento) return;

        elemento.textContent = '';
        elemento.style.display = 'none';
    }

    function mostrarErrorCampo(nombre, mensaje) {
        const input = campo(nombre);
        const elemento = document.getElementById(`error-edit-${nombre}`);

        if (!input || !elemento) return;

        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');

        elemento.textContent = mensaje;
        elemento.hidden = false;

        elemento.style.cssText = [
            'display:block',
            'margin-top:6px',
            'color:#ffabab',
            'font-size:12px',
            'font-weight:600',
            'line-height:1.55',
            'white-space:normal',
            'overflow-wrap:anywhere'
        ].join(';');
    }

    function limpiarErrorCampo(nombre) {
        const input = campo(nombre);
        const elemento = document.getElementById(`error-edit-${nombre}`);

        if (input) {
            input.classList.remove('is-invalid');
            input.removeAttribute('aria-invalid');
        }

        if (elemento) {
            elemento.textContent = '';
            elemento.hidden = true;
            elemento.style.display = 'none';
        }
    }

    function limpiarErrores() {
        CAMPOS_PERFIL.forEach(limpiarErrorCampo);
        limpiarErrorGeneral();
    }

    function enfocarPrimerError() {
        const primerError = formEditarCuenta?.querySelector(
            '[aria-invalid="true"]'
        );

        if (primerError && !primerError.disabled) {
            primerError.focus();
        }
    }

    // =========================================================
    // SESIÓN Y PERFIL
    // =========================================================

    try {
        sesionActual = JSON.parse(
            localStorage.getItem('carmovo_sesion')
        );
    } catch (error) {
        sesionActual = null;
    }

    if (
        !sesionActual ||
        !sesionActual.logueado ||
        !sesionActual.idUsuario
    ) {
        window.location.href = '/login';
        return;
    }

    if (!window.CarmovoClienteApi) {
        console.error('No está disponible CarmovoClienteApi.');

        if (btnEditarPerfil) {
            btnEditarPerfil.disabled = true;
            btnEditarPerfil.title =
                'No se pudo cargar el servicio de clientes.';
        }

        return;
    }

    function guardarSesionBasica(usuario) {
        const nombreCompleto = (
            `${usuario.nombres || ''} ${usuario.apellidos || ''}`
        ).trim();

        // Conservar cualquier dato adicional de la sesión.
        sesionActual = {
            ...sesionActual,
            logueado: true,
            idUsuario: usuario.idUsuario || sesionActual.idUsuario,
            nombre: nombreCompleto || usuario.correo,
            nombres: usuario.nombres || '',
            apellidos: usuario.apellidos || '',
            correo: usuario.correo || '',
            telefono: usuario.telefono || '',
            perfil: usuario.nombrePerfil || sesionActual.perfil || 'Cliente'
        };

        localStorage.setItem(
            'carmovo_sesion',
            JSON.stringify(sesionActual)
        );

        localStorage.setItem(
            'usuarioCarmovoLogueado',
            'true'
        );
    }

    function asignarTexto(id, contenido) {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = contenido;
        }
    }

    function renderizarPerfil(usuario) {
        const nombreCompleto = (
            `${usuario.nombres || ''} ${usuario.apellidos || ''}`
        ).trim();

        asignarTexto('lbl-nombre-completo', texto(nombreCompleto));
        asignarTexto('lbl-correo', texto(usuario.correo));
        asignarTexto('lbl-telefono', texto(usuario.telefono));
        asignarTexto('lbl-documento', texto(usuario.documento));

        asignarTexto(
            'lbl-nacimiento',
            formatearFecha(usuario.fechaNacimiento)
        );

        asignarTexto(
            'lbl-licencia',
            texto(usuario.numeroLicencia)
        );

        asignarTexto(
            'lbl-categoria',
            texto(usuario.categoriaLicencia)
        );

        asignarTexto(
            'lbl-vence',
            formatearFecha(usuario.vencimientoLicencia)
        );

        asignarTexto(
            'lbl-departamento',
            texto(usuario.departamento)
        );

        asignarTexto(
            'lbl-provincia',
            texto(usuario.provincia)
        );

        asignarTexto(
            'lbl-distrito',
            texto(usuario.distrito)
        );

        asignarTexto(
            'lbl-domicilio',
            texto(usuario.domicilio)
        );
    }

    // =========================================================
    // LECTURA DEL CSV DE UBIGEOS
    // =========================================================

    function crearOpcion(valorOpcion, etiqueta) {
        const opcion = document.createElement('option');

        opcion.value = valorOpcion;
        opcion.textContent = etiqueta;

        return opcion;
    }

    function reiniciarSelector(selector, mensaje) {
        if (!selector) return;

        selector.replaceChildren(
            crearOpcion('', mensaje)
        );

        selector.value = '';
        selector.disabled = true;
    }

    function seleccionarPorNombre(selector, nombre) {
        if (!selector || !nombre) return false;

        const nombreBuscado = normalizarUbicacion(nombre);

        const opcion = Array.from(selector.options).find(item =>
            normalizarUbicacion(item.value) === nombreBuscado
        );

        if (!opcion) return false;

        selector.value = opcion.value;
        return true;
    }

    function obtenerColumnas(linea, separador) {
        return linea
            .split(separador)
            .map(valorColumna =>
                valorColumna.trim().replace(/^"|"$/g, '')
            );
    }

    function procesarCsvUbigeos(contenido) {
        const nuevoCatalogo = new Map();

        const lineas = contenido
            .replace(/^\uFEFF/, '')
            .split(/\r?\n/)
            .filter(linea => linea.trim() !== '');

        if (lineas.length < 2) {
            throw new Error('El catálogo de ubicaciones está vacío.');
        }

        const separador = lineas[0].includes(';') ? ';' : ',';

        const encabezados = obtenerColumnas(
            lineas[0],
            separador
        ).map(nombre => nombre.toUpperCase());

        const indiceDepartamento = encabezados.indexOf('NOMBDEP');
        const indiceProvincia = encabezados.indexOf('NOMBPROV');
        const indiceDistrito = encabezados.indexOf('NOMBDIST');

        if (
            indiceDepartamento < 0 ||
            indiceProvincia < 0 ||
            indiceDistrito < 0
        ) {
            throw new Error(
                'El CSV no contiene las columnas de departamento, provincia y distrito.'
            );
        }

        let registrosValidos = 0;

        for (let i = 1; i < lineas.length; i++) {
            const columnas = obtenerColumnas(
                lineas[i],
                separador
            );

            const nombreDepartamento =
                columnas[indiceDepartamento] || '';

            const nombreProvincia =
                columnas[indiceProvincia] || '';

            const nombreDistrito =
                columnas[indiceDistrito] || '';

            if (
                !nombreDepartamento ||
                !nombreProvincia ||
                !nombreDistrito
            ) {
                continue;
            }

            const claveDepartamento =
                normalizarUbicacion(nombreDepartamento);

            const claveProvincia =
                normalizarUbicacion(nombreProvincia);

            const claveDistrito =
                normalizarUbicacion(nombreDistrito);

            if (!nuevoCatalogo.has(claveDepartamento)) {
                nuevoCatalogo.set(claveDepartamento, {
                    nombre: nombreDepartamento,
                    provincias: new Map()
                });
            }

            const departamento = nuevoCatalogo.get(
                claveDepartamento
            );

            if (!departamento.provincias.has(claveProvincia)) {
                departamento.provincias.set(claveProvincia, {
                    nombre: nombreProvincia,
                    distritos: new Map()
                });
            }

            const provincia = departamento.provincias.get(
                claveProvincia
            );

            provincia.distritos.set(
                claveDistrito,
                nombreDistrito
            );

            registrosValidos++;
        }

        if (registrosValidos === 0) {
            throw new Error(
                'El catálogo no contiene ubicaciones válidas.'
            );
        }

        console.info(
            `CARMOVO: ${registrosValidos} ubicaciones cargadas.`
        );

        return nuevoCatalogo;
    }

    function buscarDepartamento(nombre) {
        return catalogoUbigeos.get(
            normalizarUbicacion(nombre)
        ) || null;
    }

    function buscarProvincia(departamento, nombre) {
        if (!departamento) return null;

        return departamento.provincias.get(
            normalizarUbicacion(nombre)
        ) || null;
    }

    function llenarDepartamentos() {
        if (!selectDepartamento) return;

        const departamentos = Array.from(
            catalogoUbigeos.values()
        ).sort((a, b) =>
            a.nombre.localeCompare(b.nombre, 'es')
        );

        selectDepartamento.replaceChildren(
            crearOpcion('', 'Selecciona un departamento')
        );

        departamentos.forEach(departamento => {
            selectDepartamento.appendChild(
                crearOpcion(
                    departamento.nombre,
                    departamento.nombre
                )
            );
        });

        selectDepartamento.disabled = false;
    }

    function llenarProvincias(valorAnterior = '') {
        reiniciarSelector(
            selectProvincia,
            'Selecciona una provincia'
        );

        reiniciarSelector(
            selectDistrito,
            'Selecciona primero una provincia'
        );

        if (!catalogoCargado) return;

        const departamento = buscarDepartamento(
            selectDepartamento?.value
        );

        if (!departamento) return;

        const provincias = Array.from(
            departamento.provincias.values()
        ).sort((a, b) =>
            a.nombre.localeCompare(b.nombre, 'es')
        );

        provincias.forEach(provincia => {
            selectProvincia.appendChild(
                crearOpcion(
                    provincia.nombre,
                    provincia.nombre
                )
            );
        });

        selectProvincia.disabled = false;

        seleccionarPorNombre(
            selectProvincia,
            valorAnterior
        );
    }

    function llenarDistritos(valorAnterior = '') {
        reiniciarSelector(
            selectDistrito,
            'Selecciona un distrito'
        );

        if (!catalogoCargado) return;

        const departamento = buscarDepartamento(
            selectDepartamento?.value
        );

        const provincia = buscarProvincia(
            departamento,
            selectProvincia?.value
        );

        if (!provincia) return;

        const distritos = Array.from(
            provincia.distritos.values()
        ).sort((a, b) =>
            a.localeCompare(b, 'es')
        );

        distritos.forEach(distrito => {
            selectDistrito.appendChild(
                crearOpcion(distrito, distrito)
            );
        });

        selectDistrito.disabled = false;

        seleccionarPorNombre(
            selectDistrito,
            valorAnterior
        );
    }

    async function cargarUbigeos() {
        if (catalogoCargado) {
            return true;
        }

        if (promesaUbigeos) {
            return promesaUbigeos;
        }

        promesaUbigeos = (async () => {
            reiniciarSelector(
                selectProvincia,
                'Cargando provincias...'
            );

            reiniciarSelector(
                selectDistrito,
                'Cargando distritos...'
            );

            try {
                const respuesta = await fetch(
                    RUTA_UBIGEOS,
                    { cache: 'no-store' }
                );

                if (!respuesta.ok) {
                    throw new Error(
                        `No se pudo acceder al CSV (HTTP ${respuesta.status}).`
                    );
                }

                const datos = await respuesta.arrayBuffer();

                // El catálogo puede estar guardado en UTF-8
                // o Windows-1252, según cómo se exportó.
                let contenido = new TextDecoder(
                    'utf-8',
                    { fatal: true }
                );

                let textoCsv;

                try {
                    textoCsv = contenido.decode(datos);
                } catch (_) {
                    textoCsv = new TextDecoder(
                        'windows-1252'
                    ).decode(datos);
                }

                catalogoUbigeos = procesarCsvUbigeos(
                    textoCsv
                );

                catalogoCargado = true;

                llenarDepartamentos();

                reiniciarSelector(
                    selectProvincia,
                    'Selecciona primero un departamento'
                );

                reiniciarSelector(
                    selectDistrito,
                    'Selecciona primero una provincia'
                );

                limpiarErrorCampo('departamento');

                return true;

            } catch (error) {
                catalogoCargado = false;

                console.error(
                    'Error al cargar ubicaciones:',
                    error
                );

                reiniciarSelector(
                    selectProvincia,
                    'No se pudieron cargar las provincias'
                );

                reiniciarSelector(
                    selectDistrito,
                    'No se pudieron cargar los distritos'
                );

                mostrarErrorGeneral(
                    'No se pudo cargar el catálogo de departamentos, ' +
                    'provincias y distritos. Comprueba que el archivo CSV ' +
                    'esté disponible en /static/data/ y recarga la página.'
                );

                return false;
            }
        })();

        try {
            return await promesaUbigeos;
        } finally {
            promesaUbigeos = null;
        }
    }

    async function rellenarFormularioPerfil(usuario) {
        limpiarErrores();

        campo('nombre').value = usuario.nombres || '';
        campo('apellidos').value = usuario.apellidos || '';
        campo('correo').value = usuario.correo || '';
        campo('telefono').value = usuario.telefono || '';

        campo('nacimiento').value =
            usuario.fechaNacimiento || '';

        campo('documento').value = usuario.documento || '';
        campo('licencia').value = usuario.numeroLicencia || '';

        campo('categoria').value =
            usuario.categoriaLicencia || '';

        campo('vence').value =
            usuario.vencimientoLicencia || '';

        campo('domicilio').value =
            usuario.domicilio || '';

        const disponible = await cargarUbigeos();

        if (!disponible) return;

        const departamentoEncontrado = seleccionarPorNombre(
            selectDepartamento,
            usuario.departamento
        );

        if (!departamentoEncontrado && usuario.departamento) {
            mostrarErrorCampo(
                'departamento',
                'El departamento guardado no figura en el catálogo. Selecciona uno.'
            );
        }

        llenarProvincias(usuario.provincia);

        if (
            usuario.provincia &&
            !selectProvincia.value
        ) {
            mostrarErrorCampo(
                'provincia',
                'La provincia guardada no coincide con el departamento seleccionado.'
            );
        }

        llenarDistritos(usuario.distrito);

        if (
            usuario.distrito &&
            !selectDistrito.value
        ) {
            mostrarErrorCampo(
                'distrito',
                'El distrito guardado no coincide con la provincia seleccionada.'
            );
        }
    }

    // =========================================================
    // VALIDACIONES DEL FORMULARIO
    // =========================================================

    function obtenerDatosFormulario() {
        return {
            nombres: valor('nombre'),
            apellidos: valor('apellidos'),
            correo: valor('correo'),
            telefono: valor('telefono'),
            fechaNacimiento: valor('nacimiento'),
            documento: valor('documento'),
            numeroLicencia: valor('licencia').toUpperCase(),
            categoriaLicencia: valor('categoria'),
            vencimientoLicencia: valor('vence'),
            departamento: valor('departamento'),
            provincia: valor('provincia'),
            distrito: valor('distrito'),
            domicilio: valor('domicilio')
        };
    }

    function validarUbicacion(datos) {
        let valido = true;

        if (!catalogoCargado) {
            mostrarErrorCampo(
                'departamento',
                'El catálogo de ubicaciones no está disponible.'
            );

            return false;
        }

        const departamento = buscarDepartamento(
            datos.departamento
        );

        if (!departamento) {
            mostrarErrorCampo(
                'departamento',
                'Selecciona un departamento válido.'
            );

            return false;
        }

        const provincia = buscarProvincia(
            departamento,
            datos.provincia
        );

        if (!provincia) {
            mostrarErrorCampo(
                'provincia',
                'Selecciona una provincia válida del departamento.'
            );

            valido = false;
        }

        if (
            provincia &&
            !provincia.distritos.has(
                normalizarUbicacion(datos.distrito)
            )
        ) {
            mostrarErrorCampo(
                'distrito',
                'Selecciona un distrito válido de la provincia.'
            );

            valido = false;
        }

        return valido;
    }

    function validarFormularioPerfil(datos) {
        limpiarErrores();

        let valido = true;

        function error(nombre, mensaje) {
            mostrarErrorCampo(nombre, mensaje);
            valido = false;
        }

        const obligatorios = [
            ['nombre', datos.nombres],
            ['apellidos', datos.apellidos],
            ['correo', datos.correo],
            ['telefono', datos.telefono],
            ['nacimiento', datos.fechaNacimiento],
            ['documento', datos.documento],
            ['licencia', datos.numeroLicencia],
            ['categoria', datos.categoriaLicencia],
            ['vence', datos.vencimientoLicencia],
            ['departamento', datos.departamento],
            ['provincia', datos.provincia],
            ['distrito', datos.distrito],
            ['domicilio', datos.domicilio]
        ];

        obligatorios.forEach(([nombre, contenido]) => {
            if (!contenido) {
                error(
                    nombre,
                    'Este campo es obligatorio.'
                );
            }
        });

        if (
            datos.nombres &&
            (
                datos.nombres.length > 100 ||
                !PATRON_NOMBRES.test(datos.nombres)
            )
        ) {
            error(
                'nombre',
                'Los nombres deben tener al menos 3 letras y contener solo letras y espacios.'
            );
        }

        if (
            datos.apellidos &&
            (
                datos.apellidos.length > 100 ||
                !PATRON_NOMBRES.test(datos.apellidos)
            )
        ) {
            error(
                'apellidos',
                'Los apellidos deben tener al menos 3 letras y contener solo letras y espacios.'
            );
        }

        if (
            datos.correo &&
            (
                datos.correo.length > 150 ||
                !PATRON_CORREO.test(datos.correo)
            )
        ) {
            error(
                'correo',
                'Ingresa un correo Gmail válido.'
            );
        }

        if (
            datos.telefono &&
            !PATRON_CELULAR.test(datos.telefono)
        ) {
            error(
                'telefono',
                'El celular debe tener 9 dígitos y comenzar con 9.'
            );
        }

        if (
            datos.documento &&
            !PATRON_DNI.test(datos.documento)
        ) {
            error(
                'documento',
                'El DNI debe contener exactamente 8 números.'
            );
        }

        if (datos.fechaNacimiento) {
            if (!fechaValidaISO(datos.fechaNacimiento)) {
                error(
                    'nacimiento',
                    'Selecciona una fecha de nacimiento válida.'
                );
            } else if (calcularEdad(datos.fechaNacimiento) < 18) {
                error(
                    'nacimiento',
                    'Debes tener al menos 18 años.'
                );
            }
        }

        if (
            datos.numeroLicencia &&
            !PATRON_LICENCIA.test(datos.numeroLicencia)
        ) {
            error(
                'licencia',
                'La licencia debe empezar con una letra, seguida de 6 a 12 números. Puede incluir un guion y terminar en E.'
            );
        }

        if (
            datos.categoriaLicencia &&
            !CATEGORIAS_VALIDAS.includes(
                datos.categoriaLicencia.toUpperCase()
            )
        ) {
            error(
                'categoria',
                'Selecciona una categoría de licencia válida.'
            );
        }

        if (datos.vencimientoLicencia) {
            if (!fechaValidaISO(datos.vencimientoLicencia)) {
                error(
                    'vence',
                    'Selecciona una fecha de vencimiento válida.'
                );
            } else if (
                datos.vencimientoLicencia < fechaActualISO()
            ) {
                error(
                    'vence',
                    'La licencia de conducir está vencida.'
                );
            }
        }

        if (
            datos.domicilio &&
            datos.domicilio.length > 200
        ) {
            error(
                'domicilio',
                'El domicilio no puede superar los 200 caracteres.'
            );
        }

        if (
            datos.departamento &&
            datos.provincia &&
            datos.distrito
        ) {
            if (!validarUbicacion(datos)) {
                valido = false;
            }
        } else if (!catalogoCargado) {
            error(
                'departamento',
                'No se pudo cargar el catálogo de ubicaciones.'
            );
        }

        if (!valido) {
            enfocarPrimerError();
        }

        return valido;
    }

    // =========================================================
    // ERRORES DEVUELTOS POR EL BACKEND
    // =========================================================

    function mostrarErroresBackend(error) {
        const errores = error?.errores;

        if (!errores || typeof errores !== 'object') {
            return false;
        }

        const equivalencias = {
            nombres: 'nombre',
            apellidos: 'apellidos',
            correo: 'correo',
            telefono: 'telefono',
            fechaNacimiento: 'nacimiento',
            documento: 'documento',
            numeroLicencia: 'licencia',
            categoriaLicencia: 'categoria',
            vencimientoLicencia: 'vence',
            departamento: 'departamento',
            provincia: 'provincia',
            distrito: 'distrito',
            domicilio: 'domicilio'
        };

        let encontrados = false;

        Object.entries(errores).forEach(([nombre, mensajes]) => {
            const campoFormulario = equivalencias[nombre];

            if (!campoFormulario) return;

            const mensaje = Array.isArray(mensajes)
                ? mensajes.join(' ')
                : String(mensajes ?? '');

            if (!mensaje) return;

            mostrarErrorCampo(
                campoFormulario,
                mensaje
            );

            encontrados = true;
        });

        if (encontrados) {
            enfocarPrimerError();
        }

        return encontrados;
    }

    function mostrarErrorServidor(error) {
        if (mostrarErroresBackend(error)) {
            return;
        }

        const detalle = String(
            error?.detalle ||
            error?.message ||
            ''
        ).trim();

        const detalleNormalizado = detalle.toLowerCase();

        if (
            detalleNormalizado.includes('correo') &&
            !detalleNormalizado.includes('bad request')
        ) {
            mostrarErrorCampo('correo', detalle);
            enfocarPrimerError();
            return;
        }

        if (
            detalleNormalizado.includes('telefono') ||
            detalleNormalizado.includes('teléfono')
        ) {
            mostrarErrorCampo('telefono', detalle);
            enfocarPrimerError();
            return;
        }

        if (
            detalleNormalizado.includes('documento') ||
            detalleNormalizado.includes('dni')
        ) {
            mostrarErrorCampo('documento', detalle);
            enfocarPrimerError();
            return;
        }

        if (
            detalleNormalizado.includes('licencia')
        ) {
            mostrarErrorCampo('licencia', detalle);
            enfocarPrimerError();
            return;
        }

        if (
            error?.status === 400 ||
            detalleNormalizado === 'bad request'
        ) {
            mostrarErrorGeneral(
                'El servidor rechazó los datos del perfil. ' +
                'Revisa que todos los campos sean válidos. ' +
                'Si el problema continúa, necesitamos revisar ' +
                'el detalle de validación que devuelve el backend.'
            );

            return;
        }

        if (error?.status === 409) {
            mostrarErrorGeneral(
                detalle ||
                'Uno de los datos ingresados ya está registrado.'
            );

            return;
        }

        mostrarErrorGeneral(
            detalle || 'No se pudo actualizar el perfil. Intenta nuevamente.'
        );
    }

    // =========================================================
    // ESTADO DE RESERVAS
    // =========================================================

    function configurarEstadoAlquiler(alquiler) {
        const cajaEstado = document.querySelector(
            '.caja-estado-actual'
        );

        const tituloEstado = document.getElementById(
            'texto-estado-reserva'
        );

        const mensaje = document.getElementById(
            'mensaje-verificador'
        );

        if (!cajaEstado || !tituloEstado || !mensaje) {
            return;
        }

        cajaEstado.classList.remove(
            'pendiente',
            'aceptado',
            'rechazado'
        );

        if (!alquiler) {
            tituloEstado.textContent =
                'Sin reservas registradas';

            mensaje.textContent =
                'Cuando realices una reserva, su estado aparecerá aquí.';

            asignarTexto('cuenta-vehiculo', 'Sin registrar');
            asignarTexto('cuenta-fechas', 'Sin registrar');
            asignarTexto('cuenta-metodo-pago', 'Sin registrar');
            asignarTexto('cuenta-total', 'S/ 0.00');

            cajaEstado.classList.add('pendiente');
            return;
        }

        const estado = alquiler.estado || 'Pendiente';

        tituloEstado.textContent = estado;

        asignarTexto(
            'cuenta-vehiculo',
            texto(alquiler.vehiculo)
        );

        asignarTexto(
            'cuenta-fechas',
            `${formatearFecha(alquiler.fechaInicio)} - ${formatearFecha(alquiler.fechaFin)}`
        );

        asignarTexto(
            'cuenta-metodo-pago',
            texto(alquiler.metodoPago)
        );

        asignarTexto(
            'cuenta-total',
            `S/ ${Number(alquiler.total || 0).toFixed(2)}`
        );

        if (estado === 'Cancelado') {
            cajaEstado.classList.add('rechazado');

            mensaje.textContent =
                'La reserva fue cancelada.';

        } else if (
            estado === 'Confirmado' ||
            estado === 'En curso' ||
            estado === 'Finalizado'
        ) {
            cajaEstado.classList.add('aceptado');

            if (estado === 'Confirmado') {
                mensaje.textContent =
                    'Tu reserva fue confirmada por CARMOVO.';
            } else if (estado === 'En curso') {
                mensaje.textContent =
                    'Tu alquiler se encuentra actualmente en curso.';
            } else {
                mensaje.textContent =
                    'Tu alquiler ha finalizado.';
            }

        } else {
            cajaEstado.classList.add('pendiente');

            mensaje.textContent =
                'Tu reserva está registrada y se encuentra pendiente de confirmación.';
        }
    }

    // =========================================================
    // COMPROBANTE DE PAGO
    // =========================================================

    let comprobanteActual = null;

    function ocultarComprobante() {
        comprobanteActual = null;
        document.getElementById('comprobante')?.classList.add('oculto');
    }

    async function cargarComprobante(alquiler) {
        const bloque = document.getElementById('comprobante');
        if (!bloque || !alquiler?.idAlquiler || alquiler.estado === 'Cancelado') {
            ocultarComprobante();
            return;
        }

        try {
            const comprobante =
                await window.CarmovoClienteApi.obtenerComprobante(
                    sesionActual.idUsuario,
                    alquiler.idAlquiler
                );

            if (!comprobante) {
                ocultarComprobante();
                return;
            }

            comprobanteActual = comprobante;

            const fechaEmision = comprobante.fechaEmision
                ? new Date(comprobante.fechaEmision).toLocaleString('es-PE', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                })
                : '';

            asignarTexto('comp-numero', `Comprobante N° ${comprobante.numero}`);
            asignarTexto(
                'comp-detalle',
                [
                    comprobante.metodoPago,
                    comprobante.referencia ? `Op. ${comprobante.referencia}` : '',
                    fechaEmision
                ].filter(Boolean).join(' · ')
            );

            bloque.classList.remove('oculto');

            if (window.location.hash === '#comprobante') {
                bloque.scrollIntoView({ behavior: 'smooth', block: 'center' });
                window.CarmovoComprobante?.previsualizar(comprobanteActual);
                history.replaceState(null, '', window.location.pathname);
            }

        } catch (error) {
            console.error('No se pudo cargar el comprobante:', error);
            ocultarComprobante();
        }
    }

    document.getElementById('btn-ver-comprobante')?.addEventListener('click', () => {
        if (comprobanteActual) {
            window.CarmovoComprobante?.previsualizar(comprobanteActual);
        }
    });

    document.getElementById('btn-descargar-comprobante')?.addEventListener('click', async function () {
        if (!comprobanteActual) return;
        const original = this.innerHTML;
        this.disabled = true;
        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando PDF...';
        try {
            await window.CarmovoComprobante?.descargarPdf(comprobanteActual);
        } finally {
            this.disabled = false;
            this.innerHTML = original;
        }
    });

    // =========================================================
    // HISTORIAL DE ALQUILERES
    // =========================================================

    let historialAlquileres = [];
    let idAlquilerSeleccionado = null;

    function escaparHtml(valor) {
        return String(valor ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function claseEstadoHistorial(estado) {
        if (estado === 'Cancelado') return 'rechazado';
        if (['Confirmado', 'En curso', 'Finalizado'].includes(estado)) return 'aceptado';
        return 'pendiente';
    }

    function pintarHistorial() {
        const lista = document.getElementById('historial-lista');
        const contador = document.getElementById('historial-contador');
        if (!lista) return;

        if (contador) {
            const n = historialAlquileres.length;
            contador.textContent = `${n} ${n === 1 ? 'alquiler' : 'alquileres'}`;
        }

        if (!historialAlquileres.length) {
            lista.innerHTML = '<p class="historial-vacio">Aún no tienes alquileres registrados.</p>';
            return;
        }

        lista.innerHTML = historialAlquileres.map(alquiler => {
            const seleccionado = String(alquiler.idAlquiler) === String(idAlquilerSeleccionado);
            const estado = alquiler.estado || 'Pendiente';
            return `
                <article class="historial-item ${seleccionado ? 'seleccionado' : ''}"
                         data-id-alquiler="${escaparHtml(alquiler.idAlquiler)}"
                         tabindex="0" role="button"
                         aria-label="Ver alquiler #${escaparHtml(alquiler.idAlquiler)}">
                    <div class="historial-principal">
                        <span class="historial-id">#${escaparHtml(alquiler.idAlquiler)}</span>
                        <div>
                            <strong>${escaparHtml(texto(alquiler.vehiculo))}</strong>
                            <small>${escaparHtml(formatearFecha(alquiler.fechaInicio))} - ${escaparHtml(formatearFecha(alquiler.fechaFin))} · ${escaparHtml(texto(alquiler.metodoPago))}</small>
                        </div>
                    </div>
                    <div class="historial-secundario">
                        <span class="historial-total">S/ ${Number(alquiler.total || 0).toFixed(2)}</span>
                        <span class="historial-estado ${claseEstadoHistorial(estado)}">${escaparHtml(estado)}</span>
                        ${alquiler.numeroComprobante ? `
                            <button type="button" class="historial-btn" data-accion="ver-comprobante"
                                    title="Ver comprobante ${escaparHtml(alquiler.numeroComprobante)}"
                                    aria-label="Ver comprobante">
                                <i class="fa-regular fa-eye"></i>
                            </button>
                            <button type="button" class="historial-btn principal" data-accion="descargar-comprobante"
                                    title="Descargar comprobante" aria-label="Descargar comprobante">
                                <i class="fa-solid fa-download"></i>
                            </button>` : '<span class="historial-sin-comprobante">Sin comprobante</span>'}
                    </div>
                </article>`;
        }).join('');
    }

    async function seleccionarAlquiler(alquiler) {
        if (!alquiler) return;
        idAlquilerSeleccionado = alquiler.idAlquiler;
        pintarHistorial();
        configurarEstadoAlquiler(alquiler);
        await cargarComprobante(alquiler);
    }

    async function cargarHistorial() {
        try {
            const alquileres =
                await window.CarmovoClienteApi.listarAlquileres(
                    sesionActual.idUsuario
                );
            historialAlquileres = Array.isArray(alquileres) ? alquileres : [];
        } catch (error) {
            console.error('No se pudo cargar el historial de alquileres:', error);
            historialAlquileres = [];
        }
        pintarHistorial();
    }

    document.getElementById('historial-lista')?.addEventListener('click', async evento => {
        const item = evento.target.closest('.historial-item');
        if (!item) return;
        const alquiler = historialAlquileres.find(
            a => String(a.idAlquiler) === item.dataset.idAlquiler
        );
        if (!alquiler) return;

        const boton = evento.target.closest('[data-accion]');
        if (!boton) {
            await seleccionarAlquiler(alquiler);
            document.querySelector('.estado-reserva')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        const icono = boton.querySelector('i');
        const claseOriginal = icono?.className;
        boton.disabled = true;
        if (icono) icono.className = 'fa-solid fa-spinner fa-spin';
        try {
            const comprobante = await window.CarmovoClienteApi.obtenerComprobante(
                sesionActual.idUsuario,
                alquiler.idAlquiler
            );
            if (!comprobante) return;
            if (boton.dataset.accion === 'ver-comprobante') {
                await window.CarmovoComprobante?.previsualizar(comprobante);
            } else {
                await window.CarmovoComprobante?.descargarPdf(comprobante);
            }
        } catch (error) {
            console.error('No se pudo obtener el comprobante:', error);
            alert('No se pudo obtener el comprobante. Inténtalo nuevamente.');
        } finally {
            boton.disabled = false;
            if (icono) icono.className = claseOriginal;
        }
    });

    document.getElementById('historial-lista')?.addEventListener('keydown', evento => {
        if ((evento.key === 'Enter' || evento.key === ' ') && evento.target.classList.contains('historial-item')) {
            evento.preventDefault();
            evento.target.click();
        }
    });

    async function cargarUltimoAlquiler() {
        try {
            const alquiler =
                await window.CarmovoClienteApi.obtenerUltimoAlquiler(
                    sesionActual.idUsuario
                );

            idAlquilerSeleccionado = alquiler?.idAlquiler ?? null;
            configurarEstadoAlquiler(alquiler);
            await cargarComprobante(alquiler);

        } catch (error) {
            console.error(
                'No se pudo cargar el último alquiler:',
                error
            );

            configurarEstadoAlquiler(null);
        }
    }

    // =========================================================
    // CARGA DEL PERFIL
    // =========================================================

    async function cargarPerfil() {
        const sesionLegacy = { ...sesionActual };

        try {
            perfilActual =
                await window.CarmovoClienteApi.obtenerPerfil(
                    sesionActual.idUsuario
                );

            const perfilIncompleto =
                !perfilActual.documento ||
                !perfilActual.fechaNacimiento ||
                !perfilActual.departamento ||
                !perfilActual.provincia ||
                !perfilActual.distrito ||
                !perfilActual.domicilio ||
                !perfilActual.numeroLicencia ||
                !perfilActual.categoriaLicencia ||
                !perfilActual.vencimientoLicencia;

            const legacyCompleto =
                sesionLegacy.documento &&
                sesionLegacy.nacimiento &&
                sesionLegacy.departamento &&
                sesionLegacy.provincia &&
                sesionLegacy.distrito &&
                sesionLegacy.domicilio &&
                sesionLegacy.licencia &&
                sesionLegacy.categoria &&
                sesionLegacy.venceLicencia;

            if (perfilIncompleto && legacyCompleto) {
                try {
                    perfilActual =
                        await window.CarmovoClienteApi.actualizarPerfil(
                            sesionActual.idUsuario,
                            {
                                nombres:
                                    perfilActual.nombres ||
                                    sesionLegacy.nombres,

                                apellidos:
                                    perfilActual.apellidos ||
                                    sesionLegacy.apellidos,

                                correo:
                                    perfilActual.correo ||
                                    sesionLegacy.correo,

                                telefono:
                                    perfilActual.telefono ||
                                    sesionLegacy.telefono,

                                documento:
                                sesionLegacy.documento,

                                fechaNacimiento:
                                sesionLegacy.nacimiento,

                                departamento:
                                sesionLegacy.departamento,

                                provincia:
                                sesionLegacy.provincia,

                                distrito:
                                sesionLegacy.distrito,

                                domicilio:
                                sesionLegacy.domicilio,

                                numeroLicencia:
                                sesionLegacy.licencia,

                                categoriaLicencia:
                                sesionLegacy.categoria,

                                vencimientoLicencia:
                                sesionLegacy.venceLicencia
                            }
                        );

                } catch (errorMigracion) {
                    console.warn(
                        'No se pudieron migrar los datos antiguos:',
                        errorMigracion
                    );
                }
            }

            renderizarPerfil(perfilActual);
            guardarSesionBasica(perfilActual);

        } catch (error) {
            console.error(
                'No se pudo cargar el perfil:',
                error
            );

            renderizarPerfil({
                nombres: sesionActual.nombres,
                apellidos: sesionActual.apellidos,
                correo: sesionActual.correo,
                telefono: sesionActual.telefono
            });
        }
    }

    // =========================================================
    // APERTURA Y CIERRE DE MODALES
    // =========================================================

    function cerrarModalEditar() {
        modalEditarCuenta?.classList.add('oculto');
        modalEditarCuenta?.classList.remove('activo');

        limpiarErrores();
    }

    function cerrarModalExito() {
        modalExito?.classList.add('oculto');
        modalExito?.classList.remove('activo');
    }

    if (btnEditarPerfil && modalEditarCuenta) {
        btnEditarPerfil.addEventListener('click', async () => {
            if (!perfilActual || cargandoFormulario) {
                return;
            }

            cargandoFormulario = true;

            modalEditarCuenta.classList.remove('oculto');
            modalEditarCuenta.classList.add('activo');

            try {
                await rellenarFormularioPerfil(
                    perfilActual
                );
            } catch (error) {
                console.error(
                    'Error al preparar Editar Perfil:',
                    error
                );

                mostrarErrorGeneral(
                    'No se pudo preparar el formulario de edición.'
                );
            } finally {
                cargandoFormulario = false;
            }
        });
    }

    document.querySelectorAll(
        '#modal-editar-cuenta .btn-cerrar-modal'
    ).forEach(boton => {
        boton.addEventListener('click', evento => {
            evento.preventDefault();
            cerrarModalEditar();
        });
    });

    document.querySelectorAll(
        '.btn-cerrar-exito-cuenta'
    ).forEach(boton => {
        boton.addEventListener('click', evento => {
            evento.preventDefault();
            cerrarModalExito();
        });
    });

    // =========================================================
    // EVENTOS DE UBICACIÓN
    // =========================================================

    if (
        selectDepartamento &&
        selectProvincia &&
        selectDistrito
    ) {
        selectDepartamento.addEventListener('change', () => {
            llenarProvincias();

            limpiarErrorCampo('departamento');
            limpiarErrorCampo('provincia');
            limpiarErrorCampo('distrito');
            limpiarErrorGeneral();
        });

        selectProvincia.addEventListener('change', () => {
            llenarDistritos();

            limpiarErrorCampo('provincia');
            limpiarErrorCampo('distrito');
            limpiarErrorGeneral();
        });

        selectDistrito.addEventListener('change', () => {
            limpiarErrorCampo('distrito');
            limpiarErrorGeneral();
        });
    }

    CAMPOS_PERFIL.forEach(nombre => {
        const input = campo(nombre);

        if (!input) return;

        input.addEventListener('input', () => {
            limpiarErrorCampo(nombre);
            limpiarErrorGeneral();
        });

        input.addEventListener('change', () => {
            limpiarErrorCampo(nombre);
            limpiarErrorGeneral();
        });
    });

    // =========================================================
    // GUARDAR CAMBIOS
    // =========================================================

    if (formEditarCuenta) {
        formEditarCuenta.addEventListener(
            'submit',
            async evento => {
                evento.preventDefault();

                if (cargandoFormulario) {
                    return;
                }

                const datos = obtenerDatosFormulario();

                if (!validarFormularioPerfil(datos)) {
                    return;
                }

                const botonGuardar = formEditarCuenta.querySelector(
                    'button[type="submit"]'
                );

                try {
                    if (botonGuardar) {
                        botonGuardar.disabled = true;
                    }

                    const perfilActualizado =
                        await window.CarmovoClienteApi.actualizarPerfil(
                            sesionActual.idUsuario,
                            datos
                        );

                    perfilActual = perfilActualizado;

                    renderizarPerfil(perfilActual);
                    guardarSesionBasica(perfilActual);

                    cerrarModalEditar();

                    modalExito?.classList.remove('oculto');
                    modalExito?.classList.add('activo');

                    const botonLogin =
                        document.querySelector('.boton-login');

                    if (botonLogin) {
                        const primerNombre =
                            perfilActual.nombres?.split(' ')[0] ||
                            'Cliente';

                        botonLogin.replaceChildren();

                        const icono = document.createElement('i');
                        icono.className = 'fa-solid fa-user';

                        botonLogin.append(
                            icono,
                            document.createTextNode(
                                ` Hola, ${primerNombre}`
                            )
                        );
                    }

                } catch (error) {
                    console.error(
                        'Error al actualizar el perfil:',
                        error
                    );

                    // Ningún error de guardado abre alert().
                    mostrarErrorServidor(error);

                } finally {
                    if (botonGuardar) {
                        botonGuardar.disabled = false;
                    }
                }
            }
        );
    }

    // =========================================================
    // INICIALIZACIÓN
    // =========================================================

    await cargarPerfil();
    await cargarUltimoAlquiler();
    await cargarHistorial();
});
