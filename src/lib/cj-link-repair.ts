/**
 * Supernova Store — CJ Link Repair, Attribution Sanitizer & Anti-404 Fallback
 *
 * 1. Redes y dominios de seguimiento oficial de CJ
 */

export const CJ_CID = '7999396';
export const CJ_SUBID = 'supernova';

export const CJ_TRACKING_HOSTS = [
  'anrdoezrs.net',
  'dpbolvw.net',
  'tkqlhce.com',
  'jdoqocy.com',
  'kqzyfj.com',
  'qksrv.net',
  'emjcd.com',
  'cj.com',
];

export const CJ_DOMAINS = CJ_TRACKING_HOSTS;

/**
 * Fallbacks verificados por anunciante ante deep-links rotos o páginas 404
 */
export const MERCHANT_CJ_FALLBACKS: Record<string, string> = {
  'zinio': 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://www.zinio.com/',
  'wondershare': 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://www.wondershare.com/',
  'ashampoo': 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://www.ashampoo.com/',
  'whokeys': 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://www.whokeys.com/',
  'abracadabra': 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://abracadabranyc.com/',
  'abracadabra nyc': 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://abracadabranyc.com/',
};

/**
 * Detecta si una URL de deep-link contiene patrones conocidos de error 404 o slug caducado
 */
export function isDeadDeepLink(url: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();

  // Patrones de error 404 conocidos en feeds de anunciantes
  if (
    lower.includes('404') ||
    lower.includes('page-not-found') ||
    lower.includes('item-not-found') ||
    lower.includes('expired') ||
    lower.includes('null') ||
    lower.includes('undefined') ||
    lower.includes('error') ||
    lower.includes('product_not_available') ||
    lower.includes('/not-found') ||
    lower.endsWith('/null') ||
    lower.endsWith('/undefined')
  ) {
    return true;
  }

  // Zinio: slugs vacíos o inválidos
  if (lower.includes('zinio.com') && (lower.endsWith('/zinio.com/') || lower.includes('/undefined/') || lower.includes('magazine-not-found'))) {
    return true;
  }

  return false;
}

/**
 * 2. Función de saneamiento de URLs de afiliado con recuperación Anti-404
 * Garantiza que siempre devuelva una URL externa directa válida para compras.
 */
export function sanitizeAffiliateUrl(rawUrl?: string | null, merchant?: string, productId?: string): string {
  const mKey = (merchant || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!rawUrl || typeof rawUrl !== 'string') {
    if (mKey && MERCHANT_CJ_FALLBACKS[mKey]) {
      return MERCHANT_CJ_FALLBACKS[mKey];
    }
    const slug = mKey || 'store';
    return `https://www.anrdoezrs.net/links/${CJ_CID}/type/dlg/sid/${CJ_SUBID}/https://${slug}.com/`;
  }

  let url = rawUrl.trim();

  // Si la URL contiene un destino interno de supernovastore (ej. https://supernovastore.humancentric.online/cj/techhaven/prod-10),
  // desentrañar para obtener la URL real del comercio externo y envolverla en CJ Gateway
  if (url.includes('supernovastore.humancentric.online/cj/') || url.includes('/cj/')) {
    if (mKey && MERCHANT_CJ_FALLBACKS[mKey]) {
      return MERCHANT_CJ_FALLBACKS[mKey];
    }
    const slug = mKey || 'store';
    const cleanId = productId || 'featured';
    return `https://www.anrdoezrs.net/links/${CJ_CID}/type/dlg/sid/${CJ_SUBID}/https://${slug}.com/product/${cleanId}`;
  }

  if (url.includes('supernovastore.humancentric.online/affiliate/')) {
    if (mKey && MERCHANT_CJ_FALLBACKS[mKey]) {
      return MERCHANT_CJ_FALLBACKS[mKey];
    }
    const slug = mKey || 'store';
    return `https://www.anrdoezrs.net/links/${CJ_CID}/type/dlg/sid/${CJ_SUBID}/https://${slug}.com/`;
  }

  // Asegurar HTTPS
  if (url.startsWith('//')) {
    url = 'https:' + url;
  } else if (
    !url.startsWith('http://') &&
    !url.startsWith('https://') &&
    CJ_TRACKING_HOSTS.some((h) => url.includes(h))
  ) {
    url = 'https://' + url;
  }

  // Limpiar restos de etiquetas HTML (píxeles de 1x1, imágenes embebidas)
  if (url.includes('<img') || url.includes('.gif') || url.includes('img%20src')) {
    const cleanMatch = url.match(/^(https?:\/\/[^\s"'<>]+)/i);
    if (cleanMatch) url = cleanMatch[1];
  }

  // Corregir codificación del parámetro de destino 'url=' para evitar 404s en el anunciante
  try {
    if (url.includes('url=') && CJ_TRACKING_HOSTS.some((h) => url.includes(h))) {
      const urlObj = new URL(url);
      const targetParam = urlObj.searchParams.get('url');
      if (targetParam && targetParam.includes('http')) {
        const cleanTarget = decodeURIComponent(targetParam);
        
        // Si el destino es un deep-link roto conocido, redirigir al fallback del anunciante
        if (isDeadDeepLink(cleanTarget)) {
          if (mKey && MERCHANT_CJ_FALLBACKS[mKey]) {
            return MERCHANT_CJ_FALLBACKS[mKey];
          }
        }

        urlObj.searchParams.set('url', cleanTarget);
        url = urlObj.toString();
      }
    }
  } catch {
    // En caso de fallo de parseo estándar, conservar URL limpia
  }

  // Si la URL principal es un slug muerto, retornar el fallback del anunciante
  if (isDeadDeepLink(url)) {
    if (mKey && MERCHANT_CJ_FALLBACKS[mKey]) {
      return MERCHANT_CJ_FALLBACKS[mKey];
    }
  }

  // Si la URL no tiene pasarela CJ y es dominio externo, envolverla
  if (
    url.startsWith('http') &&
    !url.includes('anrdoezrs.net') &&
    !url.includes('dpbolvw.net') &&
    !url.includes('tkqlhce.com') &&
    !url.includes('jdoqocy.com') &&
    !url.includes('kqzyfj.com') &&
    !url.includes('qksrv.net') &&
    !url.includes('emjcd.com')
  ) {
    url = `https://www.anrdoezrs.net/links/${CJ_CID}/type/dlg/sid/${CJ_SUBID}/${url}`;
  }

  return url;
}

export const sanitizeCJLink = sanitizeAffiliateUrl;

export function isCJDomain(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return CJ_TRACKING_HOSTS.some((domain) => url.toLowerCase().includes(domain));
}
