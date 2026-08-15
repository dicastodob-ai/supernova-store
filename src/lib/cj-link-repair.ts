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
 * 2. Función de saneamiento de URLs de afiliado
 * Preserva fielmente la URL original del anunciante y asegura el parámetro sid=supernova
 */
export function sanitizeAffiliateUrl(rawUrl?: string | null, merchant?: string, productId?: string): string {
  const mKey = (merchant || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!rawUrl || typeof rawUrl !== 'string') {
    if (mKey && MERCHANT_CJ_FALLBACKS[mKey]) {
      return MERCHANT_CJ_FALLBACKS[mKey];
    }
    const slug = mKey || 'store';
    return `https://${slug}.com/?sid=${CJ_SUBID}`;
  }

  let url = rawUrl.trim();

  // Limpiar posibles caracteres o comillas residuales
  url = url.replace(/^[<"']+|[>"']+$/g, '');

  // Asegurar protocolo HTTPS
  if (url.startsWith('//')) {
    url = 'https:' + url;
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  // Si la URL principal es un slug muerto, retornar el fallback del anunciante
  if (isDeadDeepLink(url)) {
    if (mKey && MERCHANT_CJ_FALLBACKS[mKey]) {
      return MERCHANT_CJ_FALLBACKS[mKey];
    }
  }

  // Concatena sid=supernova respetando la sintaxis del enlace original sin alterar dominio ni AID/PID
  const hasSid = /[?&]sid=/i.test(url) || /\/sid\//i.test(url);
  if (!hasSid) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}sid=${CJ_SUBID}`;
  }

  return url;
}

export const sanitizeCJLink = sanitizeAffiliateUrl;

export function isCJDomain(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return CJ_TRACKING_HOSTS.some((domain) => url.toLowerCase().includes(domain));
}
