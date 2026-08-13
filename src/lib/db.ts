import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Product, ProductFilters, ProductsResponse, ProductCategory, AffiliateNetwork } from '@/types/product';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'supernova.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('synchronous = NORMAL');
    dbInstance.pragma('cache_size = -64000'); // 64MB cache

    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: Database.Database) {
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

    -- Triggers to keep FTS in sync
    CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
      INSERT INTO products_fts(rowid, title, merchant, category, tags)
      VALUES (new.rowid, new.title, new.merchant, new.category, new.tags);
    END;

    CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
      INSERT INTO products_fts(products_fts, rowid, title, merchant, category, tags)
      VALUES('delete', old.rowid, old.title, old.merchant, old.category, old.tags);
    END;

    CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
      INSERT INTO products_fts(products_fts, rowid, title, merchant, category, tags)
      VALUES('delete', old.rowid, old.title, old.merchant, old.category, old.tags);
      INSERT INTO products_fts(rowid, title, merchant, category, tags)
      VALUES (new.rowid, new.title, new.merchant, new.category, new.tags);
    END;
  `);
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

export function queryProducts(
  filters?: ProductFilters,
  page = 1,
  pageSize = 24,
  sortBy: 'latest' | 'price_asc' | 'price_desc' = 'latest'
): ProductsResponse & { totalPages: number } {
  const db = getDb();

  const whereClauses: string[] = ['is_active = 1'];
  const params: Record<string, unknown> = {};

  if (filters?.category && filters.category !== 'all' as ProductCategory) {
    whereClauses.push('category = @category');
    params.category = filters.category;
  }

  if (filters?.network && filters.network !== 'all' as unknown as AffiliateNetwork) {
    whereClauses.push('network = @network');
    params.network = filters.network;
  }

  if (filters?.minPrice !== undefined) {
    whereClauses.push('COALESCE(sale_price, price) >= @minPrice');
    params.minPrice = filters.minPrice;
  }

  if (filters?.maxPrice !== undefined) {
    whereClauses.push('COALESCE(sale_price, price) <= @maxPrice');
    params.maxPrice = filters.maxPrice;
  }

  if (filters?.merchant) {
    whereClauses.push('LOWER(merchant) = LOWER(@merchant)');
    params.merchant = filters.merchant;
  }

  let useFts = false;
  if (filters?.search && filters.search.trim()) {
    const cleanSearch = filters.search.trim().replace(/['"*]/g, '');
    if (cleanSearch) {
      // FTS search or LIKE fallback
      whereClauses.push(`id IN (SELECT id FROM products_fts WHERE products_fts MATCH @searchQuery)`);
      params.searchQuery = `"${cleanSearch}"*`;
      useFts = true;
    }
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  let orderBySql = 'ORDER BY id DESC';
  if (sortBy === 'price_asc') {
    orderBySql = 'ORDER BY COALESCE(sale_price, price) ASC';
  } else if (sortBy === 'price_desc') {
    orderBySql = 'ORDER BY COALESCE(sale_price, price) DESC';
  }

  // Count total matching
  let total = 0;
  try {
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM products ${whereSql}`).get(params) as { count: number };
    total = countRow?.count || 0;
  } catch (err) {
    // If FTS fails on special syntax, fallback to LIKE search
    if (useFts && filters?.search) {
      const fallbackWhere = whereClauses
        .filter((w) => !w.includes('products_fts'))
        .concat(['(title LIKE @likeQuery OR description LIKE @likeQuery OR merchant LIKE @likeQuery)']);
      const fallbackWhereSql = fallbackWhere.length > 0 ? `WHERE ${fallbackWhere.join(' AND ')}` : '';
      params.likeQuery = `%${filters.search.trim()}%`;
      delete params.searchQuery;

      const countRow = db.prepare(`SELECT COUNT(*) as count FROM products ${fallbackWhereSql}`).get(params) as { count: number };
      total = countRow?.count || 0;

      const offset = (page - 1) * pageSize;
      const rows = db
        .prepare(`SELECT * FROM products ${fallbackWhereSql} ${orderBySql} LIMIT @limit OFFSET @offset`)
        .all({ ...params, limit: pageSize, offset }) as DbProductRow[];

      return {
        products: rows.map(rowToProduct),
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
        page,
        pageSize,
      };
    }
    throw err;
  }

  const totalPages = Math.ceil(total / pageSize) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const offset = (safePage - 1) * pageSize;

  const rows = db
    .prepare(`SELECT * FROM products ${whereSql} ${orderBySql} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: pageSize, offset }) as DbProductRow[];

  return {
    products: rows.map(rowToProduct),
    total,
    totalPages,
    page: safePage,
    pageSize,
  };
}

export function getProductByIdFromDb(id: string): Product | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(id) as DbProductRow | undefined;
  return row ? rowToProduct(row) : undefined;
}

export function getDistinctCategories(): string[] {
  const db = getDb();
  const rows = db.prepare('SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category ASC').all() as { category: string }[];
  return rows.map((r) => r.category).filter(Boolean);
}

export function getDistinctNetworks(): string[] {
  const db = getDb();
  const rows = db.prepare('SELECT DISTINCT network FROM products WHERE is_active = 1 ORDER BY network ASC').all() as { network: string }[];
  return rows.map((r) => r.network).filter(Boolean);
}

export function getProductStats(): { total: number; categories: number; networks: number } {
  const db = getDb();
  const totalRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  const catRow = db.prepare('SELECT COUNT(DISTINCT category) as count FROM products').get() as { count: number };
  const netRow = db.prepare('SELECT COUNT(DISTINCT network) as count FROM products').get() as { count: number };

  return {
    total: totalRow?.count || 0,
    categories: catRow?.count || 0,
    networks: netRow?.count || 0,
  };
}
