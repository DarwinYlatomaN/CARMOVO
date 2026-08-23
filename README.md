 HEAD
# 🚗 Carmovo — Plataforma de Renta y Venta de Vehículos

Sistema web comercial que combina alquiler  en una sola plataforma, con un panel administrativo para el control total del negocio (flota, reservas, ventas, usuarios, reportes).

Este README documenta la arquitectura completa del proyecto: qué hace cada carpeta, qué hace cada archivo, y por qué está diseñado así.

---

## 📌 Índice

1. [Stack tecnológico](#-stack-tecnológico)
2. [Filosofía de arquitectura](#-filosofía-de-arquitectura)
3. [Estructura raíz del proyecto](#-estructura-raíz-del-proyecto)
4. [Backend — explicación completa](#-backend--explicación-completa)
5. [Frontend — Sitio Público](#-frontend--sitio-público)
6. [Frontend — Panel Admin](#-frontend--panel-admin)
7. [Roles de usuario](#-roles-de-usuario)
8. [Patrones de diseño aplicados](#-patrones-de-diseño-aplicados)
9. [Variables de entorno](#-variables-de-entorno)
10. [Cómo correr el proyecto](#-cómo-correr-el-proyecto)
11. [Hosting recomendado](#-hosting-recomendado)
12. [Pendientes antes de producción](#-pendientes-antes-de-producción)

---

## 🧰 Stack tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend (sitio público y admin) | HTML + CSS + JavaScript puro (Vanilla) | Control total, sin peso de un framework, uso de Web Components nativos para reutilizar UI |
| Backend | Node.js + Express | Ligero, no impone arquitectura, permite aplicar patrones de diseño libremente |
| Base de datos | PostgreSQL | Relacional, robusto, soporta constraints avanzados (ej. evitar doble reserva del mismo auto) |
| Cache / Colas | Redis (+ BullMQ) | Acelera lecturas frecuentes y procesa tareas en segundo plano (emails, PDFs) |
| Contenedores | Docker + docker-compose | Ambiente reproducible igual en desarrollo y producción |

---

## 🏛️ Filosofía de arquitectura

El proyecto es un **monolito modular**, no microservicios. Esto significa: un solo backend desplegado como un proceso, pero internamente dividido en módulos independientes (`usuarios`, `vehiculos`, `alquileres`, `ventas`, etc.) que **no se acceden entre sí directamente** — solo se comunican a través de sus archivos `*.servicio.js`, o mediante eventos internos (Observer Pattern).

Esto da lo mejor de ambos mundos: la simplicidad operativa de un monolito (una sola base de datos, un solo despliegue, transacciones SQL simples) con la disciplina de fronteras claras entre dominios, lo que permite en el futuro extraer cualquier módulo a un microservicio real sin reescribir todo el sistema, si el negocio llega a necesitarlo.

---

## 📁 Estructura raíz del proyecto

```
carmovo/
├── backend/              # API REST — toda la lógica de negocio y acceso a datos
├── frontend/
│   ├── sitio-publico/    # Lo que ve el cliente final (catálogo, reservas, compras)
│   └── panel-admin/      # Lo que usa el personal interno (staff, gerencia)
├── docker-compose.yml    # Levanta backend + PostgreSQL + Redis juntos con un comando
├── .env.example           # Plantilla de variables de entorno (sin valores reales/secretos)
└── README.md              # Este archivo
```

**`docker-compose.yml`**: define los servicios que deben correr juntos en desarrollo (backend, base de datos, Redis) y cómo se conectan entre sí, sin que cada desarrollador tenga que instalar PostgreSQL o Redis manualmente en su máquina.

**`.env.example`**: lista todas las variables de entorno que el proyecto necesita (claves de API, credenciales de base de datos) pero sin los valores reales — sirve de plantilla para que cada desarrollador cree su propio `.env` local. El `.env` real **nunca** se sube al repositorio (debe estar en `.gitignore`).

---

## 🔧 BACKEND — explicación completa

```
backend/
├── src/
│   ├── configuracion/
│   ├── modulos/
│   ├── middlewares/
│   ├── patrones/
│   ├── compartido/
│   ├── rutas/
│   ├── tareas/
│   ├── app.js
│   └── servidor.js
├── pruebas/
├── package.json
├── Dockerfile
└── .env
```

### `src/configuracion/`
Todo lo que el sistema necesita saber **antes** de empezar a atender peticiones.

- **`basedatos.js`** — Crea el pool de conexiones a PostgreSQL una sola vez (patrón Singleton) y lo exporta para que todos los repositorios lo reutilicen, en vez de abrir una conexión nueva por cada consulta (lo cual saturaría la base de datos rápidamente).
- **`entorno.js`** — Lee las variables de entorno (`.env`) al arrancar la aplicación y valida que las críticas existan (`DATABASE_URL`, `JWT_SECRET`, etc.). Si falta una, el servidor debe fallar inmediatamente al arrancar, no a medias cuando un usuario ya está usando el sistema.
- **`redis.js`** — Inicializa el cliente de Redis, usado tanto para cachear datos de lectura frecuente (catálogo de vehículos) como para las colas de tareas en segundo plano.
- **`integraciones.config.js`** — Centraliza las credenciales de todos los proveedores externos (RENIEC, Google Maps, Stripe, etc.), leídas desde `.env`, y valida que estén presentes antes de permitir que el sistema use esa integración.
- **`constantes.js`** — Guarda valores fijos usados en todo el sistema: nombres de roles (`ADMIN`, `RENTAL_AGENT`...), estados de una reserva (`PENDING`, `CONFIRMED`, `CANCELLED`), tipos de transacción. Evita tener el mismo texto repetido y propenso a errores de tipeo en decenas de archivos distintos.

### `src/modulos/`
El corazón del sistema. Cada subcarpeta es un **dominio de negocio** autocontenido. La convención de archivos dentro de cada módulo es siempre la misma (para que cualquier desarrollador nuevo entienda el patrón de inmediato):

| Archivo | Responsabilidad |
|---|---|
| `*.controlador.js` | Recibe la petición HTTP, la pasa al servicio, devuelve la respuesta. **No contiene lógica de negocio.** |
| `*.servicio.js` | Contiene las reglas de negocio reales (ej: "no se puede cancelar una reserva con menos de 24h de anticipación"). |
| `*.repositorio.js` | Único lugar donde se escriben queries SQL de ese módulo. Aísla la base de datos del resto del código. |
| `*.modelo.js` | Representa la forma del dato tal como vive en la base de datos (columnas y tipos). |
| `*.dto.js` | Define qué datos entran y salen hacia el cliente (Data Transfer Object) — nunca se expone el modelo de base de datos directo, para no filtrar campos internos o sensibles. |
| `*.rutas.js` | Declara las URLs de ese módulo y qué middlewares (autenticación, validación, rol) deben pasar antes de llegar al controlador. |

A continuación, el detalle específico de cada módulo:

#### `autenticacion/`
Maneja login, registro y renovación de sesión.
- **`estrategias/`** — Implementa el patrón Strategy: distintas formas de autenticar (JWT normal, refresh token y, en el futuro, login social) intercambiables sin modificar el resto del módulo.

#### `usuarios/`
Gestión de cuentas de clientes y personal interno. Su `usuario.servicio.js` es quien llama al módulo de `integraciones/identidad/` para verificar el DNI de un cliente contra RENIEC (o el organismo equivalente) antes de aprobar una reserva o venta.

#### `roles/`
Implementa RBAC (Role-Based Access Control): qué rol puede hacer qué acción. `permiso.repositorio.js` guarda la relación entre roles y permisos específicos (ej: `fleet_manager` puede `crear_vehiculo`, pero `sales_agent` no).

#### `vehiculos/`
Catálogo compartido entre renta y venta.
- **`vehiculo.repositorio.js`** — Soporta filtros combinados (tipo de auto + número de asientos + transmisión + rango de precio) para alimentar tanto la página de catálogo como los resultados de búsqueda.
- **`subdominios/category.repositorio.js`** — Categorías de vehículo (SUV, sedán, eléctrico, lujo) separadas del repositorio principal para no inflarlo.
- **`subdominios/imagen.servicio.js`** — Sube fotos a almacenamiento externo (S3/Cloudinary) y guarda solo la URL resultante en la base de datos — nunca se guarda el archivo binario en PostgreSQL.
- **`subdominios/caracteristica.repositorio.js`** — Características del vehículo (aire acondicionado, GPS, Bluetooth) modeladas como tabla propia en vez de columnas fijas, para poder agregar nuevas sin alterar el esquema.

#### `alquileres/`
El dominio más complejo del sistema.
- **`disponibilidad.servicio.js`** — Verifica que un vehículo esté libre en un rango de fechas antes de confirmar el pago. Se apoya en un constraint nativo de PostgreSQL (`EXCLUDE USING gist`) que hace **imposible** el doble-booking incluso si dos personas reservan el mismo auto al mismo tiempo.
- **`devolucion.servicio.js`** — Gestiona el cierre de una renta; puede usar el módulo `integraciones/gps-flota/` para confirmar la ubicación real donde el vehículo fue devuelto.
- **`precios/precio.estrategia.js`** — Calcula el precio según distintas reglas intercambiables (tarifa diaria, semanal, mensual) sin usar cadenas gigantes de `if/else` (patrón Strategy).
- **`precios/descuento.estrategia.js`** — Aplica descuentos (cliente frecuente, temporada baja) como una estrategia independiente de la de precio base.
- **`contrato/contrato.generador.js`** — Genera el PDF del contrato de alquiler con los datos reales de la transacción.
- **`extras/extras.decorador.js`** — "Envuelve" una renta base añadiéndole servicios opcionales (GPS, conductor adicional, silla de bebé) sin modificar la clase original de la renta (patrón Decorator).

#### `ventas/`
Dominio de venta de vehículos.
- **`venta.servicio.js`** — Antes de aprobar una venta, consulta `integraciones/registro-vehicular/` (para verificar que el auto no tenga gravámenes) y `integraciones/scoring-crediticio/` (si el cliente pide financiamiento).
- **`financiamiento.servicio.js`** — Calcula planes de pago en cuotas si la venta incluye financiamiento.

#### `pagos/`
Procesa cobros sin acoplarse a un proveedor específico.
- **`pago.servicio.js`** — Orquesta el cobro y, una vez exitoso, dispara automáticamente la emisión de comprobante fiscal a través de `integraciones/facturacion-electronica/`.
- Los adaptadores concretos (Stripe, PayPal) viven dentro de `integraciones/pagos/`, no aquí — este módulo solo conoce la interfaz común.

#### `notificaciones/`
- **`notificacion.observador.js`** — Escucha eventos internos del sistema (ej: `"rental.confirmed"`) y dispara la notificación correspondiente, sin que el módulo de alquileres sepa que el módulo de notificaciones existe (patrón Observer — desacoplamiento total).
- **`cola/notificacion.cola.js`** — Encola el envío en vez de hacerlo en el momento exacto de la petición, para que confirmar una reserva no se demore esperando que el correo salga.

#### `mantenimiento/`
Registra el historial de mantenimientos de cada vehículo — clave para saber qué autos no deben estar disponibles para renta/venta en cierto momento.

#### `resenas/`
Reseñas de clientes sobre vehículos o el servicio recibido.

#### `sucursales/`
Ubicaciones físicas donde se recoge o entrega un vehículo. `sucursal.servicio.js` usa `integraciones/mapas/` para geocodificar las direcciones.

#### `reservas/`
- **`reserva.fachada.js`** — Implementa el patrón Facade: un único punto de entrada que internamente coordina disponibilidad + cálculo de precio + cobro + generación de contrato + notificación. El controlador solo llama **una función**, y toda la orquestación compleja queda oculta y centralizada aquí.

#### `administracion/`
Todo lo que alimenta el panel admin.
- **`tablero.servicio.js`** — Agrega métricas: ingresos totales, vehículos más rentados, tasa de ocupación de la flota.
- **`reportes/`** — Un archivo por tipo de reporte, cada uno con su propia query optimizada (los reportes pesados no deben reutilizar queries genéricas pensadas para operaciones normales).

#### `auditoria/`
Registra quién hizo qué acción y cuándo — indispensable en un sistema con múltiples roles administrativos manipulando datos sensibles (precios, disponibilidad, usuarios).

#### `integraciones/`
Todo lo que el sistema necesita para hablar con servicios externos, aislado del resto del negocio mediante el patrón **Adapter**: cada proveedor implementa una interfaz común, así el resto del sistema nunca depende directamente de "RENIEC" o "Google Maps", sino de un contrato genérico ("verificar identidad", "geocodificar dirección"). Cambiar de proveedor en el futuro implica tocar un solo archivo.

- **`nucleo/`** — Piezas transversales: `integraciones.orquestador.js` (Facade que los módulos de negocio consultan), `circuito-breaker.js` (si un proveedor falla repetidamente, corta las llamadas temporalmente para no saturar el sistema), `reintentos.util.js` (política de reintentos con espera progresiva).
- **`identidad/`** — Verificación de DNI contra RENIEC (Perú), RENAPER (Argentina), Registraduría (Colombia), según el país del usuario.
- **`licencia-conducir/`** — Valida vigencia y categoría de la licencia de conducir antes de aprobar una renta.
- **`antecedentes/`** — Verificación de antecedentes, común en operadoras de renta comercial.
- **`registro-vehicular/`** — Verifica gravámenes/multas de un vehículo antes de aprobar su venta (SUNARP, RUNT).
- **`seguros/`** — Cotización, contratación y verificación de vigencia de pólizas (SOAT u equivalente).
- **`mapas/`** — Geocodificación de direcciones, cálculo de rutas, autocompletado (Google Maps o Mapbox).
- **`gps-flota/`** — Ubicación en tiempo real de cada vehículo y alertas si sale de una zona permitida (geocerca).
- **`pagos/`** — Adaptadores concretos de Stripe y PayPal, implementando la interfaz común de pasarela de pago.
- **`facturacion-electronica/`** — Emisión de comprobantes fiscales obligatorios (SUNAT, DIAN según país).
- **`firma-electronica/`** — Firma digital de contratos de renta/venta.
- **`scoring-crediticio/`** — Consulta el historial crediticio de un cliente que solicita financiamiento.
- **`comunicaciones/`** — Envío de SMS, correo, WhatsApp Business y notificaciones push, cada canal con su propio adaptador.
- **`tipo-cambio/`** — Conversión de moneda, relevante si la plataforma opera en más de un país.

### `src/middlewares/`
Funciones que se ejecutan en cadena antes de que la petición llegue al controlador (patrón Chain of Responsibility).

- **`autenticacion.middleware.js`** — Verifica que el JWT enviado sea válido; si no, corta la petición ahí mismo.
- **`rol.middleware.js`** — Verifica que el usuario logueado tenga el rol/permiso necesario para esa ruta específica.
- **`validacion.middleware.js`** — Valida el `body`/`params` de la petición contra un esquema (ej. con Zod) antes de que llegue al controlador, evitando datos corruptos en la base de datos.
- **`manejadorErrores.middleware.js`** — Captura cualquier error lanzado en la aplicación y responde siempre con un formato consistente — nunca expone un stack trace crudo al cliente.
- **`limitadorPeticiones.middleware.js`** — Limita cuántas peticiones por minuto puede hacer una IP/usuario, protegiendo contra abuso y ataques de fuerza bruta en el login.
- **`registroAuditoria.middleware.js`** — Registra automáticamente en `auditoria` las acciones sensibles (crear, editar, eliminar).

### `src/patrones/`
Implementaciones genéricas de patrones reutilizados por varios módulos.

- **`fabrica/transaccion.fabrica.js`** — Decide si crear un objeto de tipo Renta o Venta según la operación solicitada, sin que el código que lo llama conozca los detalles internos de cada uno (patrón Factory).
- **`observador/emisorEventos.js`** — Bus de eventos interno de la aplicación, usado por notificaciones y auditoría para reaccionar a lo que pasa en otros módulos sin acoplarse a ellos.
- **`singleton/registrador.singleton.js`** — Una única instancia de logger compartida en toda la aplicación.

### `src/compartido/`
Código transversal que no pertenece a un módulo de negocio específico.

- **`basedatos/pool.js`** — Configuración base del pool de conexión.
- **`basedatos/migraciones/`** — Archivos SQL versionados, uno por cada cambio de esquema. Garantiza que el estado de la base de datos sea reproducible en cualquier ambiente (desarrollo, staging, producción).
- **`errores/`** — Clases de error controladas (`ErrorApp` como base, y específicas como `ErrorNoEncontrado` para 404, `ErrorValidacion` para 400, `ErrorIntegracionExterna` cuando falla un proveedor externo), cada una asociada a un código HTTP.
- **`utilidades/paginacion.js`** — Lógica reutilizable de paginación para no repetirla en cada repositorio.
- **`utilidades/formateadorRespuesta.js`** — Da formato consistente a todas las respuestas de la API (`{ success, data, error }`).
- **`interfaces/repositorio-base.interface.js`** — Define los métodos que todo repositorio debe implementar (`findById`, `create`, `update`, `delete`), garantizando consistencia entre módulos.

### `src/rutas/index.js`
Punto central donde se registran las rutas de **todos** los módulos hacia la aplicación de Express.

### `src/tareas/`
Trabajos programados (cron) que corren solos, sin que un usuario los dispare directamente.

- **`recordatorioDevolucion.tarea.js`** — Revisa diariamente las rentas próximas a vencer y envía recordatorio automático.
- **`monitoreoFlota.tarea.js`** — Consulta el GPS de la flota periódicamente y genera alertas si algo es anómalo.
- **`renovacionSOAT.tarea.js`** — Avisa cuando el seguro de un vehículo está por vencer.
- **`reintentoVerificaciones.tarea.js`** — Reintenta en segundo plano verificaciones de identidad que fallaron por una caída temporal del proveedor externo.

### `src/app.js` vs `src/servidor.js`
- **`app.js`** — Configura la aplicación de Express: middlewares globales, CORS, seguridad (Helmet), y monta todas las rutas. No abre ningún puerto.
- **`servidor.js`** — Solo se encarga de arrancar el servidor HTTP en el puerto configurado. Se separa de `app.js` a propósito para poder testear la aplicación completa sin necesidad de levantar un puerto real durante las pruebas automatizadas.

### `pruebas/`
- **`unitarias/`** — Prueba funciones aisladas (ej: `precio.estrategia.js`) sin tocar la base de datos real.
- **`integracion/`** — Prueba endpoints completos contra una base de datos de prueba, verificando que todo el flujo funcione en conjunto.

### Archivos raíz del backend
- **`package.json`** — Dependencias del proyecto y scripts (`npm run dev`, `npm test`, etc.).
- **`Dockerfile`** — Define cómo se construye la imagen del backend para producción.
- **`.env`** — Variables sensibles reales (credenciales, claves); nunca se sube al repositorio.

---

## 🎨 FRONTEND — Sitio Público

```
frontend/sitio-publico/
├── html/
├── css/
├── js/
└── recursos/
```

Es lo que ve y usa el cliente final: explorar el catálogo, comparar vehículos, reservar una renta o iniciar una compra.

### `html/`
- **`inicio.html`** — Página principal: hero con buscador (ubicación de recogida/entrega, fechas), sección "Elige tu auto" por categoría, y bloque de estadísticas de confianza (clientes atendidos, ciudades disponibles).
- **`resultados-busqueda.html`** — Resultados de la búsqueda realizada desde el inicio, con panel de filtros lateral (tipo de auto, asientos, transmisión, rango de precio) y disponibilidad en vivo.
- **`catalogo.html`** — Vista completa del catálogo en cuadrícula, con insignias visuales (Más vendido, Popular, Lujo, Eléctrico) y una función para comparar hasta dos vehículos lado a lado.
- **`detalle-vehiculo.html`** — Ficha individual de un vehículo con toda su información antes de decidir reservar o comprar.
- **`reserva.html`** — Flujo de checkout en 3 pasos: selección de detalles, extras opcionales, y confirmación de pago, con el resumen de precio calculado en vivo.
- **`parciales/encabezado.html`** y **`parciales/pie-pagina.html`** — Fragmentos de HTML reutilizados por JavaScript en cada página, para no duplicar el header y footer en los cinco archivos HTML.

### `css/`
- **`variables.css`** — Los tokens de diseño de la marca: paleta de color (navy profundo + gradiente azul→cian + acento naranja), tipografía, espaciados — un solo lugar para mantener la identidad visual consistente.
- **`base.css`** — Reset del navegador, tipografía global, estilos de botones, encabezado y pie de página compartidos entre todas las páginas.
- **`componentes/`** — Un archivo CSS por cada pieza de interfaz reutilizada en más de una página: la barra de búsqueda, la tarjeta de vehículo (aparece en inicio, resultados y catálogo), el panel de filtros, el widget de estadísticas, la barra de "comparar", el indicador de pasos del checkout, y el estilo del selector de mapa.
- **`paginas/`** — Estilos específicos que solo aplican a una página en particular, y que no tendría sentido cargar en las demás.
- **`responsive.css`** — Media queries generales que adaptan el diseño a tablet y móvil.

### `js/`
- **`principal.js`** — Punto de entrada: inicializa el header/footer compartido, el menú móvil, y restaura la sesión del usuario si existe.
- **`servicios/`** — Único lugar del frontend que se comunica con la API del backend.
  - **`api.cliente.js`** — Wrapper centralizado de `fetch`: agrega los headers necesarios, maneja el caso de token expirado, y da formato consistente a los errores.
  - **`vehiculo.servicio.js`**, **`disponibilidad.servicio.js`**, **`reserva.servicio.js`** — Llaman a los endpoints correspondientes del backend.
  - **`mapas.servicio.js`** — Inicializa el SDK de Google Maps o Mapbox directo en el navegador (no pasa por el backend), muestra sucursales y autocompleta direcciones.
  - **`pago.servicio.js`** — Usa el SDK de cliente de Stripe/PayPal para tokenizar los datos de la tarjeta en el navegador — el número de tarjeta real nunca llega al backend de Carmovo, solo un token seguro.
  - **`ubicacion.servicio.js`** — Solicita permiso de geolocalización al navegador para sugerir la sucursal más cercana al usuario.
- **`componentes/`** — La lógica de interacción de cada pieza reutilizable (qué pasa cuando el usuario escribe en el buscador, selecciona un filtro, o agrega un auto a comparar).
- **`paginas/`** — Une componentes y servicios para armar el comportamiento completo de cada página específica.
- **`estado/`**
  - **`almacen.js`** — Un sistema simple de Publicación/Suscripción (Observer) hecho a mano: cuando algo cambia (ej. el usuario inicia sesión), notifica a todos los componentes interesados sin acoplarlos entre sí.
  - **`sesion.estado.js`** — Guarda en memoria los datos de sesión actuales (token, datos del usuario).
  - **`reserva.estado.js`** — Mantiene la selección de auto, fechas y extras mientras el usuario avanza por los 3 pasos del checkout.

### `recursos/`
- **`iconos/`** — Íconos SVG propios de la interfaz.
- **`imagenes/vehiculos/`** — Fotografías de los vehículos del catálogo.

---

## 🛠️ FRONTEND — Panel Admin

```
frontend/panel-admin/
├── html/
├── css/
├── js/
└── recursos/
```

Interfaz de uso exclusivo del personal interno (agentes, gerencia de flota, finanzas, superadmin). Se construye y despliega de forma completamente separada del sitio público, principal medida de seguridad: el código del panel admin nunca se sirve al público general.

### `html/`
Una página por cada función administrativa: **`tablero.html`** (resumen general del negocio), **`gestion-flota.html`** (alta, edición y baja de vehículos), **`gestion-alquileres.html`** (reservas activas, check-in/check-out), **`gestion-ventas.html`**, **`gestion-usuarios.html`** (usuarios internos y sus roles), **`reportes.html`**, **`registro-auditoria.html`** (historial de acciones sensibles) y **`monitoreo-flota.html`** (vista en vivo del GPS de cada vehículo sobre un mapa).

### `css/` y `js/`
Siguen exactamente la misma lógica de separación entre `componentes/` (reutilizable: tabla de datos, barra lateral, tarjeta de estadística, widget de gráfico, mapa de flota) y `paginas/` (específico de cada vista) que el sitio público.

Un archivo particular a destacar:
- **`js/guardias/rol.guardia.js`** — Antes de mostrar cualquier vista, verifica que el rol del usuario logueado tenga permiso para verla; si no, redirige o bloquea el acceso. Es la primera línea de defensa en el cliente (la verdadera seguridad siempre vive también en el backend, esto es solo una mejora de experiencia).
- **`js/servicios/admin-api.cliente.js`** — Igual que el del sitio público, pero apuntando a los endpoints `/admin/*` del backend, que exigen un rol elevado para responder.
- **`js/servicios/mapa-flota.servicio.js`** — Consume el módulo `integraciones/gps-flota/` del backend para pintar la posición en tiempo real de cada vehículo sobre el mapa de monitoreo.

---

## 👤 Roles de usuario

| Rol | Puede hacer |
|---|---|
| **Guest** (visitante) | Ver catálogo, buscar, filtrar — sin necesidad de cuenta |
| **Customer** (cliente) | Reservar, comprar, ver su historial, dejar reseñas |
| **Sales Agent** (agente de ventas) | Gestionar el proceso de venta, atender leads de compra |
| **Rental Agent** (agente de alquiler) | Gestionar reservas, hacer check-in/check-out de vehículos |
| **Fleet Manager** (gerente de flota) | Alta/baja de vehículos, mantenimiento, disponibilidad |
| **Finance/Admin** (finanzas) | Ver pagos, generar reportes, revisar facturación |
| **SuperAdmin** | Control total del sistema, gestión de roles y usuarios internos |

---

## 🧩 Patrones de diseño aplicados

| Patrón | Dónde se usa | Para qué |
|---|---|---|
| **Repository** | `*.repositorio.js` en cada módulo | Aísla las queries SQL de la lógica de negocio |
| **Factory** | `transaccion.fabrica.js` | Crea objetos Renta o Venta desde una interfaz común |
| **Strategy** | `precio.estrategia.js`, adaptadores de pago | Reglas de precio y métodos de pago intercambiables |
| **Observer** | `notificacion.observador.js`, `emisorEventos.js` | Reacciona a eventos sin acoplar los módulos entre sí |
| **Singleton** | `basedatos.js`, `registrador.singleton.js` | Una única instancia compartida (conexión DB, logger) |
| **Adapter** | Todo `integraciones/*/*.adaptador.js` | Aísla proveedores externos detrás de una interfaz común |
| **Facade** | `reserva.fachada.js` | Orquesta un flujo complejo detrás de una sola llamada |
| **Decorator** | `extras.decorador.js` | Añade extras a una renta sin modificar la clase base |
| **DTO** | `*.dto.js` | Controla exactamente qué datos se exponen al cliente |
| **Chain of Responsibility** | `middlewares/` | Cadena de validaciones antes de llegar al controlador |

---

## 🔑 Variables de entorno

Ver `.env.example` en la raíz del proyecto para la lista completa. Se agrupan en: base de datos y Redis, JWT, identidad (RENIEC/RENAPER), registro vehicular (SUNARP), mapas (Google Maps/Mapbox), GPS de flota, pagos (Stripe/PayPal), facturación electrónica (SUNAT/DIAN), firma electrónica, scoring crediticio, y comunicaciones (Twilio, SendGrid, WhatsApp Business, Firebase).

---

## ▶️ Cómo correr el proyecto

```bash
# 1. Clonar el repositorio y entrar a la carpeta
git clone <repo-url>
cd carmovo

# 2. Copiar la plantilla de variables de entorno y completar los valores reales
cp .env.example .env

# 3. Levantar backend + PostgreSQL + Redis con Docker
docker-compose up -d

# 4. Instalar dependencias del backend (si no usas Docker para desarrollo)
cd backend
npm install
npm run dev

# 5. Servir el frontend (sitio público o panel admin) con cualquier servidor estático
#    ej. usando la extensión Live Server, o:
npx serve frontend/sitio-publico
```

---

## ☁️ Hosting recomendado

| Pieza | Servicio sugerido | Costo aproximado para empezar |
|---|---|---|
| Frontend (sitio público + panel admin) | Cloudflare Pages / Vercel | Gratis |
| Backend (Node/Express) | Railway / Render | ~$5–20/mes |
| PostgreSQL | Neon / Supabase | Gratis para empezar |
| Redis | Upstash | Gratis para empezar |

---

## ⚠️ Pendientes antes de producción

Esta estructura cubre la arquitectura de código. Antes de aceptar el primer pago real, faltan piezas no técnicas u operativas:

- **Seguridad**: 2FA para roles administrativos, gestión de secretos fuera de `.env` plano, Helmet + CSP, política de bloqueo de cuenta.
- **CI/CD y monitoreo**: pipeline de tests automáticos, Sentry para captura de errores en producción, backups automáticos de la base de datos.
- **Legal**: términos y condiciones, política de privacidad, consentimiento de datos personales (obligatorio al guardar DNI, licencia de conducir y datos de pago), alta fiscal previa si se emite facturación electrónica.
- **Experiencia de usuario**: optimización de imágenes, SEO técnico (sitemap, meta tags dinámicos), búsqueda tolerante a errores de tipeo.
- **Analítica**: Google Analytics o similar, y separación de reportes pesados de la base de datos transaccional cuando el volumen de datos crezca.

# CARMOVO
Proyecto-MDW
 908b206a5320ab237458b977d9c7f3170929c7dc
