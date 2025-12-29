"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  getVouchers,
  deleteVoucher,
  cancelVoucher,
} from "@/services/voucherService";
import type { Voucher } from "@/types/voucher";
import Pagination from "@/components/data/Pagination";
import { toast } from "react-hot-toast";
import ConfirmPopover from "@/components/ConfirmPopover";
import { Routes } from "@/lib/routes";

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
  >("validTo");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [trashCount, setTrashCount] = useState<number>(0);

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
      toast.error(error?.response?.data?.detail || "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVoucher(id);
      toast.success("Voucher deleted successfully");
      fetchVouchers();
      setTrashCount((prev) => prev + 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to delete voucher");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelVoucher(id);
      toast.success("Voucher cancelled successfully");
      fetchVouchers();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to cancel voucher");
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
            Happening
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            Upcoming
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            Expired
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            Canceled
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
            Percentage
          </span>
        );
      case "fixed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-blue-100 text-blue-700">
            Fixed Amount
          </span>
        );
      case "free_shipping":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-700">
            Free Shipping
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
                  Voucher List {totalPages > 0 && `(${(currentPage - 1) * itemsPerPage + vouchers.length})`}
                </h1>
                <p className="text-gray-600 mt-1">
                  Create and manage voucher codes and promotional campaigns
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex h-12 items-center gap-2 bg-red-500 hover:bg-red-700 text-white text-base"
                onClick={() => router.push(Routes.sales.vouchers.trash)}
              >
                <Trash2 className="size-5" />
                Trash Bin
                {trashCount > 0 && (
                  <span className="top-2 right-2 bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full shadow">
                    {trashCount}
                  </span>
                )}
              </Button>

              <Button
                onClick={() => router.push(Routes.sales.vouchers.add)}
                className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base"
              >
                <Plus size={20} />
                Add Voucher
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
                  placeholder="Search by code or description..."
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
                Filters
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">All</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="happening">Happening</option>
                      <option value="canceled">Canceled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">All</option>
                      <option value="fixed">Fixed</option>
                      <option value="percentage">Percentage</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>

                  {/* Valid From Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid From
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
                        if (validToFilter && newValidFrom && newValidFrom > validToFilter) {
                          setValidToFilter("");
                        }
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  {/* Valid To Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid To
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
                    Reset
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
                <p className="text-gray-600 text-lg">Loading vouchers...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Value
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Min Order
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Max Discount
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Usage
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <span>Valid From</span>
                          <button
                            type="button"
                            onClick={toggleValidFromSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              sortField === "validFrom"
                                ? `Sorting: ${sortOrder} (click to change)`
                                : "No sorting (click to sort by Valid From)"
                            }
                          >
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
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <span>Valid To</span>
                          <button
                            type="button"
                            onClick={toggleValidToSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              sortField === "validTo"
                                ? `Sorting: ${sortOrder} (click to change)`
                                : "No sorting (click to sort by Valid To)"
                            }
                          >
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
                        </div>
                      </th>
                      

                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <span>Created At</span>
                          <button
                            type="button"
                            onClick={toggleCreatedAtSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                            title={
                              sortField === "createdAt"
                                ? `Sorting: ${sortOrder} (click to change)`
                                : "No sorting (click to sort by Created At)"
                            }
                          >
                            {sortField === "createdAt" ? (
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
                        Canceled At
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        Actions
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-gray-600 text-lg">
                            {voucher.code}
                          </code>
                        </td>
                        <td className="px-6 py-4 min-w-[200px] max-w-[300px]">
                          <span className="text-sm text-gray-800">
                            {voucher.description || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {getTypeBadge(voucher.type)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="text-base font-bold text-green-600">
                            {voucher.type === "percentage"
                              ? `${
                                  Number(voucher.value) > 100
                                    ? Number(voucher.value) / 100
                                    : voucher.value
                                }%`
                              : voucher.type === "free_shipping"
                              ? "Free"
                              : `${Number(voucher.value).toLocaleString(
                                  "en-US"
                                )}đ`}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {voucher.minOrderAmount
                              ? `${Number(
                                  voucher.minOrderAmount
                                ).toLocaleString("en-US")}đ`
                              : "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {voucher.maxDiscountValue
                              ? `${Number(
                                  voucher.maxDiscountValue
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-600">
                            {formatDateTime(voucher.validFrom)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-600">
                            {formatDateTime(voucher.validTo)}
                          </span>
                        </td>
                        

                        <td className="px-6 py-4 text-center whitespace-nowrap min-w-[120px]">
                          <span className="text-gray-600">
                            {formatDate(voucher.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <span className="text-gray-600">
                            {formatDate(voucher.canceledAt)}
                          </span>
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
                              title="Cancel Voucher"
                              message={
                                <div>
                                  Are you sure you want to cancel{" "}
                                  <strong>
                                    {voucher.code || "this voucher"}
                                  </strong>
                                  ?
                                </div>
                              }
                              confirmText="Cancel Voucher"
                              onConfirm={() => handleCancel(voucher.id)}
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
                              title="Remove Voucher"
                              message={
                                <div>
                                  Are you sure you want to delete{" "}
                                  <strong>
                                    {voucher.code || "this voucher"}
                                  </strong>
                                  ?
                                </div>
                              }
                              confirmText="Remove"
                              onConfirm={() => handleDelete(voucher.id)}
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Remove"
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
                          colSpan={13}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No discounts found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredVouchers.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                {/* Rows per page (left) */}
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span>Rows per page:</span>
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
      </main>
    </div>
  );
}

export default withAuthCheck(VouchersPage);
