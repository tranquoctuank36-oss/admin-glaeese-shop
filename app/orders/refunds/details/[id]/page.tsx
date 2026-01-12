"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, DollarSign, FileText, User, CreditCard, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { getRefundById } from "@/services/refundService";
import { Refund } from "@/types/refund";
import toast from "react-hot-toast";
import { Routes } from "@/lib/routes";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import { Button } from "@/components/ui/button";

function RefundDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [refund, setRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRefund = async () => {
      try {
        setLoading(true);
        const data = await getRefundById(id);
        setRefund(data);
      } catch (error: any) {
        toast.error(error?.response?.data?.detail || "Không thể tải thông tin hoàn tiền");
        router.push(Routes.orders.refunds);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRefund();
    }
  }, [id, router]);

  const formatDate = (dateString: string | Record<string, any>) => {
    if (!dateString || typeof dateString === "object") return "-";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString("en-US") + "đ";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-700" },
      rejected: { label: "Từ chối", className: "bg-red-100 text-red-700" },
      processing: { label: "Đang xử lý", className: "bg-indigo-100 text-indigo-700" },
      success: { label: "Thành công", className: "bg-green-100 text-green-700" },
      failed: { label: "Thất bại", className: "bg-red-100 text-red-700" },
    };
    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-700" };
    
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${config.className}`}>
        <span className="font-semibold">{config.label}</span>
      </div>
    );
  };

  const getTriggerLabel = (trigger: string) => {
    const triggerLabels: Record<string, string> = {
      return: "Trả hàng",
      goodwill: "Thiện chí",
      error: "Lỗi",
      promotion: "Khuyến mãi",
      manual: "Thủ công",
    };
    return triggerLabels[trigger] || trigger;
  };

  const getRefundTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      vnpay: "VNPAY",
      bank_transfer: "Chuyển khoản",
    };
    return typeLabels[type] || type;
  };

  const getFieldValue = (field: any): string => {
    if (!field) return "-";
    if (typeof field === "string") return field;
    if (typeof field === "object" && Object.keys(field).length === 0) return "-";
    if (typeof field === "object") {
      const keys = Object.keys(field);
      if (keys.length > 0) {
        return field[keys[0]] || keys[0];
      }
    }
    return "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!refund) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Không tìm thấy thông tin hoàn tiền</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                  size="icon-lg"
                  className="hover:bg-gray-300 rounded-full bg-gray-200"
                  onClick={() => router.back()}
                  title="Quay Lại"
                >
                  <ArrowLeft className="text-gray-700 size-7" />
                </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Chi tiết hoàn tiền
                </h1>
              </div>
            </div>
            <div>
              {getStatusBadge(refund.status)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Refund Information */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={24} className="text-blue-600" />
                Thông tin hoàn tiền
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Mã hoàn tiền
                  </label>
                  <p className="text-gray-900 font-mono">{refund.refundCode}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Mã đơn hàng
                  </label>
                  <p className="text-gray-900 font-mono">{refund.orderCode || "-"}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Số tiền hoàn
                  </label>
                  <p className="text-xl font-semibold text-blue-600">{formatAmount(refund.amount)}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Loại hoàn tiền
                  </label>
                  <p className="text-gray-900">{getRefundTypeLabel(refund.refundType)}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Nguồn gốc
                  </label>
                  <p className="text-gray-900">{getTriggerLabel(refund.trigger)}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Mã giao dịch
                  </label>
                  <p className="text-gray-900 font-mono">{refund.providerTransactionId || "-"}</p>
                </div>
              </div>
            </div>

            {/* Bank Information */}
            {refund.refundType === "bank_transfer" && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard size={24} className="text-blue-600" />
                  Thông tin ngân hàng
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      Tên tài khoản
                    </label>
                    <p className="text-gray-900">{getFieldValue(refund.bankAccountName)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      Số tài khoản
                    </label>
                    <p className="text-gray-900 font-mono">{getFieldValue(refund.bankAccountNumber)}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      Ngân hàng
                    </label>
                    <p className="text-gray-900">{getFieldValue(refund.bankName)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reason & Notes */}
            {(refund.reason || refund.rejectedReason) && (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle size={24} className="text-blue-600" />
                  Lý do & Ghi chú
                </h2>
                
                {refund.reason && (
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      Lý do hoàn tiền
                    </label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {getFieldValue(refund.reason)}
                    </p>
                  </div>
                )}

                {refund.rejectedReason && (
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      Lý do từ chối
                    </label>
                    <p className="text-red-700 bg-red-50 p-3 rounded-lg">
                      {getFieldValue(refund.rejectedReason)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar size={24} className="text-blue-600" />
                Thời gian
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Ngày tạo
                  </label>
                  <p className="text-gray-900">{formatDate(refund.createdAt)}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Ngày cập nhật
                  </label>
                  <p className="text-gray-900">{formatDate(refund.updatedAt)}</p>
                </div>

                {refund.approvedAt && typeof refund.approvedAt !== "object" && (
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      Ngày duyệt
                    </label>
                    <p className="text-gray-900">{formatDate(refund.approvedAt)}</p>
                  </div>
                )}

                {refund.completedAt && typeof refund.completedAt !== "object" && (
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      Ngày hoàn tất
                    </label>
                    <p className="text-gray-900">{formatDate(refund.completedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Information */}
            {/* <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User size={24} className="text-blue-600" />
                Thông tin liên quan
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-600 mb-1">
                    Người yêu cầu
                  </label>
                  <p className="text-gray-900">{getFieldValue(refund.requestedBy)}</p>
                </div>

                {refund.approvedBy && (
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      Người duyệt
                    </label>
                    <p className="text-gray-900">{getFieldValue(refund.approvedBy)}</p>
                  </div>
                )}

                {refund.completedBy && (
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      Người hoàn tất
                    </label>
                    <p className="text-gray-900">{getFieldValue(refund.completedBy)}</p>
                  </div>
                )}

                {refund.providerResponseCode && (
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-1">
                      Mã phản hồi
                    </label>
                    <p className="text-gray-900 font-mono">{refund.providerResponseCode}</p>
                  </div>
                )}
              </div>
            </div> */}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default withAuthCheck(RefundDetailsPage);
