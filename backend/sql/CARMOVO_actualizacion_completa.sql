-- =====================================================================
--  CARMOVO · ACTUALIZACIÓN COMPLETA DE LA BASE DE DATOS (Partes 1 a 5)
--  MySQL 8.0 o superior · base de datos: carmovo_db
--
--  CÓMO USARLO
--   1. Haz una copia de seguridad (MySQL Workbench → Server → Data Export).
--   2. Abre este archivo en MySQL Workbench y presiona el rayo (Execute).
--   3. Al final verás un resumen con las tablas y los roles.
--
--  ES SEGURO
--   · No borra datos: solo agrega tablas, columnas y datos iniciales.
--   · Se puede ejecutar más de una vez: lo que ya existe no se duplica.
--
--  QUÉ AGREGA
--   Parte 1  Roles del personal, permisos por rol, recuperación de
--            contraseña y protección del administrador principal.
--   Parte 2  Pasarela de pagos (tarjeta, Yape, Plin, efectivo),
--            boleta o factura, panel del Cajero.
--   Parte 3  Datos del vehículo (placa, km, SOAT, revisión técnica),
--            categorías editables, mantenimiento, entrega y devolución, cargos y choferes.
--   Parte 4  Portal web editable (textos, imágenes, ofertas, versiones).
--   Parte 5  Aceptación de términos y política de privacidad, y constancias
--            (foto del pago) de Yape, Plin y transferencia.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS carmovo_db
    DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carmovo_db;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Ayudantes (MySQL no tiene "ADD COLUMN IF NOT EXISTS")
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS carmovo_agregar_columna;
DROP PROCEDURE IF EXISTS carmovo_agregar_indice;
DROP PROCEDURE IF EXISTS carmovo_quitar_check;

DELIMITER $$
CREATE PROCEDURE carmovo_agregar_columna(IN p_tabla VARCHAR(64), IN p_columna VARCHAR(64), IN p_definicion VARCHAR(500))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_tabla AND COLUMN_NAME = p_columna) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_tabla, '` ADD COLUMN `', p_columna, '` ', p_definicion);
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END$$

CREATE PROCEDURE carmovo_agregar_indice(IN p_tabla VARCHAR(64), IN p_indice VARCHAR(64), IN p_definicion VARCHAR(500))
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_tabla AND INDEX_NAME = p_indice) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_tabla, '` ADD ', p_definicion);
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END$$

CREATE PROCEDURE carmovo_quitar_check(IN p_tabla VARCHAR(64), IN p_check VARCHAR(64))
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
               WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_tabla
                 AND CONSTRAINT_NAME = p_check AND CONSTRAINT_TYPE = 'CHECK') THEN
        SET @sql = CONCAT('ALTER TABLE `', p_tabla, '` DROP CONSTRAINT `', p_check, '`');
        PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
    END IF;
END$$
DELIMITER ;


-- =====================================================================
-- PARTE 1 · SEGURIDAD, ROLES Y PROTECCIÓN DEL ADMINISTRADOR
-- =====================================================================

-- 1.1 Roles del personal (además de Administrador y Cliente)
INSERT INTO perfiles (nombre)
SELECT 'Agente de reservas' WHERE NOT EXISTS (SELECT 1 FROM perfiles WHERE nombre = 'Agente de reservas');
INSERT INTO perfiles (nombre)
SELECT 'Cajero' WHERE NOT EXISTS (SELECT 1 FROM perfiles WHERE nombre = 'Cajero');
INSERT INTO perfiles (nombre)
SELECT 'Conductor' WHERE NOT EXISTS (SELECT 1 FROM perfiles WHERE nombre = 'Conductor');

-- 1.2 Permisos por rol (el administrador los edita en "Roles y permisos")
CREATE TABLE IF NOT EXISTS perfil_permisos (
    id_perfil BIGINT      NOT NULL,
    codigo    VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_perfil, codigo),
    CONSTRAINT fk_perfil_permisos_perfil FOREIGN KEY (id_perfil)
        REFERENCES perfiles (id_perfil) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Agente de reservas: alquileres, entrega/devolución, flota y clientes
