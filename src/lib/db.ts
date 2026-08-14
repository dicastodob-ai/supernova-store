import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Product, ProductFilters, ProductsResponse, ProductCategory, AffiliateNetwork } from '@/types/product';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'supernova.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __supernova_db: Database.Database | undefined;
}

// In-memory metadata caches to avoid repeated full-table scans
interface MetadataCache<T> {
  data: T | null;
  timestamp: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const categoriesCache: MetadataCache<string[]> = { data: null, timestamp: 0 };
const networksCache: MetadataCache<string[]> = { data: null, timestamp: 0 };
const statsCache: MetadataCache<{ total: number; categories: number; networks: number }> = { data: null, timestamp: 0 };

/**
 * Get or initialize the global shared SQLite connection singleton.
 * Uses readonly mode when possible and limits memory footprint for serverless/container environments.
 */
export function getDb(): Database.Database {
  if (!globalThis.__supernova_db) {
    const dbExists = fs.existsSync(DB_PATH);

    // Open shared instance (readonly if database already seeded, saving write locks and RAM)
    const db = new Database(DB_PATH, {
      readonly: dbExists,
      fileMustExist: false,
      timeout: 5000,
    });

    try {
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('cache_size = -4000'); // 4MB cache limit to prevent OOM
      db.pragma('temp_store = MEMORY');
      db.pragma('mmap_size = 0'); // Disable mmap to avoid virtual memory expansion
    } catch {
      // Ignored for readonly mode
    }

    if (!dbExists) {
      initSchema(db);
    }

    globalThis.__supernova_db = db;
  }
  return globalThis.__supernova_db;
}

function initSchema(db: Database.Database) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        sale_price REAL,
        currency TEXT DEFAULT 'USD',
        merchant TEXT,
        category TEXT NOT NULL,
        affiliate_url TEXT NOT NULL,
        image_url TEXT NOT NULL,
        network TEXT NOT NULL,
        tags TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_network ON products(network);
      CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
      CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
      CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant);

      CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
        title,
        merchant,
        category,
        tags,
        content='products',
        content_rowid='rowid'
      );
    `);
  } catch (err) {
    console.warn('[DB_INIT_WARN]', err);
  }
}

export interface DbProductRow {
  id: string;
  title: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  currency: string;
  merchant: string | null;
  category: string;
  affiliate_url: string;
  image_url: string;
  network: string;
  tags: string | null;
  is_active: number;
  created_at: string;
}

export function rowToProduct(row: DbProductRow): Product {
  let parsedTags: string[] = [];
  if (row.tags) {
    try {
      parsedTags = JSON.parse(row.tags);
    } catch {
      parsedTags = row.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    imageUrl: row.image_url,
    price: row.price,
    salePrice: row.sale_price !== null && row.sale_price !== undefined ? row.sale_price : undefined,
    currency: row.currency || 'USD',
    merchant: row.merchant || 'Supernova',
    category: row.category as ProductCategory,
    tags: parsedTags,
    affiliate: {
      network: row.network as AffiliateNetwork,
      url: row.affiliate_url,
      advertiserId: row.merchant || '',
    },
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

/**
 * Strict paginated query on products table with lazy loading and query optimizations.
 */
export function queryProducts(
  filters?: ProductFilters,
  page = 1,
  pageSize = 24,
  sortBy: 'latest' | 'price_asc' | 'price_desc' = 'latest'
): ProductsResponse & { totalPages: number } {
  // Strict page size boundary: minimum 1, maximum 48 products per batch
  const strictPageSize = Math.max(1, Math.min(48, pageSize));

  try {
    const db = getDb();

    const whereClauses: string[] = ['is_active = 1'];
    const params: Record<string, unknown> = {};

    let hasFilters = false;

    if (filters?.category && filters.category !== ('all' as ProductCategory)) {
      const cat = String(filters.category).toLowerCase();
      if (cat === 'tech') {
        whereClauses.push("(category = 'electronics' OR tags LIKE '%software%' OR tags LIKE '%tech%')");
        hasFilters = true;
      } else if (cat === 'travel') {
        whereClauses.push("(category = 'home' AND (LOWER(merchant) = 'booking.com' OR tags LIKE '%travel%' OR tags LIKE '%stay%'))");
        hasFilters = true;
      } else if (cat === 'media') {
        whereClauses.push("(category = 'books' OR LOWER(merchant) = 'zinio' OR tags LIKE '%magazines%' OR tags LIKE '%press%')");
        hasFilters = true;
      } else if (cat === 'lifestyle') {
        whereClauses.push("(category IN ('fashion', 'accessories', 'beauty', 'sports', 'home') AND LOWER(merchant) != 'booking.com')");
        hasFilters = true;
      } else {
        whereClauses.push('category = @category');
        params.category = filters.category;
        hasFilters = true;
      }
    }

    if (filters?.network && filters.network !== ('all' as unknown as AffiliateNetwork)) {
      const net = String(filters.network).toLowerCase();
      if (net === 'aliexpress') {
        whereClauses.push("(LOWER(merchant) LIKE '%aliexpress%' OR tags LIKE '%aliexpress%')");
        hasFilters = true;
      } else if (net === 'booking') {
        whereClauses.push("(LOWER(merchant) LIKE '%booking%' OR tags LIKE '%booking%')");
        hasFilters = true;
      } else if (net === 'zinio') {
        whereClauses.push("(LOWER(merchant) LIKE '%zinio%' OR tags LIKE '%zinio%')");
        hasFilters = true;
      } else if (net === 'cj') {
        whereClauses.push("network = 'cj'");
        hasFilters = true;
      } else {
        whereClauses.push('network = @network');
        params.network = filters.network;
        hasFilters = true;
      }
    }

    if (filters?.minPrice !== undefined) {
      whereClauses.push('COALESCE(sale_price, price) >= @minPrice');
      params.minPrice = filters.minPrice;
      hasFilters = true;
    }

    if (filters?.maxPrice !== undefined) {
      whereClauses.push('COALESCE(sale_price, price) <= @maxPrice');
      params.maxPrice = filters.maxPrice;
      hasFilters = true;
    }

    if (filters?.merchant) {
      whereClauses.push('LOWER(merchant) = LOWER(@merchant)');
      params.merchant = filters.merchant;
      hasFilters = true;
    }

    let useFts = false;
    if (filters?.search && filters.search.trim()) {
      const rawSearch = filters.search.trim();
      const tokens = rawSearch
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (tokens.length > 0) {
        const ftsQuery = tokens.map((t) => `"${t}"*`).join(' ');
        whereClauses.push('(rowid IN (SELECT rowid FROM products_fts WHERE products_fts MATCH @searchQuery) OR id LIKE @searchLikeId)');
        params.searchQuery = ftsQuery;
        params.searchLikeId = `%${rawSearch.replace(/^prod-0*/, '')}%`;
        useFts = true;
        hasFilters = true;
      }
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    let orderBySql = 'ORDER BY rowid DESC';
    if (sortBy === 'price_asc') {
      orderBySql = 'ORDER BY COALESCE(sale_price, price) ASC';
    } else if (sortBy === 'price_desc') {
      orderBySql = 'ORDER BY COALESCE(sale_price, price) DESC';
    }

    let total = 0;

    // Optimization: If no search/filters applied, use cached total count to avoid full table scan
    if (!hasFilters) {
      total = getProductStats().total;
    } else {
      try {
        const countRow = db.prepare(`SELECT COUNT(*) as count FROM products ${whereSql}`).get(params) as { count: number };
        total = countRow?.count || 0;
      } catch (err) {
        console.warn('[DB_SEARCH] FTS5 query error, switching to safe LIKE fallback:', err);
        if (useFts && filters?.search) {
          const rawSearch = filters.search.trim();
          const fallbackWhere = whereClauses
            .filter((w) => !w.includes('products_fts'))
            .concat(['(title LIKE @likeQuery OR description LIKE @likeQuery OR merchant LIKE @likeQuery OR id LIKE @likeQuery)']);
          const fallbackWhereSql = `WHERE ${fallbackWhere.join(' AND ')}`;
          params.likeQuery = `%${rawSearch}%`;
          delete params.searchQuery;
          delete params.searchLikeId;

          const countRow = db.prepare(`SELECT COUNT(*) as count FROM products ${fallbackWhereSql}`).get(params) as { count: number };
          total = countRow?.count || 0;

          const totalPages = Math.ceil(total / strictPageSize) || 1;
          const safePage = Math.max(1, Math.min(page, totalPages));
          const offset = (safePage - 1) * strictPageSize;

          const rows = db
            .prepare(`SELECT * FROM products ${fallbackWhereSql} ${orderBySql} LIMIT @limit OFFSET @offset`)
            .all({ ...params, limit: strictPageSize, offset }) as DbProductRow[];

          return {
            products: rows.map(rowToProduct),
            total,
            totalPages,
            page: safePage,
            pageSize: strictPageSize,
          };
        }
        throw err;
      }
    }

    const totalPages = Math.ceil(total / strictPageSize) || 1;
    const safePage = Math.max(1, Math.min(page, totalPages));
    const offset = (safePage - 1) * strictPageSize;

    const rows = db
      .prepare(`SELECT * FROM products ${whereSql} ${orderBySql} LIMIT @limit OFFSET @offset`)
      .all({ ...params, limit: strictPageSize, offset }) as DbProductRow[];

    return {
      products: rows.map(rowToProduct),
      total,
      totalPages,
      page: safePage,
      pageSize: strictPageSize,
    };
  } catch (err) {
    console.error('[DB_QUERY_FATAL_ERROR]', err);
    return {
      products: [],
      total: 0,
      totalPages: 1,
      page: 1,
      pageSize: strictPageSize,
    };
  }
}

export function getProductByIdFromDb(id: string): Product | undefined {
  try {
    const db = getDb();

    // 1. Direct ID match
    let row = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(id) as DbProductRow | undefined;

    // 2. Try zero-padded ID (e.g. prod-142999 -> prod-000142999 or vice-versa)
    if (!row && id.startsWith('prod-')) {
      const rawNum = id.replace(/^prod-0*/, '');
      if (rawNum) {
        const paddedId = `prod-${rawNum.padStart(6, '0')}`;
        row = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(paddedId) as DbProductRow | undefined;
      }
    }

    // 3. Fallback: match by affiliate_url suffix
    if (!row) {
      row = db.prepare('SELECT * FROM products WHERE affiliate_url LIKE ? AND is_active = 1 LIMIT 1').get(`%${id}%`) as DbProductRow | undefined;
    }

    return row ? rowToProduct(row) : undefined;
  } catch (err) {
    console.error('[GET_PRODUCT_BY_ID_ERROR]', err);
    return undefined;
  }
}

/**
 * Returns distinct product categories with in-memory caching.
 */
export function getDistinctCategories(): string[] {
  const now = Date.now();
  if (categoriesCache.data && now - categoriesCache.timestamp < CACHE_TTL_MS) {
    return categoriesCache.data;
  }

  try {
    const db = getDb();
    const rows = db.prepare('SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category ASC').all() as { category: string }[];
    const result = rows.map((r) => r.category).filter(Boolean);
    categoriesCache.data = result;
    categoriesCache.timestamp = now;
    return result;
  } catch (err) {
    console.error('[GET_DISTINCT_CATEGORIES_ERROR]', err);
    return categoriesCache.data || [];
  }
}

/**
 * Returns distinct affiliate networks with in-memory caching.
 */
export function getDistinctNetworks(): string[] {
  const now = Date.now();
  if (networksCache.data && now - networksCache.timestamp < CACHE_TTL_MS) {
    return networksCache.data;
  }

  try {
    const db = getDb();
    const rows = db.prepare('SELECT DISTINCT network FROM products WHERE is_active = 1 ORDER BY network ASC').all() as { network: string }[];
    const result = rows.map((r) => r.network).filter(Boolean);
    networksCache.data = result;
    networksCache.timestamp = now;
    return result;
  } catch (err) {
    console.error('[GET_DISTINCT_NETWORKS_ERROR]', err);
    return networksCache.data || ['cj'];
  }
}

/**
 * Returns overall product stats with in-memory caching.
 */
export function getProductStats(): { total: number; categories: number; networks: number } {
  const now = Date.now();
  if (statsCache.data && now - statsCache.timestamp < CACHE_TTL_MS) {
    return statsCache.data;
  }

  try {
    const db = getDb();
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number };
    const catRow = db.prepare('SELECT COUNT(DISTINCT category) as count FROM products WHERE is_active = 1').get() as { count: number };
    const netRow = db.prepare('SELECT COUNT(DISTINCT network) as count FROM products WHERE is_active = 1').get() as { count: number };

    const result = {
      total: totalRow?.count || 0,
      categories: catRow?.count || 0,
      networks: netRow?.count || 0,
    };

    statsCache.data = result;
    statsCache.timestamp = now;
    return result;
  } catch (err) {
    console.error('[GET_PRODUCT_STATS_ERROR]', err);
    return statsCache.data || { total: 0, categories: 0, networks: 0 };
  }
}
