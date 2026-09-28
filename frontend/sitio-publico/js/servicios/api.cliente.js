(() => {
    const API_BASE = 'http://localhost:8080/api/v1/clientes';

    async function leerRespuesta(respuesta) {
        let cuerpo = null;
        try {
            cuerpo = await respuesta.json();
        } catch (_) {
            cuerpo = null;
        }

        if (!respuesta.ok) {
            const mensaje = cuerpo?.detail || cuerpo?.message || cuerpo?.error || 'No se pudo completar la operación.';
            throw new Error(mensaje);
        }

        return cuerpo;
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

    async function obtenerPerfil(idUsuario) {
        const respuesta = await fetch(`${API_BASE}/${idUsuario}`);
        return leerRespuesta(respuesta);
    }

    async function actualizarPerfil(idUsuario, datos) {
        const respuesta = await fetch(`${API_BASE}/${idUsuario}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        return leerRespuesta(respuesta);
    }

    async function obtenerUltimoAlquiler(idUsuario) {
        const respuesta = await fetch(`${API_BASE}/${idUsuario}/alquileres/ultimo`);
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
