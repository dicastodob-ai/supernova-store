import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-16 font-courier">
      {/* Header section */}
      <div className="border-b border-black pb-8 mb-12">
        <p className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-2">Editorial & Purpose</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-[0.2em] uppercase">About Supernova</h1>
      </div>

      {/* Main content */}
      <div className="space-y-10 text-xs md:text-sm tracking-[0.08em] leading-relaxed">
        <section className="space-y-4">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase border-b border-black pb-2">
            01 / Concept & Curation
          </h2>
          <p>
            Supernova Store is a curated minimalist storefront designed to eliminate visual noise and bring clarity to modern product discovery. We index high-grade electronics, functional design, literature, and lifestyle essentials from premier brands.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase border-b border-black pb-2">
            02 / Affiliate Partnerships
          </h2>
          <p>
            All products and merchants featured in Supernova are curated and sourced exclusively through verified global affiliate partnerships with <strong>CJ Affiliate</strong>. When you click on a product link, you are redirected to the authorized merchant’s checkout with full buyer protections.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-bold tracking-[0.2em] uppercase border-b border-black pb-2">
            03 / Transparency & Disclosure
          </h2>
          <p className="opacity-80">
            Supernova may earn an affiliate commission when purchases are completed through our links at no additional cost to you. We only index items that adhere to our standards of design, quality, and technical integrity.
          </p>
        </section>

        <div className="pt-8">
          <Link
            href="/"
            className="inline-block bg-black text-white text-xs tracking-[0.2em] uppercase px-6 py-3 hover:bg-white hover:text-black hover:border hover:border-black transition-colors"
          >
            ← Return to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
