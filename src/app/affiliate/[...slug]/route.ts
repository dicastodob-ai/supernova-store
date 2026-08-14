import { NextRequest, NextResponse } from 'next/server';
import { getProductById, getPublicBaseUrl } from '@/lib/products';
import { getDb, rowToProduct, DbProductRow } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const publicBaseUrl = getPublicBaseUrl(request);

  try {
    const { slug } = await params;
    const slugPath = slug ? slug.join('/') : '';
    const lastSegment = slug && slug.length > 0 ? slug[slug.length - 1] : '';

    // 1. Find product by last segment ID
    let product = lastSegment ? getProductById(lastSegment) : undefined;

    // 2. If not found by ID, search by slug in affiliate_url via shared singleton
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
        console.error('[AFFILIATE_ROUTE] DB lookup error:', err);
      }
    }

    // 3. Fallback: if product is missing, redirect to official store homepage
    if (!product) {
      console.warn(`[AFFILIATE_ROUTE] Product not found for slug: /${slugPath}. Redirecting to store.`);
      const fallbackUrl = new URL('/', publicBaseUrl);
      if (lastSegment) {
        fallbackUrl.searchParams.set('search', lastSegment.replace(/^prod-0*/, ''));
      }
      return NextResponse.redirect(fallbackUrl.toString(), 302);
    }

    const rawUrl = product.affiliate.url || '';

    // Check if URL is an external CJ affiliate link or valid external merchant destination
    const isExternalAffiliate =
      rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
        ? !rawUrl.includes('supernovastore.humancentric.online/affiliate') &&
          !rawUrl.includes('example.com') &&
          !rawUrl.includes('google.com') &&
          !rawUrl.includes('0.0.0.0') &&
          !rawUrl.includes('localhost')
        : false;

    let targetUrl = rawUrl;
    if (
      targetUrl.startsWith('http') &&
      !targetUrl.includes('anrdoezrs.net') &&
      !targetUrl.includes('tkqlhce.com') &&
      !targetUrl.includes('dpbolvw.net') &&
      !targetUrl.includes('jdoqocy.com') &&
      !targetUrl.includes('supernovastore.humancentric.online')
    ) {
      targetUrl = `https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/${targetUrl}`;
    }

    if (isExternalAffiliate) {
      try {
        const destinationUrl = new URL(targetUrl);

        // Standard CJ affiliate tracking UTM parameters
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
          `[AFFILIATE_ROUTE] Redirecting to CJ tracking link: ${product.id} -> ${destinationUrl.hostname}`
        );
        return NextResponse.redirect(destinationUrl.toString(), 302);
      } catch (e) {
        console.error('[AFFILIATE_ROUTE] Error parsing external URL:', e);
      }
    }

    // For products without external links, redirect to the official storefront with search query
    const storeUrl = new URL('/', publicBaseUrl);
    storeUrl.searchParams.set('search', product.title);
    return NextResponse.redirect(storeUrl.toString(), 302);
  } catch (fatalError) {
    console.error('[AFFILIATE_ROUTE_FATAL]', fatalError);
    // Bulletproof fallback to homepage to prevent process crash or 502
    return NextResponse.redirect(publicBaseUrl, 302);
  }
}
