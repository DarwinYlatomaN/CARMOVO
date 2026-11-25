DROP DATABASE IF EXISTS carmovo_db;
CREATE DATABASE carmovo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carmovo_db;
SET NAMES utf8mb4;

CREATE TABLE perfiles (
    id_perfil BIGINT      NOT NULL AUTO_INCREMENT,
    nombre    VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_perfil),
    UNIQUE KEY uk_perfiles_nombre (nombre)
);

CREATE TABLE perfil_permisos (
    id_perfil BIGINT      NOT NULL,
    codigo    VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_perfil, codigo),
    CONSTRAINT fk_perfil_permisos_perfil FOREIGN KEY (id_perfil) REFERENCES perfiles (id_perfil) ON DELETE CASCADE
);

CREATE TABLE opciones (
    id_opcion BIGINT       NOT NULL AUTO_INCREMENT,
    nombre    VARCHAR(100) NOT NULL,
    ruta      VARCHAR(150) NOT NULL,
    PRIMARY KEY (id_opcion),
    UNIQUE KEY uk_opciones_ruta (ruta)
);

CREATE TABLE perfil_opcion (
    id_perfil BIGINT NOT NULL,
    id_opcion BIGINT NOT NULL,
    PRIMARY KEY (id_perfil, id_opcion),
    KEY idx_perfil_opcion_opcion (id_opcion),
    CONSTRAINT fk_perfil_opcion_perfil FOREIGN KEY (id_perfil) REFERENCES perfiles (id_perfil) ON DELETE CASCADE,
    CONSTRAINT fk_perfil_opcion_opcion FOREIGN KEY (id_opcion) REFERENCES opciones (id_opcion) ON DELETE CASCADE
);

CREATE TABLE usuarios (
    id_usuario           BIGINT       NOT NULL AUTO_INCREMENT,
    id_perfil            BIGINT       NOT NULL,
    nombres              VARCHAR(100) NOT NULL,
    apellidos            VARCHAR(100) NOT NULL,
    correo               VARCHAR(120) NOT NULL,
    contrasena           VARCHAR(255) NOT NULL,
    telefono             VARCHAR(20)  NULL,
    documento            VARCHAR(20)  NULL,
    fecha_nacimiento     DATE         NULL,
    domicilio            VARCHAR(200) NULL,
    departamento         VARCHAR(80)  NULL,
    provincia            VARCHAR(80)  NULL,
    distrito             VARCHAR(80)  NULL,
    numero_licencia      VARCHAR(50)  NULL,
    categoria_licencia   VARCHAR(30)  NULL,
    vencimiento_licencia DATE         NULL,
    estado               TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id_usuario),
    UNIQUE KEY uk_usuarios_correo (correo),
    UNIQUE KEY uk_usuarios_documento (documento),
    UNIQUE KEY uk_usuarios_telefono (telefono),
    UNIQUE KEY uk_usuarios_licencia (numero_licencia),
    KEY idx_usuarios_perfil (id_perfil),
    CONSTRAINT fk_usuarios_perfil FOREIGN KEY (id_perfil) REFERENCES perfiles (id_perfil)
);

CREATE TABLE administradores_acceso (
    id_usuario   BIGINT     NOT NULL,
    es_principal TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id_usuario),
    CONSTRAINT fk_admin_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
);

CREATE TABLE administradores_permisos (
    id_usuario BIGINT      NOT NULL,
    codigo     VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_usuario, codigo),
    CONSTRAINT fk_admin_permisos_usuario FOREIGN KEY (id_usuario) REFERENCES administradores_acceso (id_usuario) ON DELETE CASCADE
);

CREATE TABLE restablecimientos_contrasena (
    id_restablecimiento BIGINT     NOT NULL AUTO_INCREMENT,
    id_usuario          BIGINT     NOT NULL,
    token_hash          CHAR(64)   NOT NULL,
    expira              DATETIME   NOT NULL,
    usado               TINYINT(1) NOT NULL DEFAULT 0,
    fecha_registro      DATETIME   NOT NULL,
    PRIMARY KEY (id_restablecimiento),
    UNIQUE KEY uk_restablecimiento_token (token_hash),
    KEY idx_restablecimiento_usuario (id_usuario),
    CONSTRAINT fk_restablecimiento_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario) ON DELETE CASCADE
);

