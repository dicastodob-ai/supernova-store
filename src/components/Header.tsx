import Link from 'next/link';
import { CATEGORIES } from '@/data/categories';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F9F9F8]/90 backdrop-blur-md border-b border-[#ECECE8]">
      <div className="flex items-center justify-between py-4 px-6 md:px-12 max-w-7xl mx-auto">
        <Link href="/" className="font-extrabold text-lg md:text-xl tracking-tight text-[#0B2545] font-heading flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D96B27] inline-block"></span>
          SUPERNOVA
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.id === 'all' ? '/' : `/?category=${cat.slug || cat.id}`}
              className="text-xs font-bold tracking-wider uppercase text-[#0B2545] hover:text-[#D96B27] transition-colors whitespace-nowrap"
            >
              {cat.label}
            </Link>
          ))}
          <Link
            href="/about"
            className="text-xs font-bold tracking-wider uppercase text-[#5C6479] hover:text-[#D96B27] transition-colors whitespace-nowrap"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
