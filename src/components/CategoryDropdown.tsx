'use client';

import React, { useState } from 'react';
import { CATEGORIES } from '../data/categories';

export interface CategoryDropdownProps {
  value?: string;
  onChange?: (slug: string) => void;
  className?: string;
}

export function CategoryDropdown({ value, onChange, className = '' }: CategoryDropdownProps) {
  // CATEGORIES[0] = "Todos", CATEGORIES[1] = "Software" (Opción 2 por defecto)
  const [selectedCategory, setSelectedCategory] = useState(value || CATEGORIES[1]?.slug || 'software');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextVal = e.target.value;
    setSelectedCategory(nextVal);
    if (onChange) {
      onChange(nextVal);
    }
  };

  return (
    <select 
      value={value !== undefined ? value : selectedCategory} 
      onChange={handleChange}
      className={`custom-dropdown bg-white text-[#2D3142] text-xs font-semibold py-2 px-3 rounded-lg border border-[#ECECE8] focus:outline-none focus:border-[#D96B27] cursor-pointer shadow-sm ${className}`}
    >
      {CATEGORIES.map((cat) => (
        <option key={cat.id} value={cat.slug}>
          {cat.label}
        </option>
      ))}
    </select>
  );
}

export default CategoryDropdown;
