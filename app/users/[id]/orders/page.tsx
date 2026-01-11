"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShoppingBag,
  Package,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import TablePagination from "@/components/shared/TablePagination";
import { useListQuery } from "@/components/listing/hooks/useListQuery";
import {
  getUserOrders,
  type UserOrder,
  type UserOrdersQuery,
} from "@/services/userService";
import { Routes } from "@/lib/routes";

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
        className={`w-full px-3 py-2 text-left bg-white border rounded-lg cursor-pointer transition-all flex items-center justify-between ${
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

function formatDateTime(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("en-US") + "đ";
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    "awaiting_payment": "Chờ thanh toán",
    "pending": "Chờ xử lý",
    "processing": "Đang xử lý",
    "shipping": "Đang giao hàng",
    "delivered": "Đã giao hàng",
    "completed": "Hoàn tất",
    "cancelled": "Đã hủy",
    "expired": "Đã hết hạn",
    "returned": "Đã trả hàng",
    "on_hold": "Tạm dừng",
  };
  return statusMap[status.toLowerCase()] || status;
}


function UserOrdersPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery({
    limit: 20,
  });

  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (!userId) return;

    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams: UserOrdersQuery = {
          page: apiParams.page,
          limit: apiParams.limit,
        };
        if (apiParams.search) queryParams.search = apiParams.search;
        if ((apiParams as any).status) queryParams.status = (apiParams as any).status;

        const res = await getUserOrders(userId, queryParams);
        if (alive && res.success) {
          const data = res.data || [];
          setOrders(data);
          const totalItems = res.meta?.totalItems || data.length;
          const limit = apiParams.limit || 20;
          const totalPages = Math.ceil(totalItems / limit);
          setMeta({ totalItems, totalPages });
        }
      } catch (e) {
        console.error("Lỗi khi tải đơn hàng:", e);
        if (alive) {
          setError("Không thể tải đơn hàng");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [userId, apiKey]);

  const getStatusBadgeClass = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "awaiting_payment":
        return "bg-orange-100 text-orange-800 border border-orange-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "processing":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "shipping":
        return "bg-indigo-100 text-indigo-800 border border-indigo-300";
      case "delivered":
        return "bg-green-100 text-green-800 border border-green-300";
      case "completed":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border border-red-300";
      case "expired":
        return "bg-gray-100 text-gray-800 border border-gray-300";
      case "returned":
        return "bg-pink-100 text-pink-800 border border-pink-300";
      case "on_hold":
        return "bg-purple-100 text-purple-800 border border-purple-300";
      // Fallback for old status formats
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "AWAITING_PAYMENT":
        return "bg-orange-100 text-orange-800 border border-orange-300";
      case "PLACED":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "PAID":
        return "bg-green-100 text-green-800 border border-green-300";
      case "CONFIRMED":
        return "bg-green-100 text-green-800 border border-green-300";
      case "PREPARING_SHIPMENT":
        return "bg-indigo-100 text-indigo-800 border border-indigo-300";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-800 border border-indigo-300";
      case "DELIVERED":
        return "bg-green-100 text-green-800 border border-green-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
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

  if (error) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-[1440px] mx-auto py-6 px-4 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Button
              size="icon-lg"
              className="hover:bg-gray-300 rounded-full bg-gray-200"
              onClick={() => router.back()}
              title="Quay lại"
            >
              <ArrowLeft className="text-gray-700 size-7" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-800">Đơn hàng của người dùng</h1>
          </div>
          <div className="flex justify-center min-h-[400px]">
            <p className="text-red-600 text-lg">{error}</p>
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

            <div className="flex items-end gap-3 flex-1">
              <h1 className="text-3xl font-bold text-gray-800">Đơn hàng của người dùng ({meta?.totalItems || 0})</h1>
            </div>

            <div className="min-w-[200px]">
              <CustomSelect
                value={(apiParams as any).status || ""}
                onChange={(v) => setAndResetPage({ status: v || undefined, page: 1 } as any)}
                options={[
                  { value: "", label: "Tất cả trạng thái" },
                  { value: "awaiting_payment", label: "Chờ thanh toán" },
                  { value: "pending", label: "Chờ xử lý" },
                  { value: "processing", label: "Đang xử lý" },
                  { value: "shipping", label: "Đang giao hàng" },
                  { value: "delivered", label: "Đã giao hàng" },
                  { value: "completed", label: "Hoàn tất" },
                  { value: "cancelled", label: "Đã hủy" },
                  { value: "expired", label: "Đã hết hạn" },
                  { value: "returned", label: "Đã trả hàng" },
                  { value: "on_hold", label: "Tạm dừng" },
                ]}
              />
            </div>
          </div>
        </motion.div>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center"
          >
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg">Không tìm thấy đơn hàng</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-visible"
          >
            <div className="rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Mã đơn hàng
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Tổng
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Thanh toán
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package size={18} className="text-gray-400" />
                            <div>
                              <p className="text-gray-800 font-medium">
                                {order.orderCode}
                              </p>
                              {order.shippingCode && (
                                <p className="text-xs text-gray-500">
                                  Vận chuyển: {order.shippingCode}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-left">
                          <div className="space-y-1">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <p className="text-gray-800 font-medium">
                                  {item.productName || item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  SL: {item.quantity} / Màu: {item.colors}
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-left">
                          <p className="text-gray-800 font-semibold">
                            {formatCurrency(order.grandTotal)}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <p className="text-gray-700">{order.paymentMethod}</p>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <p className="text-gray-600">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <TablePagination
              page={q.page}
              limit={q.limit}
              totalPages={meta?.totalPages}
              totalItems={meta?.totalItems}
              hasPrev={q.page > 1}
              hasNext={meta?.totalPages ? q.page < meta.totalPages : false}
              onPageChange={(p) => setQ((prev) => ({ ...prev, page: p }))}
              onLimitChange={(l) => setAndResetPage({ limit: l, page: 1 })}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default withAuthCheck(UserOrdersPage);
