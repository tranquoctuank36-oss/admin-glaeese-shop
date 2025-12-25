// components/TablePagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { memo, useMemo } from "react";

export type TablePaginationProps = {
  page: number; // 1-based
  pageSize: number; // 10/20/50/…
  total: number; // tổng bản ghi
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

function createRange(start: number, end: number) {
  return Array.from(
    { length: Math.max(0, end - start + 1) },
    (_, i) => start + i
  );
}

function Ellipsis() {
  return <span className="px-2 text-gray-500">…</span>;
}

export default memo(function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = "",
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

  const pages = useMemo(() => {
    // thuật toán compact: 1 2 ... [p-1 p p+1] ... n-1 n
    if (totalPages <= 7) return createRange(1, totalPages);

    const window: number[] = [];
    window.push(1);
    if (page > 4) window.push(-1); // -1 = ellipsis

    const from = Math.max(2, page - 1);
    const to = Math.min(totalPages - 1, page + 1);
    window.push(...createRange(from, to));

    if (page < totalPages - 3) window.push(-2); // -2 = ellipsis
    window.push(totalPages);
    return window;
  }, [page, totalPages]);

  const fromIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toIdx = Math.min(page * pageSize, total);

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="text-sm text-gray-600">
        {total === 0 ? "No records" : `Showing ${fromIdx}-${toIdx} of ${total}`}
      </div>

      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center">
          <button
            className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="mx-1 flex items-center">
            {pages.map((p, i) =>
              p > 0 ? (
                <button
                  key={`${p}-${i}`}
                  onClick={() => onPageChange(p)}
                  className={`mx-0.5 h-9 min-w-9 px-3 rounded-md text-sm border ${
                    p === page
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ) : (
                <Ellipsis key={`e-${i}`} />
              )
            )}
          </div>

          <button
            className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
