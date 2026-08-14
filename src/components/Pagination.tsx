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
      className="flex flex-wrap items-center justify-center gap-2 my-14 pt-8 border-t border-[#ECECE8] select-none"
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border transition-all ${
          currentPage <= 1
            ? 'opacity-30 border-[#ECECE8] text-[#5C6479] cursor-not-allowed'
            : 'border-[#ECECE8] bg-white text-[#0B2545] hover:border-[#D96B27] hover:text-[#D96B27] cursor-pointer shadow-sm'
        }`}
      >
        ← Prev
      </button>

      <div className="flex items-center gap-1.5">
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`dots-${idx}`}
                className="px-2 py-1 text-xs text-[#5C6479] select-none"
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
              className={`min-w-[36px] h-[36px] px-2 text-xs font-bold rounded-full transition-all flex items-center justify-center ${
                isActive
                  ? 'bg-[#0B2545] text-white shadow-sm'
                  : 'bg-white text-[#2D3142] border border-[#ECECE8] hover:border-[#D96B27] hover:text-[#D96B27] cursor-pointer'
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
        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border transition-all ${
          currentPage >= totalPages
            ? 'opacity-30 border-[#ECECE8] text-[#5C6479] cursor-not-allowed'
            : 'border-[#ECECE8] bg-white text-[#0B2545] hover:border-[#D96B27] hover:text-[#D96B27] cursor-pointer shadow-sm'
        }`}
      >
        Next →
      </button>
    </nav>
  );
}
