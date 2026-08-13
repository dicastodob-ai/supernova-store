import { NextRequest, NextResponse } from 'next/server';
import {
  queryProducts,
  getDistinctCategories,
  getDistinctNetworks,
  getProductStats,
} from '@/lib/db';
import { ProductCategory, AffiliateNetwork } from '@/types/product';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '24', 10)));
  const category = searchParams.get('category') || undefined;
  const network = searchParams.get('network') || undefined;
  const search = searchParams.get('search') || undefined;
  const minPriceStr = searchParams.get('minPrice');
  const maxPriceStr = searchParams.get('maxPrice');
  const merchant = searchParams.get('merchant') || undefined;
  const sortBy = (searchParams.get('sortBy') as 'latest' | 'price_asc' | 'price_desc') || 'latest';

  const minPrice = minPriceStr ? parseFloat(minPriceStr) : undefined;
  const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : undefined;

  try {
    const result = queryProducts(
      {
        category: category && category !== 'all' ? (category as ProductCategory) : undefined,
        network: network && network !== 'all' ? (network as AffiliateNetwork) : undefined,
        minPrice: !isNaN(minPrice!) ? minPrice : undefined,
        maxPrice: !isNaN(maxPrice!) ? maxPrice : undefined,
        search,
        merchant,
      },
      page,
      pageSize,
      sortBy
    );

    const categories = getDistinctCategories();
    const networks = getDistinctNetworks().filter((n) => n.toLowerCase() !== 'impact');
    const stats = getProductStats();

    return NextResponse.json({
      ...result,
      categories,
      networks,
      stats,
    });
  } catch (error) {
    console.error('[API_PRODUCTS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch products from catalog' },
      { status: 500 }
    );
  }
}
