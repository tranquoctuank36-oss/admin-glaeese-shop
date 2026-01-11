"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getRefunds, GetRefundsParams } from "@/services/refundService";
import { Refund } from "@/types/refund";
import toast from "react-hot-toast";
import { Search, ChevronDown, ChevronUp, Filter } from "lucide-react";
import TablePagination from "@/components/shared/TablePagination";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";

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
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
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
      approved: { label: "Đã duyệt", className: "bg-blue-100 text-blue-700" },
      rejected: { label: "Từ chối", className: "bg-red-100 text-red-700" },
      processing: { label: "Đang xử lý", className: "bg-indigo-100 text-indigo-700" },
      success: { label: "Thành công", className: "bg-green-100 text-green-700" },
      failed: { label: "Thất bại", className: "bg-red-100 text-red-700" },
      cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-700" },
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
      goodwill: "Thiện chí",
      error: "Lỗi",
      promotion: "Khuyến mãi",
      manual: "Thủ công",
    };
    return triggerLabels[trigger] || trigger;
  };

  const getRefundTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      vnpay: "VNPAY",
      bank_transfer: "Chuyển khoản",
    };
    return typeLabels[type] || type;
  };

  const formatDate = (dateString: string | Record<string, any>) => {
    if (!dateString || typeof dateString === "object") return "-";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN");
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString("en-US") + "đ";
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortField(field);
      setSortOrder("DESC");
    }
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
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
                  Quản lý hoàn tiền
                </h1>
                <p className="text-gray-600 mt-1">
                  Quản lý và theo dõi tất cả hoàn tiền
                </p>
              </div>
            </div>
          </div>

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
                        { value: "approved", label: "Đã duyệt" },
                        { value: "rejected", label: "Từ chối" },
                        { value: "processing", label: "Đang xử lý" },
                        { value: "success", label: "Thành công" },
                        { value: "failed", label: "Thất bại" },
                        { value: "cancelled", label: "Đã hủy" },
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
                        { value: "goodwill", label: "Thiện chí" },
                        { value: "error", label: "Lỗi" },
                        { value: "promotion", label: "Khuyến mãi" },
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
                        { value: "vnpay", label: "VNPAY" },
                        { value: "bank_transfer", label: "Chuyển khoản" },
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
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">                      
                      Mã hoàn tiền
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Mã đơn hàng
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">                      
                      Mã giao dịch
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Nguồn gốc
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Ngày duyệt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : refunds.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        Không có danh sách hoàn tiền
                      </td>
                    </tr>
                  ) : (
                    refunds.map((refund) => (
                      <tr key={refund.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(refund.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {refund.refundCode || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {refund.orderCode || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {refund.providerTransactionId || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          {formatAmount(refund.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getRefundTypeLabel(refund.refundType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getTriggerLabel(refund.trigger)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(refund.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(refund.approvedAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

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
    </div>
  );
}

export default withAuthCheck(RefundsPage);
