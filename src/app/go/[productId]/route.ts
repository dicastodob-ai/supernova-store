import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const product = getProductById(productId);

  if (!product) {
    // Graceful fallback to home page
    const homeUrl = new URL('/', request.nextUrl.origin);
    return NextResponse.redirect(homeUrl.toString(), 302);
  }

  const rawUrl = product.affiliate.url || '';

  // Check if URL is an external affiliate destination (real CJ link or merchant checkout)
  const isExternalAffiliate =
    rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? !rawUrl.includes('supernovastore.humancentric.online/affiliate') &&
        !rawUrl.includes('example.com') &&
        !rawUrl.includes('google.com')
      : false;

  if (isExternalAffiliate) {
    try {
      const affiliateUrl = new URL(rawUrl);

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
    } catch {
      // Fallback if URL parsing fails
    }
  }

  // If internal/missing, redirect gracefully to storefront with product search (never Google)
  const fallbackStore = new URL('/', request.nextUrl.origin);
  fallbackStore.searchParams.set('search', product.title);
  return NextResponse.redirect(fallbackStore.toString(), 302);
}
