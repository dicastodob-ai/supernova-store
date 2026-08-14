import { Product } from '@/types/product';

export const products: Product[] = [
  {
    id: 'prod-001',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    description: 'Industry leading noise canceling headphones with Auto NC Optimizer. Up to 30-hour battery life with quick charging.',
    imageUrl: 'https://picsum.photos/seed/product1/600/800',
    price: 398.00,
    salePrice: 348.00,
    currency: 'USD',
    merchant: 'TechHaven',
    category: 'electronics',
    tags: ['headphones', 'wireless', 'audio', 'noise-canceling', 'sony'],
    affiliate: {
      network: 'cj',
      url: 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://techhaven.com/item',
      advertiserId: 'tech-haven-33',
      campaignId: 'summer-sale-2025'
    },
    isActive: true,
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'prod-002',
    title: 'Minimalist Canvas Backpack',
    description: 'Water-resistant daily carry backpack with laptop sleeve. Perfect for urban commuting and weekend getaways.',
    imageUrl: 'https://picsum.photos/seed/product2/600/800',
    price: 85.00,
    currency: 'USD',
    merchant: 'Urban Threads',
    category: 'fashion',
    tags: ['bag', 'backpack', 'canvas', 'minimalist', 'travel'],
    affiliate: {
      network: 'cj',
      url: 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://urbanthreads.com/backpack',
      advertiserId: 'urban-threads-89',
    },
    isActive: true,
    createdAt: '2025-02-03T14:30:00Z'
  },
  {
    id: 'prod-003',
    title: 'Smart Home Security Hub',
    description: 'Centralized command center for all your smart home devices. Features facial recognition and 24/7 monitoring.',
    imageUrl: 'https://picsum.photos/seed/product3/600/800',
    price: 199.99,
    salePrice: 179.99,
    currency: 'USD',
    merchant: 'HomeBase Co.',
    category: 'home',
    tags: ['smart-home', 'security', 'hub', 'iot'],
    affiliate: {
      network: 'cj',
      url: 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://homebase.com/smart-hub',
      advertiserId: 'homebase-12',
    },
    isActive: true,
    createdAt: '2025-03-11T09:15:00Z'
  },
  {
    id: 'prod-004',
    title: 'Hydrating Facial Serum',
    description: 'Advanced hyaluronic acid formula for deep skin hydration. Vegan, cruelty-free, and suitable for all skin types.',
    imageUrl: 'https://picsum.photos/seed/product4/600/800',
    price: 45.00,
    currency: 'USD',
    merchant: 'Glow Beauty',
    category: 'beauty',
    tags: ['skincare', 'serum', 'hydration', 'vegan'],
    affiliate: {
      network: 'cj',
      url: 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://glowbeauty.com/serum',
      advertiserId: 'glow-beauty-55',
      campaignId: 'spring-fresh-25'
    },
    isActive: true,
    createdAt: '2025-04-05T11:45:00Z'
  },
  {
    id: 'prod-005',
    title: 'Yoga Mat with Alignment Lines',
    description: 'Eco-friendly TPE yoga mat with laser-engraved alignment guides. Provides excellent grip and joint protection.',
    imageUrl: 'https://picsum.photos/seed/product5/600/800',
    price: 68.00,
    salePrice: 55.00,
    currency: 'USD',
    merchant: 'Zen Fitness',
    category: 'sports',
    tags: ['yoga', 'fitness', 'mat', 'eco-friendly', 'workout'],
    affiliate: {
      network: 'cj',
      url: 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://zenfit.com/yoga-mat',
      advertiserId: 'zen-fit-99',
    },
    isActive: true,
    createdAt: '2025-01-28T08:20:00Z'
  },
  {
    id: 'prod-006',
    title: 'The Art of Mindful Living',
    description: 'A comprehensive guide to finding peace in a chaotic world. Includes daily exercises and meditation techniques.',
    imageUrl: 'https://picsum.photos/seed/product6/600/800',
    price: 24.99,
    currency: 'USD',
    merchant: 'Chapter & Verse',
    category: 'books',
    tags: ['book', 'mindfulness', 'self-help', 'hardcover'],
    affiliate: {
      network: 'cj',
      url: 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://chapterandverse.com/mindful',
      advertiserId: 'chapter-verse-11',
    },
    isActive: true,
    createdAt: '2025-02-14T16:00:00Z'
  },
  {
    id: 'prod-007',
    title: 'Mechanical Gaming Keyboard',
    description: 'Customizable RGB backlighting with tactile Cherry MX switches. Built with aircraft-grade aluminum frame.',
    imageUrl: 'https://picsum.photos/seed/product7/600/800',
    price: 149.99,
    salePrice: 129.99,
    currency: 'USD',
    merchant: 'TechHaven',
    category: 'electronics',
    tags: ['keyboard', 'gaming', 'mechanical', 'rgb', 'pc'],
    affiliate: {
      network: 'cj',
      url: 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://techhaven.com/keyboard',
      advertiserId: 'tech-haven-33',
    },
    isActive: true,
    createdAt: '2025-03-22T13:10:00Z'
  },
  {
    id: 'prod-008',
    title: 'Polarized Aviator Sunglasses',
    description: 'Classic aviator style with premium polarized lenses. Offers 100% UV protection and reduces glare.',
    imageUrl: 'https://picsum.photos/seed/product8/600/800',
    price: 120.00,
    currency: 'USD',
    merchant: 'Urban Threads',
    category: 'accessories',
    tags: ['sunglasses', 'aviator', 'eyewear', 'polarized', 'fashion'],
    affiliate: {
      network: 'cj',
      url: 'https://www.anrdoezrs.net/links/7999396/type/dlg/sid/supernova/https://urbanthreads.com/sunglasses',
      advertiserId: 'urban-threads-89',
      campaignId: 'summer-styles-25'
    },
    isActive: true,
    createdAt: '2025-05-01T09:30:00Z'
  }
];
