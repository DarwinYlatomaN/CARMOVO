-- CARMOVO: migración para MySQL 8. Ejecutar una vez ANTES de iniciar la nueva versión.
-- No elimina perfiles, usuarios ni registros previos. Ejecutar sobre carmovo_db.
CREATE TABLE IF NOT EXISTS administradores_acceso (
    id_usuario BIGINT NOT NULL PRIMARY KEY,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_admin_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE IF NOT EXISTS administradores_permisos (
    id_usuario BIGINT NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_usuario, codigo),
    CONSTRAINT fk_admin_permisos_usuario FOREIGN KEY (id_usuario)
        REFERENCES administradores_acceso(id_usuario) ON DELETE CASCADE
);

-- Bootstrap: por defecto el primer Administrador registrado (id más bajo) es principal.
-- Antes de ejecutar, consulta SELECT id_usuario,correo FROM usuarios con perfil Administrador.
-- Si otra cuenta debe ser principal, modifica el valor de @principal_id.
SET @principal_id = (
    SELECT MIN(u.id_usuario)
    FROM usuarios u INNER JOIN perfiles p ON p.id_perfil = u.id_perfil
    WHERE LOWER(p.nombre) = 'administrador' AND u.estado = TRUE
);

-- NO promueve otras cuentas al volver a ejecutar: solo inserta las que aún no existen.
INSERT INTO administradores_acceso (id_usuario, es_principal)
SELECT u.id_usuario, (u.id_usuario = @principal_id)
FROM usuarios u
JOIN perfiles p ON p.id_perfil = u.id_perfil
WHERE LOWER(p.nombre) = 'administrador'
  AND NOT EXISTS (SELECT 1 FROM administradores_acceso a WHERE a.id_usuario = u.id_usuario);

-- Comprobar que haya exactamente un principal después de ejecutar.
SELECT u.id_usuario, u.correo, a.es_principal
FROM administradores_acceso a JOIN usuarios u ON u.id_usuario = a.id_usuario
ORDER BY a.es_principal DESC, u.id_usuario;
