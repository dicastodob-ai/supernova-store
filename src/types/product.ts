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
  | 'accessories';

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
