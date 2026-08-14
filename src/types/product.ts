/**
 * Supernova Store — Affiliate Product Data Model
 *
 * Defines the core data structures for products sourced
 * from affiliate networks (Impact, CJ Affiliate).
 */

export type AffiliateNetwork = 'impact' | 'cj' | 'direct';

export type ProductCategory =
  | 'electronics'
  | 'fashion'
  | 'home'
  | 'beauty'
  | 'sports'
  | 'books'
  | 'accessories'
  | 'tech'
  | 'travel'
  | 'media'
  | 'lifestyle'
  | 'all';

export interface CategoryOption {
  id: string;
  label: string;
}

/**
 * Configuración de categorías frontend
 */
export const CATEGORIES: CategoryOption[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'tech', label: 'Tech & Software' },
  { id: 'travel', label: 'Travel & Stays' },
  { id: 'media', label: 'Magazines & Press' },
  { id: 'lifestyle', label: 'Lifestyle' }
];

export interface NetPresetOption {
  id: string;
  label: string;
}

/**
 * Configuración de presets para selector 'net'
 */
export const NET_PRESETS: NetPresetOption[] = [
  { id: 'all', label: 'All' },
  { id: 'cj', label: 'CJ Network' },
  { id: 'zinio', label: 'Zinio' },
  { id: 'ashampoo', label: 'Ashampoo' },
  { id: 'wondershare', label: 'Wondershare' }
];

export interface FilterParams {
  category?: string;
  network?: string;
  merchant?: string;
}

export const parseCatalogQuery = (netQuery?: string, categoryQuery?: string): FilterParams => {
  const filters: FilterParams = {};

  // Resolución del selector NET / Merchant
  switch (netQuery?.toLowerCase()) {
    case 'zinio':
      filters.merchant = 'Zinio';
      filters.category = 'media';
      break;
    case 'ashampoo':
      filters.merchant = 'Ashampoo';
      filters.category = 'tech';
      break;
    case 'wondershare':
      filters.merchant = 'Wondershare';
      filters.category = 'tech';
      break;
    case 'cj':
      filters.network = 'CJ';
      break;
    case 'all':
    default:
      break;
  }

  // Si se selecciona una categoría explícita, tiene prioridad sobre la vertical inferida
  if (categoryQuery && categoryQuery !== 'all') {
    filters.category = categoryQuery.toLowerCase();
  }

  return filters;
};

export interface AffiliateLink {
  /** The affiliate network this link belongs to */
  network: AffiliateNetwork;
  /** Raw affiliate URL (never exposed to the user) */
  url: string;
  /** Advertiser/merchant ID within the network */
  advertiserId: string;
  /** Campaign or program ID */
  campaignId?: string;
}

export interface Product {
  /** Unique internal product identifier */
  id: string;
  /** Display title */
  title: string;
  /** Short description (1-2 sentences) */
  description: string;
  /** Full product image URL (external CDN) */
  imageUrl: string;
  /** Optional secondary images */
  imageGallery?: string[];
  /** Original retail price in USD */
  price: number;
  /** Sale/discounted price, if applicable */
  salePrice?: number;
  /** Currency code (ISO 4217) */
  currency: string;
  /** Merchant/brand name */
  merchant: string;
  /** Product category for filtering */
  category: ProductCategory;
  /** Tags for search and filtering */
  tags: string[];
  /** Affiliate link configuration */
  affiliate: AffiliateLink;
  /** Whether the product is currently active/available */
  isActive: boolean;
  /** Date product was added to the store (ISO 8601) */
  createdAt: string;
}

export interface ProductFilters {
  category?: ProductCategory;
  network?: AffiliateNetwork;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  merchant?: string;
  tags?: string[];
}

/** API response wrapper */
export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}