INSERT IGNORE INTO perfil_permisos (id_perfil, codigo)
SELECT p.id_perfil, c.codigo
FROM perfiles p
JOIN (SELECT 'ADMIN_TABLERO' AS codigo UNION ALL SELECT 'ADMIN_FLOTA' UNION ALL SELECT 'ADMIN_ALQUILERES'
      UNION ALL SELECT 'ADMIN_USUARIOS' UNION ALL SELECT 'ADMIN_MONITOREO'
      UNION ALL SELECT 'WEB_INICIO' UNION ALL SELECT 'WEB_CATEGORIAS' UNION ALL SELECT 'WEB_OFERTAS'
      UNION ALL SELECT 'WEB_EXPERIENCIA' UNION ALL SELECT 'WEB_SOPORTE') c
WHERE p.nombre = 'Agente de reservas'
  AND NOT EXISTS (SELECT 1 FROM perfil_permisos x WHERE x.id_perfil = p.id_perfil);

-- Cajero: pagos, comprobantes y reportes
INSERT IGNORE INTO perfil_permisos (id_perfil, codigo)
SELECT p.id_perfil, c.codigo
FROM perfiles p
JOIN (SELECT 'ADMIN_TABLERO' AS codigo UNION ALL SELECT 'ADMIN_PAGOS' UNION ALL SELECT 'ADMIN_REPORTES'
      UNION ALL SELECT 'WEB_INICIO' UNION ALL SELECT 'WEB_CATEGORIAS' UNION ALL SELECT 'WEB_OFERTAS'
      UNION ALL SELECT 'WEB_EXPERIENCIA' UNION ALL SELECT 'WEB_SOPORTE') c
WHERE p.nombre = 'Cajero'
  AND NOT EXISTS (SELECT 1 FROM perfil_permisos x WHERE x.id_perfil = p.id_perfil);

-- Conductor: "Mis servicios" (se agrega aunque el rol ya tenga otros permisos)
INSERT IGNORE INTO perfil_permisos (id_perfil, codigo)
SELECT p.id_perfil, c.codigo
FROM perfiles p
JOIN (SELECT 'ADMIN_SERVICIOS' AS codigo UNION ALL SELECT 'WEB_INICIO') c
WHERE p.nombre = 'Conductor';

-- 1.3 Recuperación de contraseña (enlaces de un solo uso, 30 minutos)
CREATE TABLE IF NOT EXISTS restablecimientos_contrasena (
    id_restablecimiento BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_usuario          BIGINT      NOT NULL,
    token_hash          CHAR(64)    NOT NULL UNIQUE,
    expira              DATETIME    NOT NULL,
    usado               TINYINT(1)  NOT NULL DEFAULT 0,
    fecha_registro      DATETIME    NOT NULL,
    KEY idx_restablecimiento_usuario (id_usuario),
    CONSTRAINT fk_restablecimiento_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 1.4 Contraseña de prueba antigua en texto plano → BCrypt ("123456")
UPDATE usuarios
SET contrasena = '$2a$10$yKA6HWbk3sTvhnIrGAQR/ecWJtI6.oHXVuOZy7BIPAsamPkHmlfBW'
WHERE correo = 'carlos@gmail.com' AND contrasena = '123456';

-- 1.5 El administrador principal no se puede desactivar, cambiar de rol
--     ni eliminar, ni siquiera desde MySQL Workbench.
DROP TRIGGER IF EXISTS trg_proteger_admin_principal_upd;
DROP TRIGGER IF EXISTS trg_proteger_admin_principal_del;

DELIMITER $$
CREATE TRIGGER trg_proteger_admin_principal_upd
BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM administradores_acceso a
               WHERE a.id_usuario = OLD.id_usuario AND a.es_principal = 1)
       AND (NEW.estado = 0 OR NEW.id_perfil <> OLD.id_perfil) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La cuenta del administrador principal no se puede desactivar ni cambiar de rol.';
    END IF;
