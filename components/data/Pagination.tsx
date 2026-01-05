"use client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export default function Pagination({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onChange,
  className,
}: {
  page: number;
  totalPages?: number; 
  hasPrev?: boolean;
  hasNext?: boolean;
  onChange: (page: number) => void;
  className?: string;
}) {

  const disablePrev = hasPrev !== undefined ? !hasPrev : page <= 1;
  const disableNext =
    hasNext !== undefined
      ? !hasNext
      : totalPages !== undefined
      ? page >= totalPages
      : false;


  const disableFirst = page <= 1;
  const disableLast =
    totalPages !== undefined ? page >= totalPages : true; 

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      {/* First */}
      <Button
        variant="outline"
        className="h-9 px-3 cursor-pointer"
        disabled={disableFirst}
        onClick={() => !disableFirst && onChange(1)}
        title="Trang đầu"
        aria-label="Trang đầu"
      >
        <ChevronsLeft size={16} />
      </Button>

      {/* Prev */}
      <Button
        variant="outline"
        className="h-9 px-3 cursor-pointer"
        disabled={disablePrev}
        onClick={() => !disablePrev && onChange(page - 1)}
        title="Trang trước"
        aria-label="Trang trước"
      >
        <ChevronLeft size={16} />
      </Button>

      <span className="text-sm text-gray-600">
        Trang <b>{page}</b>{totalPages ? <> / {totalPages}</> : null}
      </span>

      {/* Next */}
      <Button
        variant="outline"
        className="h-9 px-3 cursor-pointer"
        disabled={disableNext}
        onClick={() => !disableNext && onChange(page + 1)}
        title="Trang sau"
        aria-label="Trang sau"
      >
        <ChevronRight size={16} />
      </Button>

      {/* Last */}
      <Button
        variant="outline"
        className="h-9 px-3 cursor-pointer"
        disabled={disableLast}
        onClick={() =>
          !disableLast && totalPages !== undefined && onChange(totalPages)
        }
        title="Trang cuối"
        aria-label="Trang cuối"
      >
        <ChevronsRight size={16} />
      </Button>
    </div>
  );
}
