"use client";

import React from "react";
import Image from "next/image";
import type { TopSellingProduct } from "@/types/dashboard";
import { formatCurrency, formatCompactNumber } from "@/lib/dashboardUtils";
import { TrendingUp, Medal } from "lucide-react";

interface TopProductsTableProps {
  data: TopSellingProduct[];
  loading?: boolean;
}

export default function TopProductsTable({
  data,
  loading = false,
}: TopProductsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="h-80 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-600 bg-yellow-50";
    if (rank === 2) return "text-gray-600 bg-gray-50";
    if (rank === 3) return "text-orange-600 bg-orange-50";
    return "text-blue-600 bg-blue-50";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Top sản phẩm bán chạy
        </h3>
      </div>

      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                #
              </th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">
                Sản phẩm
              </th>
              <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">
                Đã bán
              </th>
              <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">
                Doanh thu
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              data.map((product) => (
                <tr
                  key={product.productId}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getRankColor(
                        product.rank
                      )}`}
                    >
                      {product.rank <= 3 ? (
                        <Medal className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-semibold">
                          {product.rank}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      {product.thumbnailUrl && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={product.thumbnailUrl}
                            alt={product.productName}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {product.productName}
                        </p>
                        <p className="text-sm text-gray-500">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center font-medium text-gray-900">
                    {formatCompactNumber(product.totalSold)}
                  </td>
                  <td className="py-3 px-2 text-center font-semibold text-blue-600">
                    {formatCurrency(product.revenue)}
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
