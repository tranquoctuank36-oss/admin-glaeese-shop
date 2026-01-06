"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Calendar,
  FileText,
  DollarSign,
  CreditCard,
  Building2,
  ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  X,
} from "lucide-react";
import { getReturnById, updateReturnStatus, completeRefundForCOD } from "@/services/returnService";
import { Return } from "@/types/return";
import { Routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import Image from "next/image";
import ConfirmPopover from "@/components/ConfirmPopover";

export default function ReturnDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [returnData, setReturnData] = useState<Return | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchReturn = async () => {
      try {
        setLoading(true);
        const data = await getReturnById(id);
        setReturnData(data);
      } catch (error) {
        console.error("Failed to fetch return:", error);
        toast.error("Không thể tải thông tin trả hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchReturn();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string, additionalData?: { adminNote?: string; rejectedReason?: string; refundAmount?: string }) => {
    if (!returnData) return;

    try {
      setUpdating(true);
      
      // Handle COD refund completion separately
      if (newStatus === "complete_refund_cod") {
        await completeRefundForCOD(returnData.id);
        toast.success("Đã xác nhận hoàn tiền COD thành công");
      } else {
        await updateReturnStatus(
          returnData.id, 
          newStatus,
          additionalData?.adminNote,
          additionalData?.rejectedReason,
          additionalData?.refundAmount
        );
        toast.success("Đã cập nhật trạng thái");
      }

      // Refresh data
      const data = await getReturnById(id);
      setReturnData(data);
      
      // Reset dialog state
      setShowRefundDialog(false);
      setShowRejectDialog(false);
      setAdminNote("");
      setRefundAmount("");
      setRejectedReason("");
    } catch (error: any) {
      console.error("Failed to update status:", error);
      const errorMessage = error.response?.data?.detail || error.detail || "Không thể cập nhật trạng thái";
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "approved":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "waiting_item":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "received_at_warehouse":
        return "bg-indigo-100 text-indigo-700 border-indigo-300";
      case "refund_initiated":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "refund_completed":
        return "bg-green-100 text-green-700 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-300";
      case "canceled":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "requested":
        return "Yêu cầu mới";
      case "approved":
        return "Đã duyệt";
      case "waiting_item":
        return "Chờ hàng về";
      case "received_at_warehouse":
        return "Đã nhận hàng";
      case "refund_initiated":
        return "Đang hoàn tiền";
      case "refund_completed":
        return "Đã hoàn tiền";
      case "rejected":
        return "Đã từ chối";
      case "canceled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getStatusActions = (status: string) => {
    const isCOD = returnData?.order?.paymentMethod === "COD";
    
    switch (status) {
      case "requested":
        return [
          { label: "Duyệt yêu cầu", value: "approved", color: "blue" },
          { label: "Từ chối", value: "rejected", color: "red" },
        ];
      case "approved":
        return [
          {
            label: "Đã nhận hàng",
            value: "received_at_warehouse",
            color: "indigo",
          },
        ];
      case "received_at_warehouse":
        return [
          {
            label: "Bắt đầu hoàn tiền",
            value: "refund_initiated",
            color: "orange",
          },
        ];
      case "refund_initiated":
        return [
          {
            label: isCOD ? "Xác nhận đã hoàn tiền COD" : "Hoàn tiền thành công",
            value: isCOD ? "complete_refund_cod" : "refund_completed",
            color: "green",
          },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy thông tin trả hàng</p>
          <Button
            onClick={() => router.push(Routes.orders.returns)}
            className="mt-4"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              size="icon-lg"
              className="hover:bg-gray-300 rounded-full bg-gray-200"
              onClick={() => router.back()}
              title="Quay lại"
            >
              <ArrowLeft className="text-gray-700 size-7" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Chi tiết yêu cầu trả hàng
              </h1>
              <div className="mt-1 space-y-0.5">
                <p className="text-gray-600">
                  Mã trả hàng: <span className="font-semibold text-blue-600">{returnData.returnCode}</span>
                </p>
                <p className="text-gray-600">
                  Mã đơn hàng: <span className="font-semibold">{returnData.orderCode}</span>
                </p>
              </div>
            </div>
          </div>
          <div>
            <span
              className={`inline-block px-4 py-2 rounded-lg text-sm font-medium border ${getStatusColor(
                returnData.status
              )}`}
            >
              {getStatusLabel(returnData.status)}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Return Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow border border-gray-200 p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Thông tin trả hàng
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-600">
                  Lý do trả hàng
                </label>
                <p className="mt-1 text-gray-900">{returnData.reason}</p>
              </div>

              {returnData.customerNote && (
                <div>
                  <label className="text-sm font-bold text-gray-600">
                    Ghi chú khách hàng
                  </label>
                  <p className="mt-1 text-gray-700">
                    {typeof returnData.customerNote === "string"
                      ? returnData.customerNote
                      : JSON.stringify(returnData.customerNote)}
                  </p>
                </div>
              )}

              {returnData.adminNote &&
                Object.keys(returnData.adminNote).length > 0 && (
                  <div>
                    <label className="text-sm font-bold text-gray-600">
                      Ghi chú nội bộ
                    </label>
                    <p className="mt-1 text-gray-700">
                      {typeof returnData.adminNote === "string"
                        ? returnData.adminNote
                        : JSON.stringify(returnData.adminNote)}
                    </p>
                  </div>
                )}

              {returnData.rejectedReason &&
                Object.keys(returnData.rejectedReason).length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <label className="text-sm font-bold text-red-800">
                      Lý do từ chối
                    </label>
                    <p className="mt-1 text-red-700">
                      {typeof returnData.rejectedReason === "string"
                        ? returnData.rejectedReason
                        : JSON.stringify(returnData.rejectedReason)}
                    </p>
                  </div>
                )}

              {returnData.images && returnData.images.length > 0 && (
                <div>
                  <label className="text-sm font-bold text-gray-600 flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" />
                    Hình ảnh ({returnData.images.length})
                  </label>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {returnData.images.map((image) => (
                      <div
                        key={image.id}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors cursor-pointer"
                        onClick={() => setLightboxImage({ url: image.publicUrl, alt: image.altText || "Return image" })}
                      >
                        <Image
                          src={image.publicUrl}
                          alt={image.altText || "Return image"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Payment Information */}
          {(returnData.calculatedRefundAmount || returnData.refundAmount || returnData.bankAccountName || returnData.bankAccountNumber || returnData.bankName) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Thông tin hoàn tiền
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {returnData.calculatedRefundAmount && (
                  <div>
                    <label className="text-sm font-bold text-gray-600">
                      Số tiền hoàn được tính
                    </label>
                    <p className="mt-1 text-lg font-semibold text-blue-600">
                      {typeof returnData.calculatedRefundAmount === "string"
                        ? parseFloat(returnData.calculatedRefundAmount).toLocaleString(
                            "en-US"
                          )
                        : "-"}
                      đ
                    </p>
                  </div>
                )}

                {returnData.refundAmount && (
                  <div>
                    <label className="text-sm font-bold text-gray-600">
                      Số tiền hoàn thực tế
                    </label>
                    <p className="mt-1 text-lg font-semibold text-red-600">
                      {typeof returnData.refundAmount === "string"
                        ? parseFloat(returnData.refundAmount).toLocaleString(
                            "en-US"
                          )
                        : "-"}
                      đ
                    </p>
                  </div>
                )}

                {returnData.bankAccountName && (
                  <div>
                    <label className="text-sm font-bold text-gray-600 flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      Tên tài khoản
                    </label>
                    <p className="mt-1 text-gray-900">
                      {typeof returnData.bankAccountName === "string"
                        ? returnData.bankAccountName
                        : JSON.stringify(returnData.bankAccountName)}
                    </p>
                  </div>
                )}

                {returnData.bankAccountNumber && (
                  <div>
                    <label className="text-sm font-bold text-gray-600">
                      Số tài khoản
                    </label>
                    <p className="mt-1 text-gray-900 font-mono">
                      {typeof returnData.bankAccountNumber === "string"
                        ? returnData.bankAccountNumber
                        : JSON.stringify(returnData.bankAccountNumber)}
                    </p>
                  </div>
                )}

                {returnData.bankName && (
                  <div>
                    <label className="text-sm font-bold text-gray-600 flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      Ngân hàng
                    </label>
                    <p className="mt-1 text-gray-900">
                      {typeof returnData.bankName === "string"
                        ? returnData.bankName
                        : JSON.stringify(returnData.bankName)}
                    </p>
                  </div>
                )}

                {returnData.bankBranch && (
                  <div>
                    <label className="text-sm font-bold text-gray-600">
                      Chi nhánh
                    </label>
                    <p className="mt-1 text-gray-900">
                      {typeof returnData.bankBranch === "string"
                        ? returnData.bankBranch
                        : JSON.stringify(returnData.bankBranch)}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Column - Timeline & Actions */}
        <div className="space-y-6">
          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow border border-gray-200 p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Thời gian
            </h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-600">Ngày tạo</p>
                  <p className="text-sm text-gray-900">
                    {new Date(returnData.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              {returnData.createdAt !== returnData.updatedAt && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-600">
                      Cập nhật lần cuối
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Date(returnData.updatedAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              )}

              {returnData.receivedAt &&
                Object.keys(returnData.receivedAt).length > 0 && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-600">
                        Ngày nhận hàng
                      </p>
                      <p className="text-sm text-gray-900">
                        {typeof returnData.receivedAt === "string"
                          ? new Date(returnData.receivedAt).toLocaleString(
                              "vi-VN"
                            )
                          : JSON.stringify(returnData.receivedAt)}
                      </p>
                    </div>
                  </div>
                )}

              {returnData.refundCompletedAt &&
                Object.keys(returnData.refundCompletedAt).length > 0 && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-gray-600">
                        Ngày hoàn tiền
                      </p>
                      <p className="text-sm text-gray-900">
                        {typeof returnData.refundCompletedAt === "string"
                          ? new Date(
                              returnData.refundCompletedAt
                            ).toLocaleString("vi-VN")
                          : JSON.stringify(returnData.refundCompletedAt)}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </motion.div>

          {/* Actions */}
          {getStatusActions(returnData.status).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Thao tác
              </h2>

              <div className="space-y-3">
                {getStatusActions(returnData.status).map((action) => {
                  // For approve action, use confirm popover
                  if (action.value === "approved") {
                    return (
                      <ConfirmPopover
                        key={action.value}
                        title="Xác nhận duyệt yêu cầu?"
                        message="Bạn có chắc chắn muốn duyệt yêu cầu trả hàng này?"
                        onConfirm={() => handleStatusUpdate(action.value)}
                        confirmText={action.label}
                        cancelText="Hủy"
                        confirmLoading={updating}
                        confirmClassName="h-10 bg-blue-600 hover:bg-blue-700 text-white"
                        widthClass="w-[320px]"
                      >
                        <Button
                          disabled={updating}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {action.label}
                        </Button>
                      </ConfirmPopover>
                    );
                  }
                  
                  // For reject action, use confirm popover
                  if (action.value === "rejected") {
                    return (
                      <Button
                        key={action.value}
                        onClick={() => setShowRejectDialog(true)}
                        disabled={updating}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        {action.label}
                      </Button>
                    );
                  }
                  
                  // For refund_initiated, open dialog to input refund amount
                  if (action.value === "refund_initiated") {
                    return (
                      <Button
                        key={action.value}
                        onClick={() => setShowRefundDialog(true)}
                        disabled={updating}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {action.label}
                      </Button>
                    );
                  }
                  
                  // For COD refund completion, use confirm popover
                  if (action.value === "complete_refund_cod") {
                    return (
                      <ConfirmPopover
                        key={action.value}
                        title="Xác nhận hoàn tiền COD?"
                        message="Bạn đã chuyển khoản thủ công cho khách hàng và muốn xác nhận hoàn tiền thành công?"
                        onConfirm={() => handleStatusUpdate(action.value)}
                        confirmText="Xác nhận"
                        cancelText="Hủy"
                        confirmLoading={updating}
                        confirmClassName="h-10 bg-green-600 hover:bg-green-700 text-white"
                        widthClass="w-[380px]"
                      >
                        <Button
                          disabled={updating}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          {action.label}
                        </Button>
                      </ConfirmPopover>
                    );
                  }
                  
                  // For received_at_warehouse, use confirm popover
                  if (action.value === "received_at_warehouse") {
                    return (
                      <ConfirmPopover
                        key={action.value}
                        title="Xác nhận đã nhận hàng?"
                        message="Bạn có chắc chắn đã nhận được hàng trả về kho?"
                        onConfirm={() => handleStatusUpdate(action.value)}
                        confirmText={action.label}
                        cancelText="Hủy"
                        confirmLoading={updating}
                        confirmClassName="h-10 bg-indigo-600 hover:bg-indigo-700 text-white"
                        widthClass="w-[320px]"
                      >
                        <Button
                          disabled={updating}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          {action.label}
                        </Button>
                      </ConfirmPopover>
                    );
                  }
                  
                  // For refund_completed (VNPAY auto), use confirm popover
                  if (action.value === "refund_completed") {
                    return (
                      <ConfirmPopover
                        key={action.value}
                        title="Xác nhận hoàn tiền thành công?"
                        message="VNPAY đã tự động cập nhật hoàn tiền thành công?"
                        onConfirm={() => handleStatusUpdate(action.value)}
                        confirmText={action.label}
                        cancelText="Hủy"
                        confirmLoading={updating}
                        confirmClassName="h-10 bg-green-600 hover:bg-green-700 text-white"
                        widthClass="w-[400px]"
                      >
                        <Button
                          disabled={updating}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          {action.label}
                        </Button>
                      </ConfirmPopover>
                    );
                  }
                  
                  // For other actions, direct button (should not reach here)
                  return (
                    <Button
                      key={action.value}
                      onClick={() => handleStatusUpdate(action.value)}
                      disabled={updating}
                      className={`w-full ${
                        action.color === "green"
                          ? "bg-green-600 hover:bg-green-700"
                          : action.color === "orange"
                          ? "bg-orange-600 hover:bg-orange-700"
                          : action.color === "indigo"
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : "bg-gray-600 hover:bg-gray-700"
                      } text-white`}
                    >
                      {updating ? "Đang xử lý..." : action.label}
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* View Order Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={() =>
                router.push(Routes.orders.details(returnData.orderId))
              }
              className="w-full bg-green-100 border-green-200 text-green-700 hover:bg-green-300"
            >
              <Package className="w-4 h-4 mr-2" />
              Xem đơn hàng gốc
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Refund Initiation Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Bắt đầu hoàn tiền
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tiền hoàn <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 focus:border-blue-500 outline-none"
                  placeholder="Nhập số tiền hoàn..."
                  value={refundAmount ? parseInt(refundAmount).toLocaleString("en-US") : ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setRefundAmount(value);
                  }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  đ
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú nội bộ
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none min-h-[100px]"
                placeholder="Nhập ghi chú..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center gap-3">
            <Button
              onClick={() => {
                setShowRefundDialog(false);
                setAdminNote("");
                setRefundAmount("");
              }}
              disabled={updating}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (!refundAmount) {
                  toast.error("Vui lòng nhập số tiền hoàn");
                  return;
                }
                handleStatusUpdate("refund_initiated", {
                  adminNote: adminNote || undefined,
                  refundAmount,
                });
              }}
              disabled={updating || !refundAmount}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg"
            >
              {updating ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Từ chối yêu cầu trả hàng
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none min-h-[120px]"
                placeholder="Nhập lý do từ chối..."
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center gap-3">
            <Button
              onClick={() => {
                setShowRejectDialog(false);
                setRejectedReason("");
              }}
              disabled={updating}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (!rejectedReason.trim()) {
                  toast.error("Vui lòng nhập lý do từ chối");
                  return;
                }
                handleStatusUpdate("rejected", {
                  rejectedReason,
                });
              }}
              disabled={updating || !rejectedReason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg"
            >
              {updating ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-gray-200 transition-colors cursor-pointer"
            onClick={() => setLightboxImage(null)}
            title="Đóng"
          >
            <X className="w-6 h-6 text-gray-800" />
          </button>
          <div className="w-full h-full flex items-center justify-center p-8">
            <img
              src={lightboxImage.url}
              alt={lightboxImage.alt}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
