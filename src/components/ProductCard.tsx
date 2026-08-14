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
    <article className="group flex flex-col justify-between border border-black/10 bg-white p-4 transition-all duration-300 hover:border-black hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] font-courier">
      <div>
        {/* Product Image Link */}
        <Link
          href={`/go/${product.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-[3/4] overflow-hidden bg-black/[0.03] mb-4 relative"
        >
          <Image
            src={imageSrc}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={handleImageError}
            unoptimized={imageSrc.startsWith('http')}
          />
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-black text-white text-[9px] font-bold tracking-widest px-2 py-0.5 uppercase">
              SALE
            </span>
          )}
          <span className="absolute bottom-2 right-2 bg-white/90 text-black text-[9px] tracking-widest px-1.5 py-0.5 uppercase border border-black/10">
            {product.category}
          </span>
        </Link>

        {/* Product Info */}
        <div className="space-y-1.5">
          <p className="text-[10px] tracking-[0.2em] uppercase opacity-50 font-bold">
            {product.merchant}
          </p>

          <h3 className="text-xs tracking-[0.1em] uppercase font-bold leading-snug line-clamp-2">
            <Link
              href={`/go/${product.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {product.title}
            </Link>
          </h3>

          {product.description && (
            <p className="text-[10px] tracking-normal opacity-60 line-clamp-2 leading-relaxed pt-1">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Pricing & CTA Action */}
      <div className="pt-4 mt-4 border-t border-black/10 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          {hasDiscount && (
            <span className="text-[11px] tracking-wider line-through opacity-40">
              ${product.price.toFixed(2)}
            </span>
          )}
          <span className="text-sm tracking-wider font-bold">
            ${displayPrice.toFixed(2)}
          </span>
        </div>

        <Link
          href={`/go/${product.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-[10px] tracking-[0.2em] uppercase font-bold bg-black text-white px-3 py-1.5 hover:bg-neutral-800 transition-colors"
        >
          VER OFERTA VIP →
        </Link>
      </div>
    </article>
  );
}
