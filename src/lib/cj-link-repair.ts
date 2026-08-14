/**
 * Supernova Store — CJ Link Repair & Attribution Sanitizer
 *
 * Cleans, sanitizes, and normalizes Commission Junction tracking URLs:
 * - Strips accidental host prefix concatenations
 * - Enforces HTTPS protocol
 * - Cleans embedded HTML tracking pixel tags (1x1 GIF / <img src...>)
 * - Validates official CJ tracking domains
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
 * Sanitizes and repairs any raw CJ link string
 */
export function sanitizeCJLink(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '/';

  let href = rawUrl.trim();

  // 1. Strip accidental domain concatenation (e.g., https://supernovastore.../https://www.anrdoezrs.net/...)
  const cjDomainMatch = href.match(/https?:\/\/(www\.)?(anrdoezrs|dpbolvw|tkqlhce|jdoqocy|kqzyfj|qksrv|emjcd)\.(net|com)[^\s"'<>]*/i);
  if (cjDomainMatch) {
    href = cjDomainMatch[0];
  }

  // 2. Clean residual HTML / 1x1 tracking pixel tags
  if (href.includes('<img') || href.includes('img%20src') || href.includes('.gif') || href.includes('width=') || href.includes('height=')) {
    const cleanMatch = href.match(/^(https?:\/\/[^\s"'<>]+)/i);
    if (cleanMatch) {
      href = cleanMatch[1];
    }
  }

  // 3. Ensure HTTPS protocol
  if (href.startsWith('//')) {
    href = 'https:' + href;
  } else if (!href.startsWith('http://') && !href.startsWith('https://') && CJ_DOMAINS.some(d => href.includes(d))) {
    href = 'https://' + href;
  }

  // 4. If it's a relative internal route, return as is
  if (href.startsWith('/') && !href.startsWith('//')) {
    return href;
  }

  return href;
}

/**
 * Checks if a given URL belongs to an official CJ tracking domain
 */
export function isCJDomain(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return CJ_DOMAINS.some((domain) => url.toLowerCase().includes(domain));
}
