import { Product, ProductFilters, ProductsResponse } from '@/types/product';
import {
  queryProducts,
  getProductByIdFromDb,
  getDistinctCategories,
  getDistinctNetworks,
  getProductStats,
} from '@/lib/db';
import { products as fallbackProducts } from '@/data/products';

/**
 * Get products from SQLite DB with optional filtering and pagination.
 */
export function getProducts(
  filters?: ProductFilters,
  page = 1,
  pageSize = 24,
  sortBy: 'latest' | 'price_asc' | 'price_desc' = 'latest'
): ProductsResponse & { totalPages: number } {
  try {
    const stats = getProductStats();
    if (stats.total > 0) {
      return queryProducts(filters, page, pageSize, sortBy);
    }
  } catch (err) {
    console.warn('[PRODUCTS_SERVICE] SQLite query failed, falling back to mock array:', err);
  }

  // Fallback to in-memory array if database is empty/unseeded
  let filtered = fallbackProducts.filter((p) => p.isActive);

  if (filters?.category && filters.category !== ('all' as unknown)) {
    filtered = filtered.filter((p) => p.category === filters.category);
  }
  if (filters?.network && filters.network !== ('all' as unknown)) {
    filtered = filtered.filter((p) => p.affiliate.network === filters.network);
  }
  if (filters?.minPrice !== undefined) {
    filtered = filtered.filter((p) => (p.salePrice ?? p.price) >= filters.minPrice!);
  }
  if (filters?.maxPrice !== undefined) {
    filtered = filtered.filter((p) => (p.salePrice ?? p.price) <= filters.maxPrice!);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.merchant.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return { products: paginated, total, totalPages, page, pageSize };
}

/**
 * Get a single product by ID from SQLite or fallback.
 */
export function getProductById(id: string): Product | undefined {
  try {
    const dbProduct = getProductByIdFromDb(id);
    if (dbProduct) return dbProduct;
  } catch {
    // ignore and fallback
  }
  return fallbackProducts.find((p) => p.id === id && p.isActive);
}

export const PRODUCTION_BASE_URL = 'https://supernovastore.humancentric.online';

/**
 * Get base URL with fallback to official production domain.
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || PRODUCTION_BASE_URL;
}

/**
 * Build the masked affiliate redirect URL.
 */
export function getAffiliateRedirectUrl(productId: string, absolute = false): string {
  if (absolute) {
    return `${getBaseUrl()}/go/${productId}`;
  }
  return `/go/${productId}`;
}

export { getDistinctCategories, getDistinctNetworks, getProductStats };
