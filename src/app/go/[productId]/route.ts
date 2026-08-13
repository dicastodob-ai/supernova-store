import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const product = getProductById(productId);

  if (!product) {
    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    );
  }

  // Build the affiliate URL with tracking params
  const affiliateUrl = new URL(product.affiliate.url);

  // Append UTM parameters for tracking
  affiliateUrl.searchParams.set('utm_source', 'supernova');
  affiliateUrl.searchParams.set('utm_medium', 'affiliate');
  affiliateUrl.searchParams.set('utm_campaign', product.affiliate.network);

  // Preserve any incoming query params (e.g., sub-tracking IDs)
  const incomingParams = request.nextUrl.searchParams;
  incomingParams.forEach((value, key) => {
    if (!key.startsWith('utm_')) {
      affiliateUrl.searchParams.set(key, value);
    }
  });

  // Log the click event (placeholder for analytics service)
  console.log(`[AFFILIATE CLICK] Product: ${product.id} | Network: ${product.affiliate.network} | Merchant: ${product.merchant} | Time: ${new Date().toISOString()}`);

  // 302 redirect to affiliate URL
  return NextResponse.redirect(affiliateUrl.toString(), 302);
}