END$$

CREATE TRIGGER trg_proteger_admin_principal_del
BEFORE DELETE ON usuarios
FOR EACH ROW
BEGIN
    IF EXISTS (SELECT 1 FROM administradores_acceso a
               WHERE a.id_usuario = OLD.id_usuario AND a.es_principal = 1) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La cuenta del administrador principal no se puede eliminar.';
    END IF;
END$$
DELIMITER ;


-- =====================================================================
-- PARTE 2 · PAGOS, BOLETA O FACTURA Y PANEL DEL CAJERO
-- =====================================================================

-- 2.1 Intentos de pago de la pasarela. El monto lo calcula el servidor,
--     cada intento se usa una sola vez y vence a los 15 minutos.
CREATE TABLE IF NOT EXISTS intentos_pago (
    id_intento        BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    codigo            VARCHAR(20)   NOT NULL UNIQUE,
    id_usuario        BIGINT        NOT NULL,
    id_vehiculo       BIGINT        NOT NULL,
    fecha_inicio      DATE          NOT NULL,
    fecha_fin         DATE          NOT NULL,
    con_chofer        TINYINT(1)    NOT NULL DEFAULT 0,
    metodo            VARCHAR(20)   NOT NULL,
    monto             DECIMAL(10,2) NOT NULL,
    estado            VARCHAR(20)   NOT NULL,
    referencia        VARCHAR(60)   NULL,
    detalle           VARCHAR(160)  NULL,
    banco             VARCHAR(40)   NULL,
    fecha_operacion   DATETIME      NULL,
    motivo            VARCHAR(255)  NULL,
    intentos_fallidos INT           NOT NULL DEFAULT 0,
    expira            DATETIME      NOT NULL,
    id_alquiler       BIGINT        NULL,
    fecha_registro    DATETIME      NOT NULL,
    KEY idx_intento_usuario (id_usuario),
    KEY idx_intento_estado_expira (estado, expira),
    KEY idx_intento_metodo_ref (metodo, referencia),
    CONSTRAINT fk_intento_usuario  FOREIGN KEY (id_usuario)  REFERENCES usuarios (id_usuario),
    CONSTRAINT fk_intento_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculos (id_vehiculo),
    CONSTRAINT chk_intento_estado CHECK (estado IN ('CREADO','REQUIERE_3DS','APROBADO','RECHAZADO','BLOQUEADO',
                                                    'EN_REVISION','PENDIENTE','USADO','EXPIRADO'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 2.2 Pagos: método, monto, datos de la operación, facturación y caja
CALL carmovo_agregar_columna('pagos', 'metodo',           'VARCHAR(20) NULL AFTER estado');
CALL carmovo_agregar_columna('pagos', 'monto',            'DECIMAL(10,2) NULL AFTER metodo');
CALL carmovo_agregar_columna('pagos', 'detalle',          'VARCHAR(160) NULL');
CALL carmovo_agregar_columna('pagos', 'banco',            'VARCHAR(40) NULL');
CALL carmovo_agregar_columna('pagos', 'fecha_operacion',  'DATETIME NULL');
CALL carmovo_agregar_columna('pagos', 'tipo_comprobante', 'VARCHAR(10) NULL');
CALL carmovo_agregar_columna('pagos', 'ruc',              'VARCHAR(11) NULL');
CALL carmovo_agregar_columna('pagos', 'razon_social',     'VARCHAR(150) NULL');
CALL carmovo_agregar_columna('pagos', 'direccion_fiscal', 'VARCHAR(200) NULL');
CALL carmovo_agregar_columna('pagos', 'vence_pago',       'DATETIME NULL');
CALL carmovo_agregar_columna('pagos', 'monto_recibido',   'DECIMAL(10,2) NULL');
CALL carmovo_agregar_columna('pagos', 'vuelto',           'DECIMAL(10,2) NULL');
CALL carmovo_agregar_columna('pagos', 'validado_por',     'VARCHAR(120) NULL');
CALL carmovo_agregar_columna('pagos', 'fecha_validacion', 'DATETIME NULL');
CALL carmovo_agregar_columna('pagos', 'motivo_rechazo',   'VARCHAR(255) NULL');
CALL carmovo_agregar_indice('pagos', 'idx_pagos_metodo_referencia', 'INDEX idx_pagos_metodo_referencia (metodo, referencia)');

-- Nuevos estados del pago (antes solo había 4)
CALL carmovo_quitar_check('pagos', 'chk_pagos_estado');
ALTER TABLE pagos ADD CONSTRAINT chk_pagos_estado CHECK (estado IN (
    'Pendiente', 'En revisión', 'Pagado', 'Rechazado',
    'Expirado', 'Anulado', 'Reembolso pendiente', 'Reembolsado'));

-- Completar los pagos antiguos con el método y el monto de su alquiler
UPDATE pagos p
JOIN alquileres a ON a.id_alquiler = p.id_alquiler
SET p.metodo = LOWER(TRIM(a.metodo_pago))
WHERE p.metodo IS NULL AND a.metodo_pago IS NOT NULL;

UPDATE pagos p
JOIN alquileres a ON a.id_alquiler = p.id_alquiler
SET p.monto = a.total
WHERE p.monto IS NULL;

UPDATE pagos SET tipo_comprobante = 'BOLETA' WHERE tipo_comprobante IS NULL;

-- 2.3 Comprobantes: boleta (B001) o factura (F001) con correlativo propio
CREATE TABLE IF NOT EXISTS comprobantes (
    id_comprobante      BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_alquiler         BIGINT        NOT NULL UNIQUE,
    id_pago             BIGINT        NOT NULL,
    numero              VARCHAR(20)   NOT NULL UNIQUE,
    codigo_verificacion VARCHAR(20)   NOT NULL,
    metodo_pago         VARCHAR(20)   NOT NULL,
    detalle_metodo      VARCHAR(120)  NULL,
    referencia          VARCHAR(120)  NULL,
    subtotal            DECIMAL(10,2) NOT NULL,
    igv                 DECIMAL(10,2) NOT NULL,
    total               DECIMAL(10,2) NOT NULL,
    fecha_emision       DATETIME      NOT NULL,
    CONSTRAINT fk_comp_alquiler FOREIGN KEY (id_alquiler) REFERENCES alquileres (id_alquiler)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CALL carmovo_agregar_columna('comprobantes', 'tipo',              "VARCHAR(10) NOT NULL DEFAULT 'BOLETA'");
CALL carmovo_agregar_columna('comprobantes', 'serie',             "VARCHAR(4) NOT NULL DEFAULT 'B001'");
CALL carmovo_agregar_columna('comprobantes', 'correlativo',       'INT NULL');
CALL carmovo_agregar_columna('comprobantes', 'documento_cliente', 'VARCHAR(11) NULL');
CALL carmovo_agregar_columna('comprobantes', 'nombre_cliente',    'VARCHAR(150) NULL');
CALL carmovo_agregar_columna('comprobantes', 'direccion_cliente', 'VARCHAR(200) NULL');
CALL carmovo_agregar_columna('comprobantes', 'estado',            "VARCHAR(15) NOT NULL DEFAULT 'EMITIDO'");
CALL carmovo_agregar_columna('comprobantes', 'fecha_anulacion',   'DATETIME NULL');
CALL carmovo_agregar_columna('comprobantes', 'motivo_anulacion',  'VARCHAR(255) NULL');
CALL carmovo_agregar_indice('comprobantes', 'uk_comprobante_serie_correlativo',
                            'UNIQUE INDEX uk_comprobante_serie_correlativo (serie, correlativo)');

-- Los comprobantes antiguos pasan a ser boletas B001 con número correlativo
SET @base_b001 := (SELECT IFNULL(MAX(correlativo), 0) FROM comprobantes WHERE serie = 'B001' AND correlativo IS NOT NULL);
UPDATE comprobantes c
JOIN (SELECT id_comprobante, ROW_NUMBER() OVER (ORDER BY fecha_emision, id_comprobante) AS n
      FROM comprobantes WHERE correlativo IS NULL) o ON o.id_comprobante = c.id_comprobante
SET c.serie = 'B001',
    c.tipo = 'BOLETA',
    c.correlativo = @base_b001 + o.n,
    c.numero = CONCAT('B001-', LPAD(@base_b001 + o.n, 6, '0'));

-- Datos del cliente en los comprobantes antiguos
UPDATE comprobantes c
JOIN alquileres a ON a.id_alquiler = c.id_alquiler
JOIN usuarios u ON u.id_usuario = a.id_usuario
SET c.nombre_cliente = CONCAT(u.nombres, ' ', u.apellidos),
    c.documento_cliente = LEFT(u.documento, 11),
    c.direccion_cliente = LEFT(u.domicilio, 200)
WHERE c.nombre_cliente IS NULL;


-- =====================================================================
-- PARTE 3 · VEHÍCULOS, MANTENIMIENTO, ENTREGA/DEVOLUCIÓN Y CHOFERES
-- =====================================================================

-- 3.1 Datos del vehículo
CALL carmovo_agregar_columna('vehiculos', 'placa',                'VARCHAR(10) NULL');
CALL carmovo_agregar_columna('vehiculos', 'anio',                 'INT NULL');
CALL carmovo_agregar_columna('vehiculos', 'color',                'VARCHAR(30) NULL');
CALL carmovo_agregar_columna('vehiculos', 'kilometraje',          'INT NULL DEFAULT 0');
CALL carmovo_agregar_columna('vehiculos', 'vencimiento_soat',     'DATE NULL');
CALL carmovo_agregar_columna('vehiculos', 'vencimiento_revision', 'DATE NULL');
CALL carmovo_agregar_indice('vehiculos', 'uk_vehiculos_placa', 'UNIQUE INDEX uk_vehiculos_placa (placa)');
UPDATE vehiculos SET kilometraje = 0 WHERE kilometraje IS NULL;

-- 3.2 Alquiler con chofer
CALL carmovo_agregar_columna('alquileres', 'con_chofer',      'TINYINT(1) NOT NULL DEFAULT 0');
CALL carmovo_agregar_columna('alquileres', 'id_conductor',    'BIGINT NULL');
CALL carmovo_agregar_columna('alquileres', 'estado_servicio', 'VARCHAR(20) NULL');
CALL carmovo_agregar_indice('alquileres', 'idx_alquiler_conductor', 'INDEX idx_alquiler_conductor (id_conductor)');

SET @existe_fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alquileres'
                     AND CONSTRAINT_NAME = 'fk_alquiler_conductor');
SET @sql := IF(@existe_fk = 0,
    'ALTER TABLE alquileres ADD CONSTRAINT fk_alquiler_conductor FOREIGN KEY (id_conductor) REFERENCES usuarios (id_usuario)',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- 3.3 Mantenimientos (taller, SOAT, revisión técnica...)
CREATE TABLE IF NOT EXISTS mantenimientos (
    id_mantenimiento BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_vehiculo      BIGINT        NOT NULL,
    tipo             VARCHAR(40)   NOT NULL,
    descripcion      VARCHAR(500)  NULL,
    fecha_programada DATE          NOT NULL,
    kilometraje      INT           NULL,
    estado           VARCHAR(20)   NOT NULL DEFAULT 'PROGRAMADO',
    costo            DECIMAL(10,2) NULL,
    taller           VARCHAR(120)  NULL,
    fecha_inicio     DATETIME      NULL,
    fecha_fin        DATETIME      NULL,
    fecha_registro   DATETIME      NOT NULL,
    KEY idx_mant_vehiculo_estado (id_vehiculo, estado),
    CONSTRAINT fk_mant_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculos (id_vehiculo),
    CONSTRAINT chk_mant_estado CHECK (estado IN ('PROGRAMADO', 'EN_TALLER', 'COMPLETADO', 'CANCELADO'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 3.4 Inspecciones de entrega y devolución
CREATE TABLE IF NOT EXISTS alquiler_inspecciones (
    id_inspeccion  BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_alquiler    BIGINT       NOT NULL,
    tipo           VARCHAR(12)  NOT NULL,
    kilometraje    INT          NOT NULL,
    combustible    INT          NOT NULL,
    observaciones  VARCHAR(500) NULL,
    danos          VARCHAR(500) NULL,
    registrado_por VARCHAR(120) NULL,
    fecha          DATETIME     NOT NULL,
    UNIQUE KEY uk_inspeccion_alquiler_tipo (id_alquiler, tipo),
    CONSTRAINT fk_insp_alquiler FOREIGN KEY (id_alquiler) REFERENCES alquileres (id_alquiler) ON DELETE CASCADE,
    CONSTRAINT chk_insp_tipo CHECK (tipo IN ('ENTREGA', 'DEVOLUCION')),
    CONSTRAINT chk_insp_combustible CHECK (combustible BETWEEN 0 AND 8)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 3.5 Cargos adicionales (devolución tardía, combustible, daños)
CREATE TABLE IF NOT EXISTS alquiler_cargos (
    id_cargo       BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_alquiler    BIGINT        NOT NULL,
    concepto       VARCHAR(40)   NOT NULL,
    detalle        VARCHAR(255)  NULL,
    monto          DECIMAL(10,2) NOT NULL,
    estado         VARCHAR(15)   NOT NULL DEFAULT 'PENDIENTE',
    metodo_cobro   VARCHAR(20)   NULL,
    fecha_cobro    DATETIME      NULL,
    fecha_registro DATETIME      NOT NULL,
    KEY idx_cargo_alquiler (id_alquiler),
    KEY idx_cargo_estado (estado),
    CONSTRAINT fk_cargo_alquiler FOREIGN KEY (id_alquiler) REFERENCES alquileres (id_alquiler) ON DELETE CASCADE,
    CONSTRAINT chk_cargo_monto CHECK (monto >= 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- 3.6 Categorías de vehículos (se crean y editan en Gestión de flota → Categorías)
CREATE TABLE IF NOT EXISTS categorias (
    id_categoria   BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(50)  NOT NULL,
    descripcion    VARCHAR(255) NULL,
    imagen         VARCHAR(255) NULL,
    orden          INT          NOT NULL DEFAULT 0,
    activa         TINYINT(1)   NOT NULL DEFAULT 1,
    fecha_registro DATETIME     NOT NULL,
    UNIQUE KEY uk_categorias_nombre (nombre),
    KEY idx_categorias_activa_orden (activa, orden)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Las categorías que ya usaba el sistema
INSERT IGNORE INTO categorias (nombre, orden, activa, fecha_registro) VALUES
    ('Económicos', 1, 1, NOW()), ('Sedanes', 2, 1, NOW()), ('SUVs', 3, 1, NOW()),
    ('Pick-ups 4x4', 4, 1, NOW()), ('Minivans', 5, 1, NOW()), ('Todoterreno', 6, 1, NOW()),
    ('Crossovers', 7, 1, NOW()), ('Furgonetas', 8, 1, NOW()), ('Híbridos', 9, 1, NOW()),
    ('Premium / Lujo', 10, 1, NOW()), ('Eventos', 11, 1, NOW());

-- Cualquier otra categoría que ya tengan los vehículos registrados
UPDATE vehiculos SET categoria = TRIM(categoria) WHERE categoria <> TRIM(categoria);

INSERT IGNORE INTO categorias (nombre, orden, activa, fecha_registro)
SELECT DISTINCT TRIM(v.categoria), 50, 1, NOW()
FROM vehiculos v
WHERE v.categoria IS NOT NULL AND TRIM(v.categoria) <> '';

-- Cada vehículo debe pertenecer a una categoría existente (3FN).
-- Al renombrar una categoría, sus vehículos se actualizan solos.
SET @existe_fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehiculos'
                     AND CONSTRAINT_NAME = 'fk_vehiculos_categoria');
SET @sql := IF(@existe_fk = 0,
    'ALTER TABLE vehiculos ADD CONSTRAINT fk_vehiculos_categoria FOREIGN KEY (categoria) REFERENCES categorias (nombre) ON UPDATE CASCADE',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- =====================================================================
-- PARTE 4 · PORTAL WEB EDITABLE
-- =====================================================================

-- 4.1 Contenido del sitio (una sola fila: borrador y publicado en JSON)
CREATE TABLE IF NOT EXISTS portal_documento (
    id_documento      BIGINT       NOT NULL PRIMARY KEY,
    borrador          MEDIUMTEXT   NOT NULL,
    publicado         MEDIUMTEXT   NOT NULL,
    actualizado_por   VARCHAR(120) NULL,
    fecha_borrador    DATETIME     NULL,
    fecha_publicacion DATETIME     NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- (La fila inicial la crea el sistema automáticamente la primera vez.)

-- 4.2 Historial de publicaciones
CREATE TABLE IF NOT EXISTS portal_versiones (
    id_version BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    contenido  MEDIUMTEXT   NOT NULL,
    autor      VARCHAR(120) NULL,
    resumen    VARCHAR(255) NULL,
    fecha      DATETIME     NOT NULL,
    KEY idx_portal_version_fecha (fecha)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4.3 Imágenes subidas desde el panel (máximo 2 MB cada una)
CREATE TABLE IF NOT EXISTS portal_imagenes (
    id_imagen      BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(120) NOT NULL,
    tipo_contenido VARCHAR(40)  NOT NULL,
    datos          LONGBLOB     NOT NULL,
    tamano         BIGINT       NOT NULL,
    fecha_registro DATETIME     NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 4.4 Ofertas (el descuento se aplica de verdad al cobrar)
CREATE TABLE IF NOT EXISTS portal_ofertas (
    id_oferta      BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    titulo         VARCHAR(80)  NOT NULL,
    subtitulo      VARCHAR(160) NULL,
    id_vehiculo    BIGINT       NOT NULL,
    descuento      INT          NOT NULL,
    inicio         DATE         NOT NULL,
    fin            DATE         NOT NULL,
    visible        TINYINT(1)   NOT NULL DEFAULT 1,
    fecha_registro DATETIME     NOT NULL,
    KEY idx_oferta_vehiculo_vigencia (id_vehiculo, inicio, fin),
    CONSTRAINT fk_oferta_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculos (id_vehiculo),
    CONSTRAINT chk_oferta_descuento CHECK (descuento BETWEEN 1 AND 70),
    CONSTRAINT chk_oferta_fechas CHECK (fin >= inicio)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Ofertas iniciales: las mismas que mostraba la página Ofertas,
-- vigentes por 60 días desde hoy (solo si la tabla está vacía).
INSERT INTO portal_ofertas (titulo, subtitulo, id_vehiculo, descuento, inicio, fin, visible, fecha_registro)
SELECT o.titulo, o.subtitulo, v.id_vehiculo, o.descuento, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 1, NOW()
FROM (SELECT 'Kia' AS marca, 'Picanto' AS modelo, 15 AS descuento, 'Ciudad al mejor precio' AS titulo, 'Compacto y perfecto para moverte por la ciudad.' AS subtitulo
      UNION ALL SELECT 'Toyota', 'Yaris', 20, 'El más buscado', 'Sedán cómodo para viajes de trabajo.'
      UNION ALL SELECT 'Kia', 'Sportage', 15, 'Escapada en SUV', 'Espacio y confort para toda la familia.'
      UNION ALL SELECT 'Toyota', 'Hilux', 20, 'Aventura 4x4', 'Tracción 4x4 para cualquier camino.'
      UNION ALL SELECT 'Kia', 'Carnival', 20, 'Viaje en grupo', 'Ocho asientos con confort VIP.'
      UNION ALL SELECT 'Jeep', 'Wrangler', 10, 'Off-road de fin de semana', 'Libertad total fuera de la pista.') o
JOIN vehiculos v ON v.marca = o.marca AND v.modelo = o.modelo
WHERE NOT EXISTS (SELECT 1 FROM portal_ofertas);


-- =====================================================================
-- PARTE 5 · TÉRMINOS Y POLÍTICA DE PRIVACIDAD
-- =====================================================================

-- 5.1 Constancia de aceptación (Ley N.° 29733): quién, cuándo, desde qué IP
--     y qué versión aceptó. REGISTRO = crea su cuenta, RESERVA = reserva
--     (id_referencia = alquiler), EMPLEADO = alta de personal o conductor.
CREATE TABLE IF NOT EXISTS aceptaciones_politicas (
    id_aceptacion  BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_usuario     BIGINT       NOT NULL,
    contexto       VARCHAR(20)  NOT NULL,
    id_referencia  BIGINT       NULL,
    version        VARCHAR(10)  NOT NULL,
    ip             VARCHAR(45)  NULL,
    registrado_por VARCHAR(120) NULL,
    fecha          DATETIME     NOT NULL,
    KEY idx_aceptaciones_usuario_contexto (id_usuario, contexto),
    KEY idx_aceptaciones_referencia (id_referencia),
    CONSTRAINT fk_aceptaciones_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario),
    CONSTRAINT chk_aceptaciones_contexto CHECK (contexto IN ('REGISTRO', 'RESERVA', 'EMPLEADO'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- 5.2 Foto o captura del pago (Yape, Plin o transferencia) que caja revisa
--     antes de aprobar o rechazar.
CREATE TABLE IF NOT EXISTS constancias_pago (
    id_constancia  BIGINT       NOT NULL AUTO_INCREMENT,
    id_intento     BIGINT       NOT NULL,
    nombre_archivo VARCHAR(150) NOT NULL,
    tipo_contenido VARCHAR(40)  NOT NULL,
    tamano         BIGINT       NOT NULL,
    datos          LONGBLOB     NOT NULL,
    fecha_registro DATETIME     NOT NULL,
    PRIMARY KEY (id_constancia),
    UNIQUE KEY uk_constancia_intento (id_intento),
    CONSTRAINT fk_constancia_intento FOREIGN KEY (id_intento) REFERENCES intentos_pago (id_intento) ON DELETE CASCADE,
    CONSTRAINT chk_constancia_tipo CHECK (tipo_contenido IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
    CONSTRAINT chk_constancia_tamano CHECK (tamano > 0 AND tamano <= 5242880)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- =====================================================================
-- Limpieza de ayudantes y verificación
-- =====================================================================
DROP PROCEDURE IF EXISTS carmovo_agregar_columna;
DROP PROCEDURE IF EXISTS carmovo_agregar_indice;
DROP PROCEDURE IF EXISTS carmovo_quitar_check;

SELECT 'Tablas nuevas' AS verificacion, COUNT(*) AS cantidad
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('perfil_permisos','restablecimientos_contrasena','intentos_pago','comprobantes',
                     'mantenimientos','alquiler_inspecciones','alquiler_cargos',
                     'portal_documento','portal_versiones','portal_imagenes','portal_ofertas','categorias',
                     'aceptaciones_politicas','constancias_pago');
-- Debe decir 14.

SELECT p.nombre AS rol, COUNT(pp.codigo) AS modulos
FROM perfiles p LEFT JOIN perfil_permisos pp ON pp.id_perfil = p.id_perfil
GROUP BY p.id_perfil, p.nombre ORDER BY p.id_perfil;
