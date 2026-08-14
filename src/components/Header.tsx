import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black">
      <div className="flex items-center justify-between py-4 px-6 md:px-12 max-w-7xl mx-auto">
        <Link href="/" className="font-bold text-base md:text-lg tracking-[0.3em] uppercase font-courier">
          SUPERNOVA
        </Link>
        <nav className="flex items-center gap-6 md:gap-8 font-courier">
          <Link
            href="/"
            className="text-xs tracking-[0.2em] uppercase hover:line-through transition-all duration-200"
          >
            All Items
          </Link>
          <Link
            href="/?category=electronics"
            className="text-xs tracking-[0.2em] uppercase hover:line-through transition-all duration-200 hidden sm:inline-block"
          >
            Tech
          </Link>
          <Link
            href="/?category=fashion"
            className="text-xs tracking-[0.2em] uppercase hover:line-through transition-all duration-200 hidden sm:inline-block"
          >
            Fashion
          </Link>
          <Link
            href="/?category=home"
            className="text-xs tracking-[0.2em] uppercase hover:line-through transition-all duration-200 hidden md:inline-block"
          >
            Living
          </Link>
          <Link
            href="/about"
            className="text-xs tracking-[0.2em] uppercase hover:line-through transition-all duration-200"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
