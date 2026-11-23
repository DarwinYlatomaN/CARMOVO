
(function () {
    const API_BASE = '/api/v1';
    const RUTA_LOGIN = '/admin/login';
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
        return window.location.pathname === RUTA_LOGIN;
    }

    function redirigirAlLogin() {
        if (!estaEnLogin()) {
            window.location.replace(RUTA_LOGIN);
        }
    }

    function mensajeEstado(estado) {
        switch (estado) {
            case 400: return 'Revisa los datos ingresados.';
            case 401: return 'Debes iniciar sesión para continuar.';
            case 403: return 'No tienes autorización para realizar esta acción.';
            case 404: return 'No se encontró la información solicitada.';
            case 409: return 'Ya existe un registro con esos datos.';
            case 500: return 'Se produjo un error en el servidor. Inténtalo nuevamente.';
            default: return `No se pudo completar la solicitud (HTTP ${estado}).`;
        }
    }

    function mensajeLegible(valor, estado) {
        const texto = String(valor || '').trim();
        return !texto || /^(Forbidden|Conflict|Unauthorized|Bad Request|Not Found|Internal Server Error|Error HTTP \d{3})$/i.test(texto)
            ? mensajeEstado(estado)
            : texto;
    }

    /** Sube una imagen (multipart) con la sesión del panel. */
    async function subirArchivo(ruta, archivo) {
        const datos = new FormData();
        datos.append('archivo', archivo);
        const token = obtenerToken();
        const r = await fetch(`${API_BASE}${ruta}`, {
            method: 'POST', body: datos,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!r.ok) {
            let m = 'No se pudo subir la imagen.';
            try { const j = await r.json(); m = j.detail || j.message || m; } catch (_) { /* sin JSON */ }
            throw new Error(m);
        }
        return r.json();
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
            throw new Error(
                'No se pudo conectar con la API de CARMOVO.'
            );
        }

        if (!respuesta.ok) {
            let mensaje = `Error HTTP ${respuesta.status}`;
            let detalleError = null;

            try {
                detalleError = await respuesta.json();

                mensaje =
                    detalleError.detail ||
                    detalleError.message ||
                    detalleError.error ||
                    mensaje;

            } catch (_) {
                // Si el backend no devuelve JSON,
                // conservamos el mensaje HTTP.
            }

            if (respuesta.status === 401 && !sinAutenticacion) {
                limpiarSesionLocal();
                redirigirAlLogin();
            }

            const error = new Error(mensajeLegible(mensaje, respuesta.status));

            error.status = respuesta.status;
            error.errores = detalleError?.errores || {};
            error.detalle = detalleError?.detail || null;

            throw error;
        }

        if (respuesta.status === 204) {
            return null;
        }

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
            const sesion = await solicitar(
                '/admin/autenticacion/sesion'
            );

            return guardarSesionLocal(sesion);
        },

        async cerrarSesion() {
            try {
                if (obtenerToken()) {
                    await solicitar('/admin/autenticacion/logout', {
                        method: 'POST'
                    });
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
            return solicitar(`/vehiculos/${id}`, {
                method: 'DELETE'
            });
        },

        listarUsuarios() {
            return solicitar('/admin/usuarios');
        },

        // Solo los datos básicos de clientes que se necesitan en Alquileres.
        listarClientesAlquileres() {
            return solicitar('/admin/clientes-alquileres');
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
            return solicitar(`/admin/usuarios/${id}`, {
                method: 'DELETE'
            });
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
            return solicitar(`/admin/alquileres/${id}`, {
                method: 'DELETE'
            });
        },

        listarPagos() {
            return solicitar('/admin/pagos');
        },

        obtenerPago(idAlquiler) {
            return solicitar(`/admin/pagos/${idAlquiler}`);
        },

        obtenerComprobante(idAlquiler) {
            return solicitar(`/admin/comprobantes/alquiler/${idAlquiler}`);
        },

        actualizarPago(idAlquiler, datos) {
            return solicitar(`/admin/pagos/${idAlquiler}`, {
                method: 'PATCH',
                body: JSON.stringify(datos)
            });
        },

        listarAdministradores() {
            return solicitar('/admin/administradores');
        },

        obtenerPermisosAdministradores() {
            return solicitar('/admin/administradores/permisos');
        },

        crearAdministrador(datos) {
            return solicitar('/admin/administradores', { method: 'POST', body: JSON.stringify(datos) });
        },

        actualizarAdministrador(id, datos) {
            return solicitar(`/admin/administradores/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
        },

        desactivarAdministrador(id) {
            return solicitar(`/admin/administradores/${id}/desactivar`, { method: 'PATCH' });
        },

        activarAdministrador(id) {
            return solicitar(`/admin/administradores/${id}/activar`, { method: 'PATCH' });
        },

        // Roles y permisos (solo administrador principal)
        listarRoles() {
            return solicitar('/admin/roles');
        },

        crearRol(nombre, permisos = []) {
            return solicitar('/admin/roles', { method: 'POST', body: JSON.stringify({ nombre, permisos }) });
        },
        renombrarRol(idPerfil, nombre) {
            return solicitar(`/admin/roles/${idPerfil}`, { method: 'PATCH', body: JSON.stringify({ nombre }) });
        },
        eliminarRol(idPerfil) {
            return solicitar(`/admin/roles/${idPerfil}`, { method: 'DELETE' });
        },

        listarModulosRoles() {
            return solicitar('/admin/roles/modulos');
        },

        actualizarPermisosRol(idPerfil, permisos) {
            return solicitar(`/admin/roles/${idPerfil}/permisos`, {
                method: 'PUT',
                body: JSON.stringify({ permisos })
            });
        },

        /** Acciones de caja: aprobar, rechazar, efectivo, reembolsar, cargos/cobrar. */
        // ---------- Operaciones de alquiler (entrega, devolución, chofer)
        listarInspecciones(idAlquiler) { return solicitar(`/admin/alquileres/${idAlquiler}/inspecciones`); },
        registrarEntrega(idAlquiler, datos) {
            return solicitar(`/admin/alquileres/${idAlquiler}/entrega`, { method: 'POST', body: JSON.stringify(datos) });
        },
        registrarDevolucion(idAlquiler, datos) {
            return solicitar(`/admin/alquileres/${idAlquiler}/devolucion`, { method: 'POST', body: JSON.stringify(datos) });
        },
        listarConductores() { return solicitar('/admin/alquileres/conductores'); },
        asignarConductor(idAlquiler, idConductor) {
            return solicitar(`/admin/alquileres/${idAlquiler}/chofer`, { method: 'PATCH', body: JSON.stringify({ idConductor }) });
        },

        consultarDni(dni) { return solicitar(`/admin/reniec/${encodeURIComponent(dni)}`); },

        // ---------- Mi perfil (cualquier rol del personal)
        miPerfil() { return solicitar('/admin/perfil'); },
        actualizarMiPerfil(datos) { return solicitar('/admin/perfil', { method: 'PUT', body: JSON.stringify(datos) }); },
        cambiarMiContrasena(datos) { return solicitar('/admin/perfil/contrasena', { method: 'PUT', body: JSON.stringify(datos) }); },
        subirFotoPerfil(archivo) { return subirArchivo('/admin/perfil/foto', archivo); },
        quitarFotoPerfil() { return solicitar('/admin/perfil/foto', { method: 'DELETE' }); },

        // ---------- Categorías e imágenes de vehículos
        listarCategorias() { return solicitar('/admin/categorias'); },
        guardarCategoria(categoria) {
            return categoria.idCategoria
                ? solicitar(`/admin/categorias/${categoria.idCategoria}`, { method: 'PUT', body: JSON.stringify(categoria) })
                : solicitar('/admin/categorias', { method: 'POST', body: JSON.stringify(categoria) });
        },
        eliminarCategoria(id) { return solicitar(`/admin/categorias/${id}`, { method: 'DELETE' }); },
        subirImagenVehiculo(archivo) { return subirArchivo('/admin/vehiculos/imagen', archivo); },

        // ---------- Mantenimiento
        listarMantenimientos() { return solicitar('/admin/mantenimientos'); },
        listarTiposMantenimiento() { return solicitar('/admin/mantenimientos/tipos'); },
        alertasMantenimiento() { return solicitar('/admin/mantenimientos/alertas'); },
        crearMantenimiento(datos) {
            return solicitar('/admin/mantenimientos', { method: 'POST', body: JSON.stringify(datos) });
        },
        accionMantenimiento(id, accion, datos = {}) {
            return solicitar(`/admin/mantenimientos/${id}/${accion}`, { method: 'POST', body: JSON.stringify(datos) });
        },

        // ---------- Conductor
        misServicios() { return solicitar('/admin/servicios/mios'); },
        avanzarServicio(idAlquiler, estado) {
            return solicitar(`/admin/servicios/${idAlquiler}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
        },

        // ---------- Portal web
        obtenerPortalEditor() { return solicitar('/admin/portal'); },
        guardarBorradorPortal(contenido) {
            const texto = typeof contenido === 'string' ? contenido : JSON.stringify(contenido);
            return solicitar('/admin/portal/borrador', { method: 'PUT', body: JSON.stringify({ contenido: texto }) });
        },
        publicarPortal(resumen = '') {
            return solicitar('/admin/portal/publicar', { method: 'POST', body: JSON.stringify({ resumen }) });
        },
        restaurarPortalInicial() { return solicitar('/admin/portal/restaurar-inicial', { method: 'POST' }); },
        descartarBorradorPortal() { return solicitar('/admin/portal/descartar', { method: 'POST' }); },
        versionesPortal() { return solicitar('/admin/portal/versiones'); },
        restaurarVersionPortal(id) { return solicitar(`/admin/portal/versiones/${id}/restaurar`, { method: 'POST' }); },
        listarOfertasPortal() { return solicitar('/admin/portal/ofertas'); },
        guardarOfertaPortal(oferta) {
            return oferta.idOferta
                ? solicitar(`/admin/portal/ofertas/${oferta.idOferta}`, { method: 'PUT', body: JSON.stringify(oferta) })
                : solicitar('/admin/portal/ofertas', { method: 'POST', body: JSON.stringify(oferta) });
        },
        eliminarOfertaPortal(id) { return solicitar(`/admin/portal/ofertas/${id}`, { method: 'DELETE' }); },
        subirImagenPortal(archivo) { return subirArchivo('/admin/portal/imagenes', archivo); },
        subirVideoPortal(archivo) { return subirArchivo('/admin/portal/videos', archivo); },

        /** Constancia (foto/PDF) que subió el cliente. Devuelve { url, tipo } o null si no tiene. */
        async constanciaPago(idAlquiler) {
            const token = obtenerToken();
            const r = await fetch(`${API_BASE}/admin/pagos/${idAlquiler}/constancia`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (r.status === 404) return null;
            if (!r.ok) throw new Error('No se pudo cargar la constancia del pago.');
            const blob = await r.blob();
            return { url: URL.createObjectURL(blob), tipo: blob.type || r.headers.get('Content-Type') || '' };
        },

        accionPago(idAlquiler, accion, datos = {}) {
            return solicitar(`/admin/pagos/${idAlquiler}/${accion}`, {
                method: 'POST',
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
