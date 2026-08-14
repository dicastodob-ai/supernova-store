import { Product } from '@/types/product';
import cleanProducts from '../../data.json';

export const products: Product[] = cleanProducts as unknown as Product[];
