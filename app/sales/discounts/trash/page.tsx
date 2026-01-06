"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import Pagination from "@/components/data/Pagination";
import ConfirmPopover from "@/components/ConfirmPopover";
import {
  getDiscounts,
  restoreDiscount,
  forceDeleteDiscount,
} from "@/services/discountService";
import type { Discount } from "@/types/discount";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

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

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getStatusBadge(status: string) {
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
    default:
      return null;
  }
}

function DiscountsTrashPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<
    "startAt" | "endAt" | "createdAt" | "deletedAt"
  >("deletedAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const currentVietnamTime = dayjs()
    .tz("Asia/Ho_Chi_Minh")
    .format("YYYY-MM-DDTHH:mm");
  const keyOf = (id: string, action: "restore" | "delete") => `${id}|${action}`;
  const isOpen = (id: string, action: "restore" | "delete") =>
    openKey === keyOf(id, action);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await getDiscounts({
        search: searchTerm || undefined,
        page: currentPage,
        limit: itemsPerPage,
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
        isDeleted: true,
      });

      setDiscounts(response.data);
      setTotalPages(response.meta.totalPages);
      setHasNext(currentPage < response.meta.totalPages);
      setHasPrev(currentPage > 1);
    } catch (error: any) {
      console.error("Failed to fetch deleted discounts:", error);
      toast.error(error?.response?.data?.detail || "Không thể tải thùng rác");
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    type,
    status,
    startDate,
    endDate,
    sortField,
    sortOrder,
  ]);

  const backIfEmpty = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleRestore = async (id: string) => {
    try {
      setBusyId(id);
      await restoreDiscount(id);
      toast.success("Đã khôi phục giảm giá thành công");
      const next = discounts.filter((d) => d.id !== id);
      setDiscounts(next);
      if (next.length === 0 && hasPrev) backIfEmpty();
    } catch (error: any) {
      console.error("Restore failed:", error);
      const detail =
        error?.response?.data?.detail ||
        error?.detail ||
        "Không thể khôi phục giảm giá";
      toast.error(detail);
    } finally {
      setBusyId(null);
      setOpenKey(null);
    }
  };

  const handleForceDelete = async (id: string) => {
    try {
      setBusyId(id);
      await forceDeleteDiscount(id);
      toast.success("Đã xóa vĩnh viễn giảm giá");
      const next = discounts.filter((d) => d.id !== id);
      setDiscounts(next);
      if (next.length === 0 && hasPrev) backIfEmpty();
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
    setStartDate("");
    setEndDate("");
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

  const toggleStartAtSort = () => {
    if (sortField !== "startAt") {
      setSortField("startAt");
      setSortOrder("DESC");
    } else if (sortOrder === "DESC") {
      setSortOrder("ASC");
    } else {
      setSortField("deletedAt");
      setSortOrder("DESC");
    }
    setCurrentPage(1);
  };

  const toggleEndAtSort = () => {
    if (sortField !== "endAt") {
      setSortField("endAt");
      setSortOrder("DESC");
    } else if (sortOrder === "DESC") {
      setSortOrder("ASC");
    } else {
      setSortField("deletedAt");
      setSortOrder("DESC");
    }
    setCurrentPage(1);
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
                onClick={() => router.push(Routes.sales.discounts.root)}
                title="Go Back"
              >
                <ArrowLeft className="text-gray-700 size-7" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Thùng rác - Giảm giá
                </h1>
                <p className="text-gray-600 mt-1">
                  Khôi phục hoặc xóa vĩnh viễn giảm giá
                </p>
              </div>
            </div>
          </div>

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
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
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
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tất cả</option>
                      <option value="draft">Nháp</option>
                      <option value="scheduled">Đã lên lịch</option>
                      <option value="happening">Đang diễn ra</option>
                      <option value="canceled">Đã hủy</option>
                      <option value="expired">Hết hạn</option>
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                      value={type}
                      onChange={(e) => {
                        setType(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">Tất cả</option>
                      <option value="fixed">Số tiền cố định</option>
                      <option value="percentage">Phần trăm</option>
                    </select>
                  </div>

                  {/* Sort Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sắp xếp
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                      value={`${sortField}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split('-') as [typeof sortField, typeof sortOrder];
                        setSortField(field);
                        setSortOrder(order);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="deletedAt-DESC">Ngày xóa giảm dần</option>
                      <option value="deletedAt-ASC">Ngày xóa tăng dần</option>
                      <option value="startAt-DESC">Ngày bắt đầu giảm dần</option>
                      <option value="startAt-ASC">Ngày bắt đầu tăng dần</option>
                      <option value="endAt-DESC">Ngày kết thúc giảm dần</option>
                      <option value="endAt-ASC">Ngày kết thúc tăng dần</option>
                    </select>
                  </div>

                  {/* Start Date Filter */}
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
                        if (endDate && newStartDate && newStartDate > endDate) {
                          setEndDate("");
                        }
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  {/* End Date Filter */}
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
                        if (!startDate || newEndDate >= startDate) {
                          setEndDate(newEndDate);
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
                    {discounts.map((discount, idx) => (
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
                        <td className="px-6 py-4 text-end whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <ConfirmPopover
                              open={isOpen(discount.id, "restore")}
                              onOpenChange={(o) =>
                                setOpenKey(
                                  o ? keyOf(discount.id, "restore") : null
                                )
                              }
                              title="Khôi phục giảm giá"
                              message={
                                <div>
                                  Bạn có chắc muốn khôi phục{" "}
                                  <strong>{discount.name}</strong>?
                                </div>
                              }
                              confirmText="Khôi phục"
                              onConfirm={() => handleRestore(discount.id)}
                              confirmDisabled={busyId === discount.id}
                              confirmLoading={busyId === discount.id}
                              confirmClassName="h-10 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                title="Restore"
                                disabled={busyId === discount.id}
                              >
                                <RotateCcw className="text-green-600 size-5" />
                              </Button>
                            </ConfirmPopover>

                            <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>

                            <ConfirmPopover
                              open={isOpen(discount.id, "delete")}
                              onOpenChange={(o) =>
                                setOpenKey(
                                  o ? keyOf(discount.id, "delete") : null
                                )
                              }
                              title="Xóa vĩnh viễn"
                              message={
                                <div>
                                  Bạn có chắc muốn xóa vĩnh viễn{" "}
                                  <strong>{discount.name}</strong>?
                                </div>
                              }
                              confirmText="Xóa"
                              onConfirm={() => handleForceDelete(discount.id)}
                              confirmDisabled={busyId === discount.id}
                              confirmLoading={busyId === discount.id}
                              confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete Permanently"
                                disabled={busyId === discount.id}
                              >
                                <Trash2 className="text-red-600 size-5" />
                              </Button>
                            </ConfirmPopover>
                          </div>
                        </td>
                      </motion.tr>
                    ))}

                    {discounts.length === 0 && (
                      <tr>
                        <td
                          colSpan={11}
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

            {!loading && discounts.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
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

                <div className="flex items-center gap-4">
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    hasPrev={hasPrev}
                    hasNext={hasNext}
                    onChange={setCurrentPage}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Lightbox Modal */}
          {lightboxImage && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
              onClick={() => setLightboxImage(null)}
            >
              <Button
                className="absolute top-4 right-4 p-2 rounded-full bg-white hover:bg-gray-200 transition-colors"
                onClick={() => setLightboxImage(null)}
                title="Close"
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

export default withAuthCheck(DiscountsTrashPage);
