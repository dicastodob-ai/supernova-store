'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (typeof i === 'number' && i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (typeof i === 'number' && i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      if (typeof i === 'number') {
        l = i;
      }
    }

    return rangeWithDots;
  };

  const pages = getPageNumbers();

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2 my-16 pt-8 border-t border-black select-none"
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className={`px-3 py-1.5 text-xs uppercase tracking-widest font-courier border border-black transition-colors ${
          currentPage <= 1
            ? 'opacity-20 cursor-not-allowed'
            : 'hover:bg-black hover:text-white cursor-pointer'
        }`}
      >
        ← Prev
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`dots-${idx}`}
                className="px-2 py-1 text-xs font-courier opacity-40 select-none"
              >
                ...
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              onClick={() => onPageChange(pageNum)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-w-[36px] px-2.5 py-1.5 text-xs font-courier tracking-wider uppercase border transition-colors ${
                isActive
                  ? 'bg-black text-white border-black font-bold'
                  : 'bg-white text-black border-transparent hover:border-black cursor-pointer'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className={`px-3 py-1.5 text-xs uppercase tracking-widest font-courier border border-black transition-colors ${
          currentPage >= totalPages
            ? 'opacity-20 cursor-not-allowed'
            : 'hover:bg-black hover:text-white cursor-pointer'
        }`}
      >
        Next →
      </button>
    </nav>
  );
}
