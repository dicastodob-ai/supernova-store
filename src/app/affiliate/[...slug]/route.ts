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

  console.log(`[AFFILIATE_ROUTE] Incoming affiliate request for slug: /${slugPath}`);

  // 1. Try finding product by last segment ID (e.g., 'prod-142999', 'prod-000001', 'cj-12345')
  let product = lastSegment ? getProductById(lastSegment) : undefined;

  // 2. If not found, search in DB by slug pattern in affiliate_url
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

  // 3. If product not found, fallback redirect to homepage search or store
  if (!product) {
    console.warn(`[AFFILIATE_ROUTE] Product not found for slug: /${slugPath}. Redirecting to store.`);
    const fallbackUrl = new URL('/', request.nextUrl.origin);
    if (lastSegment) {
      fallbackUrl.searchParams.set('search', lastSegment.replace(/^prod-0*/, ''));
    }
    return NextResponse.redirect(fallbackUrl.toString(), 302);
  }

  // 4. Resolve destination URL
  let targetUrlString = product.affiliate.url;

  // Check if URL is an internal/simulated placeholder
  const isInternalUrl =
    targetUrlString.includes('supernovastore.humancentric.online/affiliate') ||
    targetUrlString.includes('example.com') ||
    targetUrlString.startsWith('/affiliate');

  if (isInternalUrl) {
    // If it's a simulated catalog product from the feed, redirect to a merchant search
    targetUrlString = `https://www.google.com/search?q=${encodeURIComponent(
      `${product.title} ${product.merchant}`.trim()
    )}`;
  }

  try {
    const destinationUrl = new URL(targetUrlString);

    // Append standard affiliate tracking UTM parameters
    destinationUrl.searchParams.set('utm_source', 'supernova');
    destinationUrl.searchParams.set('utm_medium', 'affiliate');
    destinationUrl.searchParams.set('utm_campaign', product.affiliate.network || 'cj');

    // Forward any incoming query parameters
    const incomingParams = request.nextUrl.searchParams;
    incomingParams.forEach((value, key) => {
      if (!key.startsWith('utm_')) {
        destinationUrl.searchParams.set(key, value);
      }
    });

    console.log(
      `[AFFILIATE_ROUTE] Redirecting product ${product.id} (${product.merchant}) -> ${destinationUrl.hostname}`
    );

    return NextResponse.redirect(destinationUrl.toString(), 302);
  } catch {
    // Fallback if URL parsing fails
    return NextResponse.redirect(targetUrlString, 302);
  }
}
