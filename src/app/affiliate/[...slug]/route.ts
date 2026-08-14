import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/products';
import { getDb, rowToProduct, DbProductRow } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const slugPath = slug ? slug.join('/') : '';
  const lastSegment = slug && slug.length > 0 ? slug[slug.length - 1] : '';

  // 1. Find product by last segment ID
  let product = lastSegment ? getProductById(lastSegment) : undefined;

  // 2. If not found by ID, search by slug in affiliate_url
  if (!product && slugPath) {
    try {
      const db = getDb();
      const row = db
        .prepare(
          `SELECT * FROM products 
           WHERE (affiliate_url LIKE ? OR id LIKE ? OR id = ?) 
             AND is_active = 1 
           LIMIT 1`
        )
        .get(`%${slugPath}%`, `%${lastSegment}%`, lastSegment) as DbProductRow | undefined;

      if (row) {
        product = rowToProduct(row);
      }
    } catch (err) {
      console.error('[AFFILIATE_ROUTE] DB query error:', err);
    }
  }

  // 3. Fallback: if product is missing, redirect to store homepage
  if (!product) {
    console.warn(`[AFFILIATE_ROUTE] Product not found for slug: /${slugPath}. Redirecting to store.`);
    const fallbackUrl = new URL('/', request.nextUrl.origin);
    if (lastSegment) {
      fallbackUrl.searchParams.set('search', lastSegment.replace(/^prod-0*/, ''));
    }
    return NextResponse.redirect(fallbackUrl.toString(), 302);
  }

  const rawUrl = product.affiliate.url || '';

  // Check if URL is an external CJ affiliate link or valid external destination
  const isExternalAffiliate =
    rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? !rawUrl.includes('supernovastore.humancentric.online/affiliate') &&
        !rawUrl.includes('example.com') &&
        !rawUrl.includes('google.com')
      : false;

  if (isExternalAffiliate) {
    try {
      const destinationUrl = new URL(rawUrl);

      // Standard CJ affiliate tracking UTM parameters (always CJ, never Impact)
      destinationUrl.searchParams.set('utm_source', 'supernova');
      destinationUrl.searchParams.set('utm_medium', 'affiliate');
      destinationUrl.searchParams.set('utm_campaign', 'cj');

      // Forward any incoming query parameters
      const incomingParams = request.nextUrl.searchParams;
      incomingParams.forEach((value, key) => {
        if (!key.startsWith('utm_')) {
          destinationUrl.searchParams.set(key, value);
        }
      });

      console.log(
        `[AFFILIATE_ROUTE] Redirecting to CJ merchant: ${product.id} -> ${destinationUrl.hostname}`
      );
      return NextResponse.redirect(destinationUrl.toString(), 302);
    } catch (e) {
      console.error('[AFFILIATE_ROUTE] Error parsing external URL:', e);
    }
  }

  // For products without external links, keep user inside Supernova Store (no Google search)
  const storeUrl = new URL('/', request.nextUrl.origin);
  storeUrl.searchParams.set('search', product.title);
  return NextResponse.redirect(storeUrl.toString(), 302);
}
