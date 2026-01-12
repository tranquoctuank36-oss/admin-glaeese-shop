"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createManualRefund, CreateManualRefundPayload } from "@/services/refundService";
import toast from "react-hot-toast";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import { Routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";

function AddRefundPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateManualRefundPayload>({
    orderId: "",
    amount: 0,
    reason: "",
    trigger: "goodwill",
    orderReturnId: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.orderId || !formData.amount || !formData.reason || !formData.bankAccountName || !formData.bankAccountNumber || !formData.bankName) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      setLoading(true);
      await createManualRefund(formData);
      toast.success("Đã tạo yêu cầu hoàn tiền thành công");
      router.push(Routes.orders.refunds);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể tạo hoàn tiền");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="flex-1 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={handleCancel}
            variant="ghost"
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">
            Tạo yêu cầu hoàn tiền thủ công
          </h1>
          <p className="text-gray-600 mt-1">
            Điền thông tin để tạo yêu cầu hoàn tiền mới
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Order ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mã đơn hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.orderId}
                onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                placeholder="Nhập mã đơn hàng..."
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số tiền hoàn <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                placeholder="Nhập số tiền..."
                required
                min="0"
              />
            </div>

            {/* Trigger */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nguồn gốc <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none cursor-pointer"
                required
              >
                <option value="goodwill">Thiện chí</option>
                <option value="error">Lỗi</option>
                <option value="promotion">Khuyến mãi</option>
                <option value="manual">Thủ công</option>
              </select>
            </div>

            {/* Order Return ID (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mã trả hàng (Tùy chọn)
              </label>
              <input
                type="text"
                value={formData.orderReturnId}
                onChange={(e) => setFormData({ ...formData, orderReturnId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                placeholder="Nhập mã trả hàng (nếu có)..."
              />
            </div>

            {/* Bank Account Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên tài khoản <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bankAccountName}
                onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                placeholder="Nhập tên tài khoản..."
                required
              />
            </div>

            {/* Bank Account Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số tài khoản <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                placeholder="Nhập số tài khoản..."
                required
              />
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngân hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                placeholder="Nhập tên ngân hàng..."
                required
              />
            </div>

            {/* Reason - Full Width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lý do hoàn tiền <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                rows={4}
                placeholder="Nhập lý do hoàn tiền..."
                required
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              variant="outline"
              className="px-6"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Đang tạo...' : 'Tạo hoàn tiền'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default withAuthCheck(AddRefundPage);
