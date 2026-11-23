
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
    documento,
    fecha_nacimiento,
    departamento,
    provincia,
    distrito,
    domicilio,
    numero_licencia,
    categoria_licencia,
    vencimiento_licencia,
    estado,
    id_perfil
FROM usuarios
ORDER BY id_usuario;
