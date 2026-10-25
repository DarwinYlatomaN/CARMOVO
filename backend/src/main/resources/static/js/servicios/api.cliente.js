
(() => {
    const API_BASE = '/api/v1/clientes';

    async function leerRespuesta(respuesta) {
        let cuerpo = null;

        try {
            const texto = await respuesta.text();

            if (texto) {
                try {
                    cuerpo = JSON.parse(texto);
                } catch (_) {
                    cuerpo = {
                        message: texto
                    };
                }
            }
        } catch (_) {
            cuerpo = null;
        }

        if (!respuesta.ok) {
            const mensaje =
                cuerpo?.detail ||
                cuerpo?.message ||
                cuerpo?.mensaje ||
                cuerpo?.error ||
                `Error HTTP ${respuesta.status}`;

            const error = new Error(String(mensaje));

            // Conservar el código HTTP para identificar
            // errores 400, 404, 409, 500, etc.
            error.status = respuesta.status;

            // Conservar la respuesta original del backend.
            error.cuerpo = cuerpo;

            // Conservar los errores individuales de validación.
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

    async function registrar(datos) {
        const respuesta = await fetch(
            `${API_BASE}/registro`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            }
        );

        return leerRespuesta(respuesta);
    }

    async function iniciarSesion(correo, contrasena) {
        const respuesta = await fetch(
            `${API_BASE}/login`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    correo,
                    contrasena
                })
            }
        );

        return leerRespuesta(respuesta);
    }

    async function obtenerPerfil(idUsuario) {
        const respuesta = await fetch(
            `${API_BASE}/${idUsuario}`
        );

        return leerRespuesta(respuesta);
    }

    async function actualizarPerfil(idUsuario, datos) {
        const respuesta = await fetch(
            `${API_BASE}/${idUsuario}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            }
        );

        return leerRespuesta(respuesta);
    }

    async function obtenerUltimoAlquiler(idUsuario) {
        const respuesta = await fetch(
            `${API_BASE}/${idUsuario}/alquileres/ultimo`
        );

        return leerRespuesta(respuesta);
    }

    window.CarmovoClienteApi = {
        registrar,
        iniciarSesion,
        obtenerPerfil,
        actualizarPerfil,
        obtenerUltimoAlquiler
    };
})();
