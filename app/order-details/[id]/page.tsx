"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Pencil, Shield, Truck, CreditCard, MapPin, User, Phone, Mail, Calendar, DollarSign } from "lucide-react";
import { getOrderById } from "@/services/orderService";
import { Order } from "@/types/order";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getOrderById(orderId);
        if (!alive) return;
        setOrder(data);
      } catch (e) {
        console.error("Failed to fetch order:", e);
        if (alive) {
          toast.error("Không thể tải thông tin đơn hàng");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "shipping":
        return "bg-purple-100 text-purple-700";
      case "delivered":
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "returned":
        return "bg-orange-100 text-orange-700";
      case "expired":
        return "bg-gray-100 text-gray-700";
      case "on_hold":
        return "bg-indigo-100 text-indigo-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "processing":
        return "Đang đóng gói";
      case "shipping":
        return "Đang giao";
      case "delivered":
        return "Đã giao";
      case "cancelled":
        return "Đã hủy";
      case "completed":
        return "Hoàn thành";
      case "awaiting_payment":
        return "Chờ thanh toán";
      case "expired":
        return "Hết hạn";
      case "returned":
        return "Đã trả";
      case "on_hold":
        return "Tạm giữ";
      default:
        return status;
    }
  };

  const getTrackingCodeValue = (trackingCode: Record<string, any> | string): string | null => {
    if (!trackingCode) return null;
    
    if (typeof trackingCode === 'string') {
      return trackingCode;
    }
    
    if (typeof trackingCode === 'object' && Object.keys(trackingCode).length === 0) return null;
    const keys = Object.keys(trackingCode);
    if (keys.length > 0) {
      return trackingCode[keys[0]] || keys[0];
    }
    return null;
  };

  const getAdminNoteValue = (adminNote: string | Record<string, any> | null): string | null => {
    if (!adminNote) return null;
    
    if (typeof adminNote === 'string') {
      return adminNote;
    }
    
    if (typeof adminNote === 'object' && Object.keys(adminNote).length === 0) return null;
    const keys = Object.keys(adminNote);
    if (keys.length > 0) {
      return adminNote[keys[0]] || keys[0];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
          <p className="text-center text-gray-600">Đang tải...</p>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-500 mb-4">Không tìm thấy đơn hàng</p>
            <Button
              size="icon-lg"
              className="hover:bg-gray-300 rounded-full bg-gray-200"
              onClick={() => router.back()}
              title="Quay lại"
            >
              <ArrowLeft className="text-gray-700 size-7" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Button
              size="icon-lg"
              className="hover:bg-gray-300 rounded-full bg-gray-200"
              onClick={() => router.back()}
              title="Quay lại"
            >
              <ArrowLeft className="text-gray-700 size-7" />
            </Button>

            <div className="flex-1 flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Đơn hàng {order.orderCode}
                </h1>
              </div>
              <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Sản phẩm ({order.items.length})
                </h2>
              </div>
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.productName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.productVariantName}</p>
                      {item.colors && (
                        <p className="text-xs text-gray-500 mt-1">Màu: {item.colors}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-gray-900">
                        {parseFloat(item.finalPrice).toLocaleString("en-US")}đ
                      </div>
                      <div className="text-sm text-gray-600 mt-1">x {item.quantity}</div>
                      <div className="text-sm font-medium text-blue-600 mt-2">
                        = {(parseFloat(item.finalPrice) * item.quantity).toLocaleString("en-US")}đ
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Shipping Info */}
            {order.trackingCode && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-purple-600" />
                    Thông tin vận chuyển
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mã vận đơn:</span>
                    {getTrackingCodeValue(order.trackingCode) ? (
                      <a
                        href={`https://tracking.ghn.dev/?order_code=${getTrackingCodeValue(order.trackingCode)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded hover:bg-purple-100 transition-colors cursor-pointer"
                      >
                        {getTrackingCodeValue(order.trackingCode)}
                      </a>
                    ) : (
                      <span className="font-mono font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded">
                        -
                      </span>
                    )}
                  </div>
                  {order.isPrinted && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                      <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                      Đã in tem
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Notes */}
            {(order.customerNote || getAdminNoteValue(order.adminNote)) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-lg border border-gray-200"
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-orange-600" />
                    Ghi chú
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {order.customerNote && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-xs font-semibold text-yellow-800 mb-2">Ghi chú từ khách hàng:</p>
                      <p className="text-sm text-yellow-900">{order.customerNote}</p>
                    </div>
                  )}
                  {getAdminNoteValue(order.adminNote) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <p className="text-xs font-semibold text-blue-800">Ghi chú nội bộ:</p>
                      </div>
                      <p className="text-sm text-blue-900">{getAdminNoteValue(order.adminNote)}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Customer & Payment */}
          <div className="space-y-6">
            {/* Customer Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Thông tin khách hàng
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <User className="w-4 h-4" />
                    <span className="font-medium">Tên:</span>
                  </div>
                  <p className="text-gray-900 ml-6">{order.recipientName}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="font-medium">Số điện thoại:</span>
                  </div>
                  <p className="text-gray-900 ml-6">{order.recipientPhone}</p>
                </div>
                {order.recipientEmail && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">Email:</span>
                    </div>
                    <p className="text-gray-900 ml-6">{order.recipientEmail}</p>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">Địa chỉ:</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    <p className="text-gray-900">{order.addressLine}</p>
                    <p className="text-sm text-gray-600">
                      {order.wardName}, {order.districtName}
                    </p>
                    <p className="text-sm text-gray-600">{order.provinceName}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Payment Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Thanh toán
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span className="text-gray-900 font-medium">
                    {parseFloat(order.subtotal).toLocaleString("en-US")}đ
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Phí vận chuyển
                    {parseFloat(order.voucherShippingDiscount) > 0 && order.voucher?.code && (
                      <span className="font-mono ml-1">({order.voucher.code})</span>
                    )}:
                  </span>
                  <span className="text-gray-900 font-medium">
                    {parseFloat(order.voucherShippingDiscount) > 0 ? (
                      <span className="text-green-600">Miễn phí</span>
                    ) : (
                      `${parseFloat(order.shippingFee).toLocaleString("en-US")}đ`
                    )}
                  </span>
                </div>
                {parseFloat(order.voucherOrderDiscount) > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>
                      Giảm giá
                      {order.voucher?.code && (
                        <span className="font-mono ml-1">({order.voucher.code})</span>
                      )}:
                    </span>
                    <span className="font-medium">
                      -{parseFloat(order.voucherOrderDiscount).toLocaleString("en-US")}đ
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Tổng cộng:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {parseFloat(order.grandTotal).toLocaleString("en-US")}đ
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Phương thức:</span>
                    <span className={`px-3 py-1 rounded-md text-sm font-medium ${
                      order.paymentMethod === "VNPAY"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {order.paymentMethod === "VNPAY" ? "Đã thanh toán (VNPAY)" : "COD"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg border border-gray-200"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  Lịch sử
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Đơn hàng được tạo</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Cập nhật lần cuối</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.updatedAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
