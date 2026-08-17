export interface Category {
  id: string;
  label: string;
  slug: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'Todos los Productos', slug: 'all' },
  { id: 'software', label: 'Software & Herramientas', slug: 'software' },
  { id: 'magazines', label: 'Revistas & Prensa', slug: 'magazines' },
  { id: 'tech', label: 'Tecnología & Accesorios', slug: 'tech' },
  { id: 'electronics', label: 'Electrónica & Gadgets', slug: 'electronics' },
  { id: 'audio', label: 'Audio & Sonido', slug: 'audio' }
];
