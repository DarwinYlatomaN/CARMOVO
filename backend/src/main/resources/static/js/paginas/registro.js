
document.addEventListener('DOMContentLoaded', () => {

    function configurarTogglePassword(btnId, inputId) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);

        if (btn && input) {
            btn.addEventListener('click', () => {
                const tipoActual = input.getAttribute('type');
                const icono = btn.querySelector('i');

                if (tipoActual === 'password') {
                    input.setAttribute('type', 'text');

                    if (icono) {
                        icono.classList.remove('fa-eye');
                        icono.classList.add('fa-eye-slash');
                    }
                } else {
                    input.setAttribute('type', 'password');

                    if (icono) {
                        icono.classList.remove('fa-eye-slash');
                        icono.classList.add('fa-eye');
                    }
                }
            });
        }
    }

    configurarTogglePassword('btnMostrarPassword1', 'contrasena');
    configurarTogglePassword('btnMostrarPassword2', 'confirmarContrasena');

    const formularioRegistro = document.getElementById('formularioRegistro');
    const inputPassword1 = document.getElementById('contrasena');
    const inputPassword2 = document.getElementById('confirmarContrasena');
    const mensajeError = document.getElementById('mensajeErrorRegistro');

    if (!formularioRegistro || !inputPassword1 || !inputPassword2 || !mensajeError) {
        return;
    }

    const selectDepartamento = document.getElementById('departamento');
    const selectProvincia = document.getElementById('provincia');
    const selectDistrito = document.getElementById('distrito');

    const RUTA_UBIGEOS = '/data/UBIGEOS_2022_1891_distritos.csv';

    const campos = [
        'nombres',
        'apellidos',
        'correo',
        'telefono',
        'documento',
        'fechaNacimiento',
        'departamento',
        'provincia',
        'distrito',
        'domicilio',
        'numeroLicencia',
        'categoriaLicencia',
        'vencimientoLicencia',
        'contrasena',
        'confirmarContrasena'
    ];

    let catalogoUbigeos = new Map();
    let catalogoCargado = false;

    function obtenerCampo(id) {
        return document.getElementById(id);
    }

    function obtenerValor(id) {
        const campo = obtenerCampo(id);
        return campo ? campo.value.trim() : '';
    }

    function mostrarError(mensaje, idsCampos = []) {
        mensajeError.textContent = mensaje;
        mensajeError.style.display = 'block';

        idsCampos.forEach((id) => {
            const campo = obtenerCampo(id);

            if (campo) {
                campo.classList.add('is-invalid');

                const contenedor = campo.closest('.campo-input-registro');

                if (contenedor) {
                    contenedor.classList.add('campo-input-error');
                }
            }
        });
    }

    function limpiarErrores() {
        mensajeError.textContent = '';
        mensajeError.style.display = 'none';

        campos.forEach((id) => {
            const campo = obtenerCampo(id);

            if (campo) {
                campo.classList.remove('is-invalid');

                const contenedor = campo.closest('.campo-input-registro');

                if (contenedor) {
                    contenedor.classList.remove('campo-input-error');
                }
            }
        });
    }

    function obtenerFechaLocalActual() {
        const fecha = new Date();

        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');

        return `${anio}-${mes}-${dia}`;
    }

    function normalizarUbicacion(valor) {
        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .replace(/\s+/g, ' ')
            .toUpperCase();
    }

    function crearOpcion(valor, texto) {
        const opcion = document.createElement('option');
        opcion.value = valor;
        opcion.textContent = texto;
        return opcion;
    }

    function reiniciarSelector(selector, mensaje) {
        if (!selector) {
            return;
        }

        selector.replaceChildren(crearOpcion('', mensaje));
        selector.value = '';
        selector.disabled = true;
    }

    function buscarDepartamento(nombre) {
        return catalogoUbigeos.get(normalizarUbicacion(nombre));
    }

    function buscarProvincia(departamento, nombreProvincia) {
        if (!departamento) {
            return null;
        }

        return departamento.provincias.get(
            normalizarUbicacion(nombreProvincia)
        );
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

        if (!catalogoCargado || !selectDepartamento || !selectProvincia) {
            return;
        }

        const departamento = buscarDepartamento(
            selectDepartamento.value
        );

        if (!departamento) {
            return;
        }

        const provincias = Array.from(
            departamento.provincias.values()
        ).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

        provincias.forEach((provincia) => {
            selectProvincia.appendChild(
                crearOpcion(provincia.nombre, provincia.nombre)
            );
        });

        selectProvincia.disabled = false;

        if (valorAnterior) {
            const provinciaAnterior = buscarProvincia(
                departamento,
                valorAnterior
            );

            if (provinciaAnterior) {
                selectProvincia.value = provinciaAnterior.nombre;
            }
        }
    }

    function llenarDistritos(valorAnterior = '') {
        reiniciarSelector(
            selectDistrito,
            'Selecciona un distrito'
        );

        if (!catalogoCargado
            || !selectDepartamento
            || !selectProvincia
            || !selectDistrito) {
            return;
        }

        const departamento = buscarDepartamento(
            selectDepartamento.value
        );

        const provincia = buscarProvincia(
            departamento,
            selectProvincia.value
        );

        if (!provincia) {
            return;
        }

        const distritos = Array.from(
            provincia.distritos.values()
        ).sort((a, b) => a.localeCompare(b, 'es'));

        distritos.forEach((distrito) => {
            selectDistrito.appendChild(
                crearOpcion(distrito, distrito)
            );
        });

        selectDistrito.disabled = false;

        if (valorAnterior) {
            const distritoAnterior = provincia.distritos.get(
                normalizarUbicacion(valorAnterior)
            );

            if (distritoAnterior) {
                selectDistrito.value = distritoAnterior;
            }
        }
    }

    function procesarCsvUbigeos(contenido) {
        const nuevoCatalogo = new Map();
        const lineas = contenido.replace(/^\uFEFF/, '').split(/\r?\n/);

        if (lineas.length < 2) {
            throw new Error('El archivo de ubigeos está vacío.');
        }

        const encabezados = lineas[0]
            .split(';')
            .map((columna) => columna.trim().toUpperCase());

        const indiceDepartamento = encabezados.indexOf('NOMBDEP');
        const indiceProvincia = encabezados.indexOf('NOMBPROV');
        const indiceDistrito = encabezados.indexOf('NOMBDIST');
        const indiceCodigo = encabezados.indexOf('IDDIST');

        if (indiceDepartamento === -1
            || indiceProvincia === -1
            || indiceDistrito === -1
            || indiceCodigo === -1) {
            throw new Error(
                'El archivo CSV no contiene las columnas de ubigeo esperadas.'
            );
        }

        let registrosValidos = 0;

        for (let i = 1; i < lineas.length; i++) {
            const columnas = lineas[i].split(';');

            if (columnas.length < encabezados.length) {
                continue;
            }

            const codigo = columnas[indiceCodigo].trim();
            const nombreDepartamento = columnas[indiceDepartamento].trim();
            const nombreProvincia = columnas[indiceProvincia].trim();
            const nombreDistrito = columnas[indiceDistrito].trim();

            // Se ignoran notas y filas que no correspondan a un distrito.
            if (!/^\d{5,6}$/.test(codigo)
                || !nombreDepartamento
                || !nombreProvincia
                || !nombreDistrito) {
                continue;
            }

            const claveDepartamento = normalizarUbicacion(
                nombreDepartamento
            );
            const claveProvincia = normalizarUbicacion(
                nombreProvincia
            );
            const claveDistrito = normalizarUbicacion(
                nombreDistrito
            );

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

        if (registrosValidos === 0 || nuevoCatalogo.size === 0) {
            throw new Error(
                'No se encontraron ubicaciones válidas en el CSV.'
            );
        }

        return nuevoCatalogo;
    }

    async function cargarUbigeos() {
        if (!selectDepartamento || !selectProvincia || !selectDistrito) {
            return;
        }

        const departamentoAnterior = selectDepartamento.value;
        const provinciaAnterior = selectProvincia.value;
        const distritoAnterior = selectDistrito.value;

        reiniciarSelector(
            selectProvincia,
            'Cargando provincias...'
        );

        reiniciarSelector(
            selectDistrito,
            'Selecciona primero una provincia'
        );

        try {
            const respuesta = await fetch(RUTA_UBIGEOS, {
                cache: 'no-store'
            });

            if (!respuesta.ok) {
                throw new Error(
                    'No se pudo descargar el catálogo de ubicaciones.'
                );
            }

            const datosBinarios = await respuesta.arrayBuffer();

            const decodificador = new TextDecoder('windows-1252');
            const contenidoCsv = decodificador.decode(datosBinarios);

            catalogoUbigeos = procesarCsvUbigeos(contenidoCsv);
            catalogoCargado = true;

            // Los departamentos siguen viniendo de VistaController.
            // El CSV proporciona las provincias y los distritos.
            if (departamentoAnterior) {
                const departamento = buscarDepartamento(
                    departamentoAnterior
                );

                if (departamento) {
                    llenarProvincias(provinciaAnterior);
                    llenarDistritos(distritoAnterior);
                }
            } else {
                reiniciarSelector(
                    selectProvincia,
                    'Selecciona primero un departamento'
                );
            }

        } catch (error) {
            catalogoCargado = false;

            reiniciarSelector(
                selectProvincia,
                'No se pudieron cargar las provincias'
            );

            reiniciarSelector(
                selectDistrito,
                'No se pudieron cargar los distritos'
            );

            mostrarError(
                'No se pudo cargar el catálogo de departamentos, provincias y distritos. Recarga la página.'
            );

            console.error('Error al cargar ubigeos:', error);
        }
    }

    if (selectDepartamento && selectProvincia && selectDistrito) {
        selectDepartamento.addEventListener('change', () => {
            llenarProvincias();
        });

        selectProvincia.addEventListener('change', () => {
            llenarDistritos();
        });

        cargarUbigeos();
    }

    function validarUbicacion(datos) {
        if (!catalogoCargado) {
            mostrarError(
                'El catálogo de ubicaciones todavía no está disponible.'
            );
            return false;
        }

        const departamento = buscarDepartamento(
            datos.departamento
        );

        if (!departamento) {
            mostrarError(
                'Selecciona un departamento válido.',
                ['departamento']
            );
            return false;
        }

        const provincia = buscarProvincia(
            departamento,
            datos.provincia
        );

        if (!provincia) {
            mostrarError(
                'Selecciona una provincia del departamento indicado.',
                ['provincia']
            );
            return false;
        }

        if (!provincia.distritos.has(
            normalizarUbicacion(datos.distrito)
        )) {
            mostrarError(
                'Selecciona un distrito de la provincia indicada.',
                ['distrito']
            );
            return false;
        }

        return true;
    }

    function normalizarTextoPersonal(valor) {
        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    function contrasenaContieneDatosPersonales(datos) {
        const clave = normalizarTextoPersonal(datos.contrasena);

        if (datos.documento && clave.includes(datos.documento)) {
            return true;
        }

        const nombresYApellidos = [
            datos.nombres,
            datos.apellidos
        ];

        for (const dato of nombresYApellidos) {
            const normalizado = normalizarTextoPersonal(dato);

            if (normalizado.length >= 3 && clave.includes(normalizado)) {
                return true;
            }

            const partes = normalizado.split(/[\s'-]+/);

            for (const parte of partes) {
                if (parte.length >= 3 && clave.includes(parte)) {
                    return true;
                }
            }
        }

        if (datos.fechaNacimiento) {
            const fechaCompacta = datos.fechaNacimiento.replace(/-/g, '');
            const partesFecha = datos.fechaNacimiento.split('-');

            const fechaInversa = partesFecha.length === 3
                ? `${partesFecha[2]}${partesFecha[1]}${partesFecha[0]}`
                : '';

            if (clave.includes(fechaCompacta)
                || (fechaInversa && clave.includes(fechaInversa))
                || clave.includes(datos.fechaNacimiento)) {
                return true;
            }
        }

        return false;
    }

    function validarFormulario(datos, confirmarContrasena) {

        const camposObligatorios = [
            ['nombres', datos.nombres],
            ['apellidos', datos.apellidos],
            ['correo', datos.correo],
            ['telefono', datos.telefono],
            ['documento', datos.documento],
            ['fechaNacimiento', datos.fechaNacimiento],
            ['departamento', datos.departamento],
            ['provincia', datos.provincia],
            ['distrito', datos.distrito],
            ['domicilio', datos.domicilio],
            ['numeroLicencia', datos.numeroLicencia],
            ['categoriaLicencia', datos.categoriaLicencia],
            ['vencimientoLicencia', datos.vencimientoLicencia],
            ['contrasena', datos.contrasena],
            ['confirmarContrasena', confirmarContrasena]
        ];

        for (const [campo, valor] of camposObligatorios) {
            if (!valor) {
                mostrarError(
                    'Completa todos los campos obligatorios.',
                    [campo]
                );
                return false;
            }
        }

        const expresionNombres = /^(?=.{3,100}$)\p{L}+(?:[ '-]\p{L}+)*$/u;

        if (!expresionNombres.test(datos.nombres)) {
            mostrarError(
                'Los nombres deben tener al menos 3 caracteres y contener solo letras.',
                ['nombres']
            );
            return false;
        }

        if (!expresionNombres.test(datos.apellidos)) {
            mostrarError(
                'Los apellidos deben tener al menos 3 caracteres y contener solo letras.',
                ['apellidos']
            );
            return false;
        }

        const expresionCorreo = /^[A-Za-z0-9._%+-]+@gmail\.com$/i;

        if (!expresionCorreo.test(datos.correo)) {
            mostrarError(
                'Ingresa un correo electrónico válido que termine en @gmail.com.',
                ['correo']
            );
            return false;
        }

        if (!/^9[0-9]{8}$/.test(datos.telefono)) {
            mostrarError(
                'El teléfono debe tener exactamente 9 números y comenzar con 9.',
                ['telefono']
            );
            return false;
        }

        if (!/^[0-9]{8}$/.test(datos.documento)) {
            mostrarError(
                'El DNI debe contener exactamente 8 números.',
                ['documento']
            );
            return false;
        }

        const fechaActual = obtenerFechaLocalActual();

        if (datos.fechaNacimiento > fechaActual) {
            mostrarError(
                'La fecha de nacimiento no puede ser futura.',
                ['fechaNacimiento']
            );
            return false;
        }

        // Validar la mayoría de edad considerando año, mes y día.
        const [anioNacimiento, mesNacimiento, diaNacimiento] =
            datos.fechaNacimiento.split('-').map(Number);

        const hoy = new Date();

        let edad = hoy.getFullYear() - anioNacimiento;

        const yaCumplioAnios =
            hoy.getMonth() + 1 > mesNacimiento ||
            (hoy.getMonth() + 1 === mesNacimiento &&
                hoy.getDate() >= diaNacimiento);

        if (!yaCumplioAnios) {
            edad--;
        }

        if (edad < 18) {
            mostrarError(
                'Debes tener al menos 18 años para registrarte en CARMOVO.',
                ['fechaNacimiento']
            );
            return false;
        }

        if (!validarUbicacion(datos)) {
            return false;
        }

        if (datos.domicilio.length > 200) {
            mostrarError(
                'El domicilio no puede superar los 200 caracteres.',
                ['domicilio']
            );
            return false;
        }

        // Validación provisional de formato.
        // No comprueba la existencia oficial del brevete.
        const expresionLicencia = /^[A-Za-z]-?[0-9]{6,12}E?$/i;

        if (!expresionLicencia.test(datos.numeroLicencia)) {
            mostrarError(
                'La licencia debe comenzar con una letra, continuar con 6 a 12 números y puede terminar en E.',
                ['numeroLicencia']
            );
            return false;
        }

        const categoriasValidas = [
            'A-I',
            'A-IIA',
            'A-IIB',
            'A-IIIA',
            'A-IIIB',
            'A-IIIC'
        ];

        if (!categoriasValidas.includes(
            datos.categoriaLicencia.toUpperCase()
        )) {
            mostrarError(
                'Selecciona una categoría de licencia válida.',
                ['categoriaLicencia']
            );
            return false;
        }

        if (datos.vencimientoLicencia < fechaActual) {
            mostrarError(
                'La licencia de conducir no debe estar vencida.',
                ['vencimientoLicencia']
            );
            return false;
        }

        if (datos.contrasena.length < 8
            || datos.contrasena.length > 12) {
            mostrarError(
                'La contraseña debe tener entre 8 y 12 caracteres.',
                ['contrasena']
            );
            return false;
        }

        const expresionContrasena =
            /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%*_\-])[^\s].*[^\s]$/;

        if (!expresionContrasena.test(datos.contrasena)) {
            mostrarError(
                'La contraseña debe incluir una mayúscula, una minúscula, un número y un símbolo (@, #, $, %, *, _ o -), sin espacios al inicio ni al final.',
                ['contrasena']
            );
            return false;
        }

        if (contrasenaContieneDatosPersonales(datos)) {
            mostrarError(
                'La contraseña no debe contener tu DNI, nombres, apellidos ni fecha de nacimiento.',
                ['contrasena']
            );
            return false;
        }

        if (datos.contrasena !== confirmarContrasena) {
            mostrarError(
                'Las contraseñas no coinciden.',
                ['contrasena', 'confirmarContrasena']
            );
            return false;
        }

        return true;
    }

    function interpretarErrorBackend(error) {
        return error && error.message
            ? error.message
            : 'No se pudo registrar la cuenta.';
    }

    formularioRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();

        limpiarErrores();

        const nombres = obtenerValor('nombres');
        const apellidos = obtenerValor('apellidos');
        const correo = obtenerValor('correo');
        const telefono = obtenerValor('telefono');
        const documento = obtenerValor('documento');
        const nacimiento = obtenerValor('fechaNacimiento');
        const departamento = obtenerValor('departamento');
        const provincia = obtenerValor('provincia');
        const distrito = obtenerValor('distrito');
        const domicilio = obtenerValor('domicilio');
        const licencia = obtenerValor('numeroLicencia');
        const categoria = obtenerValor('categoriaLicencia');
        const venceLicencia = obtenerValor('vencimientoLicencia');

        const pass1 = inputPassword1.value;
        const pass2 = inputPassword2.value;

        const btnSubmit = formularioRegistro.querySelector(
            'button[type="submit"]'
        );

        const datosRegistro = {
            nombres,
            apellidos,
            correo,
            contrasena: pass1,
            telefono,
            documento,
            fechaNacimiento: nacimiento,
            departamento,
            provincia,
            distrito,
            domicilio,
            numeroLicencia: licencia,
            categoriaLicencia: categoria,
            vencimientoLicencia: venceLicencia
        };

        if (!validarFormulario(datosRegistro, pass2)) {
            return;
        }

        if (!window.CarmovoClienteApi) {
            mostrarError(
                'No se pudo cargar el servicio de clientes de CARMOVO.'
            );
            return;
        }

        try {
            if (btnSubmit) {
                btnSubmit.disabled = true;
            }

            const usuario = await window.CarmovoClienteApi.registrar(
                datosRegistro
            );

            const nombreCompleto = (
                `${usuario.nombres || nombres} ${usuario.apellidos || apellidos}`
            ).trim();

            const sesion = {
                logueado: true,
                idUsuario: usuario.idUsuario,
                nombre: nombreCompleto,
                nombres: usuario.nombres || nombres,
                apellidos: usuario.apellidos || apellidos,
                correo: usuario.correo || correo,
                telefono: usuario.telefono || telefono,
                perfil: usuario.nombrePerfil || 'Cliente'
            };

            // MySQL es la fuente de verdad del perfil completo.
            // En el navegador solo conservamos los datos mínimos de sesión.
            localStorage.setItem(
                'carmovo_sesion',
                JSON.stringify(sesion)
            );

            localStorage.setItem(
                'usuarioCarmovoLogueado',
                'true'
            );

            localStorage.removeItem('carmovo_usuarios');

            window.location.href = '/miCuenta';

        } catch (error) {
            mostrarError(interpretarErrorBackend(error));

        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
            }
        }
    });

});
