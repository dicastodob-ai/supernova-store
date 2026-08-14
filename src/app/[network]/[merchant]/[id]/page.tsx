import { Metadata } from 'next';
import Link from 'next/link';
import { getProductById } from '@/lib/products';
import { getDb, rowToProduct, DbProductRow } from '@/lib/db';
import { sanitizeAffiliateUrl } from '@/lib/cj-link-repair';
import ProductCard from '@/components/ProductCard';

interface Props {
  params: Promise<{
    network: string;
    merchant: string;
    id: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { merchant, id } = await params;
  const product = getProductById(id);

  if (!product) {
    return {
      title: `${merchant.toUpperCase()} Deals | Supernova Store`,
      description: 'Discover curated deals and design tech at Supernova Store.',
    };
  }

  return {
    title: `${product.title} — ${product.merchant} | Supernova Store`,
    description: product.description || `Special verified offer for ${product.title} at ${product.merchant}.`,
    openGraph: {
      title: `${product.title} — ${product.merchant}`,
      description: product.description,
      images: [product.imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { network, merchant, id } = await params;

  // 1. Intentar obtener el producto por ID exacto
  let product = getProductById(id);

  // 2. Si no se encuentra, buscar por ID normalizado o coincidencia en base de datos
  if (!product) {
    try {
      const db = getDb();
      const normalizedId = id.startsWith('prod-') ? id : `prod-${id}`;
      const row = db
        .prepare(
          `SELECT * FROM products 
           WHERE (id = ? OR id = ? OR id LIKE ? OR affiliate_url LIKE ?) 
             AND is_active = 1 
           LIMIT 1`
        )
        .get(id, normalizedId, `%${id}%`, `%${id}%`) as DbProductRow | undefined;

      if (row) {
        product = rowToProduct(row);
      }
    } catch {
      // Ignorar error de consulta y proceder al fallback amigable
    }
  }

  // 3. Obtener productos relacionados para descubrimiento continuo
  let relatedProducts: import('@/types/product').Product[] = [];
  try {
    const db = getDb();
    const cat = product?.category || 'tech';
    const rows = db
      .prepare(
        `SELECT * FROM products 
         WHERE category = ? AND id != ? AND is_active = 1 
         ORDER BY id DESC LIMIT 4`
      )
      .all(cat, id) as DbProductRow[];
    relatedProducts = rows.map(rowToProduct);
  } catch {
    relatedProducts = [];
  }

  // Si el producto no se encuentra en la base de datos, renderizar vista de descubrimiento amigable (HTTP 200, no 404)
  if (!product) {
    const merchantFallbackUrl = sanitizeAffiliateUrl(
      null,
      decodeURIComponent(merchant),
      id
    );

    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="bg-white border border-[#ECECE8] p-8 md:p-12 rounded-2xl shadow-sm">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#D96B27]/10 text-[#D96B27] text-xs font-bold uppercase tracking-wider mb-4">
            Catálogo Supernova
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B2545] font-heading mb-3">
            Oferta Verificada de {decodeURIComponent(merchant)}
          </h1>
          <p className="text-sm text-[#5C6479] max-w-lg mx-auto mb-8">
            El producto que buscas se encuentra disponible directamente a través del portal oficial de nuestro anunciante afiliado o ha sido actualizado.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={merchantFallbackUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#D96B27] hover:bg-[#B8581C] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              Ver Tienda Oficial de {decodeURIComponent(merchant)} →
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#0B2545] hover:bg-[#0B2545]/80 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
            >
              Explorar Todo el Catálogo
            </Link>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16 text-left">
            <h2 className="text-xl font-bold text-[#0B2545] mb-6 font-heading">
              Ofertas Recomendadas en Supernova
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const directCjUrl = sanitizeAffiliateUrl(
    product.affiliate?.url || (product as unknown as { product_url?: string }).product_url,
    product.merchant,
    product.id
  );

  const hasDiscount = product.salePrice !== undefined && product.salePrice < product.price;
  const displayPrice = hasDiscount ? product.salePrice! : product.price;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 md:py-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-[#5C6479] mb-8">
        <Link href="/" className="hover:text-[#D96B27] transition-colors">
          Inicio
        </Link>
        <span>/</span>
        <Link href={`/?category=${product.category}`} className="hover:text-[#D96B27] uppercase transition-colors">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-[#0B2545] truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Details Card */}
      <div className="bg-white border border-[#ECECE8] rounded-2xl md:rounded-3xl p-6 md:p-10 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        {/* Left Column: Image Gallery */}
        <div className="relative w-full h-80 md:h-96 bg-[#F9F9F8] rounded-2xl overflow-hidden flex items-center justify-center p-6 border border-[#ECECE8]">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
          />
          {hasDiscount && (
            <span className="absolute top-4 left-4 bg-[#D96B27] text-white text-xs font-extrabold tracking-wider px-3 py-1 rounded-full uppercase shadow-md">
              SALE
            </span>
          )}
          <span className="absolute bottom-4 right-4 bg-white/95 text-[#0B2545] text-xs font-bold px-3 py-1 rounded-lg uppercase border border-[#ECECE8] shadow-sm">
            {network.toUpperCase()} Verified
          </span>
        </div>

        {/* Right Column: Information & Checkout CTA */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <div className="inline-block bg-[#0B2545]/5 text-[#0B2545] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
              {product.merchant}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0B2545] font-heading leading-tight mb-4">
              {product.title}
            </h1>
            <p className="text-sm md:text-base text-[#5C6479] font-body leading-relaxed mb-6">
              {product.description}
            </p>
          </div>

          <div className="border-t border-[#ECECE8] pt-6">
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl md:text-4xl font-extrabold text-[#0B2545] font-heading">
                ${displayPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-lg line-through text-[#5C6479]/70 font-semibold">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Direct Official Merchant Button */}
            <a
              href={directCjUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="w-full inline-flex items-center justify-center py-4 px-8 bg-[#D96B27] hover:bg-[#B8581C] text-white font-heading font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
            >
              Comprar en {product.merchant} (Sitio Oficial) →
            </a>

            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-[#5C6479]">
              <span className="flex items-center gap-1">🔒 Compra Segura SSL</span>
              <span>•</span>
              <span className="flex items-center gap-1">✓ Red Oficial CJ Affiliate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl md:text-2xl font-bold text-[#0B2545] mb-6 font-heading">
            Más ofertas en {product.category.toUpperCase()}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
