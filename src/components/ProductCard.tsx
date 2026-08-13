import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.salePrice !== undefined && product.salePrice < product.price;
  const displayPrice = hasDiscount ? product.salePrice! : product.price;

  return (
    <article className="group">
      <Link href={`/go/${product.id}`} target="_blank" rel="noopener noreferrer">
        <div className="aspect-[3/4] overflow-hidden bg-black/[0.03] mb-4">
          <Image
            src={product.imageUrl}
            alt={product.title}
            width={600}
            height={800}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      <div className="space-y-2">
        <p className="text-[10px] tracking-[0.2em] uppercase opacity-40 font-courier">
          {product.merchant}
        </p>

        <h3 className="text-xs tracking-[0.15em] uppercase font-bold leading-snug font-courier">
          {product.title}
        </h3>

        <div className="flex items-baseline gap-3">
          {hasDiscount && (
            <span className="text-xs tracking-[0.1em] line-through opacity-40 font-courier">
              ${product.price.toFixed(2)}
            </span>
          )}
          <span className="text-sm tracking-[0.1em] font-bold font-courier">
            ${displayPrice.toFixed(2)}
          </span>
        </div>

        <Link
          href={`/go/${product.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[10px] tracking-[0.2em] uppercase mt-2 border-b border-transparent hover:border-black transition-all duration-200 pb-0.5 font-courier"
        >
          View →
        </Link>
      </div>
    </article>
  );
}
