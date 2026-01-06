"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, Eye, Shield } from "lucide-react";
import { getReturns } from "@/services/returnService";
import { Return } from "@/types/return";
import { useListQuery } from "@/components/data/useListQuery";
import Pagination from "@/components/data/Pagination";
import { Button } from "@/components/ui/button";
import { Routes } from "@/lib/routes";

export default function ReturnsPage() {
  const router = useRouter();

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery(
    {
      limit: 20,
    },
  );

  const [returns, setReturns] = useState<Return[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hoveredReturnId, setHoveredReturnId] = useState<string | null>(null);

  // Fetch returns from API
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getReturns(apiParams);
        if (!alive) return;
        setReturns(res.data);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
        setHasNext(!!res.hasNext);
        setHasPrev(!!res.hasPrev);
      } catch (e) {
        console.error("Failed to fetch returns:", e);
        if (alive) {
          setReturns([]);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'waiting_item':
        return 'bg-purple-100 text-purple-700';
      case 'received_at_warehouse':
        return 'bg-indigo-100 text-indigo-700';
      case 'refund_initiated':
        return 'bg-orange-100 text-orange-700';
      case 'refund_completed':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'canceled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'requested':
        return 'Yêu cầu mới';
      case 'approved':
        return 'Đã duyệt';
      case 'waiting_item':
        return 'Chờ hàng về';
      case 'received_at_warehouse':
        return 'Đã nhận hàng';
      case 'refund_initiated':
        return 'Đang hoàn tiền';
      case 'refund_completed':
        return 'Đã hoàn tiền';
      case 'rejected':
        return 'Đã từ chối';
      case 'canceled':
        return 'Đã hủy';
      default:
        return status;
    }
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
              Trả hàng ({meta?.totalItems || 0})
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý yêu cầu trả hàng và hoàn tiền
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 bg-white rounded-lg shadow border border-gray-200 p-3"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
              placeholder="Tìm kiếm theo mã đơn hàng..."
              value={q.search || ""}
              onChange={(e) =>
                setAndResetPage({ search: e.target.value, page: 1 })
              }
            />
          </div>
          <select
            className="h-[42px] px-3 border border-gray-300 rounded-lg focus:border-blue-500 outline-none bg-white cursor-pointer"
            value={q.status || ""}
            onChange={(e) => {
              setQ((prev) => ({
                ...prev,
                status: e.target.value || undefined,
                page: 1,
              }));
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="requested">Yêu cầu mới</option>
            <option value="approved">Đã duyệt</option>
            <option value="waiting_item">Chờ hàng về</option>
            <option value="received_at_warehouse">Đã nhận hàng</option>
            <option value="refund_initiated">Đang hoàn tiền</option>
            <option value="refund_completed">Đã hoàn tiền</option>
            <option value="rejected">Đã từ chối</option>
            <option value="canceled">Đã hủy</option>
          </select>
        </div>
      </motion.div>

      {/* Returns Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <p className="text-gray-600">Đang tải...</p>
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-500">
            Không có yêu cầu trả hàng nào
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
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Mã
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap ">
                    Lý do
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Thông tin hoàn tiền
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {returns.map((returnItem, idx) => (
                  <motion.tr
                    key={returnItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Trả hàng:</span>
                          <span className="font-semibold text-blue-600">
                            {returnItem.returnCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Đơn hàng:</span>
                          <span className="font-semibold text-gray-900">
                            {returnItem.orderCode}
                          </span>
                          {returnItem.adminNote &&
                            Object.keys(returnItem.adminNote).length > 0 && (
                              <div
                                className="relative inline-block"
                                onMouseEnter={() => setHoveredReturnId(returnItem.id)}
                                onMouseLeave={() => setHoveredReturnId(null)}
                              >
                                <Shield className="w-4 h-4 text-blue-600 cursor-help" />
                                {hoveredReturnId === returnItem.id && (
                                  <div className="absolute left-0 top-6 z-50 min-w-[200px] max-w-[300px] p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-normal break-words">
                                    {getAdminNoteValue(returnItem.adminNote)}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="max-w-[200px]">
                        <p className="text-sm text-gray-700 truncate">
                          {returnItem.reason}
                        </p>
                        {returnItem.customerNote && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            Ghi chú: {typeof returnItem.customerNote === 'string' 
                              ? returnItem.customerNote 
                              : JSON.stringify(returnItem.customerNote)}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="space-y-1">
                        {returnItem.calculatedRefundAmount && (
                          <div className="text-sm">
                            <span className="text-xs text-gray-500">Tính toán: </span>
                            <span className="font-semibold text-blue-600">
                              {typeof returnItem.calculatedRefundAmount === 'string' 
                                ? parseFloat(returnItem.calculatedRefundAmount).toLocaleString("en-US") 
                                : '-'}đ
                            </span>
                          </div>
                        )}
                        {returnItem.refundAmount && (
                          <div className="text-sm">
                            <span className="text-xs text-gray-500">Thực tế: </span>
                            <span className="font-semibold text-gray-900">
                              {typeof returnItem.refundAmount === 'string' 
                                ? parseFloat(returnItem.refundAmount).toLocaleString("en-US") 
                                : '-'}đ
                            </span>
                          </div>
                        )}
                        {!returnItem.calculatedRefundAmount && !returnItem.refundAmount && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(returnItem.status)}`}
                      >
                        {getStatusLabel(returnItem.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="text-base text-gray-700">
                        {new Date(returnItem.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon-sm"
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Xem chi tiết"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(Routes.orders.returnDetails(returnItem.id));
                          }}
                        >
                          <Eye className="text-blue-600 size-5" />
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
    </>
  );
}