CREATE TABLE categorias (
    id_categoria   BIGINT       NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(50)  NOT NULL,
    descripcion    VARCHAR(255) NULL,
    imagen         VARCHAR(255) NULL,
    orden          INT          NOT NULL DEFAULT 0,
    activa         TINYINT(1)   NOT NULL DEFAULT 1,
    fecha_registro DATETIME     NOT NULL,
    PRIMARY KEY (id_categoria),
    UNIQUE KEY uk_categorias_nombre (nombre),
    KEY idx_categorias_activa_orden (activa, orden)
);

CREATE TABLE vehiculos (
    id_vehiculo          BIGINT        NOT NULL AUTO_INCREMENT,
    categoria            VARCHAR(50)   NOT NULL,
    marca                VARCHAR(60)   NOT NULL,
    modelo               VARCHAR(80)   NOT NULL,
    tipo                 VARCHAR(100)  NULL,
    placa                VARCHAR(10)   NULL,
    anio                 INT           NULL,
    color                VARCHAR(30)   NULL,
    pasajeros            INT           NOT NULL,
    transmision          VARCHAR(30)   NOT NULL,
    precio_dia           DECIMAL(10,2) NOT NULL,
    kilometraje          INT           NULL DEFAULT 0,
    vencimiento_soat     DATE          NULL,
    vencimiento_revision DATE          NULL,
    imagen               VARCHAR(255)  NULL,
    descripcion          TEXT          NULL,
    estado               VARCHAR(30)   NOT NULL DEFAULT 'Disponible',
    PRIMARY KEY (id_vehiculo),
    UNIQUE KEY uk_vehiculos_placa (placa),
    KEY idx_vehiculos_categoria (categoria),
    KEY idx_vehiculos_estado (estado),
    KEY idx_vehiculos_vencimientos (vencimiento_soat, vencimiento_revision),
    CONSTRAINT fk_vehiculos_categoria FOREIGN KEY (categoria) REFERENCES categorias (nombre) ON UPDATE CASCADE,
    CONSTRAINT chk_vehiculos_precio CHECK (precio_dia > 0),
    CONSTRAINT chk_vehiculos_pasajeros CHECK (pasajeros > 0)
);

CREATE TABLE mantenimientos (
    id_mantenimiento BIGINT        NOT NULL AUTO_INCREMENT,
    id_vehiculo      BIGINT        NOT NULL,
    tipo             VARCHAR(40)   NOT NULL,
    descripcion      VARCHAR(500)  NULL,
    taller           VARCHAR(120)  NULL,
    fecha_programada DATE          NOT NULL,
    kilometraje      INT           NULL,
    costo            DECIMAL(10,2) NULL,
    estado           VARCHAR(20)   NOT NULL DEFAULT 'PROGRAMADO',
    fecha_inicio     DATETIME      NULL,
    fecha_fin        DATETIME      NULL,
    fecha_registro   DATETIME      NOT NULL,
    PRIMARY KEY (id_mantenimiento),
    KEY idx_mant_vehiculo_estado (id_vehiculo, estado),
    KEY idx_mant_fecha (fecha_programada),
    CONSTRAINT fk_mant_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculos (id_vehiculo),
    CONSTRAINT chk_mant_estado CHECK (estado IN ('PROGRAMADO', 'EN_TALLER', 'COMPLETADO', 'CANCELADO'))
);

