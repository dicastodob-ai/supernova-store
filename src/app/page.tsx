'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Product } from '@/types/product';
import FilterBar from '@/components/FilterBar';
import ProductGrid from '@/components/ProductGrid';
import Pagination from '@/components/Pagination';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [networks, setNetworks] = useState<string[]>(['cj']);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeNetwork, setActiveNetwork] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'price_asc' | 'price_desc'>('latest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [, startTransition] = useTransition();

  // Debounce search query input (250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to page 1 on new search
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

  // Handlers for instant filters
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handleNetworkChange = (net: string) => {
    setActiveNetwork(net);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: 'latest' | 'price_asc' | 'price_desc') => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12">
      {/* Hero Section */}
      <section className="py-16 md:py-24 border-b border-black mb-12 md:mb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="text-[10px] tracking-[0.3em] uppercase opacity-40 block mb-2 font-courier">
              Affiliate Catalog • 143k Products
            </span>
            <h1 className="text-3xl md:text-5xl font-bold tracking-[0.2em] uppercase font-courier leading-tight">
              Curated
              <br />
              Directory
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase opacity-40 max-w-sm leading-relaxed font-courier">
              Instant indexed search & direct affiliate deep-routing. Pure monochrome aesthetics.
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
          onSearchChange={setSearchQuery}
          totalProducts={totalProducts}
        />

        {/* Loading State or Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-8 md:gap-y-16">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-[3/4] bg-black/[0.06] border border-black/10" />
                <div className="h-2 bg-black/[0.06] w-1/3" />
                <div className="h-3 bg-black/[0.06] w-3/4" />
                <div className="h-3 bg-black/[0.06] w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <ProductGrid products={products} />
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
