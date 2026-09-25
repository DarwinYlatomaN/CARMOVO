-- =========================================================
-- CARMOVO - Gestión de Usuarios
-- Archivo de verificación de la base de datos.
--
-- Este script NO crea tablas, NO crea perfiles/roles y NO
-- modifica datos existentes. Gestión de Usuarios trabaja con
-- los perfiles que ya estén definidos en la base de datos.
-- =========================================================

-- Verificar perfiles existentes
SELECT id_perfil, nombre
FROM perfiles
ORDER BY id_perfil;

-- Verificar usuarios existentes
SELECT
    id_usuario,
    nombres,
    apellidos,
    correo,
    telefono,
    estado,
    id_perfil
FROM usuarios
ORDER BY id_usuario;
