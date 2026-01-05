"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Star,
  Search,
  Filter,
  Check,
  X,
  EyeOff,
  Trash2,
  Calendar,
  ChevronDown,
  Eye,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReviews, bulkUpdateReviews } from "@/services/reviewService";
import type { Review, ReviewStatus } from "@/types/review";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import Pagination from "@/components/data/Pagination";
import { Routes } from "@/lib/routes";

dayjs.extend(utc);
dayjs.extend(timezone);

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    return dayjs
      .utc(dateString)
      .tz("Asia/Ho_Chi_Minh")
      .format("DD/MM/YYYY HH:mm");
  } catch {
    return "-";
  }
};

function getStatusBadge(status: ReviewStatus) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          Đã duyệt
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
          Đang chờ
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          Đã từ chối
        </span>
      );
    case "hidden":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          Ẩn
        </span>
      );
    default:
      return null;
  }
}

function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "">("");
  const [ratingFilter, setRatingFilter] = useState<number | "">("");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(20);
  const [lightboxImage, setLightboxImage] = useState<{url: string, alt: string} | null>(null);
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>("pending");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [editMode, setEditMode] = useState<"single" | "bulk">("bulk");
  const [singleReviewId, setSingleReviewId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const result = await getReviews({
        page,
        limit,
        search: search || undefined,
        status: statusFilter || undefined,
        rating: ratingFilter || undefined,
        sortField: "createdAt",
        sortOrder,
      });

      setReviews(result.data);
      setTotalPages(result.meta?.totalPages || 1);
      setTotalItems(result.meta?.totalItems || 0);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, limit, statusFilter, ratingFilter, sortOrder]);

  const handleSearch = () => {
    setPage(1);
    fetchReviews();
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setRatingFilter("");
    setSortOrder("DESC");
    setLimit(20);
    setPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReviews(new Set(reviews.map(r => r.id)));
    } else {
      setSelectedReviews(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedReviews);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedReviews(newSelected);
  };

  const handleBulkUpdate = async () => {
    const reviewIds = editMode === "single" && singleReviewId 
      ? [singleReviewId] 
      : Array.from(selectedReviews);

    if (reviewIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một đánh giá");
      return;
    }

    try {
      setIsBulkUpdating(true);
      await bulkUpdateReviews({
        reviewIds,
        status: selectedStatus,
      });
      toast.success(`Đã cập nhật ${reviewIds.length} đánh giá thành công`);
      setShowStatusDialog(false);
      setSelectedReviews(new Set());
      setSingleReviewId(null);
      setEditMode("bulk");
      fetchReviews();
    } catch (error: any) {
      console.error("Failed to bulk update reviews:", error);
      toast.error(error?.response?.data?.message || "Cập nhật đánh giá thất bại");
    } finally {
      setIsBulkUpdating(false);
    }
  };


  const getDisplayName = (nameDisplay: Record<string, any> | null) => {
    if (!nameDisplay) return "Ẩn danh";
    if (typeof nameDisplay === "string") return nameDisplay;
    const keys = Object.keys(nameDisplay);
    if (keys.length > 0) {
      return nameDisplay[keys[0]] || keys[0] || "Ẩn danh";
    }
    return "Ẩn danh";
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
        <span className="ml-1 text-sm font-semibold text-gray-700">
          {rating}
        </span>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Quản lý đánh giá ({totalItems})
                </h1>
                <p className="text-gray-600 mt-1">
                  Quản lý và kiểm duyệt đánh giá sản phẩm
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm đánh giá theo tên hiển thị, bình luận, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 h-[42px] px-4 bg-white text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Filter size={20} />
                  Bộ lọc
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 mt-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value as ReviewStatus | "");
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="pending">Đang chờ</option>
                      <option value="approved">Đã duyệt</option>
                      <option value="rejected">Đã từ chối</option>
                      <option value="hidden">Đã ẩn</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đánh giá
                    </label>
                    <select
                      value={ratingFilter}
                      onChange={(e) => {
                        setRatingFilter(
                          e.target.value ? Number(e.target.value) : ""
                        );
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tất cả đánh giá</option>
                      <option value="5">5 Sao</option>
                      <option value="4">4 Sao</option>
                      <option value="3">3 Sao</option>
                      <option value="2">2 Sao</option>
                      <option value="1">1 Sao</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sắp xếp
                    </label>
                    <select
                      value={sortOrder}
                      onChange={(e) => {
                        setSortOrder(e.target.value as "ASC" | "DESC");
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DESC">Ngày tạo giảm dần</option>
                      <option value="ASC">Ngày tạo tăng dần</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Reset Button */}
              {showFilters && (
                <div className="flex justify-end mt-3">
                  <Button
                    onClick={handleResetFilters}
                    className="hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
                  >
                    Đặt lại
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Selected Items Bar */}
          {selectedReviews.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 rounded-xl shadow-md border border-blue-200 p-4 mb-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-semibold">
                  {selectedReviews.size} đánh giá đã chọn
                </span>
                <Button
                  onClick={() => {
                    setEditMode("bulk");
                    setShowStatusDialog(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold"
                >
                  Cập nhật trạng thái
                </Button>
              </div>
            </motion.div>
          )}

          {/* Reviews Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Đang tải đánh giá...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="mx-auto size-12 text-gray-300 mb-3" />
                <p className="text-gray-600">Không tìm thấy đánh giá nào</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedReviews.size === reviews.length && reviews.length > 0}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                          Sản phẩm
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                          Đánh giá
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                          Tên hiển thị 
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                          Trạng thái
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                          Ngày
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reviews.map((review) => (
                        <motion.tr
                          key={review.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedReviews.has(review.id)}
                              onChange={(e) => handleSelectOne(review.id, e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {review.orderItem?.thumbnailUrl && (
                                <img
                                  src={review.orderItem.thumbnailUrl}
                                  alt={review.orderItem.productName}
                                  className="w-12 h-12 rounded-lg object-contain border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setLightboxImage({url: review.orderItem.thumbnailUrl, alt: review.orderItem.productName})}
                                />
                              )}
                              <div>
                                <p className="font-medium text-gray-900 text-sm whitespace-nowrap">
                                  {review.orderItem?.productName}
                                </p>
                                <p className="text-xs text-gray-500 whitespace-nowrap">
                                  {review.orderItem?.productVariantName}
                                </p>
                                <p className="text-xs text-gray-500 whitespace-nowrap">
                                  Màu sắc: {review.orderItem?.colors}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderStars(review.rating)}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700 whitespace-nowrap">
                              {getDisplayName(review.nameDisplay)}
                            </p>
                            {review.user?.email && (
                              <p className="text-xs text-gray-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                Email: {review.user.email}
                              </p>
                            )}
                          </td>
                          {/* <td className="px-6 py-4">
                            <div className="max-w-xs">
                              {review.comment && review.comment.length > 0 ? (
                                <p className="text-sm text-gray-700 break-words whitespace-normal">
                                  {JSON.stringify(review.comment)}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-400 italic">
                                  -
                                </p>
                              )}
                              {review.image && review.image.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {review.image.slice(0, 3).map((img, idx) => (
                                    <img
                                      key={idx}
                                      src={img.publicUrl}
                                      alt={img.altText || "Review image"}
                                      className="w-10 h-10 rounded object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => setLightboxImage({url: img.publicUrl, alt: img.altText || "Review image"})}
                                    />
                                  ))}
                                  {review.image.length > 3 && (
                                    <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                                      <span className="text-xs text-gray-600">
                                        +{review.image.length - 3}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td> */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(review.status)}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700">
                              {formatDateTime(review.createdAt)}
                            </p>
                            {review.isEdited && (
                              <p className="text-xs text-gray-500 mt-1">
                                Đã chỉnh sửa: {formatDateTime(review.updatedAt)}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Xem chi tiết"
                                onClick={() => {
                                  router.push(Routes.reviews.details(review.id));
                                }}
                              >
                                <Eye className="text-blue-600 size-5" />
                              </Button>
                              <span className="text-gray-500 text-sm leading-none">
                                |
                              </span>
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                title="Chỉnh sửa"
                                onClick={() => {
                                  setEditMode("single");
                                  setSingleReviewId(review.id);
                                  setSelectedStatus(review.status);
                                  setShowStatusDialog(true);
                                }}
                              >
                                <Edit className="text-green-600 size-5" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <span>Số hàng mỗi trang:</span>
                    <select
                      className="border rounded-md px-2 py-1"
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    hasPrev={page > 1}
                    hasNext={page < totalPages}
                    onChange={(p) => {
                      const capped = totalPages
                        ? Math.min(p, totalPages)
                        : p;
                      setPage(Math.max(1, capped));
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Status Update Dialog */}
        {showStatusDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 bg-opacity-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Cập nhật trạng thái đánh giá
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {editMode === "single" 
                  ? "Bạn đang cập nhật trạng thái cho 1 đánh giá"
                  : `Bạn đang cập nhật trạng thái cho ${selectedReviews.size} đánh giá`
                }
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn trạng thái mới
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ReviewStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isBulkUpdating}
                >
                  <option value="approved">Đã duyệt</option>
                  <option value="pending">Đang chờ</option>
                  <option value="rejected">Đã từ chối</option>
                  <option value="hidden">Ẩn</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => {
                    setShowStatusDialog(false);
                    setSelectedStatus("pending");
                    setSingleReviewId(null);
                    setEditMode("bulk");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg"
                  disabled={isBulkUpdating}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleBulkUpdate}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isBulkUpdating}
                >
                  {isBulkUpdating ? "Đang cập nhật..." : "Xác nhận"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
            onClick={() => setLightboxImage(null)}
          >
            <Button
              className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-gray-200 transition-colors"
              onClick={() => setLightboxImage(null)}
              title="Đóng"
            >
              <X className="w-6 h-6 text-gray-800" />
            </Button>
            <div className="max-w-7xl max-h-[90vh] p-4">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.alt}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default withAuthCheck(ReviewsPage);
