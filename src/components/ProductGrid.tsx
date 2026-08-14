import { Product } from '@/types/product';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onResetFilters?: () => void;
}

export default function ProductGrid({ products, onResetFilters }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-24 border border-dashed border-black/20 my-8 p-8 font-courier">
        <span className="text-[10px] tracking-[0.3em] uppercase opacity-40 block mb-2">
          NO MATCHES FOUND
        </span>
        <h3 className="text-sm font-bold tracking-[0.2em] uppercase mb-4">
          No products match the selected criteria
        </h3>
        <p className="text-xs tracking-wider opacity-60 max-w-md mx-auto mb-6">
          Try selecting another category, adjusting your price filters, or clearing your search term.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-block text-xs font-bold tracking-[0.2em] uppercase bg-black text-white px-6 py-2.5 hover:bg-neutral-800 transition-colors"
          >
            RESET ALL FILTERS →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