CREATE TABLE alquileres (
    id_alquiler     BIGINT        NOT NULL AUTO_INCREMENT,
    id_usuario      BIGINT        NOT NULL,
    id_vehiculo     BIGINT        NOT NULL,
    id_conductor    BIGINT        NULL,
    fecha_inicio    DATE          NOT NULL,
    fecha_fin       DATE          NOT NULL,
    lugar_recogida  VARCHAR(120)  NOT NULL,
    lugar_entrega   VARCHAR(120)  NOT NULL,
    con_chofer      TINYINT(1)    NOT NULL DEFAULT 0,
    estado_servicio VARCHAR(20)   NULL,
    metodo_pago     VARCHAR(40)   NULL,
    total           DECIMAL(12,2) NOT NULL,
    observaciones   VARCHAR(500)  NULL,
    estado          VARCHAR(30)   NOT NULL DEFAULT 'Pendiente',
    fecha_registro  DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id_alquiler),
    KEY idx_alquileres_estado (estado),
    KEY idx_alquileres_fechas (fecha_inicio, fecha_fin),
    KEY idx_alquileres_usuario_inicio (id_usuario, fecha_inicio),
    KEY idx_alquileres_disponibilidad (id_vehiculo, estado, fecha_inicio, fecha_fin),
    KEY idx_alquileres_conductor_inicio (id_conductor, fecha_inicio),
    CONSTRAINT fk_alquileres_usuario   FOREIGN KEY (id_usuario)   REFERENCES usuarios (id_usuario),
    CONSTRAINT fk_alquileres_vehiculo  FOREIGN KEY (id_vehiculo)  REFERENCES vehiculos (id_vehiculo),
    CONSTRAINT fk_alquileres_conductor FOREIGN KEY (id_conductor) REFERENCES usuarios (id_usuario),
    CONSTRAINT chk_alquiler_estado CHECK (estado IN ('Pendiente', 'Confirmado', 'En curso', 'Finalizado', 'Cancelado')),
    CONSTRAINT chk_alquiler_fechas CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT chk_alquiler_total  CHECK (total >= 0)
);

CREATE TABLE alquiler_inspecciones (
    id_inspeccion  BIGINT       NOT NULL AUTO_INCREMENT,
    id_alquiler    BIGINT       NOT NULL,
    tipo           VARCHAR(12)  NOT NULL,
    kilometraje    INT          NOT NULL,
    combustible    INT          NOT NULL,
    observaciones  VARCHAR(500) NULL,
    danos          VARCHAR(500) NULL,
    registrado_por VARCHAR(120) NULL,
    fecha          DATETIME     NOT NULL,
    PRIMARY KEY (id_inspeccion),
    UNIQUE KEY uk_inspeccion_alquiler_tipo (id_alquiler, tipo),
    CONSTRAINT fk_insp_alquiler FOREIGN KEY (id_alquiler) REFERENCES alquileres (id_alquiler) ON DELETE CASCADE,
    CONSTRAINT chk_insp_tipo CHECK (tipo IN ('ENTREGA', 'DEVOLUCION')),
    CONSTRAINT chk_insp_combustible CHECK (combustible BETWEEN 0 AND 8)
);

CREATE TABLE alquiler_cargos (
    id_cargo       BIGINT        NOT NULL AUTO_INCREMENT,
    id_alquiler    BIGINT        NOT NULL,
    concepto       VARCHAR(40)   NOT NULL,
    detalle        VARCHAR(255)  NULL,
    monto          DECIMAL(10,2) NOT NULL,
    estado         VARCHAR(15)   NOT NULL DEFAULT 'PENDIENTE',
    metodo_cobro   VARCHAR(20)   NULL,
    fecha_cobro    DATETIME      NULL,
    fecha_registro DATETIME      NOT NULL,
    PRIMARY KEY (id_cargo),
    KEY idx_cargo_alquiler_estado (id_alquiler, estado),
    KEY idx_cargo_estado (estado),
    CONSTRAINT fk_cargo_alquiler FOREIGN KEY (id_alquiler) REFERENCES alquileres (id_alquiler) ON DELETE CASCADE,
    CONSTRAINT chk_cargo_monto CHECK (monto >= 0)
);

