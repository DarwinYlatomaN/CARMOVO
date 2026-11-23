/* =========================================================
   CARMOVO · Editor del portal web
   El contenido es un documento JSON con borrador y publicado.
   - Los cambios se guardan como BORRADOR (autoguardado).
   - "Publicar" copia el borrador al sitio y crea una versión.
   - Las ofertas se guardan directo (tienen fechas de vigencia).
   ========================================================= */
(() => {
    'use strict';

    const api = () => window.CarmovoAdminApi;
    const $ = id => document.getElementById(id);
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const soles = n => `S/ ${Number(n || 0).toFixed(2)}`;
    const fecha = v => v ? new Date(v).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
    const fechaCorta = v => v ? new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) : '—';

    const VIDEO_ORIGINAL = '/recursos/imagenes/home/video-auto.mp4';
    let contenido = null;
    let hayCambios = false;
    let sinGuardar = false;
    let ofertas = [];
    let vehiculos = [];
    let temporizador = null;

    function avisar(texto, error = false) {
        const caja = $('pu-mensaje');
        caja.textContent = texto;
        caja.classList.toggle('error', error);
        caja.hidden = false;
        clearTimeout(avisar.t);
        avisar.t = setTimeout(() => { caja.hidden = true; }, 4500);
    }

    // ------------------------------------------------------------ utilidades de rutas "a.b"
    const leer = (obj, ruta) => ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
    function escribir(obj, ruta, valor) {
        const partes = ruta.split('.');
        let o = obj;
        partes.slice(0, -1).forEach(k => { o[k] = o[k] ?? {}; o = o[k]; });
        o[partes.at(-1)] = valor;
    }

    function estado(texto, clase = '') {
        const chip = $('pw-estado');
        chip.textContent = texto;
        chip.className = `pu-chip ${clase}`;
    }

    function refrescarEstado() {
        if (sinGuardar) estado('Guardando…');
        else if (hayCambios) estado('Borrador sin publicar', 'pu-chip--amarillo');
        else estado('Publicado', 'pu-chip--verde');
        $('pw-descartar').disabled = !hayCambios;
    }

    // ------------------------------------------------------------ formulario ↔ contenido
    function llenarCampos() {
        document.querySelectorAll('[data-campo]').forEach(campo => {
            const valor = leer(contenido, campo.dataset.campo);
            if (campo.type === 'checkbox') campo.checked = !!valor;
            else campo.value = valor ?? '';
        });
        pintarBeneficios();
        pintarFaq();
        pintarDiseno();
        pintarVista();
    }

    function pintarBeneficios() {
        const lista = contenido.inicio.beneficios || [];
        $('pw-beneficios').innerHTML = lista.map((b, i) => `
            <div class="pw-bloque">
                <span class="pw-bloque__numero">${i + 1}</span>
                <label class="pu-campo">Título <input data-beneficio="${i}" data-prop="titulo" maxlength="50" value="${esc(b.titulo)}"></label>
                <label class="pu-campo">Texto <input data-beneficio="${i}" data-prop="texto" maxlength="120" value="${esc(b.texto)}"></label>
            </div>`).join('');
    }

    function pintarFaq() {
        const lista = contenido.faq || [];
        $('pw-faq').innerHTML = lista.length ? lista.map((f, i) => `
            <div class="pw-bloque pw-bloque--faq">
                <div class="pw-bloque__orden">
                    <button type="button" data-faq-mover="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Subir"><i class="fa-solid fa-chevron-up"></i></button>
                    <button type="button" data-faq-mover="${i}" data-dir="1" ${i === lista.length - 1 ? 'disabled' : ''} aria-label="Bajar"><i class="fa-solid fa-chevron-down"></i></button>
                </div>
                <div class="pw-bloque__campos">
                    <label class="pu-campo">Pregunta <input data-faq="${i}" data-prop="pregunta" maxlength="150" value="${esc(f.pregunta)}"></label>
                    <label class="pu-campo">Respuesta <textarea data-faq="${i}" data-prop="respuesta" maxlength="600">${esc(f.respuesta)}</textarea></label>
                </div>
                <button type="button" class="pw-bloque__quitar" data-faq-quitar="${i}" aria-label="Eliminar pregunta"><i class="fa-solid fa-trash"></i></button>
            </div>`).join('') : '<p class="pu-ayuda">No hay preguntas. Agrega la primera.</p>';
    }

    function pintarVista() {
        const ini = contenido.inicio || {};
        // Miniatura del fondo de la portada: imagen propia > video propio > video original.
        const imagen = ini.imagen || '';
        const video = ini.video || VIDEO_ORIGINAL;
        const mini = $('pw-video-vista');
        mini.hidden = !!imagen;
        if (!imagen && mini.getAttribute('src') !== video) { mini.src = video; mini.play?.().catch(() => {}); }
        $('pw-imagen-vista').hidden = !imagen;
        if (imagen) $('pw-imagen-vista').src = imagen;
        $('pw-imagen-quitar').hidden = !imagen && !ini.video;
        $('pw-imagen-estado').textContent = imagen ? 'Imagen propia' : (ini.video ? 'Video propio' : 'Video original');
        enviarVistaPrevia();
    }

    // ------------------------------------------------------------ vista previa real (iframe de la página)
    const PAGINA_DE_PANEL = { inicio: '/home', diseno: '/home', faq: '/soporte', contacto: '/soporte' };
    const NOMBRE_PAGINA = { '/home': 'Inicio', '/soporte': 'Soporte' };
    let paginaVista = '/home';
    let dispositivo = 'pc';

    function enviarVistaPrevia() {
        const marco = $('pw-vista-iframe');
        if (!contenido || !marco?.contentWindow) return;
        marco.contentWindow.postMessage({ tipo: 'carmovo-vista-previa', contenido }, location.origin);
    }

    function ajustarVistaPrevia() {
        const caja = $('pw-vista-marco');
        const marco = $('pw-vista-iframe');
        if (!caja || !marco) return;
        const anchoPagina = dispositivo === 'celular' ? 390 : 1440;
        const altoPagina = dispositivo === 'celular' ? 844 : 1500;
        const escala = Math.min(1, caja.clientWidth / anchoPagina);
        marco.style.width = `${anchoPagina}px`;
        marco.style.height = `${altoPagina}px`;
        marco.style.transform = `scale(${escala})`;
        marco.style.left = `${Math.max(0, (caja.clientWidth - anchoPagina * escala) / 2)}px`;
        caja.style.height = `${Math.round(altoPagina * escala)}px`;
    }

    function cambiarPaginaVista(ruta) {
        if (!ruta || ruta === paginaVista) return;
        paginaVista = ruta;
        $('pw-vista-iframe').src = `${ruta}?vistaPrevia=1`;
        $('pw-vista-pagina').textContent = `Vista previa del borrador · ${NOMBRE_PAGINA[ruta] || ''}`;
    }

    // ------------------------------------------------------------ diseño (colores, letras, formas)
    const ORIGINAL = { colorPrincipal: '#376b50', colorAcento: '#a8d5ba', colorFondo: '#f5faf6', colorTexto: '#263b30' };
    // Mismo catálogo que portal.publico.js (Google Fonts), agrupado por estilo.
    const GRUPOS_FUENTES = {"Modernas": ["Montserrat", "Poppins", "Inter", "Roboto", "Open Sans", "Lato", "Nunito", "Nunito Sans", "Raleway", "Work Sans", "Rubik", "Manrope", "DM Sans", "Outfit", "Plus Jakarta Sans", "Urbanist", "Mulish", "Source Sans 3", "Barlow", "Kanit", "Josefin Sans", "Quicksand", "Sora", "Lexend", "Figtree"], "Clásicas (con serifa)": ["Playfair Display", "Merriweather", "Lora", "Libre Baskerville", "Cormorant Garamond", "EB Garamond", "Roboto Slab", "Crimson Text", "DM Serif Display"], "Llamativas": ["Bebas Neue", "Oswald", "Anton", "Archivo Black", "Righteous", "Bungee", "Fredoka", "Comfortaa", "Teko", "Russo One", "Orbitron"], "Manuscritas": ["Pacifico", "Dancing Script", "Caveat", "Lobster", "Satisfy"]};
    const FUENTES = Object.values(GRUPOS_FUENTES).flat();
    const FUENTES_UN_PESO = ["Anton", "Archivo Black", "Bebas Neue", "Bungee", "DM Serif Display", "Lobster", "Pacifico", "Righteous", "Russo One", "Satisfy"];
    const PALETAS = [
        { nombre: 'Verde original', colores: {} },
        { nombre: 'Azul océano', colores: { colorPrincipal: '#1f5f8b', colorAcento: '#9fcbe8', colorFondo: '#f3f8fc', colorTexto: '#1e3446' } },
        { nombre: 'Terracota', colores: { colorPrincipal: '#a4512f', colorAcento: '#f0bfa4', colorFondo: '#fdf7f3', colorTexto: '#3b2a22' } },
        { nombre: 'Morado', colores: { colorPrincipal: '#5b3f8c', colorAcento: '#cdb8ec', colorFondo: '#f8f5fd', colorTexto: '#2e2540' } },
        { nombre: 'Grafito', colores: { colorPrincipal: '#2f3a45', colorAcento: '#c3ccd5', colorFondo: '#f6f7f9', colorTexto: '#1f262d' } },
        { nombre: 'Rojo deportivo', colores: { colorPrincipal: '#b3262f', colorAcento: '#f2b5b9', colorFondo: '#fdf6f6', colorTexto: '#2f1c1e' } }
    ];

    function pintarDiseno() {
        const t = contenido.tema || {};
        document.querySelectorAll('input[type=color][data-tema]').forEach(i => { i.value = t[i.dataset.tema] || ORIGINAL[i.dataset.tema]; });
        document.querySelectorAll('select.pw-fuente').forEach(sel => {
            if (!sel.options.length) {
                sel.innerHTML = '<option value="">Original del sitio</option>' + Object.entries(GRUPOS_FUENTES).map(([grupo, fuentes]) =>
                    `<optgroup label="${grupo}">${fuentes.map(f => `<option value="${f}">${f}</option>`).join('')}</optgroup>`).join('');
            }
            sel.value = t[sel.dataset.tema] || '';
        });
        document.querySelectorAll('[data-opciones]').forEach(grupo => {
            const valor = t[grupo.dataset.opciones] || '';
            grupo.querySelectorAll('button').forEach(b => b.classList.toggle('activa', b.dataset.valor === valor));
        });
        const rango = document.querySelector('[data-tema="oscuridadPortada"]');
        const tieneOscuridad = t.oscuridadPortada !== undefined && t.oscuridadPortada !== '';
        rango.value = tieneOscuridad ? t.oscuridadPortada : 45;
        $('pw-oscuridad-valor').textContent = tieneOscuridad ? `${t.oscuridadPortada}%` : 'original';
        $('pw-paletas').innerHTML = PALETAS.map((p, i) => {
            const c = { ...ORIGINAL, ...p.colores };
            const activa = Object.keys(ORIGINAL).every(k => (t[k] || ORIGINAL[k]).toLowerCase() === c[k].toLowerCase());
            return `<button type="button" class="pw-paleta ${activa ? 'activa' : ''}" data-paleta="${i}">
                <span>${[c.colorPrincipal, c.colorAcento, c.colorFondo, c.colorTexto].map(x => `<i style="background:${x}"></i>`).join('')}</span>${esc(p.nombre)}</button>`;
        }).join('');
        const muestra = $('pw-muestra-fuente');
        muestra.querySelector('strong').style.fontFamily = t.fuenteTitulos ? `'${t.fuenteTitulos}', sans-serif` : '';
        muestra.querySelector('span').style.fontFamily = t.fuenteTexto ? `'${t.fuenteTexto}', sans-serif` : '';
        cargarFuentesEditor([t.fuenteTitulos, t.fuenteTexto]);
    }

    function cargarFuentesEditor(nombres) {
        const lista = nombres.filter(n => FUENTES.includes(n));
        if (!lista.length) return;
        const id = 'pw-fuentes-' + lista.join('-').replace(/\s/g, '');
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?' + lista.map(n => `family=${n.replace(/ /g, '+')}${FUENTES_UN_PESO.includes(n) ? '' : ':wght@400;700'}`).join('&') + '&display=swap';
        document.head.appendChild(link);
    }

    function cambiarTema(clave, valor) {
        contenido.tema = contenido.tema || {};
        const vacio = valor === '' || valor == null || (ORIGINAL[clave] && String(valor).toLowerCase() === ORIGINAL[clave]);
        if (vacio) delete contenido.tema[clave];
        else contenido.tema[clave] = valor;
        pintarDiseno();
        cambio();
    }

    async function restaurarInicial() {
        const ok = window.confirm('¿Restaurar la configuración inicial del sitio?\n\n' +
            'Se volverán a poner los textos, el video de portada, las preguntas frecuentes, el contacto y el diseño originales, y se publicará de inmediato.\n\n' +
            'Lo que tienes ahora queda guardado en "Historial", por si quieres recuperarlo.');
        if (!ok) return;
        try {
            aplicarEstado(await api().restaurarPortalInicial());
            avisar('Listo: el sitio volvió a su configuración inicial.');
            cargarVersiones();
        } catch (e) {
            avisar(e.message || 'No se pudo restaurar.', true);
        }
    }

    function validar() {
        const ini = contenido.inicio || {};
        if (!String(ini.titulo || '').trim()) return 'El título de la portada no puede quedar vacío.';
        if ((ini.beneficios || []).some(b => !String(b.titulo || '').trim())) return 'Cada beneficio necesita un título.';
        if ((contenido.faq || []).some(f => !String(f.pregunta || '').trim() || !String(f.respuesta || '').trim()))
            return 'Cada pregunta frecuente necesita pregunta y respuesta.';
        const correo = contenido.contacto?.correo;
        if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return 'El correo de contacto no es válido.';
        return null;
    }

    function cambio() {
        pintarVista();
        sinGuardar = true;
        refrescarEstado();
        clearTimeout(temporizador);
        temporizador = setTimeout(() => guardar(true), 1200);
    }

    async function guardar(silencioso = false) {
        clearTimeout(temporizador);
        const problema = validar();
        if (problema) {
            sinGuardar = false;
            estado('Revisa los datos', 'pu-chip--rojo');
            if (!silencioso) avisar(problema, true);
            return false;
        }
        try {
            const r = await api().guardarBorradorPortal(contenido);
            hayCambios = !!r?.hayCambios;
            sinGuardar = false;
            refrescarEstado();
            if (!silencioso) avisar('Borrador guardado.');
            return true;
        } catch (e) {
            sinGuardar = false;
            estado('No se guardó', 'pu-chip--rojo');
            avisar(e.message || 'No se pudo guardar el borrador.', true);
            return false;
        }
    }

    async function publicar() {
        if (!(await guardar(true))) return;
        if (!hayCambios) return avisar('No hay cambios por publicar.');
        const resumen = window.prompt('Describe brevemente qué cambiaste (queda en el historial):', 'Actualización de contenido');
        if (resumen === null) return;
        try {
            const r = await api().publicarPortal(resumen);
            hayCambios = !!r?.hayCambios;
            refrescarEstado();
            avisar('¡Publicado! Los cambios ya se ven en el sitio.');
            cargarVersiones();
        } catch (e) {
            avisar(e.message || 'No se pudo publicar.', true);
        }
    }

    async function descartar() {
        if (!window.confirm('¿Descartar el borrador y volver a lo que está publicado?')) return;
        try {
            const r = await api().descartarBorradorPortal();
            aplicarEstado(r);
            avisar('Borrador descartado.');
        } catch (e) {
            avisar(e.message || 'No se pudo descartar.', true);
        }
    }

    function aplicarEstado(r) {
        try {
            contenido = JSON.parse(r.borrador || r.publicado);
        } catch (_) {
            avisar('El contenido guardado no es válido; se cargó el contenido inicial.', true);
            contenido = { inicio: { beneficios: [] }, contacto: {}, faq: [] };
        }
        contenido.inicio = contenido.inicio || {};
        contenido.inicio.beneficios = contenido.inicio.beneficios || [];
        contenido.faq = contenido.faq || [];
        delete contenido.aviso;
        contenido.tema = contenido.tema && typeof contenido.tema === 'object' ? contenido.tema : {};
        hayCambios = !!r.hayCambios;
        sinGuardar = false;
        llenarCampos();
        refrescarEstado();
    }

    // ------------------------------------------------------------ imagen
    function ocupado(si) {
        $('pw-progreso').hidden = !si;
        ['pw-video-boton', 'pw-imagen-boton'].forEach(id => $(id).classList.toggle('ocupado', si));
    }

    async function subirImagen(archivo) {
        if (!archivo) return;
        if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) return avisar('Solo se aceptan imágenes JPG, PNG o WEBP.', true);
        if (archivo.size > 2 * 1024 * 1024) return avisar('La imagen pesa más de 2 MB. Redúcela e inténtalo otra vez.', true);
        estado('Subiendo imagen…');
        ocupado(true);
        try {
            const r = await api().subirImagenPortal(archivo);
            contenido.inicio.imagen = r.url;
            contenido.inicio.video = '';
            cambio();
            avisar('Imagen lista. Presiona Publicar para mostrarla en el sitio.');
        } catch (e) {
            refrescarEstado();
            avisar(e.message, true);
        } finally {
            ocupado(false);
        }
    }

    async function subirVideo(archivo) {
        if (!archivo) return;
        if (!/^video\/(mp4|webm)$/.test(archivo.type)) return avisar('Solo se aceptan videos MP4 o WEBM.', true);
        if (archivo.size > 20 * 1024 * 1024) return avisar('El video pesa más de 20 MB. Usa uno más corto o comprimido.', true);
        estado('Subiendo video…');
        ocupado(true);
        try {
            const r = await api().subirVideoPortal(archivo);
            contenido.inicio.video = r.url;
            contenido.inicio.imagen = '';
            cambio();
            avisar('Video listo. Presiona Publicar para mostrarlo en el sitio.');
        } catch (e) {
            refrescarEstado();
            avisar(e.message, true);
        } finally {
            ocupado(false);
        }
    }

    // ------------------------------------------------------------ historial
    async function cargarVersiones() {
        try {
            const lista = await api().versionesPortal() || [];
            $('pw-versiones').innerHTML = lista.length ? lista.map((v, i) => `
                <div class="pu-linea__item pw-version">
                    <div><strong>${esc(v.resumen)}</strong>${i === 0 ? ' <span class="pu-chip pu-chip--verde">Actual</span>' : ''}
                    <p>${fecha(v.fecha)} · ${esc(v.autor || '')}</p></div>
                    ${i === 0 ? '' : `<button class="pu-boton pu-boton--suave pu-boton--chico" type="button" data-restaurar="${v.idVersion}">Restaurar</button>`}
                </div>`).join('') : '<p class="pu-ayuda">Todavía no hay publicaciones.</p>';
        } catch (e) {
            $('pw-versiones').innerHTML = `<div class="pu-error">${esc(e.message)}</div>`;
        }
    }

    async function restaurar(id) {
        if (!window.confirm('Se cargará esa versión como borrador. Luego podrás revisarla y publicarla. ¿Continuar?')) return;
        try {
            aplicarEstado(await api().restaurarVersionPortal(id));
            avisar('Versión cargada como borrador. Revísala y publícala.');
            activarPanel('inicio');
        } catch (e) {
            avisar(e.message, true);
        }
    }

    // ------------------------------------------------------------ ofertas
    function estadoOferta(o) {
        const mapa = { Activa: 'pu-chip--verde', Programada: 'pu-chip--azul', Vencida: '', Oculta: '' };
        const t = o.estado || '—';
        const c = mapa[o.estado] || '';
        return `<span class="pu-chip ${c}">${t}</span>`;
    }

    async function cargarOfertas() {
        try {
            ofertas = await api().listarOfertasPortal() || [];
            $('pw-ofertas').innerHTML = ofertas.length ? ofertas.map(o => `<tr>
                <td><strong>${esc(o.titulo)}</strong><small>${esc(o.subtitulo || '')}</small></td>
                <td>${esc(o.vehiculo)}<small>${esc(o.categoria || '')}</small></td>
                <td><strong>-${o.descuento}%</strong><small>${soles(o.precioDia)} → ${soles(o.precioFinal)}/día</small></td>
                <td>${fechaCorta(o.inicio)} – ${fechaCorta(o.fin)}</td>
                <td>${estadoOferta(o)}</td>
                <td><div class="pu-celda-acciones">
                    <button class="pu-boton pu-boton--suave pu-boton--chico" type="button" data-oferta="${o.idOferta}" aria-label="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="pu-boton pu-boton--rojo pu-boton--chico" type="button" data-oferta-quitar="${o.idOferta}" aria-label="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </div></td></tr>`).join('') : '<tr><td colspan="6" class="pu-vacio">Sin ofertas. Crea la primera con "Nueva oferta".</td></tr>';
        } catch (e) {
            $('pw-ofertas').innerHTML = `<tr><td colspan="6" class="pu-vacio">${esc(e.message)}</td></tr>`;
        }
    }

    function precioFinal() {
        const f = $('pw-oferta-form');
        const v = vehiculos.find(x => String(x.idVehiculo) === f.idVehiculo.value);
        const d = Number(f.descuento.value || 0);
        f.precioFinal.value = v && d ? `${soles(v.precioDia * (100 - d) / 100)} / día` : '';
    }

    function abrirOferta(o = null) {
        const f = $('pw-oferta-form');
        f.reset();
        f.dataset.id = o?.idOferta || '';
        $('pw-modal-titulo').textContent = o ? 'Editar oferta' : 'Nueva oferta';
        f.idVehiculo.innerHTML = '<option value="">Selecciona un vehículo</option>' +
            vehiculos.map(v => `<option value="${v.idVehiculo}">${esc(v.marca)} ${esc(v.modelo)} · ${soles(v.precioDia)}/día</option>`).join('');
        const hoy = new Date().toISOString().slice(0, 10);
        f.titulo.value = o?.titulo || '';
        f.subtitulo.value = o?.subtitulo || '';
        f.idVehiculo.value = o?.idVehiculo || '';
        f.descuento.value = o?.descuento || 15;
        f.inicio.value = o?.inicio || hoy;
        f.fin.value = o?.fin || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
        f.visible.checked = o ? !!o.visible : true;
        f.querySelector('.pu-error').hidden = true;
        precioFinal();
        $('pw-modal').hidden = false;
        setTimeout(() => f.titulo.focus(), 50);
    }

    async function guardarOferta(e) {
        e.preventDefault();
        const f = e.target;
        const error = f.querySelector('.pu-error');
        const mostrar = t => { error.textContent = t; error.hidden = false; };
        const datos = {
            idOferta: f.dataset.id ? Number(f.dataset.id) : null,
            titulo: f.titulo.value.trim(), subtitulo: f.subtitulo.value.trim(),
            idVehiculo: Number(f.idVehiculo.value) || null, descuento: Number(f.descuento.value),
            inicio: f.inicio.value, fin: f.fin.value, visible: f.visible.checked
        };
        if (!datos.titulo) return mostrar('Escribe el título de la oferta.');
        if (!datos.idVehiculo) return mostrar('Selecciona un vehículo.');
        if (!(datos.descuento >= 1 && datos.descuento <= 70)) return mostrar('El descuento debe estar entre 1% y 70%.');
        if (!datos.inicio || !datos.fin || datos.fin < datos.inicio) return mostrar('Revisa las fechas: "Hasta" no puede ser antes de "Desde".');
        try {
            await api().guardarOfertaPortal(datos);
            $('pw-modal').hidden = true;
            avisar('Oferta guardada.');
            cargarOfertas();
        } catch (err) {
            mostrar(err.message || 'No se pudo guardar la oferta.');
        }
    }

    async function quitarOferta(id) {
        if (!window.confirm('¿Eliminar esta oferta? Dejará de mostrarse en el sitio.')) return;
        try {
            await api().eliminarOfertaPortal(id);
            avisar('Oferta eliminada.');
            cargarOfertas();
        } catch (e) {
            avisar(e.message, true);
        }
    }

    // ------------------------------------------------------------ pestañas y eventos
    function activarPanel(nombre) {
        document.querySelectorAll('#pw-pestanas [data-panel]').forEach(b => b.classList.toggle('activa', b.dataset.panel === nombre));
        document.querySelectorAll('.pu-panel[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== nombre; });
        document.querySelector('.pw-vista').hidden = ['ofertas', 'historial'].includes(nombre);
        document.querySelector('.pw-diseno').classList.toggle('sin-vista', ['ofertas', 'historial'].includes(nombre));
        cambiarPaginaVista(PAGINA_DE_PANEL[nombre]);
        if (nombre === 'historial') cargarVersiones();
        if (nombre === 'ofertas') cargarOfertas();
    }

    function preparar() {
        document.querySelector('.pw-editor').addEventListener('input', e => {
            const c = e.target;
            if (c.dataset.campo) {
                escribir(contenido, c.dataset.campo, c.type === 'checkbox' ? c.checked : c.value);
                return cambio();
            }
            if (c.dataset.beneficio) {
                contenido.inicio.beneficios[Number(c.dataset.beneficio)][c.dataset.prop] = c.value;
                return cambio();
            }
            if (c.dataset.faq) {
                contenido.faq[Number(c.dataset.faq)][c.dataset.prop] = c.value;
                return cambio();
            }
        });
        document.querySelector('.pw-editor').addEventListener('change', e => {
            if (e.target.type === 'checkbox' && e.target.dataset.campo) {
                escribir(contenido, e.target.dataset.campo, e.target.checked);
                cambio();
            }
        });
        $('pw-faq').addEventListener('click', e => {
            const mover = e.target.closest('[data-faq-mover]');
            const quitar = e.target.closest('[data-faq-quitar]');
            if (mover) {
                const i = Number(mover.dataset.faqMover);
                const j = i + Number(mover.dataset.dir);
                [contenido.faq[i], contenido.faq[j]] = [contenido.faq[j], contenido.faq[i]];
                pintarFaq();
                cambio();
            }
            if (quitar && window.confirm('¿Eliminar esta pregunta?')) {
                contenido.faq.splice(Number(quitar.dataset.faqQuitar), 1);
                pintarFaq();
                cambio();
            }
        });
        $('pw-nueva-faq').addEventListener('click', () => {
            contenido.faq.push({ pregunta: '', respuesta: '' });
            pintarFaq();
            $('pw-faq').querySelector(`[data-faq="${contenido.faq.length - 1}"]`)?.focus();
        });
        $('pw-imagen-archivo').addEventListener('change', e => { subirImagen(e.target.files[0]); e.target.value = ''; });
        document.querySelectorAll('input[type=color][data-tema]').forEach(i => i.addEventListener('input', () => cambiarTema(i.dataset.tema, i.value)));
        document.querySelectorAll('select.pw-fuente').forEach(sel => sel.addEventListener('change', () => cambiarTema(sel.dataset.tema, sel.value)));
        document.querySelectorAll('[data-opciones]').forEach(grupo => grupo.addEventListener('click', e => {
            const b = e.target.closest('button[data-valor]');
            if (b) cambiarTema(grupo.dataset.opciones, b.dataset.valor);
        }));
        const rango = document.querySelector('[data-tema="oscuridadPortada"]');
        rango.addEventListener('input', () => cambiarTema('oscuridadPortada', Number(rango.value)));
        $('pw-paletas').addEventListener('click', e => {
            const b = e.target.closest('[data-paleta]');
            if (!b) return;
            const paleta = PALETAS[Number(b.dataset.paleta)];
            contenido.tema = contenido.tema || {};
            Object.keys(ORIGINAL).forEach(k => { delete contenido.tema[k]; });
            Object.assign(contenido.tema, paleta.colores);
            pintarDiseno();
            cambio();
        });
        $('pw-diseno-original').addEventListener('click', () => {
            if (!window.confirm('¿Volver al diseño original (colores, letras y formas)? Los textos no cambian.')) return;
            contenido.tema = {};
            pintarDiseno();
            cambio();
        });
        $('pw-restaurar-inicial').addEventListener('click', restaurarInicial);
        $('pw-video-archivo').addEventListener('change', e => { subirVideo(e.target.files[0]); e.target.value = ''; });
        $('pw-imagen-quitar').addEventListener('click', () => { contenido.inicio.imagen = ''; contenido.inicio.video = ''; cambio(); });
        $('pw-guardar').addEventListener('click', () => guardar(false));
        $('pw-publicar').addEventListener('click', publicar);
        $('pw-descartar').addEventListener('click', descartar);
        $('pw-versiones').addEventListener('click', e => {
            const b = e.target.closest('[data-restaurar]');
            if (b) restaurar(b.dataset.restaurar);
        });
        document.querySelectorAll('#pw-pestanas [data-panel]').forEach(b => b.addEventListener('click', () => activarPanel(b.dataset.panel)));

        $('pw-nueva-oferta').addEventListener('click', () => abrirOferta());
        $('pw-ofertas').addEventListener('click', e => {
            const editar = e.target.closest('[data-oferta]');
            const quitar = e.target.closest('[data-oferta-quitar]');
            if (editar) abrirOferta(ofertas.find(o => String(o.idOferta) === editar.dataset.oferta));
            if (quitar) quitarOferta(quitar.dataset.ofertaQuitar);
        });
        const formOferta = $('pw-oferta-form');
        formOferta.addEventListener('submit', guardarOferta);
        formOferta.idVehiculo.addEventListener('change', precioFinal);
        formOferta.descuento.addEventListener('input', precioFinal);
        $('pw-modal').addEventListener('click', e => {
            if (e.target.id === 'pw-modal' || e.target.closest('[data-cerrar]')) $('pw-modal').hidden = true;
        });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') $('pw-modal').hidden = true; });
        window.addEventListener('message', e => {
            if (e.origin === location.origin && e.data?.tipo === 'carmovo-vista-lista') enviarVistaPrevia();
        });
        $('pw-vista-iframe').addEventListener('load', () => { enviarVistaPrevia(); ajustarVistaPrevia(); });
        document.querySelectorAll('[data-dispositivo]').forEach(b => b.addEventListener('click', () => {
            dispositivo = b.dataset.dispositivo;
            document.querySelectorAll('[data-dispositivo]').forEach(x => x.classList.toggle('activo', x === b));
            ajustarVistaPrevia();
        }));
        window.addEventListener('resize', ajustarVistaPrevia);
        ajustarVistaPrevia();
        window.addEventListener('beforeunload', e => { if (sinGuardar) { e.preventDefault(); e.returnValue = ''; } });

        Promise.all([api().obtenerPortalEditor(), api().listarVehiculos().catch(() => [])])
            .then(([estadoEditor, lista]) => {
                vehiculos = (lista || []).filter(v => v.estado !== 'Inactivo');
                aplicarEstado(estadoEditor);
            })
            .catch(e => avisar(e.message || 'No se pudo cargar el contenido del portal.', true));
    }

    document.addEventListener('DOMContentLoaded', preparar);
})();
