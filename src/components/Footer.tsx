export default function Footer() {
  return (
    <footer className="border-t border-[#ECECE8] mt-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="font-extrabold text-sm tracking-tight text-[#0B2545] font-heading flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D96B27] inline-block"></span>
              SUPERNOVA
            </p>
            <p className="text-xs text-[#5C6479] mt-1">
              Curated premium products. Affiliate powered.
            </p>
          </div>
          <p className="text-xs text-[#5C6479]">
            © {new Date().getFullYear()} Supernova Store. All rights reserved.
          </p>
        </div>
        <p className="text-[11px] text-[#5C6479]/70 mt-8 leading-relaxed">
          Disclosure: This site contains affiliate links. We may earn a commission from qualifying purchases at no extra cost to you.
        </p>
      </div>
    </footer>
  );
}
