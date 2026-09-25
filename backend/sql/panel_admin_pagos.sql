-- =========================================================
-- CARMOVO - Panel Administrador - Pagos e ingresos
-- Esta migración NO crea ni modifica perfiles, usuarios o roles.
-- Solo agrega la tabla necesaria para el estado administrativo
-- de los pagos asociados a alquileres ya existentes.
-- =========================================================

CREATE TABLE IF NOT EXISTS pagos (
    id_pago BIGSERIAL PRIMARY KEY,
    id_alquiler BIGINT NOT NULL UNIQUE
        REFERENCES alquileres(id_alquiler) ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    referencia VARCHAR(120),
    observaciones VARCHAR(500),
    fecha_pago TIMESTAMP,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pagos_estado
        CHECK (estado IN ('Pendiente', 'En revisión', 'Pagado', 'Rechazado'))
);

CREATE INDEX IF NOT EXISTS idx_pagos_estado
    ON pagos(estado);

CREATE INDEX IF NOT EXISTS idx_pagos_fecha_pago
    ON pagos(fecha_pago);
