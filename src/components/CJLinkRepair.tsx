'use client';

import { useEffect } from 'react';
import { CJ_TRACKING_HOSTS, sanitizeAffiliateUrl } from '@/lib/cj-link-repair';

export default function CJLinkRepair() {
  useEffect(() => {
    // 1. Aplicar atributos y corregir enlaces en el DOM con fallback anti-404
    function fixAllProductLinks() {
      const selector =
        'a[href], button[data-href], .product-card a, .cta-btn, .button-primary';
      const elements = document.querySelectorAll<HTMLElement>(selector);

      elements.forEach((el) => {
        const currentHref =
          el.getAttribute('href') ||
          el.getAttribute('data-href') ||
          el.dataset.url;
        if (
          !currentHref ||
          currentHref === '#' ||
          currentHref.startsWith('javascript:')
        )
          return;

        const merchant = el.closest('.product-card')?.querySelector('.text-\\[\\#D96B27\\]')?.textContent?.trim();

        const isCJ = CJ_TRACKING_HOSTS.some((h) => currentHref.includes(h));
        if (isCJ) {
          const cleanHref = sanitizeAffiliateUrl(currentHref, merchant);

          if (el.tagName.toLowerCase() === 'a') {
            el.setAttribute('href', cleanHref);
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer sponsored');
          } else {
            el.setAttribute('data-href', cleanHref);
          }
        }
      });
    }

    // 2. Interceptor global de clics para evitar bloqueos del enrutador de Next.js
    function handleGlobalClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        'a, button, .product-card, .cta-btn'
      );
      if (!target) return;

      const href =
        target.getAttribute('href') ||
        target.getAttribute('data-href') ||
        target.dataset.url;
      if (!href) return;

      const merchant = target.closest('.product-card')?.querySelector('.text-\\[\\#D96B27\\]')?.textContent?.trim();

      const isCJ = CJ_TRACKING_HOSTS.some((h) => href.includes(h));
      if (isCJ) {
        const finalUrl = sanitizeAffiliateUrl(href, merchant);
        // Evitar que el enrutador cliente de Next.js intente cargar la página de CJ como ruta interna
        e.stopPropagation();

        if (
          target.tagName.toLowerCase() !== 'a' ||
          target.getAttribute('target') !== '_blank'
        ) {
          e.preventDefault();
          window.open(finalUrl, '_blank', 'noopener,noreferrer,sponsored');
        }
      }
    }

    // Registrar interceptor en fase de captura (true)
    document.addEventListener('click', handleGlobalClick, true);

    // Inicialización
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fixAllProductLinks);
    } else {
      fixAllProductLinks();
    }

    // Observador dinámico para catálogo paginado y filtros
    const observer = new MutationObserver(fixAllProductLinks);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
