# 🚗 CARMOVO — Sistema de alquiler de vehículos

CARMOVO es una página web para **alquilar autos por internet**. Tiene dos partes:

- **El sitio web** (para los clientes): ven los autos, eligen fechas, pagan y descargan su boleta o factura. Funciona en celular, tablet y computadora.
- **El panel de administración** (para el personal): cada trabajador entra con su cuenta y solo ve lo que le corresponde según su rol (cajero, agente, conductor, administrador). Está pensado para usarse en laptop o PC.

> Este documento está escrito para que **cualquier persona**, sepa o no de programación, entienda qué hace el sistema y cómo ponerlo en marcha.

---

## 📌 Contenido

1. [¿Qué puede hacer el sistema?](#-qué-puede-hacer-el-sistema)
2. [Los roles: quién hace qué](#-los-roles-quién-hace-qué)
3. [Cómo funciona un alquiler, paso a paso](#-cómo-funciona-un-alquiler-paso-a-paso)
4. [Formas de pago](#-formas-de-pago)
5. [Boleta o factura](#-boleta-o-factura)
6. [Datos para probar](#-datos-para-probar)
7. [Instalar y ejecutar en tu computadora (VS Code)](#-instalar-y-ejecutar-en-tu-computadora-vs-code)
8. [Publicarlo en internet con un enlace](#-publicarlo-en-internet-con-un-enlace)
9. [Seguridad](#-seguridad)
10. [Pruebas automáticas](#-pruebas-automáticas)
11. [Cómo está organizado el proyecto](#-cómo-está-organizado-el-proyecto)
12. [Preguntas frecuentes y problemas comunes](#-preguntas-frecuentes-y-problemas-comunes)

---

## ✨ ¿Qué puede hacer el sistema?

### Para el cliente (sitio web)
| Función | Qué significa |
|---|---|
| Ver autos y ofertas | Catálogo por categorías y ofertas con descuento real (el precio que ves es el que pagas). |
| Crear cuenta e iniciar sesión | Con correo y contraseña. Si olvida la contraseña, recibe un enlace para crear otra. |
| Términos y privacidad | Al crear su cuenta y al reservar marca **"Acepto"**: primero se abre el documento completo y solo puede aceptar después de leerlo hasta el final. Se guarda la fecha, la hora y la versión aceptada. También se puede leer en `/politicas`. |
| Reservar | Elige auto, fechas, lugar de recojo y devolución, y responde **"¿Quién manejará el auto?"**: **Yo manejo** (el titular de la cuenta es el conductor, con su licencia, como siempre) o **Chofer de la agencia** (no se le pide licencia). |
| Pagar | Con tarjeta, Yape, Plin, **transferencia bancaria** o **efectivo en la oficina**. Con Yape, Plin y transferencia sube la **foto o captura del pago** y queda **"En revisión"** hasta que caja lo apruebe o lo rechace. |
| Comprobante | Elige **boleta** (con DNI) o **factura** (con RUC). La descarga desde "Mi cuenta". |
| Mi cuenta | Historial de alquileres, estado de cada pago y sus comprobantes. |
| Avisos por correo | Recibe un correo al reservar, cuando su pago se confirma o si se rechaza. |

### Para el personal (panel de administración)
| Módulo | Para qué sirve |
|---|---|
| Tablero | Resumen del negocio: alquileres, ingresos y estado de la flota. |
| Gestión de flota | Autos con placa, año, color, kilometraje, **foto subida desde la computadora** y vencimiento de SOAT y revisión técnica. |
| Categorías | Crear, renombrar, ordenar, ocultar o eliminar las categorías de vehículos (SUVs, Sedanes…). Aparecen solas en la web. |
| Mantenimiento | Programar taller, cambio de aceite, SOAT, etc. Un auto en taller **no se puede alquilar**. |
| Alquileres | Reservas, **entrega** del auto (km y combustible), **devolución** (cobros por retraso, combustible o daños) y asignación de **chofer**. |
| Mis servicios | Pantalla del **conductor**, pensada para el celular: ve sus servicios y marca "en camino", "con el cliente" y "finalizado". |
| Pagos e ingresos | Pantalla del **cajero**: aprobar Plin, cobrar efectivo (calcula el vuelto), rechazar, reembolsar y cobrar cargos adicionales. |
| Usuarios | Clientes registrados. |
| Monitoreo y Reportes | Seguimiento de la flota y reportes del negocio. |
| Auditoría | Registro de quién hizo qué y cuándo. |
| Portal web | Cambiar textos, video o imagen de portada, ofertas, preguntas frecuentes, contacto y el **diseño** del sitio (colores, tipo de letra, forma de botones y tarjetas) **sin programar**, con vista previa real. Botón **Restaurar configuración inicial** para volver al sitio original. |
| Empleados | Registrar al personal con sus datos reales (DNI, celular, fecha de nacimiento, domicilio y, para conductores, su licencia) y asignarles un rol. El empleado acepta las condiciones y la política de privacidad (se abre el documento completo). |
| Conductores | Los **choferes de la agencia**: botón **Registrar conductor**, licencia, aviso de licencias por vencer o vencidas. Cada alquiler "con chofer" recibe automáticamente un conductor libre con licencia vigente. |
| Mi cuenta (arriba a la derecha) | Cada empleado actualiza sus datos, pone su foto de perfil, cambia su contraseña o cierra sesión. |
| Roles y permisos | Decidir a qué módulos entra cada rol y **crear roles nuevos** (por ejemplo Supervisor o Recepcionista). |

---

## 👥 Los roles: quién hace qué

Los permisos se dan **por rol**: todos los cajeros ven lo mismo, todos los conductores ven lo mismo, etc. El administrador puede cambiar estos permisos en **Roles y permisos**, y también **crear roles nuevos**, renombrarlos o eliminarlos (si no tienen empleados). Los 5 roles de fábrica no se pueden eliminar.

| Rol | Qué hace | Módulos por defecto |
|---|---|---|
| **Administrador** | Tiene acceso a todo. Crea empleados y define permisos. | Todos |
| **Agente de reservas** | Atiende reservas, entrega y recibe autos, asigna choferes. | Tablero, Flota, Alquileres, Usuarios, Monitoreo |
| **Cajero** | Confirma pagos, cobra efectivo, emite y anula comprobantes. | Tablero, Pagos, Reportes |
| **Conductor** | Realiza los alquileres con chofer. | Mis servicios |
| **Cliente** | Usa el sitio web. No entra al panel. | — |

🔒 **La cuenta del administrador principal nunca se puede desactivar, cambiar de rol ni eliminar.** Está protegida por el sistema y también por la base de datos.

---

## 🔁 Cómo funciona un alquiler, paso a paso

```
 CLIENTE                         PERSONAL
 ───────                         ────────
 1. Elige auto y fechas
 2. Elige boleta o factura
 3. Paga ─────────────────────▶  Tarjeta: se confirma al instante
                                 Yape / Plin / Transferencia: el cliente sube
                                 la foto del pago y queda "En revisión"; el
                                 CAJERO revisa la foto y los datos, y la
                                 aprueba o la rechaza indicando el motivo
                                 Efectivo: el CAJERO cobra en la oficina
 4. Recibe su comprobante  ◀───  Se emite automáticamente al confirmarse el pago
                                 5. AGENTE entrega el auto (km y combustible)
                                    → el alquiler pasa a "En curso"
                                 6. AGENTE recibe el auto de vuelta
                                    → calcula cargos si hubo retraso, falta de
                                      combustible o daños → "Finalizado"
                                 7. CAJERO cobra los cargos adicionales (si hay)
```

**Estados del alquiler:** Pendiente → Confirmado → En curso → Finalizado (o Cancelado).

**Estados del pago:** Pendiente · En revisión · Pagado · Rechazado · Expirado · Anulado · Reembolso pendiente · Reembolsado.

### Reglas importantes
- **Edad mínima:** 21 años para manejar. Con **chofer de la agencia** el cliente no maneja: no se le pide licencia, solo ser mayor de edad.
- **Licencia:** debe estar vigente **hasta el último día** del alquiler. Las furgonetas piden licencia **A-IIb** o superior; el resto, A-I.
- **Precio:** tarifa por día + chofer (S/ 80 por día, opcional) + IGV 18% + seguro S/ 120. Si el auto tiene una oferta vigente en la fecha de recojo, se aplica el descuento.
- **Un auto no se puede alquilar** si está en taller, inactivo, o con el SOAT o la revisión técnica vencidos.
- **Efectivo:** se debe pagar antes de las **12:00 del día de recojo**; si no, la reserva se cancela sola.
- **Devolución tardía:** cada día de retraso se cobra a la tarifa diaria. **Combustible:** S/ 25 por cada octavo de tanque que falte.
- **Chofer de la agencia:** al reservar "con chofer" el sistema asigna un conductor activo, con licencia vigente hasta el último día y de la categoría que pide el auto, que no tenga otro servicio esas fechas. Si no hay ninguno libre, avisa antes de pagar. El agente puede cambiarlo con "Asignar chofer".
- Si se cancela un alquiler ya pagado, el pago queda en **"Reembolso pendiente"** y el comprobante se **anula**.

---

## 💳 Formas de pago

| Método | Cómo funciona |
|---|---|
| **Tarjeta** (Visa, Mastercard, Amex, Diners) | Se valida el número, la fecha y el CVV. Puede pedir verificación 3D Secure. Con tarjeta de crédito se puede elegir cuotas. |
| **Yape** | El cliente yapea al QR y reporta: **foto/captura del pago**, celular, N° de operación y hora. Límite de **S/ 2,000** por operación. |
| **Plin** | El cliente paga al QR y reporta: **foto/captura**, banco, N° de operación y hora. |
| **Transferencia** | Se muestran las cuentas de CARMOVO (N° de cuenta y CCI). El cliente reporta: **foto/constancia**, banco de origen, titular, N° de operación y hora. |

Con Yape, Plin y transferencia el pago queda **"En revisión"** (también en *Mi cuenta* del cliente). En **Pagos e ingresos** el cajero pulsa **Verificar**: ve la foto junto con todos los datos de la operación y de la reserva, y **aprueba** (se confirma la reserva y se emite el comprobante) o **rechaza con motivo** (la reserva se cancela y el cliente recibe el motivo por correo y en *Mi cuenta*).

> Las cuentas bancarias de transferencia son de ejemplo: cámbialas en `static/js/paginas/pasarela-simulada.js` (`CUENTAS_CARMOVO`).
| **Efectivo** | El cliente paga en billetes en la oficina. El cajero registra cuánto recibió y el sistema calcula el **vuelto**. |

> La pasarela es una **simulación realista** para el curso: no mueve dinero real. Todo se valida en el servidor (el monto lo calcula el sistema, no el navegador) y cada pago se usa una sola vez.

---

## 🧾 Boleta o factura

- **Boleta** (serie **B001**): a nombre del cliente con su DNI.
- **Factura** (serie **F001**): a nombre de una empresa. Se pide **RUC** (se verifica que sea válido), razón social y dirección fiscal.
- Se emite **una sola vez** y **solo cuando el pago está confirmado**.
- El cliente la ve y la descarga en **Mi cuenta**; el personal la ve y descarga en **Pagos e ingresos**.
- Si hay un reembolso, el comprobante se marca como **ANULADO** (se conserva el número para el historial).

---

## 🧪 Datos para probar

### Cuentas
| Quién | Correo | Contraseña |
|---|---|---|
| Administrador principal | `admin@carmovo.com` | la que ya usas |
| Cliente de prueba | `carlos@gmail.com` | `123456` |

Para probar los roles, entra como administrador → **Empleados** → **Nuevo empleado** y crea un Cajero, un Agente de reservas y un Conductor.

### Tarjetas de prueba (cualquier nombre, fecha futura)
| Número | Resultado |
|---|---|
| `4111 1111 1111 1111` | ✅ Aprobada (CVV `123`) |
| `5555 5555 5555 4444` | ✅ Aprobada (Mastercard) |
| `4000 0000 0000 0002` | ❌ Fondos insuficientes |
| `4000 0000 0000 0069` | ❌ Tarjeta bloqueada |
| `4000 0000 0000 0127` | ❌ CVV incorrecto |
| `4000 0000 0000 3220` | ❌ Falla la verificación 3D Secure |

Código 3D Secure: **`123456`**.

### Yape, Plin y transferencia
Elige el método, pulsa **"Ya yapeé" / "Ya realicé el pago" / "Ya transferí"** y completa: una **foto o captura** cualquiera (JPG, PNG, WEBP o PDF de hasta 5 MB), un N° de operación de 6 a 12 dígitos (Plin: hasta 10) y la hora (de las últimas 24 horas). El pago queda **"En revisión"**; entra al panel como cajero → **Pagos e ingresos** → **Verificar** para aprobarlo o rechazarlo con motivo.

### Factura
RUC válido de ejemplo: **`20601234565`**.

---

## 💻 Instalar y ejecutar en tu computadora (VS Code)

### Lo que necesitas instalar (una sola vez)
1. **Java 25** (JDK) — descarga "Temurin 25" en [adoptium.net](https://adoptium.net).
2. **MySQL 8** y **MySQL Workbench** — en [dev.mysql.com/downloads](https://dev.mysql.com/downloads/).
3. **Visual Studio Code** con el paquete **"Extension Pack for Java"** y **"Spring Boot Extension Pack"**.

### Paso 1 · Preparar la base de datos
1. Abre **MySQL Workbench** y conéctate a tu servidor (este proyecto usa el puerto **3308**, usuario **root**, contraseña **654321**; si los tuyos son distintos, mira el Paso 3).
2. Elige **una** de estas dos opciones:
   - **Base nueva, desde cero (recomendado):** abre **`backend/sql/CARMOVO_base_datos_nueva.sql`** y presiona el **rayo ⚡**. Crea las 24 tablas en tercera forma normal, sin datos de prueba; solo trae los roles y la cuenta del administrador principal (**admin@carmovo.com** / **Carmovo2026** — cámbiala al entrar). Las categorías, vehículos y demás se crean desde el panel. ⚠️ Borra la base `carmovo_db` si ya existía.
   - **Conservar una base que ya tienes:** importa tu respaldo `CARMOVO_BaseDeDatos_Completa.sql` (**Server → Data Import**) y sigue con el punto 3.
3. (Solo para conservar una base existente) Abre **`backend/sql/CARMOVO_actualizacion_completa.sql`** y presiona el **rayo ⚡** para ejecutarlo.
   - Agrega todas las tablas y columnas nuevas. **No borra nada** y se puede ejecutar más de una vez.
   - Al final muestra "Tablas nuevas: 14" y la lista de roles con sus módulos.

### Paso 2 · Abrir el proyecto
1. En VS Code: **File → Open Folder** y elige la carpeta **`backend`**.
2. Espera a que VS Code termine de cargar el proyecto (abajo a la derecha dice "Java: Ready"). La primera vez descarga las librerías; tarda unos minutos.

### Paso 3 · Ejecutar
- Opción fácil: en la barra izquierda, pestaña **Run and Debug ▶**, elige **"CARMOVO (local)"** y presiona play.
- O en la terminal de VS Code:
  ```bash
  ./mvnw spring-boot:run          # Mac / Linux
  mvnw.cmd spring-boot:run        # Windows
  ```
- Abre **http://localhost:8080** (sitio web) y **http://localhost:8080/admin/login** (panel).

Si tu MySQL usa otro puerto o contraseña, cámbialos en `.vscode/launch.json` o en `src/main/resources/application.yml` (líneas `DB_URL`, `DB_USER`, `DB_PASSWORD`).

### Paso 4 · Token para traer nombres desde el DNI (opcional)
En **Empleados**, al escribir un DNI de 8 dígitos el sistema trae los nombres y apellidos de RENIEC. Para eso necesita tu token de **MiAPI** (miapi.cloud). Ponlo en **uno** de estos lugares y vuelve a ejecutar:
- `backend/.vscode/launch.json` → cambia `PEGA_AQUI_TU_TOKEN_DE_MIAPI` por tu token, o
- `src/main/resources/application.yml` → línea `token: ${CARMOVO_DNI_TOKEN:TU_TOKEN}` (pégalo después de los dos puntos).

Sin token el panel funciona igual: solo escribes los nombres a mano.

### Verlo desde tu celular (misma red Wi-Fi)
1. Averigua la IP de tu computadora (Windows: `ipconfig` → "Dirección IPv4", por ejemplo `192.168.1.20`).
2. En el celular abre `http://192.168.1.20:8080`.
3. Si no carga, permite Java en el firewall de Windows.

---

## 🌐 Publicarlo en internet con un enlace

La forma más sencilla es **Railway** (tiene plan gratuito de prueba). El proyecto ya trae un `Dockerfile`, así que Railway lo construye solo.

1. Sube el proyecto a **GitHub**.
2. Entra a [railway.app](https://railway.app) con tu cuenta de GitHub → **New Project → Deploy from GitHub repo** → elige el repositorio. En **Settings → Root Directory** escribe `backend`.
3. En el mismo proyecto: **New → Database → MySQL**.
4. Conéctate a esa base de datos con MySQL Workbench (Railway muestra host, puerto, usuario y contraseña en la pestaña **Connect**) e importa tu respaldo y luego `CARMOVO_actualizacion_completa.sql`.
5. En el servicio de la app → **Variables**, agrega:

| Variable | Valor |
|---|---|
| `DB_URL` | `jdbc:mysql://HOST:PUERTO/railway?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=America/Lima` |
| `DB_USER` | el usuario de Railway |
| `DB_PASSWORD` | la contraseña de Railway |
| `CARMOVO_JWT_SECRETO` | una frase larga y secreta (mínimo 32 caracteres) |
| `CARMOVO_URL_PUBLICA` | el enlace que te da Railway, por ejemplo `https://carmovo.up.railway.app` |
| `THYMELEAF_CACHE` | `true` |

6. **Settings → Networking → Generate Domain**. Ese es el **enlace** que puedes abrir desde cualquier celular o computadora.

### Correos reales (opcional)
Sin configuración, los correos se muestran en la consola (útil para probar). Para enviarlos de verdad con Gmail:

| Variable | Valor |
|---|---|
| `MAIL_HOST` | `smtp.gmail.com` |
| `MAIL_PORT` | `587` |
| `MAIL_USER` | tu correo de Gmail |
| `MAIL_PASSWORD` | una **contraseña de aplicación** de Google (no tu contraseña normal) |
| `MAIL_FROM` | `CARMOVO <tu-correo@gmail.com>` |

### Con Docker (alternativa)
Si tienes Docker Desktop: en la carpeta principal ejecuta `docker compose up --build` y abre http://localhost:8080 (importa la base de datos como en el Paso 1).

### Todas las variables de configuración
| Variable | Para qué | Valor por defecto |
|---|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Conexión a MySQL | localhost:3308 / root / 654321 |
| `PORT` | Puerto de la web | 8080 |
| `CARMOVO_JWT_SECRETO` | Clave para firmar las sesiones de clientes | una de desarrollo (cámbiala en internet) |
| `CARMOVO_JWT_MINUTOS` | Duración de la sesión del cliente | 480 (8 horas) |
| `CARMOVO_URL_PUBLICA` | Dirección del sitio (para los enlaces de los correos) | http://localhost:8080 |
| `CARMOVO_LIMITE_YAPE` | Límite de Yape en soles | 2000 |
| `CARMOVO_DNI_TOKEN` | Token de MiAPI para traer nombres desde el DNI | vacío (nombres a mano) |
| `CARMOVO_DNI_URL` | Proveedor de consulta DNI (`{dni}` = número) | https://miapi.cloud/v1/dni/{dni} |
| `MAIL_*` | Envío de correos | vacío (consola) |
| `THYMELEAF_CACHE` | `true` en internet para que cargue más rápido | false |

---

## 🔐 Seguridad

- **Spring Security + JWT** para los clientes: al iniciar sesión reciben una "llave" firmada que vence a las 8 horas. Sin ella no pueden ver ni cambiar datos de otra persona.
- **Sesiones del personal** con permisos por rol revisados **en el servidor** en cada pantalla y en cada acción (no basta con ocultar un botón).
- Una función nueva del panel que no tenga permiso definido queda **bloqueada por defecto**.
- Contraseñas guardadas con **BCrypt** (no se pueden leer).
- Recuperación de contraseña con enlace de **un solo uso** que vence en **30 minutos**.
- Pagos: el **monto lo calcula el servidor**, cada pago se usa una sola vez, 3 intentos fallidos bloquean el pago y los pagos abandonados vencen a los 15 minutos. Un número de operación Plin no se puede registrar dos veces.
- Imágenes del portal: solo JPG, PNG o WEBP reales (se revisa el contenido, no solo el nombre), máximo 2 MB.
- Todo cambio importante queda en **Auditoría**.

---

## ✅ Pruebas automáticas

En `backend/src/test` hay pruebas que revisan solas las reglas más importantes:

| Prueba | Qué revisa |
|---|---|
| `JwtServicioTest` | La llave de sesión: válida, alterada, vencida, clave demasiado corta. |
| `ValidadorDocumentosTest` | DNI, RUC, placa, celular, edad mínima, licencia vencida y categoría para furgonetas. |
| `SimuladorPasarelaTest` | Tarjetas aprobadas y rechazadas, vencidas, CVV, Yape. |
| `PermisosAdministrativosTest` | Que cada módulo del panel exija su permiso y que lo nuevo se bloquee por defecto. |
| `CotizacionTest` | El cálculo del precio: tarifa, chofer, IGV, seguro y ofertas. |

Para ejecutarlas: en la terminal de VS Code, dentro de `backend`:
```bash
./mvnw test          # Windows: mvnw.cmd test
```
Al final debe decir **BUILD SUCCESS**.

---

## 🗂️ Cómo está organizado el proyecto

```
CARMOVO/
├── README.md                 ← este documento
├── docker-compose.yml        ← para levantar todo con Docker (opcional)
└── backend/
    ├── Dockerfile            ← receta para publicarlo en internet
    ├── pom.xml               ← lista de librerías (Spring Boot 4, Java 25)
    ├── sql/
    │   └── CARMOVO_actualizacion_completa.sql   ← ⭐ actualización de la base de datos
    └── src/
        ├── main/java/com/carmovo/
        │   ├── controller/   ← reciben las peticiones de la web (rutas /api/...)
        │   ├── service/      ← las reglas del negocio (precios, pagos, validaciones)
        │   ├── repository/   ← leen y guardan en MySQL
        │   ├── model/        ← cada tabla de la base de datos
        │   ├── dto/          ← los datos que viajan entre la web y el servidor
        │   └── config/       ← seguridad (Spring Security, JWT, permisos)
        ├── main/resources/
        │   ├── templates/        ← páginas del sitio (HTML con Thymeleaf)
        │   ├── templates/admin/  ← páginas del panel
        │   ├── static/css, js    ← diseño y comportamiento de cada página
        │   └── application.yml   ← configuración
        └── test/             ← pruebas automáticas
```

### Tecnologías
| Parte | Tecnología |
|---|---|
| Servidor | Java 25 · Spring Boot 4 (Web, Data JPA, Security, Mail, Validation, Scheduling) |
| Páginas | Thymeleaf + HTML, CSS y JavaScript |
| Base de datos | MySQL 8 |
| Publicación | Docker · Railway (o cualquier servicio compatible) |

### Tablas nuevas de esta versión
| Tabla | Guarda |
|---|---|
| `perfil_permisos` | Qué módulos tiene cada rol |
| `restablecimientos_contrasena` | Enlaces para recuperar la contraseña |
| `intentos_pago` | Cada intento de pago en la pasarela |
| `comprobantes` | Boletas y facturas |
| `mantenimientos` | Servicios de taller de cada auto |
| `alquiler_inspecciones` | Km y combustible al entregar y recibir el auto |
| `alquiler_cargos` | Cobros extra: retraso, combustible, daños |
| `portal_documento`, `portal_versiones` | Textos del sitio (borrador, publicado e historial) |
| `portal_imagenes` | Imágenes subidas desde el panel |
| `portal_ofertas` | Ofertas con descuento y fechas de vigencia |
| `categorias` | Categorías de vehículos creadas desde el panel |
| `aceptaciones_politicas` | Quién aceptó los términos y la privacidad, cuándo, desde qué IP y qué versión |
| `constancias_pago` | Foto o captura del pago (Yape, Plin, transferencia) que caja revisa antes de aprobar |

---

## ❓ Preguntas frecuentes y problemas comunes

**"Communications link failure" al iniciar.** MySQL no está encendido o el puerto/contraseña no coinciden. Revisa el Paso 3.

**"Unknown column ..." o "Table ... doesn't exist".** Falta ejecutar `CARMOVO_actualizacion_completa.sql`.

**Un empleado entra y no ve ningún módulo.** Su rol no tiene permisos. Ve a **Roles y permisos** y márcalos.

**Un auto no aparece para alquilar.** Revisa en **Gestión de flota** que esté "Disponible" y que su SOAT y revisión técnica no estén vencidos (aparecen en **Mantenimiento → Documentos por vencer**).

**Cambié algo en "Portal web" y no se ve en el sitio.** Presiona **Publicar**. Lo que guardas es un borrador hasta que lo publicas.

**El panel se ve apretado en el celular.** Es normal: el panel está pensado para laptop o PC. La excepción es **Mis servicios** (conductores), que sí está hecho para el celular.

---

Hecho para el curso por **Darwin Ylatoma Núñez** · CARMOVO 2026
