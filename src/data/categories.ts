export interface Category {
  id: string;
  label: string;
  slug: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'Todos', slug: 'all' },
  { id: 'software', label: 'Software', slug: 'software' },
  { id: 'electronics', label: 'Electrónica', slug: 'electronics' },
  { id: 'tech', label: 'Tech & Gadgets', slug: 'tech' }
];
