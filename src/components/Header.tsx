import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black">
      <div className="flex items-center justify-between py-5 px-6 md:px-12 max-w-7xl mx-auto">
        <Link href="/" className="font-bold text-lg tracking-[0.3em] uppercase font-courier">
          SUPERNOVA
        </Link>
        <nav className="flex gap-8">
          <Link
            href="/"
            className="text-xs tracking-[0.2em] uppercase hover:line-through transition-all duration-200 font-courier"
          >
            Store
          </Link>
          <Link
            href="/about"
            className="text-xs tracking-[0.2em] uppercase hover:line-through transition-all duration-200 font-courier"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
