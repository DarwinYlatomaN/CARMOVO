/* =========================================================
   CARMOVO - Cliente de la API para el sitio público
   - Guarda la sesión del cliente (incluye el token JWT).
   - Envía "Authorization: Bearer <token>" en cada petición privada.
   - Si el servidor responde 401 (token vencido o inválido),
     cierra la sesión y lleva al cliente al login.
   ========================================================= */
(() => {
    const API_BASE = '/api/v1/clientes';
    const CLAVE_SESION = 'carmovo_sesion';

    function obtenerSesion() {
        try {
            const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null');
            return sesion?.logueado && sesion?.token ? sesion : null;
        } catch (_) {
            return null;
        }
    }

    function guardarSesion(usuario) {
        const nombreCompleto = `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim();
        const sesion = {
            logueado: true,
            idUsuario: usuario.idUsuario,
            token: usuario.token,
            nombre: nombreCompleto || usuario.correo,
            nombres: usuario.nombres || '',
            apellidos: usuario.apellidos || '',
            correo: usuario.correo,
            telefono: usuario.telefono || '',
            perfil: usuario.nombrePerfil || 'Cliente'
        };
        localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
        localStorage.setItem('usuarioCarmovoLogueado', 'true');
        localStorage.removeItem('carmovo_usuarios');
        return sesion;
    }

    function cerrarSesion() {
        localStorage.removeItem(CLAVE_SESION);
        localStorage.removeItem('usuarioCarmovoLogueado');
    }

    /** Cabeceras para peticiones privadas del cliente. */
    function cabeceras(extra = {}) {
        const sesion = obtenerSesion();
        return sesion
            ? { ...extra, Authorization: `Bearer ${sesion.token}` }
            : { ...extra };
    }

    function sesionExpirada() {
        cerrarSesion();
        const ruta = window.location.pathname;
        if (ruta !== '/login') {
            window.location.href = `/login?expirada=1&volver=${encodeURIComponent(ruta)}`;
        }
    }

    async function leerRespuesta(respuesta, { privada = false } = {}) {
        let cuerpo = null;

        try {
            const texto = await respuesta.text();
            if (texto) {
                try {
                    cuerpo = JSON.parse(texto);
                } catch (_) {
                    cuerpo = { message: texto };
                }
            }
        } catch (_) {
            cuerpo = null;
        }

        if (privada && respuesta.status === 401) {
            sesionExpirada();
        }

        if (!respuesta.ok) {
            const mensaje =
                cuerpo?.detail ||
                cuerpo?.message ||
                cuerpo?.mensaje ||
                cuerpo?.error ||
                `Error HTTP ${respuesta.status}`;

            const error = new Error(String(mensaje));
            error.status = respuesta.status;
            error.cuerpo = cuerpo;

            if (cuerpo?.errores) {
                error.errores = cuerpo.errores;
            } else if (cuerpo?.errors) {
                error.errores = cuerpo.errors;
            }
            if (cuerpo?.detail) {
                error.detalle = cuerpo.detail;
            }
            throw error;
        }

        return cuerpo;
    }

    /** Petición privada: siempre lleva el token del cliente. */
    async function privada(url, opciones = {}) {
        const respuesta = await fetch(url, {
            ...opciones,
            headers: cabeceras(opciones.headers || {})
        });
        return respuesta;
    }

    async function registrar(datos) {
        const respuesta = await fetch(`${API_BASE}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        return leerRespuesta(respuesta);
    }

    async function iniciarSesion(correo, contrasena) {
        const respuesta = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
        });
        return leerRespuesta(respuesta);
    }

    async function solicitarRecuperacion(correo) {
        const respuesta = await fetch(`${API_BASE}/recuperar/solicitar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo })
        });
        return leerRespuesta(respuesta);
    }

    async function restablecerContrasena(token, contrasena) {
        const respuesta = await fetch(`${API_BASE}/recuperar/confirmar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, contrasena })
        });
        return leerRespuesta(respuesta);
    }

    async function obtenerPerfil(idUsuario) {
        const respuesta = await privada(`${API_BASE}/${idUsuario}`);
        return leerRespuesta(respuesta, { privada: true });
    }

    async function actualizarPerfil(idUsuario, datos) {
        const respuesta = await privada(`${API_BASE}/${idUsuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        return leerRespuesta(respuesta, { privada: true });
    }

    async function obtenerUltimoAlquiler(idUsuario) {
        const respuesta = await privada(`${API_BASE}/${idUsuario}/alquileres/ultimo`);
        return leerRespuesta(respuesta, { privada: true });
    }

    async function listarAlquileres(idUsuario) {
        const respuesta = await privada(`${API_BASE}/${idUsuario}/alquileres`);
        return leerRespuesta(respuesta, { privada: true });
    }

    async function obtenerComprobante(idUsuario, idAlquiler) {
        const respuesta = await privada(
            `${API_BASE}/${idUsuario}/comprobantes/alquiler/${idAlquiler}`
        );
        // 404 = el alquiler todavía no tiene comprobante.
        if (respuesta.status === 404) {
            return null;
        }
        return leerRespuesta(respuesta, { privada: true });
    }

    /** Pasarela de pago: crea el intento o ejecuta un paso (tarjeta, 3ds, yape, plin, efectivo). */
    async function pasarela(ruta, datos = {}) {
        const respuesta = await privada(`/api/v1/reservas/${ruta}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        return leerRespuesta(respuesta, { privada: true });
    }

    /** Sube la foto, captura o PDF del pago (Yape, Plin o transferencia). */
    async function subirConstancia(codigoIntento, archivo) {
        const datos = new FormData();
        datos.append('archivo', archivo);
        const respuesta = await privada(`/api/v1/reservas/pagos/intentos/${encodeURIComponent(codigoIntento)}/constancia`, {
            method: 'POST',
            body: datos
        });
        return leerRespuesta(respuesta, { privada: true });
    }

    /** Consulta de RUC en SUNAT (mismo proveedor que la consulta de DNI) para completar la factura. */
    async function consultarRuc(ruc) {
        const respuesta = await privada(`/api/v1/reservas/ruc/${encodeURIComponent(ruc)}`);
        return leerRespuesta(respuesta, { privada: true });
    }

    async function listarComprobantes(idUsuario) {
        const respuesta = await privada(`${API_BASE}/${idUsuario}/comprobantes`);
        return leerRespuesta(respuesta, { privada: true });
    }

    async function crearReserva(datos) {
        const respuesta = await privada('/api/v1/reservas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        return leerRespuesta(respuesta, { privada: true });
    }

    window.CarmovoClienteApi = {
        obtenerSesion,
        guardarSesion,
        cerrarSesion,
        cabeceras,
        registrar,
        iniciarSesion,
        solicitarRecuperacion,
        restablecerContrasena,
        obtenerPerfil,
        actualizarPerfil,
        obtenerUltimoAlquiler,
        obtenerComprobante,
        listarAlquileres,
        crearReserva,
        pasarela,
        subirConstancia,
        consultarRuc,
        listarComprobantes
    };
})();