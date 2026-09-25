-- CARMOVO - Etapa 8: verificación previa de autenticación administrativa.
-- Este archivo NO modifica datos ni crea tablas.

SELECT
    u.id_usuario,
    u.correo,
    u.estado,
    p.nombre AS perfil,
    LENGTH(u.contrasena) AS longitud_hash,
    LEFT(u.contrasena, 4) AS prefijo_hash
FROM usuarios u
JOIN perfiles p ON p.id_perfil = u.id_perfil
WHERE LOWER(p.nombre) = LOWER('Administrador')
ORDER BY u.id_usuario;

-- Para BCrypt se espera normalmente una longitud de 60 y prefijo $2a$, $2b$ o equivalente $2x$/$2y$.
