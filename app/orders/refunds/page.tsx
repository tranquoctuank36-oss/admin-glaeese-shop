"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getRefunds, GetRefundsParams, approveRefund, rejectRefund, completeRefund, failRefund, getRefundStatistics, RefundStatistics } from "@/services/refundService";
import { Refund } from "@/types/refund";
import toast from "react-hot-toast";
import { Search, ChevronDown, ChevronUp, Filter, MoreVertical, CheckCircle, XCircle, Clock, Ban, AlertCircle, Eye, Plus, TrendingUp, TrendingDown } from "lucide-react";
import TablePagination from "@/components/shared/TablePagination";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import { useRouter } from "next/navigation";
import { Routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import ConfirmPopover from "@/components/shared/ConfirmPopover";

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
        className={`h-[42px] w-full px-3 text-left bg-white border rounded-lg cursor-pointer transition-all flex items-center justify-between ${
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

function RefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<RefundStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("");
  const [refundTypeFilter, setRefundTypeFilter] = useState("");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [orderReturnIdFilter, setOrderReturnIdFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Action Dialog States
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | 'success' | 'fail' | null;
    refund: Refund | null;
  }>({ open: false, type: null, refund: null });
  const [actionNote, setActionNote] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [actionTransactionId, setActionTransactionId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Không đóng menu nếu click vào ConfirmPopover
      if (target.closest('[data-radix-popper-content-wrapper]') || 
          target.closest('[role="dialog"]')) {
        return;
      }
      if (openActionMenu && !target.closest('.action-menu-container')) {
        setOpenActionMenu(null);
      }
    };

    if (openActionMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openActionMenu]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const params: GetRefundsParams = {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        trigger: triggerFilter || undefined,
        refundType: refundTypeFilter || undefined,
        orderId: orderIdFilter || undefined,
        orderReturnId: orderReturnIdFilter || undefined,
        page: currentPage,
        limit: itemsPerPage,
        sortField,
        sortOrder,
      };
      const response = await getRefunds(params);
      setRefunds(response.data);
      setTotalItems(response.meta.totalItems);
      setTotalPages(response.meta.totalPages);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể tải danh sách hoàn tiền");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [currentPage, statusFilter, triggerFilter, refundTypeFilter, orderIdFilter, orderReturnIdFilter, itemsPerPage, searchTerm, sortField, sortOrder]);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setStatsLoading(true);
        const data = await getRefundStatistics();
        setStatistics(data);
      } catch (error: any) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const handleClearFilters = () => {
    setStatusFilter("");
    setTriggerFilter("");
    setRefundTypeFilter("");
    setOrderIdFilter("");
    setOrderReturnIdFilter("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-700" },
      rejected: { label: "Từ chối", className: "bg-red-100 text-red-700" },
      processing: { label: "Đang xử lý", className: "bg-indigo-100 text-indigo-700" },
      success: { label: "Thành công", className: "bg-green-100 text-green-700" },
      failed: { label: "Thất bại", className: "bg-red-100 text-red-700" },
    };
    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-700" };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getTriggerLabel = (trigger: string) => {
    const triggerLabels: Record<string, string> = {
      return: "Trả hàng",
      cancel_order: "Hủy đơn",
      manual: "Thủ công",
    };
    return triggerLabels[trigger] || trigger;
  };

  const getRefundTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      online_payment: "Thanh toán trực tuyến",
      bank_transfer: "Chuyển khoản ngân hàng",
    };
    return typeLabels[type] || type;
  };


  const getRelativeTime = (dateString: string | Record<string, any>) => {
    if (!dateString || typeof dateString === "object") return "-";
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return "Vừa xong";
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} giây trước`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ngày trước`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} tháng trước`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} năm trước`;
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString("en-US") + "đ";
  };


  const openActionDialog = (type: 'approve' | 'reject' | 'success' | 'fail', refund: Refund) => {
    setActionDialog({ open: true, type, refund });
    setActionNote("");
    setActionReason("");
    setActionTransactionId("");
    setOpenActionMenu(null);
  };

  const closeActionDialog = () => {
    setActionDialog({ open: false, type: null, refund: null });
    setActionNote("");
    setActionReason("");
    setActionTransactionId("");
  };

  const handleAction = async () => {
    if (!actionDialog.refund || !actionDialog.type) return;

    try {
      setActionLoading(true);
      
      switch (actionDialog.type) {
        case 'approve':
          await approveRefund(actionDialog.refund.id, { note: actionNote });
          toast.success("Đã duyệt hoàn tiền thành công");
          break;
        case 'reject':
          await rejectRefund(actionDialog.refund.id, { reason: actionReason });
          toast.success("Đã từ chối hoàn tiền");
          break;
        case 'success':
          await completeRefund(actionDialog.refund.id, { 
            providerTransactionId: actionTransactionId,
            note: actionNote 
          });
          toast.success("Đã đánh dấu hoàn tiền thành công");
          break;
        case 'fail':
          await failRefund(actionDialog.refund.id, { reason: actionReason });
          toast.success("Đã đánh dấu hoàn tiền thất bại");
          break;
      }
      
      closeActionDialog();
      fetchRefunds();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Không thể thực hiện thao tác");
    } finally {
      setActionLoading(false);
    }
  };

  const canApprove = (status: string) => status === 'pending';
  const canReject = (status: string) => status === 'pending';
  const canMarkSuccess = (status: string) => status === 'processing';
  const canMarkFail = (status: string) => status === 'processing';

  return (
    <div className="flex-1 relative z-10">
      <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Hoàn tiền
                </h1>
                <p className="text-gray-600 mt-1">
                  Quản lý và theo dõi tất cả hoàn tiền
                </p>
              </div>
              {/* <Button
                onClick={() => router.push(Routes.orders.refundAdd)}
                className="flex h-12 items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base"
              >
                <Plus size={20} />
                Tạo hoàn tiền
              </Button> */}
            </div>
          </div>

          {/* Statistics Cards */}
          {statsLoading ? (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : statistics && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Refunds */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Tổng hoàn tiền</p>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
              </div>

              {/* Pending */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Chờ duyệt</p>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
              </div>

              {/* Rejected */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Từ chối</p>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-600">{statistics.rejected}</p>
              </div>

              {/* Processing */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Đang xử lý</p>
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-indigo-600">{statistics.processing}</p>
              </div>

              {/* Success */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Thành công</p>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-600">{statistics.success}</p>
                <p className="text-xs text-gray-500 mt-1">Tỷ lệ: {statistics.successRate}%</p>
              </div>

              {/* Failed */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Thất bại</p>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-orange-600">{statistics.failed}</p>
                <p className="text-xs text-gray-500 mt-1">Không hoàn</p>
              </div>

              {/* Total Amount */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">Tổng tiền</p>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {parseFloat(statistics.totalRefundAmount).toLocaleString('en-US')}đ
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  TB: {parseFloat(statistics.averageRefundAmount).toLocaleString('en-US')}đ
                </p>
              </div>
            </div>
          )}

          {/* Search Bar and Filters */}
          <div
            ref={filtersRef}
            className="mb-6 bg-white rounded-lg shadow border border-gray-200 p-3"
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
                  placeholder="Tìm kiếm theo lý do hoàn tiền..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <CustomSelect
                value={`${sortField}-${sortOrder}`}
                onChange={(v) => {
                  const [field, order] = v.split("-");
                  setSortField(field);
                  setSortOrder(order as "ASC" | "DESC");
                  setCurrentPage(1);
                }}
                options={[
                  { value: "createdAt-DESC", label: "Ngày tạo giảm dần" },
                  { value: "createdAt-ASC", label: "Ngày tạo tăng dần" },
                  { value: "amount-DESC", label: "Số tiền giảm dần" },
                  { value: "amount-ASC", label: "Số tiền tăng dần" },
                  { value: "status-ASC", label: "Trạng thái A-Z" },
                  { value: "status-DESC", label: "Trạng thái Z-A" },
                  { value: "approvedAt-DESC", label: "Ngày duyệt mới nhất" },
                ]}
              />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Trạng thái đơn hàng
                    </label>
                    <CustomSelect
                      value={statusFilter}
                      onChange={(v) => {
                        setStatusFilter(v);
                        setCurrentPage(1);
                      }}
                      options={[
                        { value: "", label: "Tất cả" },
                        { value: "pending", label: "Chờ duyệt" },
                        { value: "rejected", label: "Từ chối" },
                        { value: "processing", label: "Đang xử lý" },
                        { value: "success", label: "Thành công" },
                        { value: "failed", label: "Thất bại" },
                      ]}
                    />
                  </div>

                  {/* Trigger Filter */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Nguồn gốc
                    </label>
                    <CustomSelect
                      value={triggerFilter}
                      onChange={(v) => {
                        setTriggerFilter(v);
                        setCurrentPage(1);
                      }}
                      options={[
                        { value: "", label: "Tất cả" },
                        { value: "return", label: "Trả hàng" },
                        { value: "cancel_order", label: "Hủy đơn" },
                        { value: "manual", label: "Thủ công" },
                      ]}
                    />
                  </div>

                  {/* Refund Type Filter */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Loại hoàn tiền
                    </label>
                    <CustomSelect
                      value={refundTypeFilter}
                      onChange={(v) => {
                        setRefundTypeFilter(v);
                        setCurrentPage(1);
                      }}
                      options={[
                        { value: "", label: "Tất cả" },
                        { value: "online_payment", label: "Thanh toán trực tuyến" },
                        { value: "bank_transfer", label: "Chuyển khoản ngân hàng" },
                      ]}
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 text-sm cursor-pointer text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Đặt lại
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">                      
                      Mã hoàn tiền
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Mã đơn hàng
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Nguồn gốc
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : refunds.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        Không có danh sách hoàn tiền
                      </td>
                    </tr>
                  ) : (
                    refunds.map((refund) => (
                      <tr key={refund.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="font-mono text-gray-900">
                            {refund.refundCode || "-"}
                          </div>
                          <div className="text-xs text-gray-500 cursor-help relative group">
                            {getRelativeTime(refund.updatedAt || refund.createdAt)}
                            <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block min-w-[180px] p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap">
                              <div>Tạo: {new Date(refund.createdAt).toLocaleString("vi-VN")}</div>
                              <div className="mt-1">Cập nhật: {new Date(refund.updatedAt).toLocaleString("vi-VN")}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {refund.orderCode || "-"}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-sm font-semibold text-blue-600">
                          {formatAmount(refund.amount)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          {getStatusBadge(refund.status)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                          {getRefundTypeLabel(refund.refundType)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                          {getTriggerLabel(refund.trigger)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center relative">
                          <div className="flex items-center justify-center action-menu-container">
                            <button
                              onClick={() => setOpenActionMenu(openActionMenu === refund.id ? null : refund.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical size={18} className="text-gray-600" />
                            </button>
                            {openActionMenu === refund.id && (
                              <div className="absolute right-8 top-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                <button
                                  onClick={() => {
                                    router.push(Routes.orders.refundDetails(refund.id));
                                    setOpenActionMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-blue-600"
                                >
                                  <Eye size={16} />
                                  Xem chi tiết
                                </button>
                                {canApprove(refund.status) && (
                                  <ConfirmPopover
                                    title="Duyệt hoàn tiền"
                                    message={
                                      <>
                                        Bạn có chắc chắn muốn <span className="font-semibold">duyệt hoàn tiền?</span>                                     </>
                                    }
                                    confirmText="Xác nhận"
                                    cancelText="Hủy"
                                    confirmClassName="h-10 bg-green-600 hover:bg-green-700 text-white"
                                    confirmLoading={actionLoading}
                                    onConfirm={async () => {
                                      try {
                                        setActionLoading(true);
                                        await approveRefund(refund.id, { note: "" });
                                        toast.success("Đã duyệt hoàn tiền thành công");
                                        await fetchRefunds();
                                        setOpenActionMenu(null);
                                      } catch (error: any) {
                                        toast.error(error?.response?.data?.detail || "Không thể thực hiện thao tác");
                                      } finally {
                                        setActionLoading(false);
                                      }
                                    }}
                                  >
                                    <button className="w-full px-4 py-2 text-left text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-green-600">
                                      <CheckCircle size={16} />
                                      Duyệt hoàn tiền
                                    </button>
                                  </ConfirmPopover>
                                )}
                                {canReject(refund.status) && (
                                  <button
                                    onClick={() => openActionDialog('reject', refund)}
                                    className="w-full px-4 py-2 text-left text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                  >
                                    <XCircle size={16} />
                                    Từ chối hoàn tiền
                                  </button>
                                )}
                                {canMarkSuccess(refund.status) && (
                                  <button
                                    onClick={() => openActionDialog('success', refund)}
                                    className="w-full px-4 py-2 text-left text-sm cursor-pointer  hover:bg-gray-50 flex items-center gap-2 text-green-600"
                                  >
                                    <CheckCircle size={16} />
                                    Đánh dấu thành công
                                  </button>
                                )}
                                {canMarkFail(refund.status) && (
                                  <button
                                    onClick={() => openActionDialog('fail', refund)}
                                    className="w-full px-4 py-2 text-left text-sm cursor-pointer hover:bg-gray-50 flex items-center gap-2 text-orange-600"
                                  >
                                    <AlertCircle size={16} />
                                    Đánh dấu thất bại
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

            {/* Pagination */}
            {!loading && refunds.length > 0 && (
              <TablePagination
                page={currentPage}
                limit={itemsPerPage}
                totalPages={totalPages}
                totalItems={totalItems}
                hasPrev={currentPage > 1}
                hasNext={currentPage < totalPages}
                onPageChange={setCurrentPage}
                onLimitChange={(value: number) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
                limitOptions={[10, 20, 50, 100]}
              />
            )}
          </div>
        </motion.div>

        {/* Action Dialog */}
        {actionDialog.open && (
          <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {actionDialog.type === 'approve' && 'Duyệt hoàn tiền'}
                {actionDialog.type === 'reject' && 'Từ chối hoàn tiền'}
                {actionDialog.type === 'success' && 'Đánh dấu thành công'}
                {actionDialog.type === 'fail' && 'Đánh dấu thất bại'}
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Mã hoàn tiền: <span className="font-semibold">{actionDialog.refund?.refundCode}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Số tiền: <span className="font-semibold text-blue-600">{actionDialog.refund && formatAmount(actionDialog.refund.amount)}</span>
                </p>
              </div>

              {/* Mã giao dịch - chỉ hiện cho action success */}
              {actionDialog.type === 'success' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã giao dịch <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={actionTransactionId}
                    onChange={(e) => setActionTransactionId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                    placeholder="Nhập mã giao dịch..."
                  />
                </div>
              )}

              {/* Ghi chú - hiện cho approve và success */}
              {(actionDialog.type === 'approve' || actionDialog.type === 'success') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú
                  </label>
                  <textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                    rows={3}
                    placeholder="Nhập ghi chú..."
                  />
                </div>
              )}

              {/* Lý do - hiện cho reject và fail */}
              {(actionDialog.type === 'reject' || actionDialog.type === 'fail') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                    rows={3}
                    placeholder="Nhập lý do..."
                  />
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeActionDialog}
                  disabled={actionLoading}
                  className="px-4 py-2 cursor-pointer text-white bg-gray-500 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAction}
                  disabled={
                    actionLoading || 
                    (actionDialog.type === 'reject' && !actionReason) ||
                    (actionDialog.type === 'fail' && !actionReason) ||
                    (actionDialog.type === 'success' && !actionTransactionId)
                  }
                  className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Refund Dialog */}
    </div>
  );
}

export default withAuthCheck(RefundsPage);
