import { NextRequest, NextResponse } from 'next/server';
import { getProductById, getPublicBaseUrl } from '@/lib/products';
import { sanitizeAffiliateUrl } from '@/lib/cj-link-repair';
import { getDb, rowToProduct, DbProductRow } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const publicBaseUrl = getPublicBaseUrl(request);

  try {
    const { productId } = await params;
    let product = getProductById(productId);

    if (!product) {
      try {
        const db = getDb();
        const normalizedId = productId.startsWith('prod-') ? productId : `prod-${productId}`;
        const row = db
          .prepare(`SELECT * FROM products WHERE (id = ? OR id = ?) AND is_active = 1 LIMIT 1`)
          .get(productId, normalizedId) as DbProductRow | undefined;
        if (row) product = rowToProduct(row);
      } catch {
        // Ignorar
      }
    }

    if (!product) {
      const fallbackUrl = new URL('/', publicBaseUrl);
      fallbackUrl.searchParams.set('search', productId.replace(/^prod-0*/, ''));
      return NextResponse.redirect(fallbackUrl.toString(), 307);
    }

    const rawUrl =
      product.affiliate?.url ||
      (product as unknown as { product_url?: string }).product_url;

    const targetUrl = sanitizeAffiliateUrl(rawUrl, product.merchant, product.id);

    return NextResponse.redirect(targetUrl, 307);
  } catch (fatalErr) {
    console.error('[GO_ROUTE_FATAL]', fatalErr);
    return NextResponse.redirect(publicBaseUrl, 307);
  }
}
