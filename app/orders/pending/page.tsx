"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Shield, X, Send, Pencil, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmPopover from "@/components/ConfirmPopover";
import CancelOrderDialog from "@/components/orders/CancelOrderDialog";
import {
  getOrders,
  confirmOrder,
  cancelOrder,
  updateOrder,
  getOrderById,
  bulkConfirmOrders,
} from "@/services/orderService";
import { Order } from "@/types/order";
import { useListQuery } from "@/components/data/useListQuery";
import toast from "react-hot-toast";
import Pagination from "@/components/data/Pagination";

export default function PendingOrdersPage() {
  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery(
    {
      limit: 20,
      sortField: "createdAt",
      sortOrder: "DESC",
    },
    {
      extraFilters: { status: "pending" },
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
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState("");
  const [hoveredOrderId, setHoveredOrderId] = useState<string | null>(null);
  const [editingFields, setEditingFields] = useState<{
    recipientName: boolean;
    recipientPhone: boolean;
    addressLine: boolean;
  }>({ recipientName: false, recipientPhone: false, addressLine: false });
  const [customerInfo, setCustomerInfo] = useState<{
    recipientName: string;
    recipientPhone: string;
    addressLine: string;
  }>({ recipientName: "", recipientPhone: "", addressLine: "" });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    try {
      await confirmOrder(orderId);
      toast.success("Đơn hàng đã được duyệt!");
      // Refresh orders list
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      setMeta((prev) =>
        prev ? { ...prev, totalItems: (prev.totalItems || 0) - 1 } : undefined
      );
    } catch (e: any) {
      console.error("Failed to approve order:", e);
      const detail =
        e?.response?.data?.detail || e?.detail || "Failed to approve order";
      toast.error(detail);
    }
  };

  const handleCancelOrder = async (reason: string) => {
    if (!orderToCancel || !reason.trim()) return;

    try {
      await cancelOrder(orderToCancel.id, reason);
      toast.success("Đơn hàng đã được hủy!");
      setOrders((prev) => prev.filter((o) => o.id !== orderToCancel.id));
      setMeta((prev) =>
        prev ? { ...prev, totalItems: (prev.totalItems || 0) - 1 } : undefined
      );
      setOrderToCancel(null);
      setCancelDialogOpen(false);
      if (selectedOrder?.id === orderToCancel.id) {
        setSelectedOrder(null);
      }
    } catch (e: any) {
      console.error("Failed to cancel order:", e);
      const detail =
        e?.response?.data?.detail || e?.detail || "Failed to cancel order";
      toast.error(detail);
    }
  };

  const handleBatchApprove = async () => {
    try {
      const response = await bulkConfirmOrders({ orderIds: selectedOrders });
      
      const confirmedCount = response.success?.length || 0;
      const failedCount = response.failed?.length || 0;
      
      if (confirmedCount > 0) {
        toast.success(`Đã duyệt ${confirmedCount} đơn hàng!`);
      }
      
      if (failedCount > 0) {
        toast.error(`${failedCount} đơn hàng không thể duyệt`);
      }
      
      // Refresh orders list
      setOrders((prev) => prev.filter((o) => !selectedOrders.includes(o.id)));
      setMeta((prev) =>
        prev
          ? {
              ...prev,
              totalItems: (prev.totalItems || 0) - confirmedCount,
            }
          : undefined
      );
      setSelectedOrders([]);
    } catch (e: any) {
      console.error("Failed to batch approve:", e);
      const detail =
        e?.response?.data?.detail || e?.detail || "Failed to approve orders";
      toast.error(detail);
    }
  };

  const handleSendAdminNote = async () => {
    if (!selectedOrder || !adminNoteInput.trim()) return;

    try {
      await updateOrder(selectedOrder.id, { adminNote: adminNoteInput });
      toast.success("Đã thêm ghi chú!");
      setAdminNoteInput("");

      // Refresh the selected order to show updated admin note
      const updatedOrder = await getOrderById(selectedOrder.id);
      setSelectedOrder(updatedOrder);

      // Update the order in the list as well to keep data consistent
      //   setOrders((prev) =>
      //     prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      //   );
    } catch (e: any) {
      console.error("Failed to add admin note:", e);
      const detail =
        e?.response?.data?.detail || e?.detail || "Failed to add note";
      toast.error(detail);
    }
  };

  const handleSaveCustomerInfo = async (field: keyof typeof customerInfo) => {
    if (!selectedOrder) return;

    try {
      const updateData: any = {};
      if (field === "recipientName")
        updateData.recipientName = customerInfo.recipientName;
      if (field === "recipientPhone")
        updateData.recipientPhone = customerInfo.recipientPhone;
      if (field === "addressLine")
        updateData.addressLine = customerInfo.addressLine;

      await updateOrder(selectedOrder.id, updateData);
      toast.success("Đã cập nhật thông tin!");

      // Disable editing for this field
      setEditingFields((prev) => ({ ...prev, [field]: false }));

      // Refresh the order
      const updatedOrder = await getOrderById(selectedOrder.id);
      setSelectedOrder(updatedOrder);
    } catch (e: any) {
      console.error("Failed to update customer info:", e);
      const detail =
        e?.response?.data?.detail || e?.detail || "Failed to update";
      toast.error(detail);
    }
  };

  return (
    <>
      {/* Search Bar and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 bg-white rounded-2xl shadow-lg p-3 border border-gray-200"
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
              className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:border-gray-500 outline-none"
              placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng, số điện thoại, email..."
              value={q.search || ""}
              onChange={(e) =>
                setAndResetPage({ search: e.target.value, page: 1 })
              }
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

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 border-t border-gray-200 pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Sort Options */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Sắp xếp
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none bg-white"
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
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setQ((prev) => ({
                    ...prev,
                    paymentStatus: undefined,
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

      {/* Batch Action Bar */}
      {selectedOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between"
        >
          <span className="text-sm font-medium text-blue-900">
            Đã chọn: {selectedOrders.length} đơn
          </span>
          <ConfirmPopover
            title="Xác nhận duyệt hàng loạt?"
            message={`Bạn có chắc muốn duyệt ${selectedOrders.length} đơn hàng?`}
            confirmText="Duyệt"
            cancelText="Hủy"
            onConfirm={handleBatchApprove}
            confirmClassName="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Duyệt hàng loạt
            </Button>
          </ConfirmPopover>
        </motion.div>
      )}

      {/* Orders Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <p className="text-gray-600">Đang tải...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-500">
            Không có đơn hàng nào chờ xác nhận
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
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      checked={
                        selectedOrders.length === orders.length &&
                        orders.length > 0
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
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
                    Tác vụ
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
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("input, button"))
                        return;
                      setSelectedOrder(order);
                    }}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectOrder(order.id, e.target.checked);
                        }}
                      />
                    </td>

                    {/* Mã đơn */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-1">
                            {order.orderCode}
                            {order.adminNote &&
                              Object.keys(order.adminNote).length > 0 && (
                                <div
                                  className="relative inline-block"
                                  onMouseEnter={() =>
                                    setHoveredOrderId(order.id)
                                  }
                                  onMouseLeave={() => setHoveredOrderId(null)}
                                >
                                  <Shield className="w-4 h-4 text-blue-600" />
                                  {hoveredOrderId === order.id && (
                                    <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                                      {JSON.stringify(order.adminNote)}
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString("en-US")}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Khách hàng */}
                    <td className="px-4 py-3">
                      <div className="min-w-[200px]">
                        <div className="font-medium text-gray-900">
                          {order.recipientName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.recipientPhone} · {order.provinceName}
                        </div>
                        {order.addressLine && (
                          <div className="text-sm text-gray-600">
                            {order.addressLine}
                          </div>
                        )}
                        {order.customerNote && (
                          <div className="mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Pencil className="w-3 h-3" />
                            <span>Khách: {order.customerNote}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Sản phẩm */}
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

                    {/* Thanh toán */}
                    <td className="px-4 py-3">
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

                    {/* Tác vụ */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <ConfirmPopover
                          title="Xác nhận duyệt đơn?"
                          message={`Duyệt đơn hàng ${order.orderCode}?`}
                          confirmText="Duyệt"
                          cancelText="Hủy"
                          onConfirm={() => handleApproveOrder(order.id)}
                          confirmClassName="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Button
                            onClick={(e) => e.stopPropagation()}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5"
                          >
                            Duyệt
                          </Button>
                        </ConfirmPopover>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderToCancel(order);
                            setCancelDialogOpen(true);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5"
                        >
                          Hủy
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
              <span>Rows per page:</span>
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

      {/* Drawer Chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300"
            onClick={() => setSelectedOrder(null)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl overflow-y-auto z-[60]"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">
                Chi tiết đơn hàng {selectedOrder.orderCode}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Thông tin khách hàng */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Khách hàng:
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={
                          editingFields.recipientName
                            ? customerInfo.recipientName
                            : selectedOrder.recipientName
                        }
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            recipientName: e.target.value,
                          }))
                        }
                        disabled={!editingFields.recipientName}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600"
                      />
                      {editingFields.recipientName && (
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                          onClick={() =>
                            handleSaveCustomerInfo("recipientName")
                          }
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button
                      className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                      onClick={() => {
                        setEditingFields((prev) => ({
                          ...prev,
                          recipientName: !prev.recipientName,
                        }));
                        if (!editingFields.recipientName) {
                          setCustomerInfo((prev) => ({
                            ...prev,
                            recipientName: selectedOrder.recipientName,
                          }));
                        }
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={
                          editingFields.recipientPhone
                            ? customerInfo.recipientPhone
                            : selectedOrder.recipientPhone
                        }
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            recipientPhone: e.target.value,
                          }))
                        }
                        disabled={!editingFields.recipientPhone}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600"
                      />
                      {editingFields.recipientPhone && (
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                          onClick={() =>
                            handleSaveCustomerInfo("recipientPhone")
                          }
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button
                      className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                      onClick={() => {
                        setEditingFields((prev) => ({
                          ...prev,
                          recipientPhone: !prev.recipientPhone,
                        }));
                        if (!editingFields.recipientPhone) {
                          setCustomerInfo((prev) => ({
                            ...prev,
                            recipientPhone: selectedOrder.recipientPhone,
                          }));
                        }
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={
                          editingFields.addressLine
                            ? customerInfo.addressLine
                            : selectedOrder.addressLine
                        }
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            addressLine: e.target.value,
                          }))
                        }
                        disabled={!editingFields.addressLine}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg disabled:bg-gray-50 disabled:text-gray-600"
                      />
                      {editingFields.addressLine && (
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                          onClick={() => handleSaveCustomerInfo("addressLine")}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button
                      className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-pointer transition-colors"
                      onClick={() => {
                        setEditingFields((prev) => ({
                          ...prev,
                          addressLine: !prev.addressLine,
                        }));
                        if (!editingFields.addressLine) {
                          setCustomerInfo((prev) => ({
                            ...prev,
                            addressLine: selectedOrder.addressLine,
                          }));
                        }
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedOrder.wardName}, {selectedOrder.districtName},{" "}
                    {selectedOrder.provinceName}
                  </div>
                  {selectedOrder.customerNote && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="text-xs text-yellow-800 font-medium mb-1 flex items-center gap-1">
                        <Pencil className="w-3 h-3" />
                        <span>Note: {selectedOrder.customerNote}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sản phẩm */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Sản phẩm:
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-white rounded flex items-center justify-center overflow-hidden">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.productName}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-2xl">👓</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {item.productName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {item.productVariantName} x {item.quantity}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Màu: {item.colors}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {(
                            parseFloat(item.finalPrice) * item.quantity
                          ).toLocaleString("en-US")}
                          đ
                        </div>
                        <div className="font-semibold">
                          {parseFloat(item.finalPrice).toLocaleString("en-US")}đ
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thanh toán */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Thanh toán:
                </h3>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span>Tạm tính:</span>
                    <span>
                      {parseFloat(selectedOrder.subtotal).toLocaleString(
                        "en-US"
                      )}
                      đ
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Phí vận chuyển:</span>
                    <span>
                      {parseFloat(selectedOrder.voucherShippingDiscount) > 0 ? (
                        <span className="text-green-600 font-medium">
                          Miễn phí
                        </span>
                      ) : (
                        <>
                          {parseFloat(selectedOrder.shippingFee).toLocaleString(
                            "en-US"
                          )}
                          đ
                        </>
                      )}
                    </span>
                  </div>
                  {/* {parseFloat(selectedOrder.voucherShippingDiscount) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Giảm phí ship:</span>
                      <span>
                        -
                        {parseFloat(
                          selectedOrder.voucherShippingDiscount
                        ).toLocaleString("en-US")}
                        đ
                      </span>
                    </div>
                  )} */}
                  {parseFloat(selectedOrder.voucherOrderDiscount) > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Giảm giá:</span>
                      <span>
                        -
                        {parseFloat(
                          selectedOrder.voucherOrderDiscount
                        ).toLocaleString("en-US")}
                        đ
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between text-lg pt-3 border-t">
                  <span className="font-bold">Tổng cộng:</span>
                  <div className="text-right">
                    <div className="font-bold">
                      {parseFloat(selectedOrder.grandTotal).toLocaleString(
                        "en-US"
                      )}
                      đ
                    </div>
                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded text-sm font-medium ${
                        selectedOrder.paymentMethod === "VNPAY"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {selectedOrder.paymentMethod === "VNPAY"
                        ? "Đã thanh toán"
                        : "COD"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ghi chú nội bộ */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Ghi chú nội bộ (Admin Note)
                </h3>
                {selectedOrder.adminNote &&
                  Object.keys(selectedOrder.adminNote).length > 0 && (
                    <div className="mb-3 bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Admin:</div>
                      <div className="text-sm text-gray-900 ">
                        {JSON.stringify(selectedOrder.adminNote)}
                      </div>
                    </div>
                  )}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập ghi chú..."
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSendAdminNote();
                      }
                    }}
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                    onClick={handleSendAdminNote}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
              <ConfirmPopover
                title="Xác nhận duyệt đơn?"
                message={`Duyệt đơn hàng ${selectedOrder.orderCode}?`}
                confirmText="Duyệt"
                cancelText="Hủy"
                onConfirm={async () => {
                  await handleApproveOrder(selectedOrder.id);
                  setSelectedOrder(null);
                }}
                confirmClassName="bg-blue-600 hover:bg-blue-700 text-white"
                widthClass="w-[300px]"
              >
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3">
                  Duyệt đơn
                </Button>
              </ConfirmPopover>
              <Button
                onClick={() => {
                  setOrderToCancel(selectedOrder);
                  setCancelDialogOpen(true);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white border border-red-300 py-3"
              >
                Hủy đơn
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        open={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setOrderToCancel(null);
        }}
        onConfirm={handleCancelOrder}
        orderCode={orderToCancel?.orderCode || ""}
      />
    </>
  );
}
