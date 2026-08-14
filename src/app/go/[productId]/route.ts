import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const product = getProductById(productId);

  if (!product) {
    // Graceful fallback to home page instead of hard error
    const homeUrl = new URL('/', request.nextUrl.origin);
    return NextResponse.redirect(homeUrl.toString(), 302);
  }

  let targetUrlString = product.affiliate.url;

  // If internal simulated URL, redirect to merchant Google search
  if (
    targetUrlString.includes('supernovastore.humancentric.online/affiliate') ||
    targetUrlString.includes('example.com') ||
    targetUrlString.startsWith('/affiliate')
  ) {
    targetUrlString = `https://www.google.com/search?q=${encodeURIComponent(
      `${product.title} ${product.merchant}`.trim()
    )}`;
  }

  try {
    const affiliateUrl = new URL(targetUrlString);

    // Append UTM parameters for tracking
    affiliateUrl.searchParams.set('utm_source', 'supernova');
    affiliateUrl.searchParams.set('utm_medium', 'affiliate');
    affiliateUrl.searchParams.set('utm_campaign', product.affiliate.network || 'cj');

    // Forward any incoming query parameters
    const incomingParams = request.nextUrl.searchParams;
    incomingParams.forEach((value, key) => {
      if (!key.startsWith('utm_')) {
        affiliateUrl.searchParams.set(key, value);
      }
    });

    console.log(
      `[AFFILIATE CLICK] Product: ${product.id} | Network: ${product.affiliate.network} | Merchant: ${product.merchant} -> ${affiliateUrl.hostname}`
    );

    return NextResponse.redirect(affiliateUrl.toString(), 302);
  } catch {
    return NextResponse.redirect(targetUrlString, 302);
  }
}
