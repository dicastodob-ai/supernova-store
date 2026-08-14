'use client';

import { CATEGORIES, NET_PRESETS } from '@/types/product';

interface FilterBarProps {
  categories?: string[];
  networks?: string[];
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
  return (
    <div className="space-y-6 mb-10">
      {/* Search & Sort Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center pb-6 border-b border-[#ECECE8]">
        {/* Instant Search Box */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search catalog (e.g. Booking, AliExpress, Wondershare)..."
            className="w-full bg-white text-[#2D3142] text-xs py-3 px-4 rounded-full border border-[#ECECE8] placeholder:text-[#5C6479]/50 focus:outline-none focus:border-[#D96B27] focus:ring-2 focus:ring-[#D96B27]/20 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#5C6479] hover:text-[#0B2545]"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Network Presets & Sort Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* NET Presets Filter */}
          <div className="flex items-center gap-1 bg-white border border-[#ECECE8] p-1 rounded-full shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 text-[#5C6479] select-none">
              NET:
            </span>
            {NET_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onNetworkChange(preset.id)}
                className={`text-[11px] font-bold tracking-wide px-3 py-1.5 rounded-full transition-all ${
                  activeNetwork.toLowerCase() === preset.id.toLowerCase()
                    ? 'bg-[#0B2545] text-white shadow-sm'
                    : 'bg-transparent text-[#2D3142] hover:text-[#D96B27]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-white border border-[#ECECE8] p-1 rounded-full shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 text-[#5C6479] select-none">
              SORT:
            </span>
            <select
              value={sortBy}
              onChange={(e) =>
                onSortChange(e.target.value as 'latest' | 'price_asc' | 'price_desc')
              }
              className="bg-transparent text-[#2D3142] text-[11px] font-semibold py-1.5 px-3 border-none focus:outline-none cursor-pointer rounded-full"
            >
              <option value="latest">Latest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Curated Categories Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#5C6479] mr-1 select-none">
          CATEGORIES:
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`text-[11px] font-bold tracking-wide px-3.5 py-1.5 rounded-full transition-all duration-150 ${
              activeCategory.toLowerCase() === cat.id.toLowerCase()
                ? 'bg-[#D96B27] text-white shadow-sm'
                : 'bg-white text-[#2D3142] border border-[#ECECE8] hover:border-[#D96B27] hover:text-[#D96B27]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Catalog Status Bar */}
      <div className="flex justify-between items-center text-xs text-[#5C6479] pt-1">
        <span>
          Showing 24 per page &nbsp;•&nbsp;{' '}
          <strong className="text-[#0B2545]">{totalProducts.toLocaleString()}</strong> verified products
        </span>
      </div>
    </div>
  );
}
