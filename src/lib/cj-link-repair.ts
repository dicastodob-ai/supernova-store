/**
 * Supernova Store — CJ Link Repair & Attribution Sanitizer
 *
 * 1. Redes y dominios de seguimiento oficial de CJ
 */

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
 * 2. Función de saneamiento de URLs de afiliado
 */
export function sanitizeAffiliateUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  let url = rawUrl.trim();

  // Deshacer concatenación accidental con el dominio de la tienda
  if (url.includes('supernovastore.humancentric.online')) {
    const match = url.match(
      /https?:\/\/[^\s"'<>]*(?:anrdoezrs|dpbolvw|tkqlhce|jdoqocy|kqzyfj|qksrv|emjcd)\.(?:net|com)[^\s"'<>]*/i
    );
    if (match) url = match[0];
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
        // Asegurar que la URL interna esté bien formateada y sin dobles barras rotas
        const cleanTarget = decodeURIComponent(targetParam);
        urlObj.searchParams.set('url', cleanTarget);
        url = urlObj.toString();
      }
    }
  } catch (e) {
    // En caso de fallo de parseo estándar, conservar URL limpia
  }

  // Si es ruta relativa limpia interna, retornar tal cual
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }

  return url;
}

export const sanitizeCJLink = sanitizeAffiliateUrl;

export function isCJDomain(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return CJ_TRACKING_HOSTS.some((domain) => url.toLowerCase().includes(domain));
}
