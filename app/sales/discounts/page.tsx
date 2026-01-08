"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Filter,
  XCircle,
  Eye,
  ChevronDown,
  Ticket,
  CircleCheck,
  TrendingUp,
  DollarSign,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TablePagination from "@/components/TablePagination";
import ConfirmPopover from "@/components/ConfirmPopover";
import {
  getDiscounts,
  deleteDiscount,
  cancelDiscount,
  getDiscountStatistics,
} from "@/services/discountService";
import type { Discount, DiscountStatistics } from "@/types/discount";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

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

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "-";
  try {
    return dayjs
      .utc(dateString)
      .tz("Asia/Ho_Chi_Minh")
      .format("DD/MM/YYYY HH:mm");
  } catch {
    return "-";
  }
};

function DiscountsPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortField, setSortField] = useState<"createdAt" | "startAt" | "endAt">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [trashCount, setTrashCount] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statistics, setStatistics] = useState<DiscountStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const lastStatsFetchRef = useRef<number>(0);

  // Get current Vietnam time for min validation
  const currentVietnamTime = dayjs()
    .tz("Asia/Ho_Chi_Minh")
    .format("YYYY-MM-DDTHH:mm");

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const data = await getDiscounts({
        search,
        page,
        limit,
        type: type as any,
        status: status as any,
        startDate: startDate
          ? dayjs.tz(startDate, "Asia/Ho_Chi_Minh").utc().toISOString()
          : undefined,
        endDate: endDate
          ? dayjs.tz(endDate, "Asia/Ho_Chi_Minh").utc().toISOString()
          : undefined,
        sortField: sortField as any,
        sortOrder,
        isDeleted: false,
      });
      setDiscounts(data.data);
      setTotalItems(data.meta.totalItems);
      setTotalPages(data.meta.totalPages);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to fetch discounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrashCount = async () => {
    try {
      const data = await getDiscounts({
        page: 1,
        limit: 1,
        isDeleted: true,
      });
      setTrashCount(data.meta.totalItems);
    } catch (error) {
      console.error("Failed to fetch trash count:", error);
    }
  };

  const fetchStatistics = async (force: boolean = false) => {
    // Throttle: only allow fetching once every 2 seconds
    const now = Date.now();
    if (!force && now - lastStatsFetchRef.current < 2000) {
      return;
    }
    
    try {
      setStatsLoading(true);
      lastStatsFetchRef.current = now;
      const response = await getDiscountStatistics();
      setStatistics(response.data);
    } catch (error: any) {
      console.error("Failed to fetch statistics:", error);
      // Don't show error toast for rate limiting, just silently fail
      if (error?.response?.status !== 429) {
        toast.error("Không thể tải thống kê");
      }
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [
    page,
    limit,
    search,
    type,
    status,
    startDate,
    endDate,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    fetchTrashCount();
    fetchStatistics();
  }, []);

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteDiscount(id);
      toast.success("Chương trình giảm giá đã được chuyển vào thùng rác thành công!");
      fetchDiscounts();
      fetchTrashCount();
      fetchStatistics();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể chuyển chương trình giảm giá vào thùng rác");
    } finally {
      setBusyId(null);
      setOpenKey(null);
    }
  };

  const handleCancel = async (id: string) => {
    setBusyId(id);
    try {
      await cancelDiscount(id);
      toast.success("Chương trình giảm giá đã được hủy thành công!");
      fetchDiscounts();
      fetchStatistics(true); // Force refresh
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể hủy chương trình giảm giá");
    } finally {
      setBusyId(null);
      setOpenKey(null);
    }
  };

  const handleReset = () => {
    setSearch("");
    setType("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const toggleStartAtSort = () => {
    if (sortField !== "startAt") {
      setSortField("startAt");
      setSortOrder("DESC");
    } else if (sortOrder === "DESC") {
      setSortOrder("ASC");
    } else {
      setSortField("createdAt");
      setSortOrder("DESC");
    }
    setPage(1);
  };

  const toggleEndAtSort = () => {
    if (sortField !== "endAt") {
      setSortField("endAt");
      setSortOrder("DESC");
    } else if (sortOrder === "DESC") {
      setSortOrder("ASC");
    } else {
      setSortField("createdAt");
      setSortOrder("DESC");
    }
    setPage(1);
  };

  const toggleCreatedAtSort = () => {
    if (sortField !== "createdAt") {
      setSortField("createdAt");
      setSortOrder("DESC");
    } else if (sortOrder === "DESC") {
      setSortOrder("ASC");
    } else {
      setSortField("createdAt");
      setSortOrder("DESC");
    }
    setPage(1);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "percentage":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-700">
            Phần trăm
          </span>
        );
      case "fixed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">
            Số tiền cố định
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "happening":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            Đang diễn ra
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            Đã lên lịch
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            Hết hạn
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            Đã hủy
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            Nháp
          </span>
        );
      default:
        return null;
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
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Danh sách các chương trình giảm giá
                </h1>
                <p className="text-gray-600 mt-1">
                  Tạo và quản lý các chương trình giảm giá sản phẩm và giá khuyến mại
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex h-12 items-center gap-2 bg-red-500 hover:bg-red-700 text-white text-base"
                onClick={() => router.push(Routes.sales.discounts.trash)}
              >
                <Trash2 className="size-5" />
                Thùng rác
                {trashCount > 0 && (
                  <span className="ml-1 bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {trashCount}
                  </span>
                )}
              </Button>

              <Button
                onClick={() => router.push(Routes.sales.discounts.add)}
                className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base"
              >
                <Plus size={20} />
                Thêm chương trình giảm giá
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          {!statsLoading && statistics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
            >
              {/* Tổng voucher */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng voucher</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {statistics.totalDiscounts}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Ticket className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Đang hoạt động */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {statistics.activeDiscounts}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CircleCheck className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Đã áp dụng */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đã áp dụng</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {statistics.totalVariantsWithDiscount}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Biến thể sản phẩm
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Giảm cố định */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Giảm cố định</p>
                    <p className="text-2xl font-bold text-cyan-600 mt-1">
                      {statistics.byType.find(t => t.type === "fixed")?.count || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-cyan-600" />
                  </div>
                </div>
              </div>

              {/* Giảm % */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Giảm %</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                      {statistics.byType.find(t => t.type === "percentage")?.count || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Percent className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Nháp */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nháp</p>
                    <p className="text-2xl font-bold text-gray-600 mt-1">
                      {statistics.byStatus.find(s => s.status === "draft")?.count || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Edit className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </div>

              {/* Đã lên lịch */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đã lên lịch</p>
                    <p className="text-2xl font-bold text-sky-600 mt-1">
                      {statistics.byStatus.find(s => s.status === "scheduled")?.count || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-sky-100 rounded-lg">
                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Hết hạn */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hết hạn</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                      {statistics.byStatus.find(s => s.status === "expired")?.count || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Đã hủy */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đã hủy</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                      {statistics.byStatus.find(s => s.status === "canceled")?.count || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <XCircle className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              {/* Đã xóa */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đã xóa</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {statistics.deletedDiscounts}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Trong thùng rác
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Trash2 className="w-6 h-6 text-red-600" />
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
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                  placeholder="Tìm kiếm theo tên hoặc slug..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 h-[42px] px-4 bg-white text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-500 rounded-lg transition-colors"
              >
                <Filter size={20} />
                Bộ lọc
              </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <CustomSelect
                      value={status}
                      onChange={(v) => {
                        setStatus(v);
                        setPage(1);
                      }}
                      options={[
                        { value: "", label: "Tất cả" },
                        { value: "draft", label: "Nháp" },
                        { value: "scheduled", label: "Đã lên lịch" },
                        { value: "happening", label: "Đang diễn ra" },
                        { value: "canceled", label: "Đã hủy" },
                        { value: "expired", label: "Hết hạn" },
                      ]}
                    />
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại
                    </label>
                    <CustomSelect
                      value={type}
                      onChange={(v) => {
                        setType(v);
                        setPage(1);
                      }}
                      options={[
                        { value: "", label: "Tất cả" },
                        { value: "fixed", label: "Số tiền cố định" },
                        { value: "percentage", label: "Phần trăm" },
                      ]}
                    />
                  </div>

                  {/* Sort Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sắp xếp
                    </label>
                    <CustomSelect
                      value={`${sortField}-${sortOrder}`}
                      onChange={(v) => {
                        const [field, order] = v.split('-') as [typeof sortField, typeof sortOrder];
                        setSortField(field);
                        setSortOrder(order);
                        setPage(1);
                      }}
                      options={[
                        { value: "createdAt-DESC", label: "Ngày tạo giảm dần" },
                        { value: "createdAt-ASC", label: "Ngày tạo tăng dần" },
                        { value: "startAt-DESC", label: "Ngày bắt đầu giảm dần" },
                        { value: "startAt-ASC", label: "Ngày bắt đầu tăng dần" },
                        { value: "endAt-DESC", label: "Ngày kết thúc giảm dần" },
                        { value: "endAt-ASC", label: "Ngày kết thúc tăng dần" },
                      ]}
                    />
                  </div>

                  {/* Valid From Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                      value={startDate}
                      max={endDate || undefined}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        setStartDate(newStartDate);
                        // If End Date is set and is less than new Start Date, reset End Date
                        if (endDate && newStartDate && newStartDate > endDate) {
                          setEndDate("");
                        }
                        setPage(1);
                      }}
                    />
                  </div>

                  {/* Valid To Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ngày kết thúc
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                      value={endDate}
                      min={startDate || currentVietnamTime}
                      onChange={(e) => {
                        const newEndDate = e.target.value;
                        // Only set if it's greater than or equal to Start Date
                        if (!startDate || newEndDate >= startDate) {
                          setEndDate(newEndDate);
                        }
                        setPage(1);
                      }}
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleReset}
                    className="px-4 py-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                  >
                    Đặt lại
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Tên
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Giá trị
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <span>Thời gian áp dụng</span>
                        
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Đang tải...
                      </td>
                    </tr>
                  ) : discounts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={13}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Không có chương trình giảm giá nào được tìm thấy.
                      </td>
                    </tr>
                  ) : (
                    discounts.map((discount, idx) => (
                      <motion.tr
                        key={discount.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {discount.name}
                          </span>
                          <br />
                          <span className="text-left">
                            {getTypeBadge(discount.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="text-base font-bold text-green-600 whitespace-nowrap">
                              {discount.type === "percentage"
                                ? `${parseFloat(discount.value) / 100}%`
                                : `${parseFloat(discount.value).toLocaleString(
                                    "en-US"
                                  )}đ`}
                            </span>
                            {discount.maxDiscountValue ? (
                              <span className="text-sm font-semibold text-gray-600">
                                Tối đa: {Number(discount.maxDiscountValue).toLocaleString(
                                  "en-US"
                                )}đ
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {getStatusBadge(discount.status)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex flex-col gap-1 min-w-[150px]">
                            <span className="text-base text-gray-600">
                              {formatDateTime(discount.startAt)}
                            </span>
                            <span className="text-xs text-gray-400">đến</span>
                            <span className="text-base text-gray-600">
                              {formatDateTime(discount.endAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="icon-sm"
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Xem chi tiết"
                              onClick={() =>
                                router.push(
                                  Routes.sales.discounts.details(discount.id)
                                )
                              }
                            >
                              <Eye className="text-blue-600 size-5" />
                            </Button>
                            <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>
                            {(discount.status === "scheduled" ||
                              discount.status === "draft") && (
                              <>
                                <Button
                                  size="icon-sm"
                                  className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                  onClick={() =>
                                    router.push(
                                      Routes.sales.discounts.edit(discount.id)
                                    )
                                  }
                                >
                                  <Edit className="text-green-600 size-5" />
                                </Button>
                                <span className="text-gray-500 text-sm leading-none">
                                  |
                                </span>
                              </>
                            )}
                            <ConfirmPopover
                              title="Hủy chương trình giảm giá"
                              message={
                                <div>
                                  Bạn có chắc chắn muốn hủy{" "}
                                  <strong>
                                    {discount.name || "chương trình giảm giá này"}
                                  </strong>
                                  ?
                                </div>
                              }
                              confirmText="Hủy chương trình giảm giá"
                              onConfirm={() => handleCancel(discount.id)}
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                                title="Hủy"
                              >
                                <XCircle className="text-orange-600 size-5" />
                              </Button>
                            </ConfirmPopover>
                            <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>
                            <ConfirmPopover
                              title="Xóa giảm giá"
                              message={
                                <div>
                                  Bạn có chắc chắn muốn xóa{" "}
                                  <strong>
                                    {discount.name || "chương trình giảm giá này"}
                                  </strong>
                                  ?
                                </div>
                              }
                              confirmText="Xóa chương trình giảm giá"
                              onConfirm={() => handleDelete(discount.id)}
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Xóa"
                              >
                                <Trash2 className="text-red-600 size-5" />
                              </Button>
                            </ConfirmPopover>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && discounts.length > 0 && (
              <TablePagination
                page={page}
                limit={limit}
                totalPages={totalPages}
                totalItems={totalItems}
                hasPrev={page > 1}
                hasNext={page < totalPages}
                onPageChange={setPage}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
              />
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default DiscountsPage;
