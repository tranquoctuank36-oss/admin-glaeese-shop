"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Check,
  X,
  EyeOff,
  Calendar,
  User,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getReviewById } from "@/services/reviewService";
import type { Review, ReviewStatus } from "@/types/review";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
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
        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">
          Đã duyệt
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
          Đang chờ
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-700">
          Đã từ chối
        </span>
      );
    case "hidden":
      return (
        <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
          Ẩn
        </span>
      );
    default:
      return null;
  }
}

function ReviewDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  useEffect(() => {
    if (reviewId) {
      fetchReviewDetails();
    }
  }, [reviewId]);

  const fetchReviewDetails = async () => {
    try {
      setLoading(true);
      const result = await getReviewById(reviewId);
      setReview(result);
    } catch (error) {
      console.error("Failed to fetch review details:", error);
      toast.error("Không thể tải chi tiết đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            className={
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }
          />
        ))}
        <span className="ml-2 text-xl font-semibold text-gray-700">
          {rating}/5
        </span>
      </div>
    );
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

  if (loading) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Đang tải chi tiết đánh giá...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Không tìm thấy đánh giá</p>
            <Button
              onClick={() => router.push("/reviews")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
            >
              Quay lại danh sách
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
              size="icon-lg"
                onClick={() => router.back()}
                className="hover:bg-gray-300 rounded-full bg-gray-200"
                title="Quay lại"
              >
                <ArrowLeft className="text-gray-700 size-7" />
              </Button>

              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Chi tiết đánh giá
                </h1>
              </div>
            </div>
            <div>{getStatusBadge(review.status)}</div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Product & Rating */}
            <div className="lg:col-span-1 space-y-6">
              {/* Product Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Thông tin sản phẩm
                  </h2>
                </div>  
                {review.orderItem?.thumbnailUrl && (
                  <img
                    src={review.orderItem.thumbnailUrl}
                    alt={review.orderItem.productName}
                    className="w-full rounded-lg object-contain border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity mb-4"
                    onClick={() =>
                      setLightboxImage({
                        url: review.orderItem.thumbnailUrl,
                        alt: review.orderItem.productName,
                      })
                    }
                  />
                )}
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">
                    {review.orderItem?.productName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Variant: {review.orderItem?.productVariantName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Màu sắc: {review.orderItem?.colors}
                  </p>
                  <p className="text-sm text-gray-600">
                    Số lượng: {review.orderItem?.quantity}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {Number(review.orderItem?.finalPrice).toLocaleString('en-US')}đ
                    </span>
                    {review.orderItem?.originalPrice !== review.orderItem?.finalPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {Number(review.orderItem?.originalPrice).toLocaleString('en-US')}đ
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Đánh giá
                  </h2>
                </div>
                {renderStars(review.rating)}
              </div>

              {/* Reviewer Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Người đánh giá
                  </h2>
                </div>
                <p className="text-gray-900 font-medium">
                  {getDisplayName(review.nameDisplay)}
                </p>
                {review.user?.email && (
                  <p className="text-sm text-gray-600 mt-2">
                    Email: {review.user.email}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Comment */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Bình luận
                </h2>
                {review.comment && review.comment.length > 0 ? (
                  <div className="text-gray-700">
                    {JSON.stringify(review.comment)}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">Không có bình luận</p>
                )}
              </div>

              {/* Images */}
              {review.image && review.image.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-800">
                      Hình ảnh
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {review.image.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.publicUrl}
                        alt={img.altText || `Review image ${idx + 1}`}
                        className="w-full h-48 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() =>
                          setLightboxImage({
                            url: img.publicUrl,
                            alt: img.altText || `Review image ${idx + 1}`,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    Thông tin thời gian
                  </h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ngày tạo:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(review.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ngày cập nhật:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(review.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

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

export default withAuthCheck(ReviewDetailsPage);
