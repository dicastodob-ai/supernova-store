'use client';

// Lógica de filtrado en el componente principal
import React, { useState } from 'react';
import productsData from '../data/products.optimized.json';
import { CATEGORIES } from '../data/categories';

export function StoreCatalog() {
  const [activeCategory, setActiveCategory] = useState('all');

  // Filtrado estricto por categorySlug
  const filteredProducts = activeCategory === 'all'
    ? productsData
    : productsData.filter(product => product.categorySlug === activeCategory);

  return (
    <div className="store-container max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8">
      {/* MENÚ DE FILTROS SUPERIOR */}
      <nav className="category-nav flex flex-wrap items-center gap-2 mb-8 pb-4 border-b border-[#ECECE8]">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.slug || cat.id)}
            className={`filter-btn text-xs font-bold tracking-wide px-4 py-2 rounded-full transition-all duration-150 ${
              activeCategory === (cat.slug || cat.id)
                ? 'bg-[#D96B27] text-white shadow-sm'
                : 'bg-white text-[#2D3142] border border-[#ECECE8] hover:border-[#D96B27] hover:text-[#D96B27]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {/* REJILLA DE PRODUCTOS FILTRADOS */}
      <div className="products-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <div
              key={product.id}
              className="product-card group bg-white rounded-xl border border-[#ECECE8] hover:border-[#D96B27]/40 p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="product-badge text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F4F4F0] text-[#5C6479]">
                    {product.category}
                  </span>
                  <span className="text-[10px] text-[#5C6479] font-medium">{(product as any).advertiser || (product as any).merchant || 'Supernova Partner'}</span>
                </div>
                <div className="aspect-[4/3] w-full rounded-lg bg-[#F9F9F8] overflow-hidden mb-3 flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </div>
                <h3 className="text-sm font-bold text-[#0B2545] line-clamp-2 mb-1 group-hover:text-[#D96B27] transition-colors">
                  {product.name}
                </h3>
              </div>
              <div className="mt-4 pt-3 border-t border-[#F4F4F0]">
                <p className="price text-base font-extrabold text-[#0B2545] mb-3">
                  {product.price} €
                </p>
                <div dangerouslySetInnerHTML={{ __html: product.safeButtonHtml }} />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center">
            <p className="no-products text-sm font-semibold text-[#5C6479]">
              No hay productos disponibles en esta categoría.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoreCatalog;