CREATE TABLE aceptaciones_politicas (
    id_aceptacion  BIGINT       NOT NULL AUTO_INCREMENT,
    id_usuario     BIGINT       NOT NULL,
    id_referencia  BIGINT       NULL,
    contexto       VARCHAR(20)  NOT NULL,
    version        VARCHAR(10)  NOT NULL,
    ip             VARCHAR(45)  NULL,
    registrado_por VARCHAR(120) NULL,
    fecha          DATETIME     NOT NULL,
    PRIMARY KEY (id_aceptacion),
    KEY idx_aceptaciones_usuario_contexto (id_usuario, contexto),
    KEY idx_aceptaciones_referencia (id_referencia),
    CONSTRAINT fk_aceptaciones_usuario  FOREIGN KEY (id_usuario)    REFERENCES usuarios (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_aceptaciones_alquiler FOREIGN KEY (id_referencia) REFERENCES alquileres (id_alquiler) ON DELETE SET NULL,
    CONSTRAINT chk_aceptaciones_contexto CHECK (contexto IN ('REGISTRO', 'RESERVA', 'EMPLEADO'))
);

CREATE TABLE intentos_pago (
    id_intento        BIGINT        NOT NULL AUTO_INCREMENT,
    codigo            VARCHAR(20)   NOT NULL,
    id_usuario        BIGINT        NOT NULL,
    id_vehiculo       BIGINT        NOT NULL,
    id_alquiler       BIGINT        NULL,
    fecha_inicio      DATE          NOT NULL,
    fecha_fin         DATE          NOT NULL,
    con_chofer        TINYINT(1)    NOT NULL DEFAULT 0,
    metodo            VARCHAR(20)   NOT NULL,
    monto             DECIMAL(10,2) NOT NULL,
    referencia        VARCHAR(60)   NULL,
    detalle           VARCHAR(160)  NULL,
    banco             VARCHAR(40)   NULL,
    fecha_operacion   DATETIME      NULL,
    motivo            VARCHAR(255)  NULL,
    intentos_fallidos INT           NOT NULL DEFAULT 0,
    estado            VARCHAR(20)   NOT NULL,
    expira            DATETIME      NOT NULL,
    fecha_registro    DATETIME      NOT NULL,
    PRIMARY KEY (id_intento),
    UNIQUE KEY uk_intento_codigo (codigo),
    KEY idx_intento_usuario (id_usuario),
    KEY idx_intento_estado_expira (estado, expira),
    KEY idx_intento_metodo_ref (metodo, referencia),
    KEY idx_intento_alquiler (id_alquiler),
    CONSTRAINT fk_intento_usuario  FOREIGN KEY (id_usuario)  REFERENCES usuarios (id_usuario),
    CONSTRAINT fk_intento_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculos (id_vehiculo),
    CONSTRAINT fk_intento_alquiler FOREIGN KEY (id_alquiler) REFERENCES alquileres (id_alquiler) ON DELETE SET NULL,
    CONSTRAINT chk_intento_estado CHECK (estado IN ('CREADO', 'REQUIERE_3DS', 'APROBADO', 'RECHAZADO', 'BLOQUEADO',
                                                    'EN_REVISION', 'PENDIENTE', 'USADO', 'EXPIRADO'))
);

CREATE TABLE constancias_pago (
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
);

CREATE TABLE pagos (
    id_pago          BIGINT        NOT NULL AUTO_INCREMENT,
    id_alquiler      BIGINT        NOT NULL,
    metodo           VARCHAR(20)   NULL,
    monto            DECIMAL(10,2) NULL,
    referencia       VARCHAR(120)  NULL,
    detalle          VARCHAR(160)  NULL,
    banco            VARCHAR(40)   NULL,
    fecha_operacion  DATETIME      NULL,
    tipo_comprobante VARCHAR(10)   NULL,
    ruc              VARCHAR(11)   NULL,
    razon_social     VARCHAR(150)  NULL,
    direccion_fiscal VARCHAR(200)  NULL,
    vence_pago       DATETIME      NULL,
    monto_recibido   DECIMAL(10,2) NULL,
    vuelto           DECIMAL(10,2) NULL,
    validado_por     VARCHAR(120)  NULL,
    fecha_validacion DATETIME      NULL,
    motivo_rechazo   VARCHAR(255)  NULL,
    observaciones    VARCHAR(500)  NULL,
    estado           VARCHAR(20)   NOT NULL DEFAULT 'Pendiente',
    fecha_pago       DATETIME(6)   NULL,
    fecha_registro   DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id_pago),
    UNIQUE KEY uk_pagos_alquiler (id_alquiler),
    UNIQUE KEY uk_pagos_alquiler_pago (id_alquiler, id_pago),
    KEY idx_pagos_estado_metodo (estado, metodo),
    KEY idx_pagos_metodo_referencia (metodo, referencia),
    KEY idx_pagos_fecha_pago (fecha_pago),
    KEY idx_pagos_vence (vence_pago),
    CONSTRAINT fk_pagos_alquiler FOREIGN KEY (id_alquiler) REFERENCES alquileres (id_alquiler) ON DELETE CASCADE,
    CONSTRAINT chk_pagos_estado CHECK (estado IN ('Pendiente', 'En revisión', 'Pagado', 'Rechazado',
                                                  'Expirado', 'Anulado', 'Reembolso pendiente', 'Reembolsado')),
    CONSTRAINT chk_pagos_tipo_comprobante CHECK (tipo_comprobante IS NULL OR tipo_comprobante IN ('BOLETA', 'FACTURA'))
);

