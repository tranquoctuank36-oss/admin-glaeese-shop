"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { History, Package, ArrowLeft, Search, Filter, ChevronDown } from "lucide-react";
import { getStocks, getStockMovements } from "@/services/stockService";
import type { Stock, StockMovement } from "@/types/stock";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import TablePagination from "@/components/shared/TablePagination";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";

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

function formatDate(iso?: string) {
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

function StockMovementsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stockIdFromUrl = searchParams.get("stockId");

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStockId, setSelectedStockId] = useState<string>("");
  const [movementTypeFilter, setMovementTypeFilter] = useState<
    MovementType | ""
  >("");
  const [referenceTypeFilter, setReferenceTypeFilter] = useState<RefType | "">(
    ""
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<"createdAt" | "deltaQuantity">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [showFilters, setShowFilters] = useState(false);
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

  // Fetch stocks for dropdown
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await getStocks({ limit: 1000 });
        setStocks(response.data);
        // Set stock from URL or first stock
        if (stockIdFromUrl) {
          setSelectedStockId(stockIdFromUrl);
        } else if (response.data.length > 0 && !selectedStockId) {
          setSelectedStockId(response.data[0].id);
        }
      } catch (error: any) {
        toast.error("Không thể tải danh sách tồn kho");
      }
    };
    fetchStocks();
  }, [stockIdFromUrl]);

  // Fetch movements
  const fetchMovements = async () => {
    if (!selectedStockId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getStockMovements(selectedStockId, {
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage,
        type: movementTypeFilter || undefined,
        referenceType: referenceTypeFilter || undefined,
      });
      setMovements(response.data);
      setTotalPages(response.meta.totalPages);
      setTotalItems(response.meta.totalItems);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || "Không thể tải lịch sử biến động"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStockId) {
      fetchMovements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage,
    itemsPerPage,
    selectedStockId,
    searchTerm,
    movementTypeFilter,
    referenceTypeFilter,
  ]);

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case "inbound":
        return (
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            Nhập kho
          </span>
        );
      case "outbound":
        return (
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            Xuất kho
          </span>
        );
      case "adjustment":
        return (
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Điều chỉnh
          </span>
        );
      case "transfer":
        return (
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            Chuyển kho
          </span>
        );
      default:
        return (
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {type}
          </span>
        );
    }
  };

  const getReferenceTypeLabel = (refType: string) => {
    const labels: Record<string, string> = {
      purchase_order: "Đơn mua hàng",
      gift_in: "Nhận quà tặng",
      sales_order: "Đơn bán hàng",
      gift_out: "Quà tặng",
      customer_return: "Khách trả hàng",
      supplier_return: "Trả hàng NCC",
      stock_take: "Kiểm kho",
      internal_transfer: "Chuyển kho nội bộ",
      manufacturing: "Sản xuất",
      damaged: "Hỏng hóa",
      loss: "Mất mát",
      other: "Khác",
    };
    return labels[refType] || refType;
  };

  const selectedStock = stocks.find((s) => s.id === selectedStockId);

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
              <Button
                size="icon-lg"
                className="hover:bg-gray-300 rounded-full bg-gray-200"
                onClick={() => router.back()}
                title="Quay lại"
              >
                <ArrowLeft className="text-gray-700 size-7" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Lịch sử biến động tồn kho
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Theo dõi tất cả các giao dịch nhập xuất kho
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 space-y-4"
          >
            {/* Selected Stock Info */}
            {selectedStock && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow border border-blue-200 p-4"
              >
                <div className="flex items-center gap-4">
                  {selectedStock.productVariant.images?.[0] ? (
                    <img
                      src={selectedStock.productVariant.images[0].publicUrl}
                      alt={selectedStock.productVariant.name}
                      className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      <Package size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {selectedStock.productVariant.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      SKU: {selectedStock.productVariant.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Tồn kho hiện tại</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedStock.quantityAvailable}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Toolbar */}
            <motion.div
              ref={filtersRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow border border-gray-200 p-3"
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
                    placeholder="Tìm kiếm theo mã tham chiếu..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Movement Type Filter */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Loại biến động
                      </label>
                      <CustomSelect
                        value={movementTypeFilter}
                        onChange={(v) => {
                          setMovementTypeFilter(v as MovementType | "");
                          setCurrentPage(1);
                        }}
                        options={[
                          { value: "", label: "Tất cả" },
                          { value: "inbound", label: "Nhập kho" },
                          { value: "outbound", label: "Xuất kho" },
                          { value: "adjustment", label: "Điều chỉnh" },
                          { value: "transfer", label: "Chuyển kho" },
                        ]}
                      />
                    </div>

                    {/* Reference Type Filter */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Loại tham chiếu
                      </label>
                      <CustomSelect
                        value={referenceTypeFilter}
                        onChange={(v) => {
                          setReferenceTypeFilter(v as RefType | "");
                          setCurrentPage(1);
                        }}
                        options={[
                          { value: "", label: "Tất cả" },
                          { value: "purchase_order", label: "Đơn mua hàng" },
                          { value: "gift_in", label: "Nhận quà tặng" },
                          { value: "sales_order", label: "Đơn bán hàng" },
                          { value: "gift_out", label: "Quà tặng" },
                          { value: "customer_return", label: "Khách trả hàng" },
                          { value: "supplier_return", label: "Trả hàng NCC" },
                          { value: "stock_take", label: "Kiểm kho" },
                          { value: "internal_transfer", label: "Chuyển kho nội bộ" },
                          { value: "manufacturing", label: "Sản xuất" },
                          { value: "damaged", label: "Hỏng hóa" },
                          { value: "loss", label: "Mất mát" },
                          { value: "other", label: "Khác" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setMovementTypeFilter("");
                        setReferenceTypeFilter("");
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Đặt lại
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600 text-lg">
                  Đang tải lịch sử biến động...
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Ngày giờ
                      </th>

                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Thay đổi
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Tồn kho sau
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Loại biến động
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Loại tham chiếu
                      </th>
                      {/* <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Mã tham chiếu
                      </th> */}
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Ghi chú
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {movements.map((movement, idx) => (
                      <motion.tr
                        key={movement.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {formatDate(movement.createdAt)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span
                            className={`text-base font-bold ${
                              movement.deltaQuantity > 0
                                ? "text-green-600"
                                : movement.deltaQuantity < 0
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {movement.deltaQuantity > 0 ? "+" : ""}
                            {movement.deltaQuantity}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span className="text-base font-semibold text-blue-600">
                            {movement.quantityAfter}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          {getMovementTypeBadge(movement.type)}
                        </td>

                        <td className="px-4 py-4 text-center whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {getReferenceTypeLabel(movement.referenceType)}
                          </span>
                        </td>

                        {/* <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-gray-600">
                            {movement.referenceId || "-"}
                          </span>
                        </td> */}

                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {movement.note || "-"}
                          </span>
                        </td>
                      </motion.tr>
                    ))}

                    {movements.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="py-20">
                          <div className="text-center">
                            <History
                              size={64}
                              className="mx-auto text-gray-300 mb-4"
                            />
                            <p className="text-gray-500 text-lg font-medium">
                              Chưa có lịch sử biến động nào
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && movements.length > 0 && (
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
        </motion.div>
      </main>
    </div>
  );
}

export default withAuthCheck(StockMovementsPage);
