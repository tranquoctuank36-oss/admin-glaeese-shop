"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Package,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
  MoreVertical,
  History,
  Settings,
  TrendingUp,
  X,
  Loader2,
} from "lucide-react";
import {
  getStocks,
  updateStockConfiguration,
  createStockMovement,
  getStockStatistics,
} from "@/services/stockService";
import type { Stock } from "@/types/stock";
import { Routes } from "@/lib/routes";
import ToolbarSearchFilters from "@/components/listing/ToolbarSearchFilters";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import TablePagination from "@/components/shared/TablePagination";
import { toast } from "react-hot-toast";
import FloatingInput from "@/components/shared/FloatingInput";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

type MovementType = "inbound" | "outbound" | "adjustment" | "transfer";

type RefType =
  | "purchase_order"
  | "gift_in"
  | "sales_order"
  | "gift_out"
  | "customer_return"
  | "supplier_return"
  | "stock_take"
  | "internal_transfer"
  | "manufacturing"
  | "damaged"
  | "loss"
  | "other";

const REFERENCE_OPTIONS: { value: RefType; label: string }[] = [
  { value: "purchase_order", label: "Đơn mua hàng" },
  { value: "gift_in", label: "Nhận quà tặng" },
  { value: "sales_order", label: "Đơn bán hàng" },
  { value: "gift_out", label: "Quà tặng" },
  { value: "customer_return", label: "Khách trả hàng" },
  { value: "supplier_return", label: "Trả hàng nhà cung cấp" },
  { value: "stock_take", label: "Kiểm kho" },
  { value: "internal_transfer", label: "Chuyển kho nội bộ" },
  { value: "manufacturing", label: "Sản xuất" },
  { value: "damaged", label: "Hỏng hóa" },
  { value: "loss", label: "Mất mát" },
  { value: "other", label: "Khác" },
];

const REFERENCE_BY_MOVEMENT: Record<MovementType, RefType[]> = {
  inbound: ["purchase_order", "gift_in", "customer_return", "manufacturing", "other"],
  outbound: ["sales_order", "gift_out", "supplier_return", "manufacturing", "damaged", "loss", "other"],
  adjustment: ["stock_take", "damaged", "loss", "other"],
  transfer: ["internal_transfer", "other"],
};


function StocksPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortField, setSortField] = useState<"updatedAt" | "quantityAvailable" | "product">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [stats, setStats] = useState<any>(null);

  // Action dialogs state
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [safetyStockValue, setSafetyStockValue] = useState(0);

  // ✅ defaults: adjustment
  const [adjustmentType, setAdjustmentType] = useState<MovementType>("adjustment");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentQuantityInput, setAdjustmentQuantityInput] = useState("0");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [referenceType, setReferenceType] = useState<RefType>("other");
  const [referenceId, setReferenceId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

  const referenceOptionsForMovement = useMemo(() => {
    const allowed = REFERENCE_BY_MOVEMENT[adjustmentType];
    return REFERENCE_OPTIONS.filter((opt) => allowed.includes(opt.value));
  }, [adjustmentType]);

  useEffect(() => {
    const allowed = REFERENCE_BY_MOVEMENT[adjustmentType];
    if (!allowed.includes(referenceType)) {
      const preferred: RefType = allowed.includes("other") ? "other" : allowed[0];
      setReferenceType(preferred);
      setReferenceId("");
    }
  }, [adjustmentType]);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await getStocks({
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter as any,
        sortField,
        sortOrder,
      });
      setStocks(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể tải tồn kho");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getStockStatistics();
      setStats(statsData.data ?? statsData);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleUpdateSafetyStock = async () => {
    if (!selectedStock) return;
    try {
      setSubmitting(true);
      await updateStockConfiguration(selectedStock.id, { safetyStock: safetyStockValue });
      toast.success("Cập nhật tồn kho an toàn thành công");
      setShowConfigDialog(false);
      fetchStocks();
      fetchStats();
    } catch (error: any) {
      console.error("Update Safety Stock Error:", error);
      toast.error(error?.response?.data?.detail || "Không thể cập nhật tồn kho an toàn");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedStock) return;
    if (adjustmentQuantity === 0) {
      toast.error("Vui lòng nhập số lượng");
      return;
    }
    try {
      setSubmitting(true);
      await createStockMovement(selectedStock.id, {
        deltaQuantity: adjustmentQuantity,
        type: adjustmentType,
        referenceType: referenceType,
        referenceId: referenceId || null,
        note: adjustmentNote || null,
      });
      toast.success("Điều chỉnh tồn kho thành công");
      setShowAdjustDialog(false);

      // reset default
      setAdjustmentType("adjustment");
      setAdjustmentQuantity(0);
      setAdjustmentQuantityInput("0");
      setAdjustmentNote("");
      setReferenceType("other");
      setReferenceId("");

      fetchStocks();
      fetchStats();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể điều chỉnh tồn kho");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, itemsPerPage, searchTerm, sortField, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, []);

  const toggleProductSort = () => {
    if (sortField !== "product") {
      setSortField("product");
      setSortOrder("ASC");
    } else if (sortOrder === "ASC") {
      setSortOrder("DESC");
    } else {
      setSortField("updatedAt");
      setSortOrder("DESC");
    }
    setCurrentPage(1);
  };

  const toggleQuantitySort = () => {
    if (sortField !== "quantityAvailable") {
      setSortField("quantityAvailable");
      setSortOrder("DESC");
    } else if (sortOrder === "DESC") {
      setSortOrder("ASC");
    } else {
      setSortField("updatedAt");
      setSortOrder("DESC");
    }
    setCurrentPage(1);
  };

  const toggleUpdatedAtSort = () => {
    if (sortField !== "updatedAt") {
      setSortField("updatedAt");
      setSortOrder("DESC");
    } else if (sortOrder === "DESC") {
      setSortOrder("ASC");
    } else {
      setSortField("product");
      setSortOrder("ASC");
    }
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            Còn hàng
          </span>
        );
      case "low_stock":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            Sắp hết hàng
          </span>
        );
      case "out_of_stock":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            Hết hàng
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            Không rõ
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Kho hàng</h1>
                <p className="text-sm text-gray-500 mt-1">Quản lý mức tồn kho và tình trạng sản phẩm</p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            >
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">SKU</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total ?? 0}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Còn hàng</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.inStock ?? 0}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sắp hết hàng</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.lowStock ?? 0}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hết hàng</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStock ?? 0}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng số lượng</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.totalQuantityOnHand ?? 0}</p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đơn hàng đang giữ</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalQuantityReserved ?? 0}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Có thể bán</p>
                    <p className="text-2xl font-bold text-teal-600 mt-1">{stats.totalQuantityAvailable ?? 0}</p>
                  </div>
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600">Giá trị ước tính</p>
                    <p className="text-lg font-bold text-orange-600 mt-1 break-words">
                      {stats.estimatedStockValue ? `${Number(stats.estimatedStockValue).toLocaleString("en-US")}đ` : "0đ"}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg flex-shrink-0 ml-2">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <ToolbarSearchFilters
              value={searchTerm}
              onSearchChange={(v) => {
                setSearchTerm(v);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm theo tên biến thể sản phẩm hoặc SKU..."
              stockStatus={statusFilter === "" ? "all" : (statusFilter as any)}
              onFiltersChange={(patch) => {
                if (patch.stockStatus !== undefined) {
                  setStatusFilter(patch.stockStatus === "all" ? "" : patch.stockStatus);
                  setCurrentPage(1);
                }
              }}
            />
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-600 text-lg">Đang tải tồn kho...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>Biến thể sản phẩm</span>
                          <button
                            type="button"
                            onClick={toggleProductSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              sortField === "product"
                                ? `Sắp xếp: ${sortOrder} (nhấn để thay đổi)`
                                : "Chưa sắp xếp (nhấn để sắp xếp theo Sản phẩm)"
                            }
                          >
                            {sortField === "product" ? (
                              sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5" />
                              ) : (
                                <ArrowDownAZ className="size-5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5" />
                            )}
                          </button>
                        </div>
                      </th>

                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Tồn kho
                      </th>

                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Đang giữ
                      </th>

                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <span>Có sẵn</span>
                          <button
                            type="button"
                            onClick={toggleQuantitySort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              sortField === "quantityAvailable"
                                ? `Sắp xếp: ${sortOrder} (nhấn để thay đổi)`
                                : "Chưa sắp xếp (nhấn để sắp xếp theo Có sẵn)"
                            }
                          >
                            {sortField === "quantityAvailable" ? (
                              sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5" />
                              ) : (
                                <ArrowDownAZ className="size-5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5" />
                            )}
                          </button>
                        </div>
                      </th>

                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Tồn kho an toàn
                      </th>

                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Trạng thái
                      </th>

                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <span>Cập nhật</span>
                          <button
                            type="button"
                            onClick={toggleUpdatedAtSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              sortField === "updatedAt"
                                ? `Sắp xếp: ${sortOrder} (nhấn để thay đổi)`
                                : "Chưa sắp xếp (nhấn để sắp xếp theo Thời gian)"
                            }
                          >
                            {sortField === "updatedAt" ? (
                              sortOrder === "ASC" ? (
                                <ArrowUpAZ className="size-5" />
                              ) : (
                                <ArrowDownAZ className="size-5" />
                              )
                            ) : (
                              <ArrowUpDown className="size-5" />
                            )}
                          </button>
                        </div>
                      </th>

                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {stocks.map((stock, idx) => {
                      if (!stock.productVariant) return null;

                      return (
                        <motion.tr
                          key={stock.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {stock.productVariant?.images?.[0] ? (
                                <img
                                  src={stock.productVariant.images[0].publicUrl}
                                  alt={stock.productVariant.name}
                                  className="w-12 h-12 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() =>
                                    setLightboxImage({
                                      url: stock.productVariant.images![0].publicUrl,
                                      alt: stock.productVariant.name,
                                    })
                                  }
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                  <Package size={20} className="text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-800 pr-6">{stock.productVariant.name}</p>
                                <p className="text-xs text-gray-500">SKU: {stock.productVariant.sku}</p>
                                <p className="text-sm text-gray-500">
                                  {Number(stock.productVariant.originalPrice).toLocaleString("en-US")}đ
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-base font-semibold text-gray-600">{stock.quantityOnHand}</span>
                          </td>

                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-base font-semibold text-gray-500">{stock.quantityReserved}</span>
                          </td>

                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-base font-bold text-green-600">{stock.quantityAvailable}</span>
                          </td>

                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-600">{stock.safetyStock}</span>
                          </td>

                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            {getStatusBadge(stock.stockStatus)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-base text-gray-600">{formatDate(stock.updatedAt)}</span>
                          </td>

                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 cursor-pointer">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-2" align="end">
                                <div className="flex flex-col gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2 font-normal cursor-pointer"
                                    onClick={() => {
                                      router.push(`${Routes.stocks.movements}?stockId=${stock.id}`);
                                    }}
                                  >
                                    <History className="h-4 w-4" />
                                    Xem lịch sử
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2 font-normal cursor-pointer"
                                    onClick={() => {
                                      setSelectedStock(stock);
                                      setSafetyStockValue(stock.safetyStock);
                                      setShowConfigDialog(true);
                                    }}
                                  >
                                    <Settings className="h-4 w-4" />
                                    Cấu hình tồn kho an toàn
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start gap-2 font-normal cursor-pointer"
                                    onClick={() => {
                                      setSelectedStock(stock);

                                      // ✅ reset default khi mở dialog
                                      setAdjustmentQuantity(0);
                                      setAdjustmentQuantityInput("0");
                                      setAdjustmentNote("");
                                      setAdjustmentType("adjustment");
                                      setReferenceType("other");
                                      setReferenceId("");

                                      setShowAdjustDialog(true);
                                    }}
                                  >
                                    <TrendingUp className="h-4 w-4" />
                                    Điều chỉnh tồn kho
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </td>
                        </motion.tr>
                      );
                    })}

                    {stocks.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-20">
                          <div className="text-center">
                            <Package size={64} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg font-medium">Không tìm thấy tồn kho nào</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && stocks.length > 0 && (
              <TablePagination
                page={currentPage}
                limit={itemsPerPage}
                totalPages={totalPages}
                totalItems={totalItems}
                hasPrev={currentPage > 1}
                hasNext={currentPage < totalPages}
                onPageChange={setCurrentPage}
                onLimitChange={(l) => {
                  setItemsPerPage(l);
                  setCurrentPage(1);
                }}
              />
            )}
          </motion.div>

          {/* Configure Safety Stock Dialog */}
          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cấu hình tồn kho an toàn</DialogTitle>
              <p className="text-sm text-gray-500">
                {selectedStock?.productVariant.name} ({selectedStock?.productVariant.sku})
              </p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mức tồn kho an toàn</label>
                <input
                  type="number"
                  min="0"
                  value={safetyStockValue}
                  onChange={(e) => setSafetyStockValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                  placeholder="Nhập mức tồn kho an toàn"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Số lượng tối thiểu cần duy trì trong kho trước khi cảnh báo sắp hết hàng.
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-sm text-gray-600">
                  <span>Tồn kho hiện tại:</span>{" "}
                  <span className="font-semibold text-blue-600">{selectedStock?.quantityAvailable} đơn vị</span>
                  <br />
                  <span>Tồn kho an toàn hiện tại:</span>{" "}
                  <span className="font-semibold text-blue-600">{selectedStock?.safetyStock} đơn vị</span>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfigDialog(false)}
                className="h-10 w-25 bg-gray-500 hover:bg-gray-700 text-white hover:text-white cursor-pointer"
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                onClick={handleUpdateSafetyStock}
                disabled={submitting}
                className="h-10 w-25 bg-blue-500 hover:bg-blue-700 text-white hover:text-white cursor-pointer"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : "Cập nhật"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Adjust Stock Dialog */}
        <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
              <p className="text-sm text-gray-500">
                {selectedStock?.productVariant.name} ({selectedStock?.productVariant.sku})
              </p>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <FloatingInput
                  id="adjustmentType"
                  label="Loại biến động"
                  as="select"
                  value={adjustmentType}
                  onChange={(val) => setAdjustmentType(val as MovementType)}
                  options={[
                    { value: "inbound", label: "Nhập kho" },
                    { value: "outbound", label: "Xuất kho" },
                    { value: "adjustment", label: "Điều chỉnh" },
                    { value: "transfer", label: "Chuyển kho" },
                  ]}
                  required
                />
              </div>

              <div>
                {/* ✅ options đã được lọc theo adjustmentType */}
                <FloatingInput
                  id="referenceType"
                  label="Loại tham chiếu"
                  as="select"
                  value={referenceType}
                  onChange={(val) => setReferenceType(val as RefType)}
                  options={referenceOptionsForMovement}
                  required
                />
              </div>

              {/* <div>
                <FloatingInput
                  id="referenceId"
                  label="Mã tham chiếu"
                  as="input"
                  type="text"
                  value={referenceId}
                  onChange={(val) => setReferenceId(val)}
                />
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={adjustmentQuantityInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAdjustmentQuantityInput(val);

                    if (val === '' || val === '-') {
                      return;
                    }
                    
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      setAdjustmentQuantity(num);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <FloatingInput
                  id="adjustmentNote"
                  label="Ghi chú"
                  as="textarea"
                  value={adjustmentNote}
                  onChange={(val) => setAdjustmentNote(val)}
                  rows={3}
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-sm text-gray-600">
                  <span>Hiện có:</span>{" "}
                  <span className="font-semibold text-blue-600">{selectedStock?.quantityAvailable} đơn vị</span>
                  <br />
                  <span>Sau điều chỉnh:</span>{" "}
                  <span className="font-semibold text-blue-600">
                    {(selectedStock?.quantityAvailable || 0) + adjustmentQuantity} đơn vị
                  </span>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAdjustDialog(false)}
                disabled={submitting}
                className="h-10 w-25 bg-gray-500 hover:bg-gray-700 text-white hover:text-white cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                onClick={handleAdjustStock}
                disabled={submitting || adjustmentQuantity === 0}
                className="h-10 w-25 bg-blue-500 hover:bg-blue-700 text-white hover:text-white cursor-pointer"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : "Điều chỉnh"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lightbox Modal */}
        {lightboxImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={() => setLightboxImage(null)}>
            <Button
              className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-gray-200 transition-colors"
              onClick={() => setLightboxImage(null)}
              title="Đóng"
            >
              <X className="w-6 h-6 text-gray-800" />
            </Button>
            <div className="max-w-7xl max-h-[90vh] p-4">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.alt}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
        </motion.div>
      </main>
    </div>
  );
}

export default withAuthCheck(StocksPage);
