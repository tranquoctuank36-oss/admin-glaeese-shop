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
}

function getTypeBadge(type: string) {
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
}

function VouchersTrashPage() {
  const router = useRouter();
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
      toast.error(error?.response?.data?.detail || "Failed to load trash");
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
      toast.success("Voucher restored successfully");
      const next = vouchers.filter((v) => v.id !== id);
      setVouchers(next);
      if (next.length === 0 && hasPrev) backIfEmpty();
    } catch (error: any) {
      console.error("Restore failed:", error);
      const detail =
        error?.response?.data?.detail ||
        error?.detail ||
        "Failed to restore voucher";
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
      toast.success("Voucher permanently deleted");
      const next = vouchers.filter((v) => v.id !== id);
      setVouchers(next);
      if (next.length === 0 && hasPrev) backIfEmpty();
    } catch (error: any) {
      console.error("Permanent delete failed:", error);
      const detail =
        error?.response?.data?.detail ||
        error?.detail ||
        "Failed to delete permanently";
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
                title="Go Back"
              >
                <ArrowLeft className="text-gray-700 size-7" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Trash Bin - Vouchers
                </h1>
                <p className="text-gray-600 mt-1">
                  Restore or permanently delete vouchers
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">All</option>
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
                      value={type}
                      onChange={(e) => {
                        setType(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="">All</option>
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
                      Valid To
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
                <p className="text-gray-600 text-lg">Loading...</p>
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
                        <div className="flex items-center justify-center gap-2">
                          <span>Valid From</span>
                          <button
                            type="button"
                            onClick={toggleValidFromSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
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
                        Usage
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <span>Deleted At</span>
                          <button
                            type="button"
                            onClick={toggleDeletedAtSort}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-[11px] uppercase text-gray-600 hover:bg-gray-200 cursor-pointer"
                          >
                            {sortField === "deletedAt" ? (
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
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Actions
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-gray-600 text-lg">
                            {voucher.code}
                          </code>
                        </td>
                        <td className="px-6 py-4">
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
                          <span className="text-gray-600">
                            {formatDate((voucher as any).deletedAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <ConfirmPopover
                              open={isOpen(voucher.id, "restore")}
                              onOpenChange={(o) =>
                                setOpenKey(
                                  o ? keyOf(voucher.id, "restore") : null
                                )
                              }
                              title="Restore this voucher"
                              message={
                                <div>
                                  Are you sure you want to restore{" "}
                                  <strong>{voucher.code}</strong>?
                                </div>
                              }
                              confirmText="Restore"
                              onConfirm={() => handleRestore(voucher.id)}
                              confirmDisabled={busyId === voucher.id}
                              confirmLoading={busyId === voucher.id}
                              confirmClassName="h-10 bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                title="Restore"
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
                              title="Permanently delete"
                              message={
                                <div>
                                  Are you sure you want to permanently delete{" "}
                                  <strong>{voucher.code}</strong>?
                                </div>
                              }
                              confirmText="Delete"
                              onConfirm={() => handleForceDelete(voucher.id)}
                              confirmDisabled={busyId === voucher.id}
                              confirmLoading={busyId === voucher.id}
                              confirmClassName="h-10 bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Button
                                size="icon-sm"
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete Permanently"
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
                          colSpan={7}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          Trash is empty.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && vouchers.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
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
        </motion.div>
      </main>
    </div>
  );
}

export default withAuthCheck(VouchersTrashPage);
