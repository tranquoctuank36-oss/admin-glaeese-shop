"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
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
import { getStocks, getStockMovements, updateStockConfiguration, createStockMovement } from "@/services/stockService";
import type { Stock, StockMovement } from "@/types/stock";
import ToolbarSearchFilters from "@/components/data/ToolbarSearchFilters";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import Pagination from "@/components/data/Pagination";
import { toast } from "react-hot-toast";
import FloatingInput from "@/components/FloatingInput";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortField, setSortField] = useState<
    "updatedAt" | "quantityAvailable" | "product"
  >("updatedAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [grandTotal, setGrandTotal] = useState(0);
  const [stats, setStats] = useState({
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  
  // Action dialogs state
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showMovementsDialog, setShowMovementsDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [safetyStockValue, setSafetyStockValue] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<"inbound" | "outbound" | "adjustment">("adjustment");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

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
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể tải tồn kho");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch counts for each status
      const [inStockRes, lowStockRes, outOfStockRes, totalRes] =
        await Promise.all([
          getStocks({ status: "in_stock", limit: 1 }),
          getStocks({ status: "low_stock", limit: 1 }),
          getStocks({ status: "out_of_stock", limit: 1 }),
          getStocks({ limit: 1 }), // Get total without filter
        ]);
      setStats({
        inStock: inStockRes.meta.totalItems,
        lowStock: lowStockRes.meta.totalItems,
        outOfStock: outOfStockRes.meta.totalItems,
      });
      setGrandTotal(totalRes.meta.totalItems);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchMovements = async (stockId: string) => {
    try {
      setLoadingMovements(true);
      const response = await getStockMovements(stockId, { limit: 50 });
      setMovements(response.data);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể tải lịch sử biến động");
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleUpdateSafetyStock = async () => {
    if (!selectedStock) return;
    try {
      setSubmitting(true);
      await updateStockConfiguration(selectedStock.id, {
        safetyStock: safetyStockValue,
      });
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
        referenceType: adjustmentType,
        note: adjustmentNote || null,
      });
      toast.success("Điều chỉnh tồn kho thành công");
      setShowAdjustDialog(false);
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
  }, [
    currentPage,
    statusFilter,
    itemsPerPage,
    searchTerm,
    sortField,
    sortOrder,
  ]);

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
      // setSortOrder(sortOrder === "DESC" ? "ASC" : "DESC");
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Danh sách tồn kho {grandTotal > 0 && `(${grandTotal})`}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Quản lý mức tồn kho và tình trạng sản phẩm
                </p>
              </div>
            </div>
          </div>

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
              placeholder="Tìm kiếm theo tên sản phẩm hoặc SKU..."
              stockStatus={statusFilter === "" ? "all" : (statusFilter as any)}
              onFiltersChange={(patch) => {
                if (patch.stockStatus !== undefined) {
                  setStatusFilter(
                    patch.stockStatus === "all" ? "" : patch.stockStatus
                  );
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
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
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
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Tồn kho
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Đã đặt
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
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
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Tồn kho an toàn
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <span>Cập nhật lúc</span>
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
                      
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {stocks.map((stock, idx) => {
                      // Skip stocks without productVariant
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
                                  onClick={() => setLightboxImage({
                                    url: stock.productVariant.images![0].publicUrl,
                                    alt: stock.productVariant.name
                                  })}
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                  <Package
                                    size={20}
                                    className="text-gray-400"
                                  />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-800 pr-6">
                                  {stock.productVariant.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  SKU: {stock.productVariant.sku}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {Number(
                                    stock.productVariant.originalPrice
                                  ).toLocaleString("en-US")}
                                  đ
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-base font-semibold text-gray-600">
                              {stock.quantityOnHand}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-base font-semibold text-gray-500">
                              {stock.quantityReserved}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-base font-bold text-green-600">
                              {stock.quantityAvailable}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-600">
                              {stock.safetyStock}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            {getStatusBadge(stock.stockStatus)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-base text-gray-600">
                              {formatDate(stock.updatedAt)}
                            </span>
                          </td>
                          
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-100 cursor-pointer"
                                >
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
                                      setSelectedStock(stock);
                                      setShowMovementsDialog(true);
                                      fetchMovements(stock.id);
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
                                      setAdjustmentQuantity(0);
                                      setAdjustmentNote("");
                                      setAdjustmentType("adjustment");
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
                            <Package
                              size={64}
                              className="mx-auto text-gray-300 mb-4"
                            />
                            <p className="text-gray-500 text-lg font-medium">
                              Không tìm thấy tồn kho nào
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && stocks.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                {/* Rows per page (left) */}
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span>Số hàng mỗi trang:</span>
                  <select
                    className="h-9 rounded-md border border-gray-300 px-2 bg-white"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    {[10, 20, 30, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Controls (right) */}
                <div className="flex items-center gap-4">
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    hasPrev={currentPage > 1}
                    hasNext={currentPage < totalPages}
                    onChange={setCurrentPage}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* View Movements Dialog */}
        <Dialog open={showMovementsDialog} onOpenChange={setShowMovementsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lịch sử biến động tồn kho</DialogTitle>
              <p className="text-sm text-gray-500">
                {selectedStock?.productVariant.name} ({selectedStock?.productVariant.sku})
              </p>
            </DialogHeader>
            {loadingMovements ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy lịch sử biến động
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thay đổi</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sau đó</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tham chiếu</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movements.map((movement) => (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {formatDate(movement.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            movement.type === "inbound" ? "bg-green-100 text-green-800" :
                            movement.type === "outbound" ? "bg-red-100 text-red-800" :
                            movement.type === "adjustment" ? "bg-blue-100 text-blue-800" :
                            "bg-purple-100 text-purple-800"
                          }`}>
                            {movement.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={movement.deltaQuantity > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                            {movement.deltaQuantity > 0 ? "+" : ""}{movement.deltaQuantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">
                          {movement.quantityAfter}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {movement.referenceType}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {movement.note || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mức tồn kho an toàn
                </label>
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
                  <span>Tồn kho hiện tại:</span> <span className="font-semibold text-blue-600">{selectedStock?.quantityAvailable} đơn vị</span><br/>
                  <span>Tồn kho an toàn hiện tại:</span> <span className="font-semibold text-blue-600">{selectedStock?.safetyStock} đơn vị</span>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfigDialog(false)}
                className="h-10 bg-gray-500 hover:bg-gray-700 text-white hover:text-white cursor-pointer"
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                onClick={handleUpdateSafetyStock}
                disabled={submitting}
                className="h-10 bg-blue-500 hover:bg-blue-700 text-white hover:text-white cursor-pointer"
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
                  onChange={(val) => setAdjustmentType(val as any)}
                  options={[
                    { value: "inbound", label: "Nhập kho (Thêm hàng)" },
                    { value: "outbound", label: "Xuất kho (Trừ hàng)" },
                    { value: "adjustment", label: "Điều chỉnh (Hiệu chỉnh)" },
                  ]}
                  required
                />
              </div>
              <div>
                <FloatingInput
                  id="adjustmentQuantity"
                  label="Số lượng"
                  as="input"
                  type="number"
                  value={String(adjustmentQuantity)}
                  onChange={(val) => setAdjustmentQuantity(Number(val) || 0)}
                  placeholder={adjustmentType === "outbound" ? "Nhập giá trị âm" : "Nhập số lượng"}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  {adjustmentType === "inbound" && "Nhập giá trị dương để thêm hàng"}
                  {adjustmentType === "outbound" && "Nhập giá trị âm để trừ hàng"}
                  {adjustmentType === "adjustment" && "Nhập giá trị dương hoặc âm"}
                </p>
              </div>
              <div>
                <FloatingInput
                  id="adjustmentNote"
                  label="Ghi chú (Tùy chọn)"
                  as="textarea"
                  value={adjustmentNote}
                  onChange={(val) => setAdjustmentNote(val)}
                  rows={3}
                />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-sm text-gray-600">
                  <span>Hiện có:</span> <span className="font-semibold text-blue-600">{selectedStock?.quantityAvailable} đơn vị</span><br/>
                  <span>Sau điều chỉnh:</span> <span className="font-semibold text-blue-600">{(selectedStock?.quantityAvailable || 0) + adjustmentQuantity} đơn vị</span>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAdjustDialog(false)}
                disabled={submitting}
                className="h-10 bg-gray-500 hover:bg-gray-700 text-white hover:text-white cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                onClick={handleAdjustStock}
                disabled={submitting || adjustmentQuantity === 0}
                className="h-10 bg-blue-500 hover:bg-blue-700 text-white hover:text-white cursor-pointer"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : "Điều chỉnh"}
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
      </main>
    </div>
  );
}

export default withAuthCheck(StocksPage);
