// components/TablePagination.tsx
"use client";

import Pagination from "@/components/listing/Pagination";
import { ChevronDown } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";

export type TablePaginationProps = {
  page: number; // 1-based
  limit: number; // 10/20/50/…
  totalPages?: number;
  totalItems?: number;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  limitOptions?: number[];
  className?: string;
};

export default memo(function TablePagination({
  page,
  limit,
  totalPages,
  totalItems,
  hasPrev,
  hasNext,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 20, 30, 50],
  className = "",
}: TablePaginationProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelectOption = (value: number) => {
    onLimitChange(value);
    setOpen(false);
  };

  return (
    <div
      className={`flex items-center justify-between p-4 border-t border-gray-200 ${className}`}
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-600">Hàng trên trang:</span>
        
        <div className="relative w-[70px]" ref={containerRef}>
          <div
            onClick={() => setOpen(!open)}
            className={`
              w-full h-9 px-3 rounded-md border bg-white text-sm cursor-pointer
              flex items-center justify-between transition
              hover:border-gray-400
              ${open ? "border-2 border-blue-400" : "border-gray-300"}
            `}
          >
            <span className="text-gray-800 font-medium">{limit}</span>
            <ChevronDown 
              className={`size-4 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} 
            />
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {limitOptions.map((n) => (
                  <div
                    key={n}
                    onClick={() => handleSelectOption(n)}
                    className={`
                      px-3 py-2 cursor-pointer transition-colors text-sm
                      ${n === limit 
                        ? "bg-blue-50 text-blue-600 font-medium" 
                        : "hover:bg-gray-100 text-gray-800"
                      }
                    `}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onChange={(p) => {
          const capped = totalPages ? Math.min(p, totalPages) : p;
          onPageChange(Math.max(1, capped));
        }}
      />
    </div>
  );
});