CREATE TABLE comprobantes (
    id_comprobante      BIGINT        NOT NULL AUTO_INCREMENT,
    id_pago             BIGINT        NOT NULL,
    id_alquiler         BIGINT        NOT NULL,
    tipo                VARCHAR(10)   NOT NULL DEFAULT 'BOLETA',
    serie               VARCHAR(4)    NOT NULL DEFAULT 'B001',
    correlativo         INT           NULL,
    numero              VARCHAR(20)   NOT NULL,
    codigo_verificacion VARCHAR(20)   NOT NULL,
    documento_cliente   VARCHAR(11)   NULL,
    nombre_cliente      VARCHAR(150)  NULL,
    direccion_cliente   VARCHAR(200)  NULL,
    metodo_pago         VARCHAR(20)   NOT NULL,
    detalle_metodo      VARCHAR(120)  NULL,
    referencia          VARCHAR(120)  NULL,
    subtotal            DECIMAL(10,2) NOT NULL,
    igv                 DECIMAL(10,2) NOT NULL,
    total               DECIMAL(10,2) NOT NULL,
    estado              VARCHAR(15)   NOT NULL DEFAULT 'EMITIDO',
    fecha_emision       DATETIME      NOT NULL,
    fecha_anulacion     DATETIME      NULL,
    motivo_anulacion    VARCHAR(255)  NULL,
    PRIMARY KEY (id_comprobante),
    UNIQUE KEY uk_comprobantes_pago (id_pago),
    UNIQUE KEY uk_comprobantes_alquiler (id_alquiler),
    UNIQUE KEY uk_comprobantes_numero (numero),
    UNIQUE KEY uk_comprobantes_serie_correlativo (serie, correlativo),
    KEY idx_comprobantes_emision (fecha_emision),
    CONSTRAINT fk_comprobantes_pago_alquiler FOREIGN KEY (id_alquiler, id_pago)
        REFERENCES pagos (id_alquiler, id_pago),
    CONSTRAINT chk_comprobantes_tipo CHECK (tipo IN ('BOLETA', 'FACTURA')),
    CONSTRAINT chk_comprobantes_estado CHECK (estado IN ('EMITIDO', 'ANULADO'))
);

CREATE TABLE portal_documento (
    id_documento      BIGINT       NOT NULL,
    borrador          MEDIUMTEXT   NOT NULL,
    publicado         MEDIUMTEXT   NOT NULL,
    actualizado_por   VARCHAR(120) NULL,
    fecha_borrador    DATETIME     NULL,
    fecha_publicacion DATETIME     NULL,
    PRIMARY KEY (id_documento)
);

CREATE TABLE portal_versiones (
    id_version BIGINT       NOT NULL AUTO_INCREMENT,
    contenido  MEDIUMTEXT   NOT NULL,
    autor      VARCHAR(120) NULL,
    resumen    VARCHAR(255) NULL,
    fecha      DATETIME     NOT NULL,
    PRIMARY KEY (id_version),
    KEY idx_portal_version_fecha (fecha)
);

