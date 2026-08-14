/**
 * Módulo de Ingesta y Mapeo de Catálogo (Antigravity Pipeline)
 * Asegura la extracción correcta del Tracking Link / Deep Link de Commission Junction (CJ)
 */

export interface RawCJProduct {
  id?: string;
  sku?: string;
  title?: string;
  name?: string;
  advertiser_name?: string;
  advertiserName?: string;
  merchant?: string;
  brand?: string;
  buy_url?: string;
  buyUrl?: string;
  click_url?: string;
  clickUrl?: string;
  tracking_link?: string;
  trackingLink?: string;
  affiliate_url?: string;
  affiliateUrl?: string;
  advertiser_url?: string;
  advertiserUrl?: string;
  link?: string;
  price?: string | number | { amount?: number; currency?: string };
  sale_price?: string | number | { amount?: number; currency?: string };
  salePrice?: string | number | { amount?: number; currency?: string };
  category?: string;
  description?: string;
  image_url?: string;
  imageLink?: string;
  imageUrl?: string;
}

export interface ProcessedProduct {
  id: string;
  title: string;
  merchant: string;
  affiliate: {
    url: string;
    directMerchantUrl?: string;
  };
  price: number;
  salePrice?: number;
  category: string;
  description?: string;
  imageUrl?: string;
}

const DEFAULT_CJ_CID = process.env.CJ_COMPANY_ID || '7999396';

/**
 * Transforma un elemento crudo de feed/GraphQL de CJ a la estructura normalizada de Supernova Store,
 * priorizando estrictamente el Tracking Link / Deep Link oficial de CJ para preservar el traqueo.
 */
export function transformCJProductFeed(rawItem: RawCJProduct): ProcessedProduct {
  // 1. Extraer precio numérico
  let parsedPrice = 0;
  if (typeof rawItem.price === 'number') {
    parsedPrice = rawItem.price;
  } else if (typeof rawItem.price === 'object' && rawItem.price !== null) {
    parsedPrice = rawItem.price.amount || 0;
  } else if (rawItem.price) {
    parsedPrice = parseFloat(String(rawItem.price)) || 0;
  }

  // 2. Extraer precio de oferta si existe
  let parsedSalePrice: number | undefined;
  const rawSale = rawItem.sale_price || rawItem.salePrice;
  if (typeof rawSale === 'number') {
    parsedSalePrice = rawSale;
  } else if (typeof rawSale === 'object' && rawSale !== null) {
    parsedSalePrice = rawSale.amount;
  } else if (rawSale) {
    parsedSalePrice = parseFloat(String(rawSale)) || undefined;
  }

  // 3. Priorizar estrictamente los enlaces de seguimiento de Commission Junction
  // evitando que la URL plana del anunciante sobrescriba el tracking de afiliación.
  const directTrackingLink =
    rawItem.buy_url ||
    rawItem.buyUrl ||
    rawItem.click_url ||
    rawItem.clickUrl ||
    rawItem.tracking_link ||
    rawItem.trackingLink ||
    rawItem.affiliate_url ||
    rawItem.affiliateUrl;

  const directMerchantUrl =
    rawItem.advertiser_url ||
    rawItem.advertiserUrl ||
    rawItem.link ||
    '';

  let resolvedUrl = directTrackingLink || '';

  // Si solo disponemos de la URL directa del anunciante, encapsularla en la estructura DeepLink de CJ
  if (!resolvedUrl && directMerchantUrl) {
    if (
      directMerchantUrl.includes('anrdoezrs.net') ||
      directMerchantUrl.includes('tkqlhce.com') ||
      directMerchantUrl.includes('dpbolvw.net') ||
      directMerchantUrl.includes('jdoqocy.com') ||
      directMerchantUrl.includes('cj.com')
    ) {
      resolvedUrl = directMerchantUrl;
    } else {
      resolvedUrl = `https://www.anrdoezrs.net/links/${DEFAULT_CJ_CID}/type/dlg/sid/supernova/${directMerchantUrl}`;
    }
  }

  return {
    id: String(rawItem.id || rawItem.sku || 'unknown-id'),
    title: String(rawItem.title || rawItem.name || 'Untitled Product'),
    merchant: String(rawItem.advertiser_name || rawItem.advertiserName || rawItem.merchant || rawItem.brand || 'Unknown Merchant'),
    affiliate: {
      url: resolvedUrl, // Inyecta el Deep Link / Tracking URL real de CJ
      directMerchantUrl: directMerchantUrl || undefined,
    },
    price: parsedPrice,
    salePrice: parsedSalePrice && parsedSalePrice < parsedPrice ? parsedSalePrice : undefined,
    category: String(rawItem.category || 'General'),
    description: rawItem.description || '',
    imageUrl: rawItem.image_url || rawItem.imageLink || rawItem.imageUrl || '',
  };
}
