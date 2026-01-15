"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpAZ,
  ArrowDownAZ,
  ArrowUpDown,
  RotateCcw,
  Trash2,
  X,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import TablePagination from "@/components/shared/TablePagination";
import ConfirmPopover from "@/components/shared/ConfirmPopover";
import {
  getVouchers,
  restoreVoucher,
  forceDeleteVoucher,
} from "@/services/voucherService";
import type { Voucher } from "@/types/voucher";
import { toast } from "react-hot-toast";
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

function getStatusBadge(status: string) {
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
}

function getTypeBadge(type: string) {
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
}

function VouchersTrashPage() {
  const router = useRouter();
  const filtersRef = useRef<HTMLDivElement>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<
    "validFrom" | "validTo" | "createdAt" | "deletedAt"
  >("deletedAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const currentVietnamTime = dayjs().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DDTHH:mm");
  const keyOf = (id: string, action: "restore" | "delete") => `${id}|${action}`;
  const isOpen = (id: string, action: "restore" | "delete") =>
    openKey === keyOf(id, action);

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

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await getVouchers({
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage,
        type: type as any,
        status: status as any,
        validFrom: validFrom ? dayjs.tz(validFrom, "Asia/Ho_Chi_Minh").utc().toISOString() : undefined,
        validTo: validTo ? dayjs.tz(validTo, "Asia/Ho_Chi_Minh").utc().toISOString() : undefined,
        sortField,
        sortOrder,
        isDeleted: true,
      });

      setVouchers(response.data);
      setTotalPages(response.meta.totalPages);
      setHasNext(currentPage < response.meta.totalPages);
      setHasPrev(currentPage > 1);
    } catch (error: any) {
      console.error("Failed to fetch deleted vouchers:", error);
      toast.error(error?.response?.data?.detail || "Không thể tải thùng rác");
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [currentPage, itemsPerPage, searchTerm, type, status, validFrom, validTo, sortField, sortOrder]);

  const backIfEmpty = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleRestore = async (id: string) => {
    try {
      setBusyId(id);
      await restoreVoucher(id);
      toast.success("Đã khôi phục mã giảm giá thành công");
      const next = vouchers.filter((v) => v.id !== id);
      setVouchers(next);
      if (next.length === 0 && hasPrev) backIfEmpty();
    } catch (error: any) {
      console.error("Restore failed:", error);
      const detail =
        error?.response?.data?.detail ||
        error?.detail ||
        "Không thể khôi phục mã giảm giá";
      toast.error(detail);
    } finally {
      setBusyId(null);
      setOpenKey(null);
    }
  };

  const handleForceDelete = async (id: string) => {
    try {
      setBusyId(id);
      await forceDeleteVoucher(id);
      const next = vouchers.filter((v) => v.id !== id);
      setVouchers(next);
      if (next.length === 0 && hasPrev) backIfEmpty();
      toast.success("Đã xóa vĩnh viễn mã giảm giá thành công");
    } catch (error: any) {
      console.error("Permanent delete failed:", error);
      const detail =
        error?.response?.data?.detail ||
        error?.detail ||
        "Không thể xóa vĩnh viễn";
      toast.error(detail);
    } finally {
      setBusyId(null);
      setOpenKey(null);
    }
  };

  const handleReset = () => {
    setSearchTerm("");
    setType("");
    setStatus("");
    setValidFrom("");
    setValidTo("");
    setCurrentPage(1);
  };

  const toggleDeletedAtSort = () => {
    if (sortField !== "deletedAt") {
      setSortField("deletedAt");
      setSortOrder("DESC");
    } else if (sortOrder === "DESC") {
      setSortOrder("ASC");
    } else {
      setSortField("deletedAt");
      setSortOrder("DESC");
    }
    setCurrentPage(1);
  };

  const toggleValidFromSort = () => {
    if (sortField !== "validFrom") {
      setSortField("validFrom");
      setSortOrder("DESC");
    } else if (sortOrder === "DESC") {
      setSortOrder("ASC");
    } else {
      setSortField("deletedAt");
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
      setSortField("deletedAt");
      setSortOrder("DESC");
    }
    setCurrentPage(1);
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
              <Button
                size="icon-lg"
                className="hover:bg-gray-300 rounded-full bg-gray-200"
                onClick={() => router.push(Routes.sales.vouchers.root)}
                title="Quay lại"
              >
                <ArrowLeft className="text-gray-700 size-7" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Thùng rác - Mã giảm giá
                </h1>
                <p className="text-gray-600 mt-1">
                  Khôi phục hoặc xóa vĩnh viễn mã giảm giá
                </p>
              </div>
            </div>
          </div>

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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                  placeholder="Tìm kiếm theo mã hoặc mô tả..."
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
                      value={status}
                      onChange={(v) => {
                        setStatus(v);
                        setCurrentPage(1);
                      }}
                      options={[
                        { value: "", label: "Tất cả" },
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
                      value={type}
                      onChange={(v) => {
                        setType(v);
                        setCurrentPage(1);
                      }}
                      options={[
                        { value: "", label: "Tất cả" },
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
                        { value: "deletedAt-DESC", label: "Ngày xóa giảm dần" },
                        { value: "deletedAt-ASC", label: "Ngày xóa tăng dần" },
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
                      value={validFrom}
                      max={validTo || undefined}
                      onChange={(e) => {
                        const newValidFrom = e.target.value;
                        setValidFrom(newValidFrom);
                        if (validTo && newValidFrom && newValidFrom > validTo) {
                          setValidTo("");
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
                      value={validTo}
                      min={validFrom || currentVietnamTime}
                      onChange={(e) => {
                        const newValidTo = e.target.value;
                        if (!validFrom || newValidTo >= validFrom) {
                          setValidTo(newValidTo);
                        }
                        setCurrentPage(1);
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-600 text-lg">Đang tải...</p>
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
                        Thời gian áp dụng
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {vouchers.map((voucher, idx) => (
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
                                ? "Miễn phí"
                                : `${Number(voucher.value).toLocaleString(
                                    "en-US"
                                  )}đ`}
                            </span>
                            {voucher.maxDiscountValue ? (
                              <span className="text-xs text-gray-500">
                                Tối đa: {Number(voucher.maxDiscountValue).toLocaleString("en-US")}đ
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
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
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <ConfirmPopover
                              open={isOpen(voucher.id, "restore")}
                              onOpenChange={(o) =>
                                setOpenKey(
                                  o ? keyOf(voucher.id, "restore") : null
                                )
                              }
                              title="Khôi phục mã giảm giá"
                              message={
                                <div>
                                  Bạn có chắc chắn muốn khôi phục{" "}
                                  <strong>{voucher.code}</strong>?
                                </div>
                              }
                              confirmText="Khôi phục"
                              onConfirm={() => handleRestore(voucher.id)}
                              confirmDisabled={busyId === voucher.id}
                              confirmLoading={busyId === voucher.id}
                              confirmClassName="h-10 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                title="Khôi phục"
                                disabled={busyId === voucher.id}
                              >
                                <RotateCcw className="text-green-600 size-5" />
                              </Button>
                            </ConfirmPopover>

                            <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>

                            <ConfirmPopover
                              open={isOpen(voucher.id, "delete")}
                              onOpenChange={(o) =>
                                setOpenKey(
                                  o ? keyOf(voucher.id, "delete") : null
                                )
                              }
                              title="Xóa vĩnh viễn"
                              message={
                                <div>
                                  Bạn có chắc chắn muốn xóa vĩnh viễn{" "}
                                  <strong>{voucher.code}</strong>?
                                </div>
                              }
                              confirmText="Xóa"
                              onConfirm={() => handleForceDelete(voucher.id)}
                              confirmDisabled={busyId === voucher.id}
                              confirmLoading={busyId === voucher.id}
                              confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Xóa vĩnh viễn"
                                disabled={busyId === voucher.id}
                              >
                                <Trash2 className="text-red-600 size-5" />
                              </Button>
                            </ConfirmPopover>
                          </div>
                        </td>
                      </motion.tr>
                    ))}

                    {vouchers.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          Thùng rác đang trống.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && vouchers.length > 0 && (
              <TablePagination
                page={currentPage}
                limit={itemsPerPage}
                totalPages={totalPages}
                totalItems={undefined}
                hasPrev={hasPrev}
                hasNext={hasNext}
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

export default withAuthCheck(VouchersTrashPage);
