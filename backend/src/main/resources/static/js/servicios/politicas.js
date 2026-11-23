/* =========================================================
   CARMOVO · Términos y Política de privacidad
   Un solo lugar con el texto completo. Se usa en:
   - Reserva y registro de clientes (documento "cliente")
   - Registro de empleados y conductores (documento "empleado")
   - La página pública /politicas
   La casilla "Acepto" no se puede marcar hasta abrir la ventana,
   leer el documento hasta el final y pulsar "He leído y acepto".
   ========================================================= */
(() => {
    'use strict';

    const VERSION = '1.0';
    const VIGENCIA = '22/11/2026';

    const TERMINOS_CLIENTE = `
        <h3 id="pol-terminos">Términos y condiciones del servicio de alquiler</h3>
        <h4>1. Objeto</h4>
        <p>Estos términos regulan el alquiler de vehículos que CARMOVO ofrece a través de su sitio web y de su oficina.
           Al crear una cuenta o hacer una reserva, el cliente declara haberlos leído y aceptado.</p>
        <h4>2. Requisitos del conductor</h4>
        <ul>
            <li>Tener <strong>21 años o más</strong> en la fecha de recojo.</li>
            <li>Presentar DNI vigente y licencia de conducir <strong>vigente hasta el último día del alquiler</strong>.</li>
            <li>Las furgonetas requieren licencia <strong>A-IIb</strong> o superior; el resto de vehículos, A-I.</li>
            <li>Los datos del conductor registrados en la reserva deben ser verdaderos. Si no coinciden con los documentos
                presentados al recoger el auto, CARMOVO puede no entregar el vehículo.</li>
            <li>Si eliges el <strong>servicio con chofer de la agencia</strong>, no se te pide licencia: maneja un
                conductor de CARMOVO y el titular solo debe ser mayor de edad.</li>
        </ul>
        <h4>3. Precio</h4>
        <p>El total se calcula en el sistema y se muestra antes de pagar: tarifa diaria del vehículo por los días de alquiler,
           servicio con chofer cuando se elige, seguro de S/ 120 por alquiler e IGV de 18%. Si el vehículo tiene una oferta
           vigente en la fecha de recojo, el descuento se aplica automáticamente.</p>
        <h4>4. Servicio con chofer de la agencia</h4>
        <ul>
            <li>El cliente puede pedir que el alquiler incluya un <strong>chofer de CARMOVO</strong> por S/ 80 por día (más IGV).</li>
            <li>El chofer es personal de la agencia, tiene licencia vigente y es asignado por CARMOVO antes de la fecha de recojo.</li>
            <li>El chofer conduce dentro del horario y las rutas acordadas, y respeta las normas de tránsito. No está obligado a
                realizar maniobras o recorridos que pongan en riesgo a los pasajeros o al vehículo.</li>
        </ul>
        <h4>5. Pagos</h4>
        <ul>
            <li>Se acepta tarjeta, Yape, Plin y efectivo en la oficina.</li>
            <li>El pago en <strong>efectivo</strong> debe hacerse antes de las <strong>12:00 del día de recojo</strong>; si no,
                la reserva se cancela automáticamente.</li>
            <li>Los pagos con Plin quedan en revisión hasta que el personal confirma la operación.</li>
            <li>La boleta o factura se emite cuando el pago queda confirmado y puede descargarse en "Mi cuenta".</li>
        </ul>
        <h4>6. Entrega y devolución</h4>
        <ul>
            <li>Al entregar el vehículo se registran el kilometraje y el nivel de combustible.</li>
            <li>Cada día de retraso en la devolución se cobra a la tarifa diaria del vehículo.</li>
            <li>Si falta combustible respecto a la entrega, se cobran S/ 25 por cada octavo de tanque.</li>
            <li>Los daños ocasionados durante el alquiler se registran en la devolución y se cobran como cargo adicional.</li>
        </ul>
        <h4>7. Cancelaciones</h4>
        <p>Si se cancela un alquiler ya pagado, el pago pasa a "Reembolso pendiente" y el comprobante se anula conservando su número.</p>
        <h4>8. Uso del vehículo</h4>
        <p>El vehículo debe usarse solo por el conductor registrado (o el chofer de la agencia), respetando las normas de tránsito,
           sin fines ilícitos, sin subarrendarlo y sin conducir bajo efectos del alcohol u otras sustancias.</p>
    `;

    const PRIVACIDAD_CLIENTE = `
        <h3 id="pol-privacidad">Política de privacidad y tratamiento de datos personales</h3>
        <h4>1. Responsable</h4>
        <p>CARMOVO es responsable del tratamiento de los datos personales que se registran en su sitio web y en su oficina,
           conforme a la <strong>Ley N.° 29733, Ley de Protección de Datos Personales</strong>, y su reglamento.</p>
        <h4>2. Datos que recopilamos</h4>
        <ul>
            <li>Identificación y contacto: nombres, apellidos, DNI, correo, celular y domicilio.</li>
            <li>Datos del conductor: fecha de nacimiento, número, categoría y vencimiento de la licencia.</li>
            <li>Datos de facturación: RUC, razón social y dirección fiscal cuando se pide factura.</li>
            <li>Datos de la operación: reservas, pagos (sin guardar el número completo de la tarjeta), comprobantes y cargos.</li>
        </ul>
        <h4>3. Para qué los usamos</h4>
        <ul>
            <li>Gestionar la cuenta, la reserva, la entrega y la devolución del vehículo.</li>
            <li>Verificar la identidad y los requisitos del conductor.</li>
            <li>Procesar pagos y emitir boletas o facturas.</li>
            <li>Enviar avisos sobre la reserva y responder consultas.</li>
            <li>Cumplir obligaciones legales y tributarias.</li>
        </ul>
        <h4>4. Con quién los compartimos</h4>
        <p>Solo con el personal de CARMOVO que los necesita para atender el alquiler, con proveedores que nos ayudan a operar
           (por ejemplo, procesamiento de pagos o envío de correos) y con autoridades cuando la ley lo exige.
           No vendemos ni cedemos datos personales con fines comerciales.</p>
        <h4>5. Cuánto tiempo los conservamos</h4>
        <p>Mientras la cuenta esté activa y luego durante el plazo que exijan las normas tributarias y contables.</p>
        <h4>6. Seguridad</h4>
        <p>Las contraseñas se guardan cifradas, el acceso del personal está limitado por roles y cada operación importante
           queda registrada en un historial de auditoría.</p>
        <h4>7. Tus derechos</h4>
        <p>Puedes ejercer tus derechos de <strong>acceso, rectificación, cancelación y oposición (ARCO)</strong> escribiendo
           a los canales de contacto publicados en la sección Soporte. También puedes actualizar tus datos desde "Mi cuenta".
           Si consideras que tus derechos no fueron atendidos, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.</p>
        <h4>8. Consentimiento</h4>
        <p>Al marcar la casilla de aceptación autorizas a CARMOVO a tratar tus datos para las finalidades descritas.
           Guardamos la fecha, la hora y la versión del documento que aceptaste.</p>
    `;

    const TERMINOS_EMPLEADO = `
        <h3 id="pol-terminos">Condiciones de uso del panel y confidencialidad</h3>
        <h4>1. Cuenta personal</h4>
        <p>El acceso al panel de CARMOVO es personal e intransferible. El empleado es responsable de lo que se haga con su
           correo y contraseña, y debe cerrar sesión al terminar su turno en equipos compartidos.</p>
        <h4>2. Uso según el rol</h4>
        <p>Cada empleado entra solo a los módulos de su rol. Está prohibido intentar acceder a información o funciones que no le corresponden.</p>
        <h4>3. Confidencialidad</h4>
        <p>Los datos de clientes, pagos, comprobantes y vehículos son confidenciales. Solo pueden usarse para atender
           los alquileres y no pueden copiarse, compartirse ni usarse para fines personales, incluso después de terminar la relación laboral.</p>
        <h4>4. Conductores de la agencia</h4>
        <ul>
            <li>Deben mantener la licencia de conducir <strong>vigente</strong> y avisar de inmediato si vence, se suspende o cambia de categoría.</li>
            <li>Atienden solo los servicios con chofer que se les asignan y registran su avance en "Mis servicios".</li>
            <li>Respetan las normas de tránsito, el horario acordado con el cliente y el cuidado del vehículo.</li>
        </ul>
        <h4>5. Registro de actividad</h4>
        <p>Las operaciones del panel (crear, editar, cobrar, entregar, devolver, etc.) quedan registradas con el usuario,
           la fecha y la hora en el historial de auditoría.</p>
    `;

    const PRIVACIDAD_EMPLEADO = `
        <h3 id="pol-privacidad">Política de privacidad para el personal</h3>
        <h4>1. Responsable</h4>
        <p>CARMOVO trata los datos personales de su personal conforme a la <strong>Ley N.° 29733, Ley de Protección de Datos Personales</strong>, y su reglamento.</p>
        <h4>2. Datos que se registran</h4>
        <ul>
            <li>Nombres, apellidos, DNI, fecha de nacimiento, celular, domicilio y distrito.</li>
            <li>Correo de acceso, rol y foto de perfil (opcional).</li>
            <li>En el caso de conductores: número, categoría y vencimiento de la licencia de conducir.</li>
        </ul>
        <h4>3. Finalidad</h4>
        <ul>
            <li>Crear y administrar la cuenta de acceso al panel según su rol.</li>
            <li>Verificar la identidad (incluida la consulta del DNI) y, para conductores, la vigencia de su licencia.</li>
            <li>Asignar servicios con chofer y contactar al empleado por temas de trabajo.</li>
            <li>Mantener el historial de auditoría de las operaciones.</li>
        </ul>
        <h4>4. Acceso a los datos</h4>
        <p>Solo el personal autorizado para gestionar empleados puede ver estos datos. Al cliente de un servicio con chofer
           solo se le muestra el nombre del conductor asignado.</p>
        <h4>5. Conservación</h4>
        <p>Mientras dure la relación laboral. Al desactivar la cuenta, los datos se conservan para el historial de auditoría
           y las obligaciones legales, sin acceso al panel.</p>
        <h4>6. Derechos</h4>
        <p>El empleado puede actualizar sus datos desde "Mi perfil" y ejercer sus derechos de acceso, rectificación,
           cancelación y oposición (ARCO) solicitándolo al administrador.</p>
        <h4>7. Consentimiento</h4>
        <p>Al aceptar, el empleado autoriza el tratamiento de sus datos para las finalidades descritas. Se guarda la fecha,
           la hora y la versión del documento aceptado.</p>
    `;

    const DOCUMENTOS = {
        cliente: { titulo: 'Términos y Política de privacidad', html: TERMINOS_CLIENTE + PRIVACIDAD_CLIENTE },
        empleado: { titulo: 'Condiciones para el personal y Política de privacidad', html: TERMINOS_EMPLEADO + PRIVACIDAD_EMPLEADO }
    };

    const ESTILOS = `
        .pol-fondo { position: fixed; inset: 0; z-index: 3000; background: rgba(9, 24, 38, .55); display: flex;
            align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(2px); }
        .pol-fondo[hidden] { display: none; }
        .pol-caja { background: #fff; color: #1D2B36; width: min(760px, 100%); max-height: min(88vh, 860px); border-radius: 20px;
            display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(9, 24, 38, .3); overflow: hidden;
            font-family: inherit; animation: polEntrar .2s ease; }
        @keyframes polEntrar { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .pol-cabecera { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; padding: 20px 24px 12px; }
        .pol-cabecera h2 { margin: 0 0 4px; font-size: 1.15rem; }
        .pol-cabecera p { margin: 0; font-size: .82rem; color: #5D7180; }
        .pol-cerrar { border: 0; background: #F1F5F8; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; font-size: 1.1rem; color: #42576A; flex-shrink: 0; }
        .pol-pestanas { display: flex; gap: 6px; padding: 0 24px 10px; }
        .pol-pestanas button { border: 0; background: #F1F5F8; color: #42576A; border-radius: 20px; padding: 7px 14px; font: inherit;
            font-size: .8rem; font-weight: 700; cursor: pointer; }
        .pol-cuerpo { overflow-y: auto; padding: 4px 24px 18px; font-size: .9rem; line-height: 1.6; border-top: 1px solid #EEF2F5; border-bottom: 1px solid #EEF2F5; }
        .pol-cuerpo h3 { font-size: 1.02rem; margin: 18px 0 6px; color: #12324A; scroll-margin-top: 8px; }
        .pol-cuerpo h4 { font-size: .9rem; margin: 14px 0 4px; color: #1D2B36; }
        .pol-cuerpo p, .pol-cuerpo ul { margin: 0 0 8px; color: #33495A; }
        .pol-cuerpo ul { padding-left: 20px; list-style: disc; }
        .pol-cuerpo li { display: list-item; }
        .pol-cuerpo li { margin-bottom: 3px; }
        .pol-fin { margin-top: 16px; padding: 12px 14px; border-radius: 12px; background: #F1F5F8; font-size: .8rem; color: #5D7180; }
        .pol-pie { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 24px 18px; flex-wrap: wrap; }
        .pol-progreso { display: flex; align-items: center; gap: 10px; font-size: .8rem; color: #5D7180; flex: 1; min-width: 200px; }
        .pol-barra { flex: 1; height: 6px; border-radius: 6px; background: #E6EDF2; overflow: hidden; max-width: 180px; }
        .pol-barra span { display: block; height: 100%; width: 0; background: #2E8B57; transition: width .15s; }
        .pol-botones { display: flex; gap: 8px; }
        .pol-boton { border: 0; border-radius: 12px; padding: 11px 18px; font: inherit; font-weight: 700; font-size: .86rem; cursor: pointer; }
        .pol-boton--suave { background: #F1F5F8; color: #42576A; }
        .pol-boton--principal { background: #12324A; color: #fff; }
        .pol-boton--principal:disabled { background: #B9C7D2; cursor: not-allowed; }
        .pol-solo-lectura .pol-boton--principal, .pol-solo-lectura .pol-progreso { display: none; }
        .pol-acepto { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; border-radius: 12px;
            background: #F4F7F9; font-size: .88rem; line-height: 1.45; color: #33495A; cursor: pointer; margin: 14px 0; text-align: left; }
        .pol-acepto input { width: 18px; height: 18px; margin: 2px 0 0; flex-shrink: 0; cursor: pointer; accent-color: #12324A; }
        .pol-acepto a { color: #12324A; font-weight: 700; text-decoration: underline; }
        .pol-acepto.pol-acepto--ok { background: #E8F6EE; }
        .pol-acepto.pol-acepto--error { background: #FDECEC; box-shadow: inset 0 0 0 1px #E3A3A3; }
        @media (max-width: 560px) {
            .pol-fondo { padding: 0; align-items: flex-end; }
            .pol-caja { max-height: 92vh; border-radius: 20px 20px 0 0; }
            .pol-cabecera, .pol-pestanas, .pol-cuerpo, .pol-pie { padding-left: 16px; padding-right: 16px; }
            .pol-botones { width: 100%; } .pol-boton { flex: 1; }
        }
    `;

    let modal = null;
    let resolver = null;

    function ponerEstilos() {
        if (document.getElementById('pol-estilos')) return;
        const estilo = document.createElement('style');
        estilo.id = 'pol-estilos';
        estilo.textContent = ESTILOS;
        document.head.appendChild(estilo);
    }
    ponerEstilos();

    function crearModal() {
        if (modal) return modal;

        modal = document.createElement('div');
        modal.className = 'pol-fondo';
        modal.hidden = true;
        modal.innerHTML = `
            <div class="pol-caja" role="dialog" aria-modal="true" aria-labelledby="pol-titulo">
                <div class="pol-cabecera">
                    <div><h2 id="pol-titulo"></h2><p>Versión ${VERSION} · vigente desde el ${VIGENCIA}</p></div>
                    <button type="button" class="pol-cerrar" data-pol="cerrar" aria-label="Cerrar">&times;</button>
                </div>
                <div class="pol-pestanas">
                    <button type="button" data-pol-ir="pol-terminos">Términos</button>
                    <button type="button" data-pol-ir="pol-privacidad">Privacidad</button>
                </div>
                <div class="pol-cuerpo" tabindex="0"></div>
                <div class="pol-pie">
                    <div class="pol-progreso"><div class="pol-barra"><span></span></div><span class="pol-progreso__texto">Lee hasta el final para aceptar</span></div>
                    <div class="pol-botones">
                        <button type="button" class="pol-boton pol-boton--suave" data-pol="cerrar">Cerrar</button>
                        <button type="button" class="pol-boton pol-boton--principal" data-pol="aceptar" disabled>He leído y acepto</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);

        const cuerpo = modal.querySelector('.pol-cuerpo');
        cuerpo.addEventListener('scroll', revisarLectura);
        modal.addEventListener('click', e => {
            if (e.target === modal) return cerrar(false);
            const ir = e.target.closest('[data-pol-ir]');
            if (ir) {
                const destino = cuerpo.querySelector(`#${ir.dataset.polIr}`);
                if (destino) cuerpo.scrollTo({ top: destino.offsetTop - 8, behavior: 'smooth' });
            }
            const accion = e.target.closest('[data-pol]')?.dataset.pol;
            if (accion === 'cerrar') cerrar(false);
            if (accion === 'aceptar') cerrar(true);
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) cerrar(false); });
        return modal;
    }

    function revisarLectura() {
        const cuerpo = modal.querySelector('.pol-cuerpo');
        const max = cuerpo.scrollHeight - cuerpo.clientHeight;
        const avance = max <= 4 ? 1 : Math.min(1, cuerpo.scrollTop / max);
        modal.querySelector('.pol-barra span').style.width = `${Math.round(avance * 100)}%`;
        if (avance >= 0.98) {
            modal.querySelector('[data-pol="aceptar"]').disabled = false;
            modal.querySelector('.pol-progreso__texto').textContent = 'Documento leído completo';
        }
    }

    function cerrar(acepto) {
        if (!modal || modal.hidden) return;
        modal.hidden = true;
        document.documentElement.style.overflow = '';
        const r = resolver;
        resolver = null;
        if (r) r(acepto);
    }

    /**
     * Abre el documento completo. Devuelve una promesa: true si pulsó "He leído y acepto".
     * opciones.tipo: 'cliente' | 'empleado'; opciones.soloLectura: sin botón aceptar; opciones.ir: 'pol-privacidad'
     */
    function abrir(opciones = {}) {
        crearModal();
        const doc = DOCUMENTOS[opciones.tipo] || DOCUMENTOS.cliente;
        modal.querySelector('#pol-titulo').textContent = doc.titulo;
        const cuerpo = modal.querySelector('.pol-cuerpo');
        cuerpo.innerHTML = doc.html + `<p class="pol-fin">Fin del documento · Versión ${VERSION}. Ante cualquier duda, escríbenos desde la sección Soporte.</p>`;
        modal.querySelector('.pol-caja').classList.toggle('pol-solo-lectura', !!opciones.soloLectura);
        modal.querySelector('[data-pol="aceptar"]').disabled = true;
        modal.querySelector('.pol-progreso__texto').textContent = 'Lee hasta el final para aceptar';
        modal.querySelector('.pol-barra span').style.width = '0';
        modal.hidden = false;
        document.documentElement.style.overflow = 'hidden';
        cuerpo.scrollTop = 0;
        requestAnimationFrame(() => {
            if (opciones.ir) {
                const destino = cuerpo.querySelector(`#${opciones.ir}`);
                if (destino) cuerpo.scrollTop = destino.offsetTop - 8;
            }
            revisarLectura();
            cuerpo.focus({ preventScroll: true });
        });
        if (resolver) resolver(false);
        return new Promise(r => { resolver = r; });
    }

    /**
     * Conecta una casilla: al intentar marcarla se abre el documento; solo queda marcada
     * si la persona lo lee hasta el final y pulsa "He leído y acepto".
     * Los enlaces con [data-politicas] dentro de la misma etiqueta también abren el documento.
     */
    function vincular(casilla, opciones = {}) {
        if (!casilla || casilla.dataset.polVinculada) return;
        casilla.dataset.polVinculada = '1';
        const etiqueta = casilla.closest('label');
        casilla.addEventListener('change', () => {
            etiqueta?.classList.toggle('pol-acepto--ok', casilla.checked);
            if (casilla.checked) etiqueta?.classList.remove('pol-acepto--error');
        });
        casilla.addEventListener('click', async e => {
            if (!casilla.checked) return;               // desmarcar siempre se permite
            e.preventDefault();                          // no se marca hasta aceptar
            const acepto = await abrir(opciones);
            if (acepto) {
                casilla.checked = true;
                casilla.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        etiqueta?.querySelectorAll('a[data-politicas], a[href="/politicas"], a[href="/terminos"], a[href="/privacidad"]').forEach(a => {
            a.addEventListener('click', async e => {
                e.preventDefault();
                e.stopPropagation();
                const acepto = await abrir({ ...opciones, ir: a.dataset.politicas || (a.getAttribute('href') === '/privacidad' ? 'pol-privacidad' : '') });
                if (acepto && !casilla.checked) {
                    casilla.checked = true;
                    casilla.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });
    }

    /** Pinta el documento dentro de un contenedor (página pública /politicas). */
    function pintar(contenedor, tipo = 'cliente') {
        const doc = DOCUMENTOS[tipo] || DOCUMENTOS.cliente;
        contenedor.innerHTML = doc.html;
    }

    window.CarmovoPoliticas = { VERSION, VIGENCIA, abrir, vincular, pintar };

    // Enlaces "Privacidad" / "Términos" del pie de página: abren el documento en modo lectura.
    document.addEventListener('click', e => {
        const a = e.target.closest('a[data-politicas-leer]');
        if (!a) return;
        e.preventDefault();
        abrir({ tipo: 'cliente', soloLectura: true, ir: a.dataset.politicasLeer || '' });
    });
})();
