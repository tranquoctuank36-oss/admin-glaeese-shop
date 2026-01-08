"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  XCircle,
  Calendar,
  X,
  CalendarX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Routes } from "@/lib/routes";
import {
  getDiscountById,
  deleteDiscount,
  cancelDiscount,
  scheduleDiscount,
  unscheduleDiscount,
} from "@/services/discountService";
import type { Discount } from "@/types/discount";
import toast from "react-hot-toast";
import ConfirmPopover from "@/components/ConfirmPopover";
import DiscountTargetSelector from "@/components/discounts/DiscountTargetSelector";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import DiscountProductsViewer from "@/components/discounts/DiscountProductsViewer";

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

function getStatusBadge(status: string) {
  switch (status) {
    case "happening":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          Đang diễn ra
        </span>
      );
    case "scheduled":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          Đã lên lịch
        </span>
      );
    case "expired":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          Hết hạn
        </span>
      );
    case "canceled":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          Đã hủy
        </span>
      );
    case "draft":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          Bản nháp
        </span>
      );
    default:
      return null;
  }
}

function getTypeBadge(type: string) {
  switch (type) {
    case "percentage":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-700">
          Phần trăm
        </span>
      );
    case "fixed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">
          Số tiền cố định
        </span>
      );
    default:
      return null;
  }
}

function DiscountDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [discount, setDiscount] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleStartAt, setScheduleStartAt] = useState("");
  const [scheduleEndAt, setScheduleEndAt] = useState("");

  const fetchDiscount = async () => {
    try {
      setLoading(true);
      const data = await getDiscountById(id);
      setDiscount(data);
    } catch (error: any) {
      console.error("Failed to fetch discount:", error);
      toast.error(error?.response?.data?.detail || "Không thể tải thông tin giảm giá");
      router.push(Routes.sales.discounts.root);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscount();
  }, [id]);

  const handleCancel = async () => {
    if (!discount) return;
    try {
      setBusyAction(true);
      await cancelDiscount(discount.id);
      toast.success("Đã hủy chương trình giảm giá thành công");
      fetchDiscount();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể hủy chương trình giảm giá");
    } finally {
      setBusyAction(false);
    }
  };

  const handleDelete = async () => {
    if (!discount) return;
    try {
      setBusyAction(true);
      await deleteDiscount(discount.id);
      toast.success("Đã chuyển chương trình giảm giá vào thùng rác");
      router.push(Routes.sales.discounts.root);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể xóa chương trình giảm giá");
    } finally {
      setBusyAction(false);
    }
  };

  const handleSchedule = async () => {
    if (!discount || !scheduleStartAt || !scheduleEndAt) {
      toast.error("Vui lòng cung cấp cả ngày bắt đầu và kết thúc");
      return;
    }
    try {
      setBusyAction(true);
      // Convert from VN timezone to UTC before sending to server
      const startUTC = dayjs
        .tz(scheduleStartAt, "Asia/Ho_Chi_Minh")
        .utc()
        .toISOString();
      const endUTC = dayjs
        .tz(scheduleEndAt, "Asia/Ho_Chi_Minh")
        .utc()
        .toISOString();

      await scheduleDiscount(discount.id, {
        startAt: startUTC,
        endAt: endUTC,
      });
      toast.success("Đã lên lịch chương trình giảm giá thành công");
      setShowScheduleDialog(false);
      fetchDiscount();
    } catch (error: any) {
      console.error("Schedule error:", error);
      console.error("Error response:", error?.response?.data);
      toast.error(
        error?.response?.data?.detail || "Không thể lên lịch chương trình giảm giá"
      );
    } finally {
      setBusyAction(false);
    }
  };

  const handleUnschedule = async () => {
    if (!discount) return;
    try {
      setBusyAction(true);
      await unscheduleDiscount(discount.id);
      toast.success("Đã hủy lịch chương trình giảm giá thành công");
      fetchDiscount();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Không thể hủy lịch chương trình giảm giá"
      );
    } finally {
      setBusyAction(false);
    }
  };

  const openScheduleDialog = () => {
    if (discount?.startAt) {
      // Convert UTC to VN timezone for display
      setScheduleStartAt(
        dayjs
          .utc(discount.startAt)
          .tz("Asia/Ho_Chi_Minh")
          .format("YYYY-MM-DDTHH:mm")
      );
    } else {
      // Set default to tomorrow at current time
      setScheduleStartAt(
        dayjs().tz("Asia/Ho_Chi_Minh").add(1, "day").format("YYYY-MM-DDTHH:mm")
      );
    }

    if (discount?.endAt) {
      // Convert UTC to VN timezone for display
      setScheduleEndAt(
        dayjs
          .utc(discount.endAt)
          .tz("Asia/Ho_Chi_Minh")
          .format("YYYY-MM-DDTHH:mm")
      );
    } else {
      // Set default to 2 days from now at current time
      setScheduleEndAt(
        dayjs().tz("Asia/Ho_Chi_Minh").add(5, "day").format("YYYY-MM-DDTHH:mm")
      );
    }

    setShowScheduleDialog(true);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-600 text-lg">Đang tải...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!discount) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <p className="text-red-600 text-lg">Không tìm thấy mã giảm giá</p>
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
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                size="icon-lg"
                className="hover:bg-gray-300 rounded-full bg-gray-200"
                onClick={() => router.push(Routes.sales.discounts.root)}
                title="Quay lại"
              >
                <ArrowLeft className="text-gray-700 size-7" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Chi tiết chương trình giảm giá
                </h1>
                <p className="text-gray-600 mt-1">
                  Xem và quản lý thông tin giảm giá
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {(discount.status === "scheduled" ||
                discount.status === "draft") && (
                <Button
                  onClick={() =>
                    router.push(Routes.sales.discounts.edit(discount.id))
                  }
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  disabled={busyAction}
                >
                  <Edit size={18} />
                  Chỉnh sửa
                </Button>
              )}

              <Button
                onClick={openScheduleDialog}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={busyAction}
              >
                <Calendar size={18} />
                Lên lịch
              </Button>

              {discount.status === "scheduled" && (
                <ConfirmPopover
                  title="Hủy lịch chương trình giảm giá"
                  message={
                    <div>
                      Bạn có chắc muốn hủy lịch{" "}
                      <strong>{discount.name}</strong>?
                    </div>
                  }
                  confirmText="Hủy lịch"
                  onConfirm={handleUnschedule}
                >
                  <Button
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={busyAction}
                  >
                    <CalendarX size={18} />
                    Hủy lịch
                  </Button>
                </ConfirmPopover>
              )}

              <ConfirmPopover
                title="Hủy chương trình giảm giá"
                message={
                  <div>
                    Bạn có chắc muốn hủy{" "}
                    <strong>{discount.name}</strong>?
                  </div>
                }
                confirmText="Hủy giảm giá"
                onConfirm={handleCancel}
              >
                <Button
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={busyAction}
                >
                  <XCircle size={18} />
                  Hủy
                </Button>
              </ConfirmPopover>

              <ConfirmPopover
                title="Xóa giảm giá"
                message={
                  <div>
                    Bạn có chắc muốn xóa{" "}
                    <strong>{discount.name}</strong>?
                  </div>
                }
                confirmText="Xóa"
                onConfirm={handleDelete}
              >
                <Button
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                  disabled={busyAction}
                >
                  <Trash2 size={18} />
                  Xóa
                </Button>
              </ConfirmPopover>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Thông tin cơ bản
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Tên chương trình
                    </label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {discount.name}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Slug
                    </label>
                    <p className="text-gray-800 mt-1">
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {discount.slug}
                      </code>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Mô tả
                    </label>
                    <p className="text-gray-800 mt-1">
                      {discount.description || "-"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Loại giảm giá
                      </label>
                      <div className="mt-2">{getTypeBadge(discount.type)}</div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Giá trị giảm
                      </label>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {discount.type === "percentage"
                          ? `${parseFloat(discount.value) / 100}%`
                          : `${parseFloat(discount.value).toLocaleString(
                              "en-US"
                            )}đ`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Giảm tối đa
                      </label>

                      {discount.maxDiscountValue ? (
                        <p className="text-xl font-bold text-blue-600 mt-1">
                          {Number(discount.maxDiscountValue).toLocaleString(
                            "en-US"
                          )}
                          đ
                        </p>
                      ) : (
                        <p className="text-gray-400 mt-1">-</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Trạng thái
                      </label>
                      <div className="mt-2">
                        {getStatusBadge(discount.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Product Targets Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">
                    Sản phẩm áp dụng
                  </h2>
                  <div className="flex items-center gap-2">
                    <DiscountProductsViewer discountId={discount.id} />
                    <DiscountTargetSelector
                      discountId={discount.id}
                      onTargetsAdded={() => {
                        toast.success("Đã thêm sản phẩm vào chương trình giảm giá");
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Banner Image */}
              {discount.bannerImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
                >
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Ảnh banner
                  </h2>
                  <img
                    src={discount.bannerImage.publicUrl}
                    alt={discount.bannerImage.altText || "Banner"}
                    className="w-full rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() =>
                      setLightboxImage(discount.bannerImage!.publicUrl)
                    }
                  />
                </motion.div>
              )}

              {/* Date Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Thông tin thời gian
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Ngày bắt đầu
                    </label>
                    <p className="text-gray-800 mt-1">
                      {formatDateTime(discount.startAt)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Ngày kết thúc
                    </label>
                    <p className="text-gray-800 mt-1">
                      {formatDateTime(discount.endAt)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Ngày tạo
                    </label>
                    <p className="text-gray-800 mt-1">
                      {formatDateTime(discount.createdAt)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Ngày hủy
                    </label>
                    <p className="text-gray-800 mt-1">
                      {formatDateTime(discount.canceledAt)}
                    </p>
                  </div>
                </div>
              </motion.div>
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
              <ArrowLeft className="w-6 h-6 text-gray-800" />
            </Button>
            <div className="max-w-7xl max-h-[90vh] p-4">
              <img
                src={lightboxImage}
                alt="Banner"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        {/* Schedule Dialog */}
        <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800">
                Lên lịch chương trình giảm giá
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày & giờ bắt đầu
                </label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                  value={scheduleStartAt}
                  min={dayjs()
                    .tz("Asia/Ho_Chi_Minh")
                    .format("YYYY-MM-DDTHH:mm")}
                  onChange={(e) => {
                    const newStartAt = e.target.value;
                    const currentTime = dayjs()
                      .tz("Asia/Ho_Chi_Minh")
                      .format("YYYY-MM-DDTHH:mm");

                    // Prevent selecting time earlier than current time
                    if (newStartAt < currentTime) {
                      toast.error(
                        "Ngày bắt đầu không thể sớm hơn thời gian hiện tại"
                      );
                      return;
                    }

                    setScheduleStartAt(newStartAt);

                    // If End Date is set and is less than or equal to new Start Date, reset End Date
                    if (
                      scheduleEndAt &&
                      newStartAt &&
                      newStartAt >= scheduleEndAt
                    ) {
                      setScheduleEndAt("");
                      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày & giờ kết thúc
                </label>
                <input
                  type="datetime-local"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                  value={scheduleEndAt}
                  min={
                    scheduleStartAt ||
                    dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DDTHH:mm")
                  }
                  onChange={(e) => {
                    const newEndAt = e.target.value;
                    const minTime =
                      scheduleStartAt ||
                      dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DDTHH:mm");

                    // Prevent selecting time earlier than start date
                    if (newEndAt <= minTime) {
                      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
                      return;
                    }

                    setScheduleEndAt(newEndAt);
                  }}
                />
              </div>
            </div>

            <DialogFooter className="flex items-center gap-3">
              <Button
                onClick={() => setShowScheduleDialog(false)}
                disabled={busyAction}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSchedule}
                disabled={busyAction || !scheduleStartAt || !scheduleEndAt}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg disabled:opacity-50"
              >
                {busyAction ? "Đang lên lịch..." : "Lên lịch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default withAuthCheck(DiscountDetailsPage);
