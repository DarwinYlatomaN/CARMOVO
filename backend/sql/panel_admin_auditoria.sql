-- =========================================================
-- CARMOVO - Registro de Auditoría
-- Etapa 7
-- Este script SOLO crea la tabla de auditoría y sus índices.
-- NO crea ni modifica perfiles, usuarios, vehículos, alquileres o pagos.
-- =========================================================

CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria BIGSERIAL PRIMARY KEY,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(60) NOT NULL,
    id_entidad BIGINT,
    actor VARCHAR(120) NOT NULL DEFAULT 'Panel administrador',
    detalle VARCHAR(700) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha_hora
    ON auditoria (fecha_hora DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_modulo
    ON auditoria (modulo);

CREATE INDEX IF NOT EXISTS idx_auditoria_accion
    ON auditoria (accion);
