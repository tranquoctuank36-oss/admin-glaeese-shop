"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, Shield, X, Pencil, Filter, Eye, Edit, ChevronDown, ShoppingCart, Clock, Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { getOrders, updateOrder, getOrderStatistics, OrderStatistics } from "@/services/orderService";
import { Order } from "@/types/order";
import { useListQuery } from "@/components/listing/hooks/useListQuery";
import TablePagination from "@/components/shared/TablePagination";
import { Button } from "@/components/ui/button";
import { Routes } from "@/lib/routes";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Helper function to calculate relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return `${diffSeconds} giây trước`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 30) {
    return `${diffDays} ngày trước`;
  } else if (diffMonths < 12) {
    return `${diffMonths} tháng trước`;
  } else {
    return `${diffYears} năm trước`;
  }
}

// Custom Select Component
interface CustomSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`h-[42px] w-full px-3 text-left bg-white border rounded-lg cursor-pointer transition-all flex items-center justify-between ${
          open ? "border-2 border-blue-400" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <span className="text-sm text-gray-900">
          {selectedOption ? selectedOption.label : "Chọn..."}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`px-3 py-2 cursor-pointer transition-colors text-sm ${
                option.value === value
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "hover:bg-gray-100"
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [stats, setStats] = useState<OrderStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
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

  // Fetch statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      setStatsLoading(true);
      try {
        const params: any = {};
        if (q.startDate || q.endDate) {
          if (q.startDate) params.startDate = q.startDate;
          if (q.endDate) params.endDate = q.endDate;
        } else if (q.preset) {
          params.preset = q.preset;
        }
        const response = await getOrderStatistics(params);
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch order statistics:", error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStatistics();
  }, [q.preset, q.startDate, q.endDate]);

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
              Tất cả đơn hàng
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý và theo dõi tất cả đơn hàng
            </p>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards - Compact Design */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {/* Total Orders */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600">{stats.total || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Tổng đơn</p>
            </div>

            {/* Pending */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Chờ xác nhận</p>
            </div>

            {/* Processing */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.processing || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Đang xử lý</p>
            </div>

            {/* Shipping */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Truck className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-indigo-600">{stats.shipping || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Đang giao</p>
            </div>

            {/* Delivered */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.delivered || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Đã giao</p>
            </div>

            {/* Completed */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{stats.completed || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Hoàn thành</p>
            </div>

            {/* Cancelled/Returned */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.cancelledOrReturned || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Đã hủy/Trả</p>
            </div>
          </div>
        </motion.div>
      )}

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
          <CustomSelect
            value={`${q.sortField}-${q.sortOrder}`}
            onChange={(v) => {
              const [field, order] = v.split("-");
              setQ((prev) => ({
                ...prev,
                sortField: field,
                sortOrder: order as "ASC" | "DESC",
                page: 1,
              }));
            }}
            options={[
              { value: "createdAt-DESC", label: "Ngày tạo giảm dần" },
              { value: "createdAt-ASC", label: "Ngày tạo tăng dần" },
              { value: "updatedAt-DESC", label: "Trạng thái mới cập nhật" },
              { value: "grandTotal-DESC", label: "Tổng tiền giảm dần" },
              { value: "grandTotal-ASC", label: "Tổng tiền tăng dần" },
            ]}
          />
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
                <CustomSelect
                  value={q.status || ""}
                  onChange={(v) => {
                    setQ((prev) => ({
                      ...prev,
                      status: v || undefined,
                      page: 1,
                    }));
                  }}
                  options={[
                    { value: "", label: "Tất cả" },
                    { value: "awaiting_payment", label: "Chờ thanh toán" },
                    { value: "pending", label: "Chờ xác nhận" },
                    { value: "processing", label: "Đang xử lý" },
                    { value: "shipping", label: "Đang giao" },
                    { value: "delivered", label: "Đã giao" },
                    { value: "completed", label: "Hoàn thành" },
                    { value: "cancelled", label: "Đã hủy" },
                    { value: "expired", label: "Hết hạn" },
                    { value: "returned", label: "Đã trả" },
                    { value: "on_hold", label: "Tạm giữ" },
                  ]}
                />
              </div>

              {/* Payment Status Filter */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Trạng thái thanh toán
                </label>
                <CustomSelect
                  value={q.paymentStatus || ""}
                  onChange={(v) => {
                    setQ((prev) => ({
                      ...prev,
                      paymentStatus: v || undefined,
                      page: 1,
                    }));
                  }}
                  options={[
                    { value: "", label: "Tất cả" },
                    { value: "pending", label: "Chờ thanh toán" },
                    { value: "paid", label: "Đã thanh toán" },
                    { value: "failed", label: "Thất bại" },
                  ]}
                />
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Phương thức thanh toán
                </label>
                <CustomSelect
                  value={q.paymentMethod || ""}
                  onChange={(v) => {
                    setQ((prev) => ({
                      ...prev,
                      paymentMethod: v || undefined,
                      page: 1,
                    }));
                  }}
                  options={[
                    { value: "", label: "Tất cả" },
                    { value: "COD", label: "COD" },
                    { value: "VNPAY", label: "VNPAY" },
                  ]}
                />
              </div>

              {/* Preset Filter */}
              <div className="mt-5">
                <CustomSelect
                  value={q.preset || "this_month"}
                  onChange={(v) => {
                    setQ((prev) => ({
                      ...prev,
                      preset: v || undefined,
                      page: 1,
                    }));
                  }}
                  options={[
                    { value: "today", label: "Hôm nay" },
                    { value: "yesterday", label: "Hôm qua" },
                    { value: "this_week", label: "Tuần này" },
                    { value: "last_week", label: "Tuần trước" },
                    { value: "this_month", label: "Tháng này" },
                    { value: "last_month", label: "Tháng trước" },
                    { value: "this_year", label: "Năm này" },
                    { value: "custom", label: "Tùy chỉnh" },
                  ]}
                />
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
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer rounded-lg transition-colors"
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
                          <div 
                            className="text-xs text-gray-500 cursor-help relative group"
                          >
                            {getRelativeTime(order.updatedAt || order.createdAt)}
                            <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block min-w-[180px] p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap">
                              <div>Tạo: {new Date(order.createdAt).toLocaleString("vi-VN")}</div>
                              <div className="mt-1">Cập nhật: {new Date(order.updatedAt).toLocaleString("vi-VN")}</div>
                            </div>  
                          </div>  
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="max-w-[200px]">
                        <div className="font-medium text-gray-900 truncate">
                          {order.recipientName}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {order.recipientPhone} · {order.provinceName}
                        </div>
                        {order.customerNote && (
                          <div className="mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md flex items-center gap-1 whitespace-nowrap overflow-hidden">
                            <Pencil className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">Khách: {order.customerNote}</span>
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
          <TablePagination
            page={q.page}
            limit={q.limit}
            totalPages={meta?.totalPages}
            totalItems={meta?.totalItems}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPageChange={(p) => setQ((prev) => ({ ...prev, page: p }))}
            onLimitChange={(l) => setAndResetPage({ limit: l, page: 1 })}
            limitOptions={[10, 20, 50, 100]}
          />
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
