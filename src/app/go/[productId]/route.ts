import { NextRequest, NextResponse } from 'next/server';
import { getProductById, getPublicBaseUrl } from '@/lib/products';
import { sanitizeCJLink } from '@/lib/cj-link-repair';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const publicBaseUrl = getPublicBaseUrl(request);

  try {
    const { productId } = await params;
    const product = getProductById(productId);

    if (!product) {
      // Graceful fallback to official store home page
      const homeUrl = new URL('/', publicBaseUrl);
      return NextResponse.redirect(homeUrl.toString(), 302);
    }

    const rawUrl = sanitizeCJLink(product.affiliate.url || '');

    // Check if URL is an external affiliate destination (real CJ link or merchant checkout)
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
      !targetUrl.includes('kqzyfj.com') &&
      !targetUrl.includes('qksrv.net') &&
      !targetUrl.includes('emjcd.com') &&
      !targetUrl.includes('supernovastore.humancentric.online')
    ) {
      targetUrl = `https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/${targetUrl}`;
    }

    targetUrl = sanitizeCJLink(targetUrl);

    if (isExternalAffiliate) {
      try {
        const affiliateUrl = new URL(targetUrl);

        // Append UTM parameters for tracking (always CJ)
        affiliateUrl.searchParams.set('utm_source', 'supernova');
        affiliateUrl.searchParams.set('utm_medium', 'affiliate');
        affiliateUrl.searchParams.set('utm_campaign', 'cj');

        // Forward any incoming query parameters
        const incomingParams = request.nextUrl.searchParams;
        incomingParams.forEach((value, key) => {
          if (!key.startsWith('utm_')) {
            affiliateUrl.searchParams.set(key, value);
          }
        });

        console.log(
          `[AFFILIATE CLICK] Product: ${product.id} | Merchant: ${product.merchant} -> ${affiliateUrl.hostname}`
        );

        return NextResponse.redirect(affiliateUrl.toString(), 302);
      } catch (urlErr) {
        console.warn('[AFFILIATE_CLICK_URL_PARSE_WARN]', urlErr);
      }
    }

    // If internal/missing, redirect gracefully to official storefront with product search
    const fallbackStore = new URL('/', publicBaseUrl);
    fallbackStore.searchParams.set('search', product.title);
    return NextResponse.redirect(fallbackStore.toString(), 302);
  } catch (fatalErr) {
    console.error('[GO_ROUTE_FATAL]', fatalErr);
    // Bulletproof fallback to homepage to prevent 502 Bad Gateway
    return NextResponse.redirect(publicBaseUrl, 302);
  }
}
