export default function Footer() {
  return (
    <footer className="border-t border-black mt-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="font-bold text-sm tracking-[0.3em] uppercase font-courier">SUPERNOVA</p>
            <p className="text-[10px] tracking-[0.15em] uppercase mt-2 opacity-50 font-courier">
              Curated products. Affiliate powered.
            </p>
          </div>
          <p className="text-[10px] tracking-[0.15em] uppercase opacity-40 font-courier">
            © {new Date().getFullYear()} Supernova Store. All rights reserved.
          </p>
        </div>
        <p className="text-[9px] tracking-[0.1em] uppercase opacity-30 mt-8 leading-relaxed font-courier">
          Disclosure: This site contains affiliate links. We may earn a commission at no extra cost to you.
        </p>
      </div>
    </footer>
  );
}
