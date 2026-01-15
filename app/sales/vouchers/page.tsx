"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Users,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
  ArrowLeft,
  Search,
  Filter,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  getVouchers,
  deleteVoucher,
  cancelVoucher,
  getVoucherStatistics,
} from "@/services/voucherService";
import type { Voucher } from "@/types/voucher";
import TablePagination from "@/components/shared/TablePagination";
import { toast } from "react-hot-toast";
import ConfirmPopover from "@/components/shared/ConfirmPopover";
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
          open ? "border-1 border-blue-400" : "border-gray-300 hover:border-gray-400"
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
  return `${dd}/${mm}/${yyyy}`;
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

// Helper function to convert datetime-local to ISO string
function convertToISOString(dateTimeLocal: string): string {
  if (!dateTimeLocal) return "";
  const date = new Date(dateTimeLocal);
  return date.toISOString();
}

function VouchersPage() {
  const router = useRouter();
  const filtersRef = useRef<HTMLDivElement>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [validFromFilter, setValidFromFilter] = useState<string>("");
  const [validToFilter, setValidToFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<
    "validFrom" | "validTo" | "createdAt"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [trashCount, setTrashCount] = useState<number>(0);
  const [stats, setStats] = useState<any>(null);

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

  useEffect(() => {
    (async () => {
      try {
        const res = await getVouchers({ isDeleted: true, limit: 1 });
        setTrashCount(res.meta?.totalItems ?? 0);
      } catch (err) {
        console.error("Failed to count trash vouchers:", err);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const statsData = await getVoucherStatistics();
        setStats(statsData.data ?? statsData);
      } catch (err) {
        console.error("Failed to fetch voucher statistics:", err);
      }
    })();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await getVouchers({
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage,
        sortField,
        sortOrder,
        type:
          typeFilter !== "all"
            ? (typeFilter as "fixed" | "percentage" | "free_shipping")
            : undefined,
        status:
          statusFilter !== "all"
            ? (statusFilter as
                | "upcoming"
                | "happening"
                | "canceled"
                | "expired")
            : undefined,
        validFrom: validFromFilter
          ? convertToISOString(validFromFilter)
          : undefined,
        validTo: validToFilter ? convertToISOString(validToFilter) : undefined,
        isDeleted: false,
      });

      setVouchers(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể tải danh sách mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVoucher(id);
      toast.success("Đã chuyển mã giảm giá vào thùng rác thành công!");
      fetchVouchers();
      setTrashCount((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể xóa mã giảm giá");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelVoucher(id);
      toast.success("Mã giảm giá đã được hủy thành công");
      fetchVouchers();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể hủy mã giảm giá");
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [
    currentPage,
    statusFilter,
    typeFilter,
    validFromFilter,
    validToFilter,
    itemsPerPage,
    searchTerm,
    sortField,
    sortOrder,
  ]);

  const toggleValidFromSort = () => {
    if (sortField !== "validFrom") {
      setSortField("validFrom");
      setSortOrder("DESC");
    } else if (sortOrder === "DESC") {
      setSortOrder("ASC");
    } else {
      setSortField("validTo");
      setSortOrder("DESC");
    }
    setCurrentPage(1);
  };

  const toggleValidToSort = () => {
    if (sortField !== "validTo") {
      setSortField("validTo");
      setSortOrder("DESC");
    } else if (sortOrder === "DESC") {
      setSortOrder("ASC");
    } else {
      setSortField("validTo");
      setSortOrder("DESC");
    }
    setCurrentPage(1);
  };

  const toggleCreatedAtSort = () => {
    if (sortField !== "createdAt") {
      setSortField("createdAt");
      setSortOrder("DESC");
    } else if (sortOrder === "DESC") {
      setSortOrder("ASC");
    } else {
      setSortField("validTo");
      setSortOrder("DESC");
    }
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "happening":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            Đang diễn ra
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            Sắp diễn ra
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
      default:
        return null;
    }
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
      case "free_shipping":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700">
            Miễn phí vận chuyển
          </span>
        );
      default:
        return null;
    }
  };

  const filteredVouchers = vouchers;

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-[1440px] mx-auto py-8 px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Mã giảm giá
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Tạo và quản lý mã giảm giá và chiến dịch khuyến mại
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex h-12 items-center gap-2 bg-red-500 hover:bg-red-700 text-white text-base"
                onClick={() => router.push(Routes.sales.vouchers.trash)}
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
                onClick={() => router.push(Routes.sales.vouchers.add)}
                className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base"
              >
                <Plus size={20} />
                Thêm mã giảm giá
              </Button>
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
              {/* Total Vouchers */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng voucher</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalVouchers ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Active Vouchers */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {stats.activeVouchers ?? 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đã sử dụng</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {stats.usageStats?.totalUsed ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tỷ lệ: {stats.usageStats?.usageRate?.toFixed(1) ?? 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expiring Soon */}
              {/* <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sắp hết hạn</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                      {stats.expiringVouchers?.length ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Trong 7 ngày tới
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div> */}

              {/* Remaining Vouchers */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Còn lại</p>
                    <p className="text-2xl font-bold text-teal-600 mt-1">
                      {stats.usageStats?.totalRemaining ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Chưa sử dụng
                    </p>
                  </div>
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Deleted Vouchers */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Đã xóa</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {stats.deletedVouchers ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Trong thùng rác
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* By Status */}
              {stats.byStatus?.map((item: any, idx: number) => {
                const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
                  upcoming: { label: "Sắp diễn ra", color: "text-blue-600", bgColor: "bg-blue-100" },
                  happening: { label: "Đang diễn ra", color: "text-green-600", bgColor: "bg-green-100" },
                  expired: { label: "Hết hạn", color: "text-gray-600", bgColor: "bg-gray-100" },
                  canceled: { label: "Đã hủy", color: "text-red-600", bgColor: "bg-red-100" },
                };
                const config = statusConfig[item.status] || { label: item.status, color: "text-gray-600", bgColor: "bg-gray-100" };
                
                return (
                  <div key={idx} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{config.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${config.color}`}>
                          {item.count ?? 0}
                        </p>
                      </div>
                      <div className={`p-3 ${config.bgColor} rounded-lg`}>
                        <svg className={`w-6 h-6 ${config.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* By Type */}
              {stats.byType?.map((item: any, idx: number) => {
                const typeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
                  fixed: { label: "Giảm cố định", color: "text-blue-600", bgColor: "bg-blue-100" },
                  percentage: { label: "Giảm %", color: "text-purple-600", bgColor: "bg-purple-100" },
                  free_shipping: { label: "Miễn phí ship", color: "text-green-600", bgColor: "bg-green-100" },
                };
                const config = typeConfig[item.type] || { label: item.type, color: "text-gray-600", bgColor: "bg-gray-100" };
                
                return (
                  <div key={idx} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{config.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${config.color}`}>
                          {item.count ?? 0}
                        </p>
                      </div>
                      <div className={`p-3 ${config.bgColor} rounded-lg`}>
                        <svg className={`w-6 h-6 ${config.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Top Used Vouchers & Expiring Vouchers */}
          {stats && (stats.topUsedVouchers?.length > 0 || stats.expiringVouchers?.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
            >
              {/* Top Used Vouchers */}
              {stats.topUsedVouchers?.length > 0 && (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Top voucher được sử dụng nhiều nhất
                  </h3>
                  <div className="space-y-3">
                    {stats.topUsedVouchers.slice(0, 3).map((voucher: any, idx: number) => (
                      <div key={voucher.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{voucher.code}</p>
                            <p className="text-xs text-gray-500 truncate">{voucher.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {voucher.usedCount}/{voucher.maxUsage}
                            </p>
                            <p className="text-xs text-gray-500">
                              {voucher.usageRate?.toFixed(1)}%
                            </p>
                          </div>
                          {voucher.type === 'fixed' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">Số tiền cố định</span>
                          )}
                          {voucher.type === 'percentage' && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md">%</span>
                          )}
                          {voucher.type === 'free_shipping' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">Free Ship</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expiring Vouchers Details */}
              {stats.expiringVouchers?.length > 0 && (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Voucher sắp hết hạn
                  </h3>
                  <div className="space-y-3">
                    {stats.expiringVouchers.slice(0, 3).map((voucher: any) => (
                      <div key={voucher.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{voucher.code}</p>
                          <p className="text-xs text-gray-500 truncate">{voucher.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-orange-600">
                              {voucher.daysRemaining} ngày
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(voucher.validTo)}
                            </p>
                          </div>
                          {voucher.type === 'fixed' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md">Số tiền cố định</span>
                          )}
                          {voucher.type === 'percentage' && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md">%</span>
                          )}
                          {voucher.type === 'free_shipping' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">Free Ship</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Search and Filter Bar */}
          <motion.div
            ref={filtersRef}
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
                  placeholder="Tìm kiếm theo mã giảm giá hoặc mô tả..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 h-[42px] px-4 bg-white text-gray-600 hover:text-gray-900 rounded-lg transition-colors ${
                  showFilters ? 'border-1 border-blue-500' : 'border border-gray-300 hover:border-gray-500'
                }`}
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
                      value={statusFilter}
                      onChange={(v) => {
                        setStatusFilter(v);
                        setCurrentPage(1);
                      }}
                      options={[
                        { value: "all", label: "Tất cả" },
                        { value: "upcoming", label: "Sắp diễn ra" },
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
                      value={typeFilter}
                      onChange={(v) => {
                        setTypeFilter(v);
                        setCurrentPage(1);
                      }}
                      options={[
                        { value: "all", label: "Tất cả" },
                        { value: "fixed", label: "Số tiền cố định" },
                        { value: "percentage", label: "Phần trăm" },
                        { value: "free_shipping", label: "Miễn phí vận chuyển" },
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
                        setCurrentPage(1);
                      }}
                      options={[
                        { value: "createdAt-DESC", label: "Ngày tạo giảm dần" },
                        { value: "createdAt-ASC", label: "Ngày tạo tăng dần" },
                        { value: "validFrom-DESC", label: "Ngày bắt đầu giảm dần" },
                        { value: "validFrom-ASC", label: "Ngày bắt đầu tăng dần" },
                        { value: "validTo-DESC", label: "Ngày kết thúc giảm dần" },
                        { value: "validTo-ASC", label: "Ngày kết thúc tăng dần" },
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
                      value={validFromFilter}
                      max={validToFilter || undefined}
                      onChange={(e) => {
                        const newValidFrom = e.target.value;
                        setValidFromFilter(newValidFrom);
                        // If Valid To is set and is less than new Valid From, reset Valid To
                        if (
                          validToFilter &&
                          newValidFrom &&
                          newValidFrom > validToFilter
                        ) {
                          setValidToFilter("");
                        }
                        setCurrentPage(1);
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
                      value={validToFilter}
                      min={
                        validFromFilter ||
                        dayjs()
                          .tz("Asia/Ho_Chi_Minh")
                          .format("YYYY-MM-DDTHH:mm")
                      }
                      onChange={(e) => {
                        const newValidTo = e.target.value;
                        // Only set if it's greater than or equal to Valid From
                        if (!validFromFilter || newValidTo >= validFromFilter) {
                          setValidToFilter(newValidTo);
                        }
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => {
                      setStatusFilter("all");
                      setTypeFilter("all");
                      setValidFromFilter("");
                      setValidToFilter("");
                      setCurrentPage(1);
                    }}
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-600 text-lg">Đang tải mã giảm giá...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Mã giảm giá
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Giá trị
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Đơn tối thiểu
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Sử dụng
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          <span>Thời gian áp dụng</span>
                          {/* <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={toggleValidFromSort}
                              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                              title={
                                sortField === "validFrom"
                                  ? `Đang sắp xếp: ${sortOrder} (nhấp để thay đổi)`
                                  : "Chưa sắp xếp (nhấp để sắp xếp theo thời gian bắt đầu)"
                              }
                            >
                              <span className="mr-1">Bắt đầu</span>
                              {sortField === "validFrom" ? (
                                sortOrder === "ASC" ? (
                                  <ArrowUpAZ className="size-5" />
                                ) : (
                                  <ArrowDownAZ className="size-5" />
                                )
                              ) : (
                                <ArrowUpDown className="size-5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={toggleValidToSort}
                              className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                              title={
                                sortField === "validTo"
                                  ? `Đang sắp xếp: ${sortOrder} (nhấp để thay đổi)`
                                  : "Chưa sắp xếp (nhấp để sắp xếp theo thời gian kết thúc)"
                              }
                            >
                              <span className="mr-1">Kết thúc</span>
                              {sortField === "validTo" ? (
                                sortOrder === "ASC" ? (
                                  <ArrowUpAZ className="size-5" />
                                ) : (
                                  <ArrowDownAZ className="size-5" />
                                )
                              ) : (
                                <ArrowUpDown className="size-5" />
                              )}
                            </button>
                          </div> */}
                        </div>
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredVouchers.map((voucher, idx) => (
                      <motion.tr
                        key={voucher.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 min-w-[140px] max-w-[180px]">
                          <div className="flex flex-col gap-1">
                            <code className="text-gray-600 text-lg font-semibold">
                              {voucher.code}
                            </code>
                            <span className="text-left whitespace-nowrap">
                              {getTypeBadge(voucher.type)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="text-base font-bold text-green-600 whitespace-nowrap">
                              {voucher.type === "percentage"
                                ? `${
                                    Number(voucher.value) > 100
                                      ? Number(voucher.value) / 100
                                      : voucher.value
                                  }%`
                                : voucher.type === "free_shipping"
                                ? "Free Ship"
                                : `${Number(voucher.value).toLocaleString(
                                    "en-US"
                                  )}đ`}
                            </span>
                            {voucher.maxDiscountValue ? (
                              <span className="text-sm font-semibold text-gray-600">
                                Tối đa: {Number(voucher.maxDiscountValue).toLocaleString(
                                  "en-US"
                                )}đ
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="text-base text-gray-600">
                            {voucher.minOrderAmount
                              ? `${Number(
                                  voucher.minOrderAmount
                                ).toLocaleString("en-US")}đ`
                              : "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {getStatusBadge(voucher.status)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="text-sm">
                            <span className="font-semibold text-gray-800">
                              {voucher.usedCount}
                            </span>
                            <span className="text-gray-500">
                              {" "}
                              / {voucher.maxUsage}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex flex-col gap-1 min-w-[150px]">
                            <span className="text-base text-gray-600">
                              {formatDateTime(voucher.validFrom)}
                            </span>
                            <span className="text-xs text-gray-400">đến</span>
                            <span className="text-base text-gray-600">
                              {formatDateTime(voucher.validTo)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {voucher.status === "upcoming" && (
                              <>
                                <Button
                                  size="icon-sm"
                                  className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                  onClick={() =>
                                    router.push(
                                      Routes.sales.vouchers.edit(voucher.id)
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
                              title="Hủy mã giảm giá"
                              message={
                                <div>
                                  Bạn có chắc muốn hủy mã giảm giá{" "}
                                  <strong>
                                    {voucher.code || "này"}
                                  </strong>
                                  ?
                                </div>
                              }
                              confirmText="Hủy"
                              onConfirm={() => handleCancel(voucher.id)}
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
                              title="Xóa mã giảm giá"
                              message={
                                <div>
                                  Bạn có chắc muốn xóa mã giảm giá{" "}
                                  <strong>
                                    {voucher.code || "này"}
                                  </strong>
                                  ?
                                </div>
                              }
                              confirmText="Xóa"
                              onConfirm={() => handleDelete(voucher.id)}
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
                    ))}

                    {filteredVouchers.length === 0 && (
                      <tr>
                        <td
                          colSpan={11}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          Không tìm thấy mã giảm giá
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredVouchers.length > 0 && (
              <TablePagination
                page={currentPage}
                limit={itemsPerPage}
                totalPages={totalPages}
                totalItems={undefined}
                hasPrev={currentPage > 1}
                hasNext={currentPage < totalPages}
                onPageChange={setCurrentPage}
                onLimitChange={(l) => { setItemsPerPage(l); setCurrentPage(1); }}
              />
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default withAuthCheck(VouchersPage);
