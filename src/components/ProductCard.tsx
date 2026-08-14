'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

export default function ProductCard({ product }: ProductCardProps) {
  const [imageSrc, setImageSrc] = useState<string>(product.imageUrl || FALLBACK_IMAGE);
  const [hasImageError, setHasImageError] = useState<boolean>(false);

  const hasDiscount = product.salePrice !== undefined && product.salePrice < product.price;
  const displayPrice = hasDiscount ? product.salePrice! : product.price;

  const handleImageError = () => {
    if (!hasImageError) {
      setHasImageError(true);
      setImageSrc(FALLBACK_IMAGE);
    }
  };

  return (
    <article className="product-card group flex flex-col justify-between p-4 transition-all duration-300 hover:-translate-y-1">
      <div>
        {/* Product Image Link */}
        <Link
          href={`/go/${product.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-[3/4] overflow-hidden rounded-lg bg-[#F3F3F0] mb-4 relative"
        >
          <Image
            src={imageSrc}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={handleImageError}
            unoptimized={imageSrc.startsWith('http')}
          />
          {hasDiscount && (
            <span className="absolute top-2.5 left-2.5 bg-[#D96B27] text-white text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-full uppercase shadow-sm">
              SALE
            </span>
          )}
          <span className="absolute bottom-2.5 right-2.5 bg-white/95 text-[#0B2545] text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-md uppercase border border-[#ECECE8] shadow-sm">
            {product.category}
          </span>
        </Link>

        {/* Product Info */}
        <div className="space-y-1.5">
          <p className="text-[11px] tracking-wider uppercase text-[#5C6479] font-semibold">
            {product.merchant}
          </p>

          <h3 className="text-sm font-bold leading-snug line-clamp-2 text-[#0B2545]">
            <Link
              href={`/go/${product.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#D96B27] transition-colors"
            >
              {product.title}
            </Link>
          </h3>

          {product.description && (
            <p className="text-xs text-[#5C6479] line-clamp-2 leading-relaxed pt-1 font-normal">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Pricing & CTA Action */}
      <div className="pt-4 mt-4 border-t border-[#ECECE8] flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          {hasDiscount && (
            <span className="text-xs line-through text-[#5C6479]/70">
              ${product.price.toFixed(2)}
            </span>
          )}
          <span className="text-base font-extrabold text-[#0B2545]">
            ${displayPrice.toFixed(2)}
          </span>
        </div>

        <Link
          href={`/go/${product.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-btn !py-2 !px-4 !text-[11px] whitespace-nowrap"
        >
          VER OFERTA VIP →
        </Link>
      </div>
    </article>
  );
}
