/* =========================================================
   CARMOVO · Contenido del sitio editable desde "Portal web"
   Lee /api/v1/portal (contenido publicado + ofertas vigentes)
   y lo aplica sobre el diseño existente de cada página.
   Si la API no responde, la página conserva su texto original.
   Todo se inserta con textContent (no se ejecuta HTML ajeno).
   ========================================================= */
(() => {
    'use strict';

    const IMAGEN_RESPALDO = '/recursos/imagenes/home/logo-carmovo4.jpg';
    // Vista previa del panel: la página se abre dentro del editor y muestra el BORRADOR.
    const VISTA_PREVIA = new URLSearchParams(location.search).has('vistaPrevia') && window.parent !== window;
    const soles = n => `S/ ${Number(n || 0).toFixed(2)}`;
    const soloDigitos = v => String(v || '').replace(/\D/g, '');

    function el(etiqueta, clase, texto) {
        const e = document.createElement(etiqueta);
        if (clase) e.className = clase;
        if (texto != null) e.textContent = texto;
        return e;
    }

    function enlaceSeguro(url) {
        const u = String(url || '').trim();
        return /^(\/(?!\/)|https:\/\/)/.test(u) ? u : null;
    }

    // ------------------------------------------------------------ diseño del sitio (colores, letras, formas)
    // Cada color original del sitio pertenece a un grupo. Al elegir un nuevo color base,
    // los tonos del grupo se recalculan conservando su diferencia de luz y saturación.
    const GRUPOS = {
        colorPrincipal: { base: '#376B50', tonos: ['#376B50', '#2F7A4E', '#2F8654', '#236D4E', '#1F7A45', '#329A61', '#164D39', '#5B9C76'] },
        colorAcento:    { base: '#A8D5BA', tonos: ['#A8D5BA', '#8BC9A3', '#D8EEDF', '#E4F3E9', '#D8E9DE', '#DFF3E6', '#C9E1D1', '#C4DDCD'] },
        colorFondo:     { base: '#F5FAF6', tonos: ['#F5FAF6', '#F1F7F2', '#F0F6F1'] },
        colorTexto:     { base: '#263B30', tonos: ['#263B30', '#526B5D', '#648070', '#667F70', '#708579', '#789184'] }
    };
    // Mismo catálogo que el editor del Portal web (Google Fonts).
    const FUENTES = ["Montserrat", "Poppins", "Inter", "Roboto", "Open Sans", "Lato", "Nunito", "Nunito Sans", "Raleway", "Work Sans", "Rubik", "Manrope", "DM Sans", "Outfit", "Plus Jakarta Sans", "Urbanist", "Mulish", "Source Sans 3", "Barlow", "Kanit", "Josefin Sans", "Quicksand", "Sora", "Lexend", "Figtree", "Playfair Display", "Merriweather", "Lora", "Libre Baskerville", "Cormorant Garamond", "EB Garamond", "Roboto Slab", "Crimson Text", "DM Serif Display", "Bebas Neue", "Oswald", "Anton", "Archivo Black", "Righteous", "Bungee", "Fredoka", "Comfortaa", "Teko", "Russo One", "Orbitron", "Pacifico", "Dancing Script", "Caveat", "Lobster", "Satisfy"];
    const FUENTES_UN_PESO = ["Anton", "Archivo Black", "Bebas Neue", "Bungee", "DM Serif Display", "Lobster", "Pacifico", "Righteous", "Russo One", "Satisfy"];
    const FORMAS_BOTON = { redondeado: '12px', pildora: '999px', recto: '4px' };
    const FORMAS_TARJETA = { suave: '22px', recta: '6px' };

    const hexARgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    function rgbAHsl([r, g, b]) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, sat = 0;
        const l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
            h /= 6;
        }
        return [h, sat, l];
    }
    function hslARgb([h, sat, l]) {
        if (!sat) return [l, l, l].map(v => Math.round(v * 255));
        const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat;
        const p = 2 * l - q;
        const f = t => {
            t = (t + 1) % 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
    }
    const limitar = v => Math.min(1, Math.max(0, v));
    const hexValido = v => /^#[0-9a-f]{6}$/i.test(String(v || ''));

    function mapaDeColores(tema) {
        const mapa = new Map();
        Object.entries(GRUPOS).forEach(([clave, grupo]) => {
            const nuevo = tema?.[clave];
            if (!hexValido(nuevo) || nuevo.toUpperCase() === grupo.base) return;
            const [hb, sb, lb] = rgbAHsl(hexARgb(grupo.base));
            const [hn, sn, ln] = rgbAHsl(hexARgb(nuevo));
            grupo.tonos.forEach(tono => {
                const [h, sat, l] = rgbAHsl(hexARgb(tono));
                const destino = hslARgb([(hn + (h - hb) + 1) % 1, limitar(sn + (sat - sb)), limitar(ln + (l - lb))]);
                mapa.set(hexARgb(tono).join(','), destino.join(', '));
            });
        });
        return mapa;
    }

    let declaraciones = null;
    function declaracionesConColor() {
        if (declaraciones) return declaraciones;
        declaraciones = [];
        const recorrer = reglas => {
            for (const regla of reglas) {
                if (regla.cssRules) recorrer(regla.cssRules);
                const st = regla.style;
                if (!st) continue;
                for (let i = 0; i < st.length; i++) {
                    const prop = st[i];
                    const valor = st.getPropertyValue(prop);
                    if (/rgba?\(/.test(valor)) declaraciones.push({ st, prop, valor, prioridad: st.getPropertyPriority(prop) });
                }
            }
        };
        for (const hoja of document.styleSheets) {
            try { recorrer(hoja.cssRules); } catch (_) { /* hojas de otros dominios (fuentes, íconos) */ }
        }
        return declaraciones;
    }

    function aplicarColores(tema) {
        const mapa = mapaDeColores(tema);
        if (!mapa.size && !declaraciones) return;
        declaracionesConColor().forEach(d => {
            const nuevo = mapa.size ? d.valor.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g, (todo, r, g, b) => {
                const destino = mapa.get(`${r},${g},${b}`);
                return destino ? todo.replace(`${r}, ${g}, ${b}`, destino).replace(`${r},${g},${b}`, destino) : todo;
            }) : d.valor;
            if (d.st.getPropertyValue(d.prop) !== nuevo) d.st.setProperty(d.prop, nuevo, d.prioridad);
        });
    }

    function cargarFuentes(nombres) {
        const faltan = nombres.filter(n => n && n !== 'Montserrat' && n !== 'Outfit' && FUENTES.includes(n));
        const id = 'portal-tema-fuentes';
        document.getElementById(id)?.remove();
        if (!faltan.length) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?' + [...new Set(faltan)]
            .map(n => `family=${n.replace(/ /g, '+')}${FUENTES_UN_PESO.includes(n) ? '' : ':wght@400;700'}`).join('&') + '&display=swap';
        document.head.appendChild(link);
    }

    function aplicarTema(tema = {}) {
        aplicarColores(tema);
        const fuenteTitulos = FUENTES.includes(tema.fuenteTitulos) ? tema.fuenteTitulos : '';
        const fuenteTexto = FUENTES.includes(tema.fuenteTexto) ? tema.fuenteTexto : '';
        cargarFuentes([fuenteTitulos, fuenteTexto]);
        const reglas = [];
        if (fuenteTexto) {
            reglas.push(`body, body :where(p, a, li, span, small, label, input, select, textarea, button, td, th, strong, div) { font-family: '${fuenteTexto}', sans-serif !important; }`);
        }
        if (fuenteTitulos) {
            reglas.push(`body :where(h1, h2, h3, h4, h5, h6, .titulo-principal, .titulo-principal span) { font-family: '${fuenteTitulos}', sans-serif !important; }`);
        }
        const radioBoton = FORMAS_BOTON[tema.formaBotones];
        if (radioBoton) {
            reglas.push(`body :where(button, input[type=submit], [class*="boton"], [class*="btn"]):not(.portal-sin-forma) { border-radius: ${radioBoton} !important; }`);
        }
        const radioTarjeta = FORMAS_TARJETA[tema.formaTarjetas];
        if (radioTarjeta) {
            reglas.push(`body :where([class*="tarjeta"], .beneficio, .item-faq, .tarjeta-oferta, .auto-card, .card) { border-radius: ${radioTarjeta} !important; }`);
        }
        const oscuridad = Number(tema.oscuridadPortada);
        if (Number.isFinite(oscuridad) && tema.oscuridadPortada !== '' && tema.oscuridadPortada != null) {
            reglas.push(`.capa-oscura-video { background: rgba(0, 0, 0, ${Math.min(90, Math.max(0, oscuridad)) / 100}) !important; }`);
            reglas.push(`.portal-imagen-hero::after { content: ""; position: absolute; inset: 0; background: rgba(0, 0, 0, ${Math.min(90, Math.max(0, oscuridad)) / 100}); pointer-events: none; }`);
        }
        let estilo = document.getElementById('portal-tema');
        if (!estilo) {
            estilo = document.createElement('style');
            estilo.id = 'portal-tema';
            document.head.appendChild(estilo);
        }
        estilo.textContent = reglas.join('\n');
    }

    // Sin "franja" de avisos: si quedó alguna de una versión anterior, se quita.
    function aviso() {
        document.querySelectorAll('.portal-aviso').forEach(b => b.remove());
    }

    // ------------------------------------------------------------ inicio
    function inicio(datos) {
        if (!datos) return;
        const titulo = document.querySelector('.seccion-hero .titulo-principal');
        if (titulo && datos.titulo) {
            titulo.textContent = `${datos.titulo} `;
            if (datos.resaltado) titulo.append(el('span', 'texto-resaltado', datos.resaltado));
        }
        const sub = document.querySelector('.seccion-hero .descripcion-hero');
        if (sub && datos.subtitulo) sub.textContent = datos.subtitulo;

        // Fondo de la portada: imagen propia > video propio > video original.
        const caja = document.querySelector('.seccion-hero .hero-imagen-caja');
        const video = caja?.querySelector('video');
        if (video && !video.dataset.original) {
            video.dataset.original = video.currentSrc || video.querySelector('source')?.src || video.src || '';
        }
        const imagen = enlaceSeguro(datos.imagen);
        const videoDeseado = enlaceSeguro(datos.video) || video?.dataset.original || '';
        if (caja && imagen) {
            if (video) { video.pause?.(); video.hidden = true; }
            caja.classList.add('portal-imagen-hero');
            caja.style.backgroundImage = `url("${imagen.replace(/"/g, '')}")`;
        } else if (caja) {
            caja.classList.remove('portal-imagen-hero');
            caja.style.backgroundImage = '';
            if (video) {
                video.hidden = false;
                const actual = video.currentSrc || video.src || '';
                if (videoDeseado && !actual.endsWith(videoDeseado.replace(/^https?:\/\/[^/]+/, ''))) {
                    video.querySelectorAll('source').forEach(s => s.remove());
                    video.src = videoDeseado;
                    video.muted = true;
                    video.load();
                }
                video.play?.().catch(() => {});
            }
        }

        const tituloBen = document.querySelector('.titulo-seccion-caracteristicas');
        if (tituloBen && datos.tituloBeneficios) tituloBen.textContent = datos.tituloBeneficios;
        const tarjetas = document.querySelectorAll('.grid-beneficios .beneficio');
        (datos.beneficios || []).forEach((b, i) => {
            const t = tarjetas[i];
            if (!t) return;
            const h = t.querySelector('h3');
            const p = t.querySelector('p');
            if (h && b.titulo) h.textContent = b.titulo;
            if (p && b.texto) p.textContent = b.texto;
        });
    }

    // ------------------------------------------------------------ soporte
    function faq(lista) {
        const cont = document.getElementById('contenedor-faq');
        if (!cont || !Array.isArray(lista) || !lista.length) return;
        cont.replaceChildren(...lista.map(f => {
            const item = el('div', 'item-faq');
            const boton = el('button', 'pregunta-faq', `${f.pregunta} `);
            boton.type = 'button';
            boton.setAttribute('aria-expanded', 'false');
            const icono = el('i', 'fa-solid fa-chevron-down');
            boton.append(icono);
            const resp = el('div', 'respuesta-faq');
            resp.append(el('p', null, f.respuesta));
            item.append(boton, resp);
            return item;
        }));
        if (cont.dataset.portalListo) return;
        cont.dataset.portalListo = '1';
        cont.addEventListener('click', e => {
            const boton = e.target.closest('.pregunta-faq');
            if (!boton) return;
            const item = boton.parentElement;
            const abierto = item.classList.contains('activo');
            cont.querySelectorAll('.item-faq.activo').forEach(x => {
                x.classList.remove('activo');
                x.querySelector('.respuesta-faq').style.maxHeight = null;
                x.querySelector('.pregunta-faq').setAttribute('aria-expanded', 'false');
            });
            if (!abierto) {
                item.classList.add('activo');
                const r = item.querySelector('.respuesta-faq');
                r.style.maxHeight = `${r.scrollHeight}px`;
                boton.setAttribute('aria-expanded', 'true');
            }
        });
    }

    function contacto(c) {
        if (!c) return;
        const tel = soloDigitos(c.telefonoEmergencias);
        const wa = soloDigitos(c.whatsapp);
        if (tel) document.querySelectorAll('a[href^="tel:"]').forEach(a => { a.href = `tel:+${tel}`; });
        if (wa) {
            document.querySelectorAll('a[href*="wa.me/"], .btn-contacto-wssp').forEach(a => {
                a.href = `https://wa.me/${wa}`;
                a.target = '_blank';
                a.rel = 'noopener';
            });
        }
        if (c.correo) {
            document.querySelectorAll('.btn-contacto-email').forEach(a => { a.href = `mailto:${c.correo}`; a.textContent = c.correo; });
        }
        const oficina = document.querySelector('.tarjeta-contacto.oficina p');
        if (oficina && c.direccion) oficina.textContent = c.direccion;
        const mapa = document.querySelector('.btn-contacto-oficina');
        if (mapa && c.direccion) {
            mapa.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion)}`;
            mapa.target = '_blank';
            mapa.rel = 'noopener';
        }
        const horario = document.querySelector('.tarjeta-contacto.wssp p');
        if (horario && c.horario) horario.textContent = c.horario;

        // Pie de página: datos de contacto en todas las páginas
        const pie = document.querySelector('.pie-logo-info');
        if (pie) {
            pie.querySelector('.portal-pie-contacto')?.remove();
            const bloque = el('div', 'portal-pie-contacto');
            if (c.telefonoEmergencias) bloque.append(el('span', null, `Emergencias 24/7: ${c.telefonoEmergencias}`));
            if (c.correo) bloque.append(el('span', null, c.correo));
            if (c.direccion) bloque.append(el('span', null, c.direccion));
            pie.append(bloque);
        }
    }

    // ------------------------------------------------------------ ofertas
    function rutaImagen(o) {
        const img = String(o.imagen || '').trim();
        if (/^(https:|\/|\.\.\/recursos\/)/i.test(img)) return img;
        if (img.startsWith('recursos/')) return `/${img}`;
        if (typeof autosDB !== 'undefined' && Array.isArray(autosDB)) {
            const ref = autosDB.find(a => String(a.nombre).toLowerCase() === String(o.vehiculo).toLowerCase());
            if (ref?.imagen) return ref.imagen;
        }
        return IMAGEN_RESPALDO;
    }

    function tarjetaOferta(o) {
        const art = el('article', 'tarjeta-oferta');
        art.dataset.categoria = o.categoria || '';
        const caja = el('div', 'imagen-oferta');
        const img = el('img');
        img.src = rutaImagen(o);
        img.alt = o.vehiculo;
        img.loading = 'lazy';
        img.onerror = () => { img.onerror = null; img.src = IMAGEN_RESPALDO; };
        caja.append(img, el('span', 'descuento-oferta', `-${o.descuento}%`), el('span', 'etiqueta-tarjeta-oferta', 'OFERTA'));

        const cont = el('div', 'contenido-tarjeta-oferta');
        cont.append(el('span', 'categoria-oferta', String(o.categoria || '').toUpperCase()), el('h3', null, o.vehiculo));
        cont.append(el('p', 'descripcion-oferta', o.subtitulo || o.titulo));
        const carac = el('div', 'caracteristicas-oferta');
        if (o.pasajeros) carac.append(el('span', null, `${o.pasajeros} pasajeros`));
        if (o.transmision) carac.append(el('span', null, o.transmision));
        const fin = new Date(`${o.fin}T12:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
        carac.append(el('span', null, `Hasta el ${fin}`));
        cont.append(carac);

        const precios = el('div', 'precios-oferta');
        const izq = el('div');
        izq.append(el('span', 'precio-anterior', soles(o.precioDia)), el('strong', null, soles(o.precioFinal)), el('span', 'por-dia', ' / día'));
        precios.append(izq, el('span', 'ahorro-oferta', `Ahorras ${soles(o.precioDia - o.precioFinal)}`));
        cont.append(precios);

        const boton = el('button', 'btn-reservar-oferta portal-reservar', 'Reservar ahora ');
        boton.type = 'button';
        boton.append(el('i', 'fa-solid fa-arrow-right'));
        boton.addEventListener('click', () => {
            const seleccion = {
                idVehiculo: Number(o.idVehiculo), id: Number(o.idVehiculo), nombre: o.vehiculo,
                categoria: o.categoria, tipo: o.categoria, pasajeros: o.pasajeros, transmision: o.transmision,
                imagen: o.imagen, precioDia: Number(o.precioDia), precio: Number(o.precioDia),
                descuento: o.descuento, esOferta: true
            };
            try {
                localStorage.setItem('autoReserva', JSON.stringify(seleccion));
                localStorage.setItem('ofertaActiva', 'true');
            } catch (_) { /* sin almacenamiento */ }
            window.location.href = '/reservas';
        });
        cont.append(boton);
        art.append(caja, cont);
        return art;
    }

    function ofertas(lista) {
        const grid = document.querySelector('#lista-ofertas .grid-ofertas');
        if (!grid) return;
        const sinResultados = document.getElementById('sinResultadosOfertas');
        if (!lista.length) {
            const vacio = el('p', 'portal-sin-ofertas', 'Por ahora no hay ofertas vigentes. Vuelve pronto: publicamos descuentos cada semana.');
            grid.replaceChildren(vacio);
            return;
        }
        // Las ofertas de la base de datos reemplazan las tarjetas de ejemplo
        // (así el precio mostrado es exactamente el que se cobra).
        grid.replaceChildren(...lista.map(tarjetaOferta));
        document.querySelector('.filtros-ofertas')?.addEventListener('click', e => {
            const b = e.target.closest('.filtro-oferta');
            if (!b) return;
            const cat = b.dataset.categoria;
            let visibles = 0;
            grid.querySelectorAll('.tarjeta-oferta').forEach(t => {
                const ok = cat === 'Todos' || t.dataset.categoria === cat;
                t.classList.toggle('oculta', !ok);
                if (ok) visibles++;
            });
            if (sinResultados) sinResultados.style.display = visibles ? 'none' : 'block';
        });
    }

    // ------------------------------------------------------------ arranque
    async function cargar() {
        let datos;
        try {
            const r = await fetch('/api/v1/portal', { headers: { Accept: 'application/json' } });
            if (!r.ok) return;
            datos = await r.json();
        } catch (_) {
            return;
        }
        let contenido = {};
        try { contenido = JSON.parse(datos.contenido || '{}'); } catch (_) { contenido = {}; }
        if (!VISTA_PREVIA) aplicar(contenido);
        ofertas(Array.isArray(datos.ofertas) ? datos.ofertas : []);
    }

    function aplicar(contenido) {
        aviso();
        aplicarTema(contenido.tema || {});
        if (!VISTA_PREVIA) {
            try { localStorage.setItem('carmovo_tema', JSON.stringify(contenido.tema || {})); } catch (_) { /* sin almacenamiento */ }
        }
        inicio(contenido.inicio);
        faq(contenido.faq);
        contacto(contenido.contacto);
    }

    // El editor del panel envía el borrador en cada cambio (solo desde el mismo sitio).
    if (VISTA_PREVIA) {
        window.addEventListener('message', e => {
            if (e.origin !== location.origin || e.data?.tipo !== 'carmovo-vista-previa') return;
            const aplicarAhora = () => aplicar(e.data.contenido || {});
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicarAhora);
            else aplicarAhora();
        });
        window.parent.postMessage({ tipo: 'carmovo-vista-lista' }, location.origin);
    }

    // Aplica el último diseño conocido al instante (evita ver los colores originales un momento).
    if (!VISTA_PREVIA) {
        try {
            const guardado = JSON.parse(localStorage.getItem('carmovo_tema') || 'null');
            if (guardado && Object.keys(guardado).length) aplicarTema(guardado);
        } catch (_) { /* sin almacenamiento */ }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cargar);
    else cargar();
})();
