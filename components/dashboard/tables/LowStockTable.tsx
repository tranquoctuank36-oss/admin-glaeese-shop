"use client";

import React from "react";
import type { LowStockProduct } from "@/types/dashboard";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LowStockTableProps {
  data: LowStockProduct[];
  loading?: boolean;
}

export default function LowStockTable({
  data,
  loading = false,
}: LowStockTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="h-80 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Cảnh báo tồn kho
        </h3>
        <span className="text-sm text-gray-500">{data.length} sản phẩm</span>
      </div>

      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                Sản phẩm
              </th>
              <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">
                Tồn kho
              </th>
              <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">
                Mức an toàn
              </th>
              <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  Không có cảnh báo tồn kho
                </td>
              </tr>
            ) : (
              data.map((product) => (
                <tr
                  key={product.variantId}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {product.variantName}
                      </p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm font-medium",
                        product.currentStock === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      )}
                    >
                      {product.currentStock}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center text-gray-600">
                    {product.safetyStock}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-center">
                      {product.alertType === "out_of_stock" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertCircle className="w-3 h-3" />
                          Hết hàng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          <AlertTriangle className="w-3 h-3" />
                          Sắp hết
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
