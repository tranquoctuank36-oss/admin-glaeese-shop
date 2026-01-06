"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, Shield, X, Pencil, Filter, Eye, Edit } from "lucide-react";
import { getOrders, updateOrder } from "@/services/orderService";
import { Order } from "@/types/order";
import { useListQuery } from "@/components/data/useListQuery";
import Pagination from "@/components/data/Pagination";
import { Button } from "@/components/ui/button";
import { Routes } from "@/lib/routes";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AllOrdersPage() {
  const router = useRouter();

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery(
    {
      limit: 20,
      sortField: "createdAt",
      sortOrder: "DESC",
      preset: "this_month",
    },
    {
      allowedsortField: ["createdAt", "updatedAt", "grandTotal"] as const,
    }
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    recipientName: "",
    recipientPhone: "",
    addressLine: "",
    adminNote: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [minGrandTotal, setMinGrandTotal] = useState<string>("");
  const [maxGrandTotal, setMaxGrandTotal] = useState<string>("");
  const filtersRef = useRef<HTMLDivElement>(null);

  // Close filters dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  // Fetch orders from API
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getOrders(apiParams);
        if (!alive) return;
        setOrders(res.data);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
        setHasNext(!!res.hasNext);
        setHasPrev(!!res.hasPrev);
      } catch (e) {
        console.error("Failed to fetch orders:", e);
        if (alive) {
          setOrders([]);
          setMeta(undefined);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiKey]);

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
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Tất cả đơn hàng ({meta?.totalItems})
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý và theo dõi tất cả đơn hàng
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search Bar and Filters */}
      <motion.div
        ref={filtersRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 bg-white rounded-lg shadow border border-gray-200 p-3"
      >
        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
              placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng, số điện thoại, email..."
              value={q.search || ""}
              onChange={(e) =>
                setAndResetPage({ search: e.target.value, page: 1 })
              }
            />
          </div>
          <select
            className="h-[42px] px-3 border border-gray-300 rounded-lg focus:border-blue-500 outline-none bg-white cursor-pointer"
            value={`${q.sortField}-${q.sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setQ((prev) => ({
                ...prev,
                sortField: field,
                sortOrder: order as "ASC" | "DESC",
                page: 1,
              }));
            }}
          >
            <option value="createdAt-DESC">Ngày tạo giảm dần</option>
            <option value="createdAt-ASC">Ngày tạo tăng dần</option>
            <option value="updatedAt-DESC">
              Trạng thái mới cập nhật
            </option>
            <option value="grandTotal-DESC">Tổng tiền giảm dần</option>
            <option value="grandTotal-ASC">Tổng tiền tăng dần</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 h-[42px] px-4 bg-white text-gray-600 hover:text-gray-900 border rounded-lg transition-colors cursor-pointer ${
              showFilters ? 'border-blue-500' : 'border-gray-300 hover:border-gray-500'
            }`}
          >
            <Filter size={20} />
            Bộ lọc
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 border-t border-gray-200 pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Trạng thái đơn hàng
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none bg-white"
                  value={q.status || ""}
                  onChange={(e) => {
                    setQ((prev) => ({
                      ...prev,
                      status: e.target.value || undefined,
                      page: 1,
                    }));
                  }}
                >
                  <option value="">Tất cả</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="shipping">Đang giao</option>
                  <option value="delivered">Đã giao</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                  <option value="expired">Hết hạn</option>
                  <option value="returned">Đã trả</option>
                  <option value="on_hold">Tạm giữ</option>
                </select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Trạng thái thanh toán
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none bg-white"
                  value={q.paymentStatus || ""}
                  onChange={(e) => {
                    setQ((prev) => ({
                      ...prev,
                      paymentStatus: e.target.value || undefined,
                      page: 1,
                    }));
                  }}
                >
                  <option value="">Tất cả</option>
                  <option value="pending">Chờ thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="cod_collected">Đã thu COD</option>
                  <option value="failed">Thất bại</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Phương thức thanh toán
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none bg-white"
                  value={q.paymentMethod || ""}
                  onChange={(e) => {
                    setQ((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value || undefined,
                      page: 1,
                    }));
                  }}
                >
                  <option value="">Tất cả</option>
                  <option value="COD">COD</option>
                  <option value="VNPAY">VNPAY</option>
                </select>
              </div>

              {/* Preset Filter */}
              <div className="mt-5">
                <select
                  className="w-full cursor-pointer border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none bg-white"
                  value={q.preset || "this_month"}
                  onChange={(e) => {
                    setQ((prev) => ({
                      ...prev,
                      preset: e.target.value || undefined,
                      page: 1,
                    }));
                  }}
                >
                  <option value="today">Hôm nay</option>
                  <option value="yesterday">Hôm qua</option>
                  <option value="this_week">Tuần này</option>
                  <option value="last_week">Tuần trước</option>
                  <option value="this_month">Tháng này</option>
                  <option value="last_month">Tháng trước</option>
                  <option value="this_year">Năm này</option>
                  <option value="custom">Tùy chỉnh</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setMinGrandTotal("");
                  setMaxGrandTotal("");
                  setQ((prev) => ({
                    ...prev,
                    startDate: undefined,
                    endDate: undefined,
                    minGrandTotal: undefined,
                    maxGrandTotal: undefined,
                    status: undefined,
                    paymentStatus: undefined,
                    paymentMethod: undefined,
                    preset: "this_month",
                    sortField: "createdAt",
                    sortOrder: "DESC",
                    page: 1,
                  }));
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Đặt lại
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Orders Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <p className="text-gray-600">Đang tải...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-500">
            Không có đơn hàng nào
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                    Mã đơn
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">
                    Thanh toán
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order, idx) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-1">
                            {order.orderCode}
                            {order.adminNote &&
                              Object.keys(order.adminNote).length > 0 && (
                                <div
                                  className="relative inline-block"
                                  onMouseEnter={() => setHoveredOrderId(order.id)}
                                  onMouseLeave={() => setHoveredOrderId(null)}
                                >
                                  <Shield className="w-4 h-4 text-blue-600 cursor-help" />
                                  {hoveredOrderId === order.id && (
                                    <div className="absolute left-0 top-6 z-50 min-w-[200px] max-w-[300px] p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-normal break-words">
                                      {getAdminNoteValue(order.adminNote)}
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString("vi-VN")}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="min-w-[200px]">
                        <div className="font-medium text-gray-900">
                          {order.recipientName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.recipientPhone} · {order.provinceName}
                        </div>
                        {order.customerNote && (
                          <div className="mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Pencil className="w-3 h-3" />
                            <span>Khách: {order.customerNote}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="min-w-[200px] space-y-1">
                        {order.items.slice(0, 2).map((item, i) => (
                          <div key={i} className="text-sm text-gray-700">
                            {item.productName} - {item.productVariantName} x{" "}
                            <span className="font-semibold">
                              {item.quantity}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{order.items.length - 2} sản phẩm khác
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {parseFloat(order.grandTotal).toLocaleString("en-US")}
                          đ
                        </div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                            order.paymentMethod === "VNPAY"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {order.paymentMethod === "VNPAY" ? "Đã TT" : "COD"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
                            order.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : order.status === "processing"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "shipping"
                              ? "bg-purple-100 text-purple-700"
                              : order.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : order.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : order.status === "returned"
                              ? "bg-orange-100 text-orange-700"
                              : order.status === "expired"
                              ? "bg-gray-100 text-gray-700"
                              : order.status === "on_hold"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status === "pending"
                            ? "Chờ xác nhận"
                            : order.status === "processing"
                            ? "Đang đóng gói"
                            : order.status === "shipping"
                            ? "Đang giao"
                            : order.status === "delivered"
                            ? "Đã giao"
                            : order.status === "completed"
                            ? "Hoàn thành"
                            : order.status === "cancelled"
                            ? "Đã hủy"
                            : order.status === "returned"
                            ? "Đã trả"
                            : order.status === "expired"
                            ? "Hết hạn"
                            : order.status === "on_hold"
                            ? "Tạm giữ"
                            : order.status}
                        </span>
                        {order.trackingCode && (
                          <a
                            href={`https://tracking.ghn.dev/?order_code=${
                              typeof order.trackingCode === "string"
                                ? order.trackingCode
                                : Object.keys(order.trackingCode).length > 0
                                ? order.trackingCode[Object.keys(order.trackingCode)[0]] || Object.keys(order.trackingCode)[0]
                                : ""
                            }`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-600 hover:text-gray-800 mt-1 hover:font-semibold inline-block cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {typeof order.trackingCode === "string" ? (
                              order.trackingCode
                            ) : Object.keys(order.trackingCode).length > 0 ? (
                              order.trackingCode[
                                Object.keys(order.trackingCode)[0]
                              ] || Object.keys(order.trackingCode)[0]
                            ) : null}
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Thao tác Column */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon-sm"
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Xem chi tiết"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(Routes.orders.details(order.id));
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingOrder(order);
                            setEditForm({
                              recipientName: order.recipientName,
                              recipientPhone: order.recipientPhone,
                              addressLine: order.addressLine,
                              adminNote: typeof order.adminNote === 'string' ? order.adminNote : (order.adminNote && Object.keys(order.adminNote).length > 0 ? JSON.stringify(order.adminNote) : "")
                            });
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
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <span>Số hàng mỗi trang:</span>
              <select
                className="border rounded-md px-2 py-1"
                value={q.limit}
                onChange={(e) =>
                  setAndResetPage({
                    limit: Number(e.target.value),
                    page: 1,
                  })
                }
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <Pagination
              page={q.page}
              totalPages={meta?.totalPages}
              hasPrev={hasPrev}
              hasNext={hasNext}
              onChange={(p) => {
                const capped = meta?.totalPages
                  ? Math.min(p, meta.totalPages)
                  : p;
                setQ((prev) => ({ ...prev, page: Math.max(1, capped) }));
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Edit Order Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa đơn hàng {editingOrder?.orderCode}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editingOrder) return;
              
              setIsSubmitting(true);
              try {
                await updateOrder(editingOrder.id, editForm);
                toast.success("Đã cập nhật đơn hàng");
                setEditingOrder(null);
                // Refresh orders list
                const res = await getOrders(apiParams);
                setOrders(res.data);
                setMeta({
                  totalPages: res.meta?.totalPages,
                  totalItems: res.meta?.totalItems,
                });
                setHasNext(!!res.hasNext);
                setHasPrev(!!res.hasPrev);
              } catch (error) {
                console.error("Failed to update order:", error);
                toast.error("Không thể cập nhật đơn hàng");
              } finally {
                setIsSubmitting(false);
              }
            }}
            className="space-y-4 mt-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên người nhận
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                value={editForm.recipientName}
                onChange={(e) => setEditForm({ ...editForm, recipientName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                value={editForm.recipientPhone}
                onChange={(e) => setEditForm({ ...editForm, recipientPhone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                value={editForm.addressLine}
                onChange={(e) => setEditForm({ ...editForm, addressLine: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú nội bộ
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none resize-none"
                rows={3}
                value={editForm.adminNote}
                onChange={(e) => setEditForm({ ...editForm, adminNote: e.target.value })}
                placeholder="Ghi chú cho admin..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setEditingOrder(null)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </>
  );
}
