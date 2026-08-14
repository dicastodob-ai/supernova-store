'use client';

import React, { useState } from 'react';
import { Product } from '@/types/product';
import { sanitizeAffiliateUrl } from '@/lib/cj-link-repair';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

export function ProductCard({ product }: { product: Product }) {
  const rawAffiliateUrl =
    (product as unknown as { affiliateUrl?: string }).affiliateUrl ||
    product.affiliate?.url ||
    (product as unknown as { product_url?: string }).product_url ||
    `https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://${(product.merchant || 'store').toLowerCase().replace(/[^a-z0-9]/g, '')}.com/product/${product.id}`;

  const cjUrl = sanitizeAffiliateUrl(rawAffiliateUrl, product.merchant, product.id);

  const [imgSrc, setImgSrc] = useState<string>(product.imageUrl || FALLBACK_IMAGE);

  const hasDiscount = product.salePrice !== undefined && product.salePrice < product.price;
  const displayPrice = hasDiscount ? product.salePrice! : product.price;

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(cjUrl, '_blank', 'noopener,noreferrer,sponsored');
  };

  return (
    <div
      onClick={handleCardClick}
      className="product-card cursor-pointer group bg-white border border-[#ECECE8] rounded-xl md:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
    >
      <div className="p-4 sm:p-5">
        {/* Imagen del producto con enlace externo directo */}
        <a
          href={cjUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={(e) => e.stopPropagation()}
          className="block relative w-full h-48 sm:h-52 mb-4 overflow-hidden rounded-lg sm:rounded-xl bg-[#F9F9F8] flex items-center justify-center"
        >
          <img
            src={imgSrc}
            alt={product.title}
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {hasDiscount && (
            <span className="absolute top-2.5 left-2.5 bg-[#D96B27] text-white text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full uppercase shadow-sm font-heading">
              SALE
            </span>
          )}
          <span className="absolute bottom-2.5 right-2.5 bg-white/95 text-[#0B2545] text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-md uppercase border border-[#ECECE8] shadow-sm font-heading">
            {product.category}
          </span>
        </a>

        {/* Metadatos y Título con enlace externo directo */}
        <span className="text-xs font-bold text-[#D96B27] uppercase tracking-wider block font-heading">
          {product.merchant}
        </span>
        <h3 className="font-bold text-[#0B2545] text-base sm:text-lg mt-1 line-clamp-2 leading-snug font-heading group-hover:text-[#D96B27] transition-colors">
          <a
            href={cjUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => e.stopPropagation()}
          >
            {product.title}
          </a>
        </h3>
        {product.description && (
          <p className="text-xs sm:text-sm text-[#5C6479] mt-2 line-clamp-2 font-body leading-relaxed">
            {product.description}
          </p>
        )}
      </div>

      {/* Precio y Botón CTA con enlace externo directo */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3 border-t border-[#ECECE8] flex items-center justify-between gap-3 mb-3">
          <div className="flex items-baseline gap-2">
            {hasDiscount && (
              <span className="text-xs line-through text-[#5C6479]/70">
                ${product.price.toFixed(2)}
              </span>
            )}
            <span className="text-base sm:text-lg font-extrabold text-[#0B2545] font-heading">
              ${displayPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <a
          href={cjUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          onClick={(e) => e.stopPropagation()}
          className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-[#0B2545] hover:bg-[#D96B27] text-white font-heading font-bold text-xs uppercase tracking-wider rounded-lg md:rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
        >
          Ver Oferta en {product.merchant || 'Comercio'} →
        </a>
      </div>
    </div>
  );
}

export default ProductCard;
