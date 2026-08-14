import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getProductStats, getDistinctCategories, getDistinctNetworks } from '@/lib/db';

export async function GET() {
  try {
    const stats = getProductStats();
    const categories = getDistinctCategories();
    const networks = getDistinctNetworks();

    const masterJsonPath = path.join(process.cwd(), 'data', 'master_catalog.json');
    let featuredSample: unknown[] = [];

    if (fs.existsSync(masterJsonPath)) {
      try {
        const raw = fs.readFileSync(masterJsonPath, 'utf8');
        featuredSample = JSON.parse(raw);
      } catch {
        // fallback
      }
    }

    return NextResponse.json({
      status: 'success',
      totalActiveProducts: stats.total,
      categories,
      networks,
      approvedMerchants: [
        'Booking.com',
        'AliExpress',
        'Wondershare',
        'Zinio',
        'Ashampoo Software',
        'Whokeys',
        'AbracadabraNYC',
        'Urban Minimalist',
        'Nordic Home',
        'Aether Audio',
        'Lumina Beauty',
        'Apex Athletics',
        'Form & Function',
        'Vanguard Goods',
        'Monochrome Editions',
      ],
      trackingDomain: 'anrdoezrs.net',
      sampleMasterProducts: featuredSample.slice(0, 20),
    });
  } catch (err) {
    console.error('[API_CATALOG_ERROR]', err);
    return NextResponse.json(
      { error: 'Failed to retrieve master catalog overview' },
      { status: 500 }
    );
  }
}
