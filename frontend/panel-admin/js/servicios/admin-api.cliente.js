(function () {
    const API_BASE = 'http://localhost:8080/api/v1';
    const CLAVE_SESION = 'carmovo_admin_sesion';

    function obtenerSesionLocal() {
        try {
            return JSON.parse(sessionStorage.getItem(CLAVE_SESION) || 'null');
        } catch (_) {
            return null;
        }
    }

    function guardarSesionLocal(sesion) {
        sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
        return sesion;
    }

    function limpiarSesionLocal() {
        sessionStorage.removeItem(CLAVE_SESION);
    }

    function obtenerToken() {
        return obtenerSesionLocal()?.token || null;
    }

    function estaEnLogin() {
        return window.location.pathname.endsWith('/login-admin.html');
    }

    function redirigirAlLogin() {
        if (!estaEnLogin()) {
            window.location.replace('login-admin.html');
        }
    }

    async function solicitar(ruta, opciones = {}) {
        const {
            sinAutenticacion = false,
            headers: headersPersonalizados = {},
            ...configuracion
        } = opciones;

        const headers = {
            'Content-Type': 'application/json',
            ...headersPersonalizados
        };

        if (!sinAutenticacion) {
            const token = obtenerToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
        }

        let respuesta;
        try {
            respuesta = await fetch(`${API_BASE}${ruta}`, {
                ...configuracion,
                headers
            });
        } catch (_) {
            throw new Error('No se pudo conectar con la API de CARMOVO.');
        }

        if (!respuesta.ok) {
            let mensaje = `Error HTTP ${respuesta.status}`;

            try {
                const detalle = await respuesta.json();
                mensaje = detalle.message || detalle.detail || detalle.error || mensaje;
            } catch (_) {
                // Si el backend no devuelve JSON, conservamos el mensaje HTTP.
            }

            if (respuesta.status === 401 && !sinAutenticacion) {
                limpiarSesionLocal();
                redirigirAlLogin();
            }

            throw new Error(mensaje);
        }

        if (respuesta.status === 204) return null;
        return respuesta.json();
    }

    window.CarmovoAdminApi = {
        obtenerSesionLocal,
        guardarSesionLocal,
        limpiarSesionLocal,
        obtenerToken,

        async iniciarSesion(correo, contrasena) {
            const sesion = await solicitar('/admin/autenticacion/login', {
                method: 'POST',
                body: JSON.stringify({ correo, contrasena }),
                sinAutenticacion: true
            });
            return guardarSesionLocal(sesion);
        },
        async validarSesion() {
            const sesion = await solicitar('/admin/autenticacion/sesion');
            return guardarSesionLocal(sesion);
        },
        async cerrarSesion() {
            try {
                if (obtenerToken()) {
                    await solicitar('/admin/autenticacion/logout', { method: 'POST' });
                }
            } finally {
                limpiarSesionLocal();
            }
        },

        listarVehiculos() {
            return solicitar('/vehiculos');
        },
        obtenerVehiculo(id) {
            return solicitar(`/vehiculos/${id}`);
        },
        crearVehiculo(datos) {
            return solicitar('/vehiculos', {
                method: 'POST',
                body: JSON.stringify(datos)
            });
        },
        actualizarVehiculo(id, datos) {
            return solicitar(`/vehiculos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(datos)
            });
        },
        eliminarVehiculo(id) {
            return solicitar(`/vehiculos/${id}`, { method: 'DELETE' });
        },

        listarUsuarios() {
            return solicitar('/admin/usuarios');
        },
        obtenerUsuario(id) {
            return solicitar(`/admin/usuarios/${id}`);
        },
        crearUsuario(datos) {
            return solicitar('/admin/usuarios', {
                method: 'POST',
                body: JSON.stringify(datos)
            });
        },
        actualizarUsuario(id, datos) {
            return solicitar(`/admin/usuarios/${id}`, {
                method: 'PUT',
                body: JSON.stringify(datos)
            });
        },
        eliminarUsuario(id) {
            return solicitar(`/admin/usuarios/${id}`, { method: 'DELETE' });
        },
        listarPerfiles() {
            return solicitar('/admin/perfiles');
        },

        listarAlquileres() {
            return solicitar('/admin/alquileres');
        },
        obtenerAlquiler(id) {
            return solicitar(`/admin/alquileres/${id}`);
        },
        crearAlquiler(datos) {
            return solicitar('/admin/alquileres', {
                method: 'POST',
                body: JSON.stringify(datos)
            });
        },
        actualizarAlquiler(id, datos) {
            return solicitar(`/admin/alquileres/${id}`, {
                method: 'PUT',
                body: JSON.stringify(datos)
            });
        },
        cambiarEstadoAlquiler(id, estado) {
            return solicitar(`/admin/alquileres/${id}/estado`, {
                method: 'PATCH',
                body: JSON.stringify({ estado })
            });
        },
        eliminarAlquiler(id) {
            return solicitar(`/admin/alquileres/${id}`, { method: 'DELETE' });
        },

        listarPagos() {
            return solicitar('/admin/pagos');
        },
        obtenerPago(idAlquiler) {
            return solicitar(`/admin/pagos/${idAlquiler}`);
        },
        actualizarPago(idAlquiler, datos) {
            return solicitar(`/admin/pagos/${idAlquiler}`, {
                method: 'PATCH',
                body: JSON.stringify(datos)
            });
        },

        listarAuditoria() {
            return solicitar('/admin/auditoria');
        },
        obtenerAuditoria(id) {
            return solicitar(`/admin/auditoria/${id}`);
        }
    };
})();
