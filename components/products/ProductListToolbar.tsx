"use client";

import { motion } from "framer-motion";
import { Filter, Search } from "lucide-react";
import React from "react";

type Props = {
  value: string;
  onSearchChange: (v: string) => void;

  showFilters: boolean;
  onToggleFilters: () => void;

  /** Khu vực filter nâng cao (tùy chọn) */
  children?: React.ReactNode;

  /** Khi gõ search nên reset trang về 1 – trang cha truyền vào */
  onSearchSideEffect?: () => void;

  /** Placeholder cho input search (tùy chọn) */
  placeholder?: string;
};

export default function ProductListToolbar({
  value,
  onSearchChange,
  showFilters,
  onToggleFilters,
  children,
  onSearchSideEffect,
  placeholder = "Tìm kiếm theo tên, SKU hoặc thương hiệu...",
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onSearchSideEffect?.();
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg ${
            showFilters ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Filter size={20} />
          Bộ lọc
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {children ?? <div className="text-sm text-gray-500">Thêm bộ lọc...</div>}
        </motion.div>
      )}
    </div>
  );
}
