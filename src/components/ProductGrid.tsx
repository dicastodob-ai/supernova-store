import { Product } from '@/types/product';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onResetFilters?: () => void;
}

export default function ProductGrid({ products, onResetFilters }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl border border-dashed border-[#ECECE8] bg-white my-8 p-8 shadow-sm">
        <span className="text-xs font-bold tracking-wider uppercase text-[#D96B27] block mb-2">
          No matches found
        </span>
        <h3 className="text-lg font-bold text-[#0B2545] mb-2 font-heading">
          No products match the selected criteria
        </h3>
        <p className="text-xs text-[#5C6479] max-w-md mx-auto mb-6">
          Try selecting another category, adjusting your network presets, or clearing your search term.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="button-primary !text-xs !py-2.5 !px-6"
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
