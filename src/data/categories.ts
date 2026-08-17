export interface Category {
  id: string;
  label: string;
  slug: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'Todos', slug: 'all' },
  { id: 'software', label: 'Software', slug: 'software' },
  { id: 'magazines', label: 'Magazines', slug: 'magazines' },
  { id: 'tech', label: 'Tech', slug: 'tech' },
  { id: 'electronics', label: 'Electronics', slug: 'electronics' },
  { id: 'audio', label: 'Audio', slug: 'audio' }
];
