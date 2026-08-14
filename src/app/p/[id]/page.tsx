import { redirect } from 'next/navigation';
import { getProductById } from '@/lib/products';
import { getDb, rowToProduct, DbProductRow } from '@/lib/db';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ShortProductRedirectPage({ params }: Props) {
  const { id } = await params;
  let product = getProductById(id);

  if (!product) {
    try {
      const db = getDb();
      const normalizedId = id.startsWith('prod-') ? id : `prod-${id}`;
      const row = db
        .prepare(`SELECT * FROM products WHERE (id = ? OR id = ?) AND is_active = 1 LIMIT 1`)
        .get(id, normalizedId) as DbProductRow | undefined;
      if (row) product = rowToProduct(row);
    } catch {
      // Ignorar error
    }
  }

  if (product) {
    const merchantSlug = (product.merchant || 'store').toLowerCase().replace(/[^a-z0-9]/g, '');
    redirect(`/cj/${merchantSlug}/${product.id}`);
  }

  redirect(`/?search=${encodeURIComponent(id)}`);
}
