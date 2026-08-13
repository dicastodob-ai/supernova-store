'use client';

interface FilterBarProps {
  categories: string[];
  networks: string[];
  activeCategory: string;
  activeNetwork: string;
  sortBy: 'latest' | 'price_asc' | 'price_desc';
  searchQuery: string;
  onCategoryChange: (category: string) => void;
  onNetworkChange: (network: string) => void;
  onSortChange: (sort: 'latest' | 'price_asc' | 'price_desc') => void;
  onSearchChange: (search: string) => void;
  totalProducts: number;
}

export default function FilterBar({
  categories,
  networks,
  activeCategory,
  activeNetwork,
  sortBy,
  searchQuery,
  onCategoryChange,
  onNetworkChange,
  onSortChange,
  onSearchChange,
  totalProducts,
}: FilterBarProps) {
  const allCategories = ['all', ...categories.filter((c) => c !== 'all')];
  const allNetworks = ['all', ...networks.filter((n) => n !== 'all')];

  return (
    <div className="space-y-6 mb-12 font-courier">
      {/* Search & Sort Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center pb-6 border-b border-black">
        {/* Instant Search Box */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="SEARCH 143K CATALOG (e.g. SONY, LEATHER, OAK)..."
            className="w-full bg-white text-black text-xs uppercase tracking-wider py-2.5 px-3 border border-black placeholder:opacity-30 focus:outline-none focus:ring-1 focus:ring-black"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs uppercase opacity-40 hover:opacity-100"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Network & Sort Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Network Filter */}
          <div className="flex items-center gap-1 border border-black p-0.5">
            <span className="text-[9px] uppercase tracking-widest px-2 opacity-50 select-none">
              NET:
            </span>
            {allNetworks.map((net) => (
              <button
                key={net}
                onClick={() => onNetworkChange(net)}
                className={`text-[10px] tracking-wider uppercase px-2.5 py-1 transition-colors ${
                  activeNetwork === net
                    ? 'bg-black text-white'
                    : 'bg-transparent text-black hover:opacity-60'
                }`}
              >
                {net}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 border border-black p-0.5">
            <span className="text-[9px] uppercase tracking-widest px-2 opacity-50 select-none">
              SORT:
            </span>
            <select
              value={sortBy}
              onChange={(e) =>
                onSortChange(e.target.value as 'latest' | 'price_asc' | 'price_desc')
              }
              className="bg-white text-black text-[10px] uppercase tracking-wider py-1 px-2 border-none focus:outline-none cursor-pointer"
            >
              <option value="latest">Latest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[9px] uppercase tracking-widest opacity-40 mr-1 select-none">
          CATEGORIES:
        </span>
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 border transition-all duration-150 ${
              activeCategory === cat
                ? 'bg-black text-white border-black font-bold'
                : 'bg-transparent text-black border-transparent hover:border-black hover:line-through'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Catalog Status Bar */}
      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest opacity-40 pt-2">
        <span>
          Showing 24 per page &nbsp;•&nbsp;{' '}
          {totalProducts.toLocaleString()} active items indexed
        </span>
      </div>
    </div>
  );
}
