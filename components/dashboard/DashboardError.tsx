"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface DashboardErrorProps {
  error: Error;
  refetch?: () => void;
}

export default function DashboardError({
  error,
  refetch,
}: DashboardErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center h-96 p-6">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Không thể tải dữ liệu dashboard
      </h3>
      <p className="text-gray-600 mb-4 text-center max-w-md">
        {error.message || "Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại."}
      </p>
      {refetch && (
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
