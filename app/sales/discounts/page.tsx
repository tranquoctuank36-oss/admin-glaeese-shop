"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/data/Pagination";
import ConfirmPopover from "@/components/ConfirmPopover";
import {
  getDiscounts,
  deleteDiscount,
  cancelDiscount,
} from "@/services/discountService";
import type { Discount } from "@/types/discount";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);


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
  }, []);

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteDiscount(id);
      toast.success("Discount moved to trash successfully!");
      fetchDiscounts();
      fetchTrashCount();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to delete discount");
    } finally {
      setBusyId(null);
      setOpenKey(null);
    }
  };

  const handleCancel = async (id: string) => {
    setBusyId(id);
    try {
      await cancelDiscount(id);
      toast.success("Discount canceled successfully!");
      fetchDiscounts();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to cancel discount");
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
              <Button
                size="icon-lg"
                className="hover:bg-gray-300 rounded-full bg-gray-200"
                onClick={() => router.push(Routes.sales.root)}
                title="Go Back"
              >
                <ArrowLeft className="text-gray-700 size-7" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Danh sách giảm giá {totalItems > 0 && `(${totalItems})`}
                </h1>
                <p className="text-gray-600 mt-1">
                  Tạo và quản lý giảm giá sản phẩm và giá khuyến mại
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
                Thêm giảm giá
              </Button>
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
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setPage(1);
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
                        setPage(1);
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
                        setPage(1);
                      }}
                    >
                      <option value="createdAt-DESC">Ngày tạo giảm dần</option>
                      <option value="createdAt-ASC">Ngày tạo tăng dần</option>
                      <option value="startAt-DESC">Ngày bắt đầu giảm dần</option>
                      <option value="startAt-ASC">Ngày bắt đầu tăng dần</option>
                      <option value="endAt-DESC">Ngày kết thúc giảm dần</option>
                      <option value="endAt-ASC">Ngày kết thúc tăng dần</option>
                    </select>
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
                        Không có giảm giá nào được tìm thấy.
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
                              title="View Details"
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
                              title="Cancel Discount"
                              message={
                                <div>
                                  Are you sure you want to cancel{" "}
                                  <strong>
                                    {discount.name || "this discount"}
                                  </strong>
                                  ?
                                </div>
                              }
                              confirmText="Cancel Discount"
                              onConfirm={() => handleCancel(discount.id)}
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <XCircle className="text-orange-600 size-5" />
                              </Button>
                            </ConfirmPopover>
                            <span className="text-gray-500 text-sm leading-none">
                              |
                            </span>
                            <ConfirmPopover
                              title="Remove Discount"
                              message={
                                <div>
                                  Are you sure you want to delete{" "}
                                  <strong>
                                    {discount.name || "this discount"}
                                  </strong>
                                  ?
                                </div>
                              }
                              confirmText="Delete"
                              onConfirm={() => handleDelete(discount.id)}
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete"
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
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                {/* Rows per page (left) */}
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span>Số hàng mỗi trang:</span>
                  <select
                    className="h-9 rounded-md border border-gray-300 px-2 bg-white"
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
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
                    page={page}
                    totalPages={totalPages}
                    hasPrev={page > 1}
                    hasNext={page < totalPages}
                    onChange={setPage}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

export default DiscountsPage;
