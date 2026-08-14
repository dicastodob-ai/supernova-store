'use client';

import { useState, useEffect, useCallback, useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/types/product';
import FilterBar from '@/components/FilterBar';
import ProductGrid from '@/components/ProductGrid';
import Pagination from '@/components/Pagination';

function StoreContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [networks, setNetworks] = useState<string[]>(['cj']);
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeNetwork, setActiveNetwork] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'price_asc' | 'price_desc'>('latest');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [, startTransition] = useTransition();

  // Sync category from URL parameter if changed externally
  useEffect(() => {
    const urlCat = searchParams.get('category');
    if (urlCat && urlCat !== activeCategory) {
      setActiveCategory(urlCat);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Debounce search query input (250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch paginated products from /api/products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('pageSize', '24');
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (activeNetwork !== 'all') params.set('network', activeNetwork);
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (sortBy !== 'latest') params.set('sortBy', sortBy);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();

      startTransition(() => {
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
        setTotalProducts(data.total || 0);
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
        if (data.networks && data.networks.length > 0) {
          setNetworks(data.networks.filter((n: string) => n.toLowerCase() !== 'impact'));
        }
      });
    } catch (err) {
      console.error('[FETCH_PRODUCTS_ERROR]', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeCategory, activeNetwork, debouncedSearch, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update browser URL query params without reloading page
  const updateUrlParams = (cat: string, search: string) => {
    const nextParams = new URLSearchParams();
    if (cat !== 'all') nextParams.set('category', cat);
    if (search.trim()) nextParams.set('search', search.trim());
    const query = nextParams.toString();
    const newUrl = query ? `/?${query}` : '/';
    window.history.replaceState(null, '', newUrl);
  };

  // Handlers for instant filters
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
    updateUrlParams(cat, searchQuery);
  };

  const handleNetworkChange = (net: string) => {
    setActiveNetwork(net);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: 'latest' | 'price_asc' | 'price_desc') => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrlParams(activeCategory, val);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setActiveCategory('all');
    setActiveNetwork('all');
    setSearchQuery('');
    setDebouncedSearch('');
    setSortBy('latest');
    setCurrentPage(1);
    window.history.replaceState(null, '', '/');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8">
      {/* Hero Section */}
      <section className="py-12 md:py-16 border-b border-[#ECECE8] mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D96B27]/10 text-[#D96B27] text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D96B27]"></span>
              Multi-Advertiser Catalog • Verified CJ Feeds
            </div>
            <h1 className="hero-title text-3xl md:text-5xl font-extrabold tracking-tight text-[#0B2545] leading-tight">
              Curated Directory
            </h1>
            <p className="text-sm text-[#5C6479] mt-2 max-w-xl">
              Handpicked deals from premier verified global merchants. Direct affiliate attribution guaranteed.
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs text-[#5C6479] font-medium leading-relaxed max-w-sm">
              Booking.com • AliExpress • Wondershare • Zinio • Ashampoo • Whokeys • Abracadabra NYC
            </p>
          </div>
        </div>
      </section>

      {/* Instant Filters & Search Bar */}
      <section className="pb-16">
        <FilterBar
          categories={categories}
          networks={networks}
          activeCategory={activeCategory}
          activeNetwork={activeNetwork}
          sortBy={sortBy}
          searchQuery={searchQuery}
          onCategoryChange={handleCategoryChange}
          onNetworkChange={handleNetworkChange}
          onSortChange={handleSortChange}
          onSearchChange={handleSearchChange}
          totalProducts={totalProducts}
        />

        {/* Loading Skeleton or Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-4 rounded-xl border border-[#ECECE8] p-4 bg-white">
                <div className="aspect-[3/4] bg-[#F3F3F0] rounded-lg" />
                <div className="h-2.5 bg-[#ECECE8] w-1/3 rounded" />
                <div className="h-4 bg-[#ECECE8] w-3/4 rounded" />
                <div className="h-4 bg-[#ECECE8] w-1/4 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <ProductGrid
              products={products}
              onResetFilters={handleResetFilters}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 text-center">
          <p className="text-sm font-bold text-[#D96B27] tracking-wider uppercase animate-pulse">
            Loading Supernova Catalog...
          </p>
        </div>
      }
    >
      <StoreContent />
    </Suspense>
  );
}
