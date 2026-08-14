'use client';

import { useEffect } from 'react';
import { CJ_DOMAINS, sanitizeCJLink } from '@/lib/cj-link-repair';

export default function CJLinkRepair() {
  useEffect(() => {
    function repairCJLinks() {
      const links = document.querySelectorAll<HTMLElement>(
        'a[href], button[data-href], .product-card a, .cta-btn, .button-primary'
      );

      links.forEach((el) => {
        const rawHref =
          el.getAttribute('href') ||
          el.getAttribute('data-href') ||
          el.dataset.url;
        if (!rawHref) return;

        let href: string = rawHref;

        // 1. Corregir enlaces que se concatenaron con el dominio local por error (404 relativo)
        if (
          href.includes('supernovastore.humancentric.online') &&
          CJ_DOMAINS.some((d) => href.includes(d))
        ) {
          const cjIndex = href.search(
            /https?:\/\/(www\.)?(anrdoezrs|dpbolvw|tkqlhce|jdoqocy|kqzyfj|qksrv|emjcd)\.(net|com)/i
          );
          if (cjIndex !== -1) {
            href = href.substring(cjIndex);
          }
        }

        // 2. Comprobar si es un enlace de la red de CJ
        const isCJLink = CJ_DOMAINS.some((domain) => href.includes(domain));

        if (isCJLink) {
          // Sanitizar y limpiar etiquetas HTML residuales / píxeles 1x1
          const cleanHref = sanitizeCJLink(href);

          // Asignar el enlace corregido y atributos de seguridad para afiliados
          if (el.tagName.toLowerCase() === 'a') {
            el.setAttribute('href', cleanHref);
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer sponsored');
          } else {
            el.setAttribute('data-href', cleanHref);
            el.onclick = function (e) {
              e.preventDefault();
              window.open(cleanHref, '_blank', 'noopener,noreferrer,sponsored');
            };
          }
        }
      });
    }

    repairCJLinks();

    const observer = new MutationObserver(() => {
      repairCJLinks();
    });

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
