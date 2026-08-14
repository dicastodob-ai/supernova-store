/**
 * Supernova Store — CJ Link Repair & Attribution Sanitizer
 *
 * Gateways y dominios oficiales de salida de CJ Affiliate:
 * anrdoezrs.net, dpbolvw.net, tkqlhce.com, jdoqocy.com, kqzyfj.com, qksrv.net, emjcd.com, cj.com
 */

export const CJ_DOMAINS = [
  'anrdoezrs.net',
  'dpbolvw.net',
  'tkqlhce.com',
  'jdoqocy.com',
  'kqzyfj.com',
  'qksrv.net',
  'emjcd.com',
  'cj.com',
];

/**
 * Limpieza y reparación universal de URLs para cualquier anunciante
 */
export function sanitizeCJLink(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '/';

  let href = rawUrl.trim();

  // 1. Deshacer concatenación indebida con el dominio propio (Error 404)
  if (
    href.includes('supernovastore.humancentric.online') &&
    CJ_DOMAINS.some((d) => href.includes(d))
  ) {
    const cjMatch = href.match(
      /https?:\/\/[^\s"'<>]*(?:anrdoezrs|dpbolvw|tkqlhce|jdoqocy|kqzyfj|qksrv|emjcd)\.(?:net|com)[^\s"'<>]*/i
    );
    if (cjMatch) href = cjMatch[0];
  }

  // 2. Si pertenece a la red de afiliados de CJ
  if (CJ_DOMAINS.some((d) => href.includes(d))) {
    if (href.startsWith('//')) href = 'https:' + href;
    else if (!href.startsWith('http://') && !href.startsWith('https://')) href = 'https://' + href;

    // Limpiar píxeles de impresión 1x1 incrustados en la cadena
    if (href.includes('<img') || href.includes('.gif') || href.includes('img%20src')) {
      const cleanUrl = href.match(/^(https?:\/\/[^\s"'<>]+)/i);
      if (cleanUrl) href = cleanUrl[1];
    }
  }

  // Si es ruta relativa interna limpia, mantener
  if (href.startsWith('/') && !href.startsWith('//')) {
    return href;
  }

  return href;
}

export function isCJDomain(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return CJ_DOMAINS.some((domain) => url.toLowerCase().includes(domain));
}
