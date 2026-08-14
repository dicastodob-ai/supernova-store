'use client';

import { useEffect } from 'react';
import { CJ_DOMAINS } from '@/lib/cj-link-repair';

export default function CJLinkRepair() {
  useEffect(() => {
    // 1. Limpieza y reparación universal de URLs para cualquier anunciante
    function fixAllAffiliateLinks() {
      const clickableElements = document.querySelectorAll<HTMLElement>(
        'a[href], button[data-href], .product-card a, .cta-btn, .button-primary'
      );

      clickableElements.forEach((el) => {
        const rawHref =
          el.getAttribute('href') ||
          el.getAttribute('data-href') ||
          el.dataset.url;
        if (!rawHref) return;

        let href: string = rawHref;

        // Deshacer concatenación indebida con el dominio propio (Error 404)
        if (
          href.includes('supernovastore.humancentric.online') &&
          CJ_DOMAINS.some((d) => href.includes(d))
        ) {
          const cjMatch = href.match(
            /https?:\/\/[^\s"'<>]*(?:anrdoezrs|dpbolvw|tkqlhce|jdoqocy|kqzyfj|qksrv|emjcd)\.(?:net|com)[^\s"'<>]*/i
          );
          if (cjMatch) href = cjMatch[0];
        }

        // Si pertenece a la red de afiliados de CJ
        if (CJ_DOMAINS.some((d) => href.includes(d))) {
          if (href.startsWith('//')) href = 'https:' + href;
          else if (!href.startsWith('http://') && !href.startsWith('https://')) href = 'https://' + href;

          // Limpiar píxeles de impresión 1x1 incrustados en la cadena
          if (href.includes('<img') || href.includes('.gif') || href.includes('img%20src')) {
            const cleanUrl = href.match(/^(https?:\/\/[^\s"'<>]+)/i);
            if (cleanUrl) href = cleanUrl[1];
          }

          if (el.tagName.toLowerCase() === 'a') {
            el.setAttribute('href', href);
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer sponsored');
          } else {
            el.setAttribute('data-href', href);
            el.onclick = (e) => {
              e.preventDefault();
              window.open(href, '_blank', 'noopener,noreferrer,sponsored');
            };
          }
        }
      });
    }

    // 2. Ejecutar y observar cambios dinámicos de paginación y catálogo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fixAllAffiliateLinks);
    } else {
      fixAllAffiliateLinks();
    }

    const observer = new MutationObserver(fixAllAffiliateLinks);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
