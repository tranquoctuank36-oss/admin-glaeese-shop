"use client";

import React from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import type { RecentReview } from "@/types/dashboard";
import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);
dayjs.locale("vi");

interface RecentReviewsListProps {
  data: RecentReview[];
  loading?: boolean;
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Chờ duyệt" },
  approved: { bg: "bg-green-100", text: "text-green-700", label: "Đã duyệt" },
  rejected: { bg: "bg-red-100", text: "text-red-700", label: "Từ chối" },
};

export default function RecentReviewsList({
  data,
  loading = false,
}: RecentReviewsListProps) {
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
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Đánh giá gần đây
        </h3>
      </div>

      <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3">
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Không có đánh giá nào
          </div>
        ) : (
          data.map((review) => {
            const status = statusStyles[review.status] || statusStyles.pending;
            return (
              <div
                key={review.id}
                className="p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {review.productName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {review.customerName}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium ml-2 flex-shrink-0",
                      status.bg,
                      status.text
                    )}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        "w-4 h-4",
                        index < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">
                    {review.rating}/5
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {review.comment}
                </p>

                <p className="text-xs text-gray-500">
                  {dayjs(review.createdAt).fromNow()}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
