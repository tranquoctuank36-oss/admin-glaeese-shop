"use client";

import { useState } from "react";
import type { StatsPeriod } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface PeriodSelectorProps {
  value: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
}

const periods: { value: StatsPeriod; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
  { value: "quarter", label: "Quý này" },
  { value: "year", label: "Năm này" },
];

export default function PeriodSelector({
  value,
  onChange,
}: PeriodSelectorProps) {
  return (
    <div className="inline-flex bg-white rounded-lg border border-gray-200 shadow-sm p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onChange(period.value)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer",
            value === period.value
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
