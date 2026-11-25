/* CARMOVO · Las tarjetas aparecen suavemente al bajar por la página (sitio web y panel). */
(() => {
    'use strict';
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const SELECTOR = [
        '.beneficio', '.tarjeta-oferta', '.tarjeta-vehiculo', '.tarjeta-ayuda', '.tarjeta-guia', '.tarjeta-ruta',
        '.tarjeta-contacto', '.insignia-card', 'article.disponible', '.item-faq', '.historia-item',
        '.tarjeta-estadistica', '.pu-tarjeta', '.panel-base', '.reporte-panel', '.ga-resumen__item', '.ms-tarjeta'
    ].join(',');
    const visto = new WeakSet();
    const observador = new IntersectionObserver(entradas => {
        entradas.forEach(e => {
            if (!e.isIntersecting) return;
            const el = e.target;
            const hermanos = el.parentElement ? [...el.parentElement.children].filter(x => x.classList.contains('cm-revelar')) : [];
            el.style.transitionDelay = `${Math.min(hermanos.indexOf(el), 6) * 70}ms`;
            el.classList.add('cm-visible');
            observador.unobserve(el);
            setTimeout(() => { el.style.transitionDelay = ''; el.classList.remove('cm-revelar', 'cm-visible'); }, 1400);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    const preparar = raiz => {
        (raiz.matches?.(SELECTOR) ? [raiz] : []).concat([...(raiz.querySelectorAll?.(SELECTOR) || [])]).forEach(el => {
            if (visto.has(el) || el.closest('[hidden], .cd-fondo')) return;
            visto.add(el);
            el.classList.add('cm-revelar');
            observador.observe(el);
        });
    };
    const iniciar = () => {
        preparar(document.body);
        new MutationObserver(cambios => cambios.forEach(c => c.addedNodes.forEach(n => n.nodeType === 1 && preparar(n))))
            .observe(document.body, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
})();