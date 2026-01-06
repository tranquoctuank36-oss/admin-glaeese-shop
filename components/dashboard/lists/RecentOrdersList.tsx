"use client";

import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import type { RecentOrder } from "@/types/dashboard";
import { formatCurrency } from "@/lib/dashboardUtils";
import { Clock, Package } from "lucide-react";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);
dayjs.locale("vi");

interface RecentOrdersListProps {
  data: RecentOrder[];
  loading?: boolean;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Chờ xử lý" },
  processing: { bg: "bg-blue-100", text: "text-blue-700", label: "Đang xử lý" },
  shipping: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Đang giao" },
  delivered: { bg: "bg-green-100", text: "text-green-700", label: "Đã giao" },
  completed: { bg: "bg-green-100", text: "text-green-700", label: "Hoàn thành" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Đã hủy" },
  returned: { bg: "bg-pink-100", text: "text-pink-700", label: "Trả hàng" },
};

export default function RecentOrdersList({
  data,
  loading = false,
}: RecentOrdersListProps) {
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
          <Package className="w-5 h-5 text-blue-600" />
          Đơn hàng gần đây
        </h3>
      </div>

      <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Không có đơn hàng nào
          </div>
        ) : (
          data.map((order) => {
            const status = statusStyles[order.status] || statusStyles.pending;
            return (
              <div
                key={order.id}
                className="flex items-start justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">
                      {order.orderCode}
                    </p>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        status.bg,
                        status.text
                      )}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {order.customerName}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {dayjs(order.createdAt).fromNow()}
                    </span>
                    <span>•</span>
                    <span>{order.itemCount} sản phẩm</span>
                    <span>•</span>
                    <span>{order.paymentMethod === "cod" ? "COD" : "VNPAY"}</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-blue-600">
                    {formatCurrency(order.grandTotal)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