CREATE TABLE portal_imagenes (
    id_imagen      BIGINT       NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(120) NOT NULL,
    tipo_contenido VARCHAR(40)  NOT NULL,
    datos          LONGBLOB     NOT NULL,
    tamano         BIGINT       NOT NULL,
    fecha_registro DATETIME     NOT NULL,
    PRIMARY KEY (id_imagen),
    KEY idx_portal_imagen_nombre (nombre)
);

CREATE TABLE portal_ofertas (
    id_oferta      BIGINT       NOT NULL AUTO_INCREMENT,
    id_vehiculo    BIGINT       NOT NULL,
    titulo         VARCHAR(80)  NOT NULL,
    subtitulo      VARCHAR(160) NULL,
    descuento      INT          NOT NULL,
    inicio         DATE         NOT NULL,
    fin            DATE         NOT NULL,
    visible        TINYINT(1)   NOT NULL DEFAULT 1,
    fecha_registro DATETIME     NOT NULL,
    PRIMARY KEY (id_oferta),
    KEY idx_oferta_vehiculo_vigencia (id_vehiculo, inicio, fin),
    KEY idx_oferta_visible_vigencia (visible, inicio, fin),
    CONSTRAINT fk_oferta_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculos (id_vehiculo) ON DELETE CASCADE,
    CONSTRAINT chk_oferta_descuento CHECK (descuento BETWEEN 1 AND 70),
    CONSTRAINT chk_oferta_fechas CHECK (fin >= inicio)
);

CREATE TABLE auditoria (
    id_auditoria BIGINT       NOT NULL AUTO_INCREMENT,
    fecha_hora   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    modulo       VARCHAR(50)  NOT NULL,
    accion       VARCHAR(50)  NOT NULL,
    entidad      VARCHAR(60)  NOT NULL,
    id_entidad   BIGINT       NULL,
    actor        VARCHAR(120) NOT NULL DEFAULT 'Panel administrador',
    detalle      VARCHAR(700) NOT NULL,
    PRIMARY KEY (id_auditoria),
    KEY idx_auditoria_fecha_hora (fecha_hora),
    KEY idx_auditoria_modulo (modulo),
    KEY idx_auditoria_accion (accion),
    KEY idx_auditoria_entidad (entidad, id_entidad)
);

INSERT INTO perfiles (id_perfil, nombre) VALUES
    (1, 'Administrador'),
    (2, 'Cliente'),
    (3, 'Agente de reservas'),
    (4, 'Cajero'),
    (5, 'Conductor');

INSERT INTO perfil_permisos (id_perfil, codigo) VALUES
    (3, 'ADMIN_TABLERO'), (3, 'ADMIN_FLOTA'), (3, 'ADMIN_ALQUILERES'), (3, 'ADMIN_USUARIOS'), (3, 'ADMIN_MONITOREO'),
    (3, 'WEB_INICIO'), (3, 'WEB_CATEGORIAS'), (3, 'WEB_OFERTAS'), (3, 'WEB_EXPERIENCIA'), (3, 'WEB_SOPORTE'),
    (4, 'ADMIN_TABLERO'), (4, 'ADMIN_PAGOS'), (4, 'ADMIN_REPORTES'),
    (4, 'WEB_INICIO'), (4, 'WEB_CATEGORIAS'), (4, 'WEB_OFERTAS'), (4, 'WEB_EXPERIENCIA'), (4, 'WEB_SOPORTE'),
    (5, 'ADMIN_SERVICIOS'), (5, 'WEB_INICIO');

INSERT INTO usuarios (id_usuario, id_perfil, nombres, apellidos, correo, contrasena, estado) VALUES
    (1, 1, 'Administrador', 'Carmovo', 'admin@carmovo.com',
     '$2a$10$NRPw6qGa0hMJ8M1YdPagveRn0JJypXELG4Buf45iqw.2pj5NIoVOu', 1);

INSERT INTO administradores_acceso (id_usuario, es_principal) VALUES
    (1, 1);
