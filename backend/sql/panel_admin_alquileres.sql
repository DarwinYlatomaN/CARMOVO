-- =========================================================
-- CARMOVO - Gestión de alquileres
-- Esta migración NO crea, elimina ni modifica perfiles/roles.
-- Solo agrega la tabla necesaria para persistir alquileres.
-- =========================================================

CREATE TABLE IF NOT EXISTS alquileres (
    id_alquiler BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT NOT NULL REFERENCES usuarios(id_usuario),
    id_vehiculo BIGINT NOT NULL REFERENCES vehiculos(id_vehiculo),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    lugar_recogida VARCHAR(120) NOT NULL,
    lugar_entrega VARCHAR(120) NOT NULL,
    metodo_pago VARCHAR(40),
    estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    total NUMERIC(12,2) NOT NULL,
    observaciones VARCHAR(500),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_alquiler_fechas CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT chk_alquiler_estado CHECK (
        estado IN ('Pendiente', 'Confirmado', 'En curso', 'Finalizado', 'Cancelado')
    )
);

CREATE INDEX IF NOT EXISTS idx_alquileres_usuario ON alquileres(id_usuario);
CREATE INDEX IF NOT EXISTS idx_alquileres_vehiculo ON alquileres(id_vehiculo);
CREATE INDEX IF NOT EXISTS idx_alquileres_estado ON alquileres(estado);
CREATE INDEX IF NOT EXISTS idx_alquileres_fechas ON alquileres(fecha_inicio, fecha_fin);
