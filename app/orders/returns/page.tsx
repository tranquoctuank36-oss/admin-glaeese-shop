"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, MoreVertical, Shield, ChevronDown, CheckCircle, XCircle, Eye } from "lucide-react";
import { 
  getReturns, 
  getReturnStatistics, 
  updateReturnStatus, 
  performQualityCheck,  
  completeRefund,
  updateShouldRefund
} from "@/services/returnService";
import { Return } from "@/types/return";
import { useListQuery } from "@/components/listing/hooks/useListQuery";
import TablePagination from "@/components/shared/TablePagination";
import { Button } from "@/components/ui/button";
import { Routes } from "@/lib/routes";
import ConfirmPopover from "@/components/shared/ConfirmPopover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import Image from "next/image";

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

export default function ReturnsPage() {
  const router = useRouter();

  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery(
    {
      limit: 20,
    },
  );

  const [returns, setReturns] = useState<Return[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hoveredReturnId, setHoveredReturnId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  // Action states
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showQcDialog, setShowQcDialog] = useState(false);
  const [qcResult, setQcResult] = useState<'pass' | 'fail'>('pass');
  const [qcNote, setQcNote] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");
  const [shouldRefund, setShouldRefund] = useState(true);
  const [refundAmount, setRefundAmount] = useState("");
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundDialogData, setRefundDialogData] = useState<{
    shouldRefund: boolean;
    refundAmount: string;
    reason: string;
  }>({ shouldRefund: true, refundAmount: "", reason: "" });

  // Fetch statistics
  useEffect(() => {
    (async () => {
      const statsData = await getReturnStatistics();
      setStats(statsData.data ?? statsData);
    })();
  }, []);

  // Fetch returns from API
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getReturns(apiParams);
        if (!alive) return;
        setReturns(res.data);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
        setHasNext(!!res.hasNext);
        setHasPrev(!!res.hasPrev);
      } catch (e) {
        console.error("Failed to fetch returns:", e);
        if (alive) {
          setReturns([]);
          setMeta(undefined);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiKey]);

  const getAdminNoteValue = (adminNote: string | Record<string, any> | null): string | null => {
    if (!adminNote) return null;
    
    if (typeof adminNote === 'string') {
      return adminNote;
    }
    
    if (typeof adminNote === 'object' && Object.keys(adminNote).length === 0) return null;
    const keys = Object.keys(adminNote);
    if (keys.length > 0) {
      return adminNote[keys[0]] || keys[0];
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-blue-100 text-blue-700';
      case 'waiting_item':
        return 'bg-purple-100 text-purple-700';
      case 'received_at_warehouse':
        return 'bg-indigo-100 text-indigo-700';
      case 'qc_pass':
        return 'bg-teal-100 text-teal-700';
      case 'qc_fail':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'canceled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'requested':
        return 'Yêu cầu mới';
      case 'approved':
        return 'Đã duyệt';
      case 'waiting_item':
        return 'Chờ hàng hoàn';
      case 'received_at_warehouse':
        return 'Đã nhận hàng';
      case 'qc_pass':
        return 'QC đạt';
      case 'qc_fail':
        return 'QC không đạt';
      case 'completed':
        return 'Hoàn tất';
      case 'rejected':
        return 'Đã từ chối';
      case 'canceled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const fetchData = async () => {
    let alive = true;
    setLoading(true);
    try {
      const res = await getReturns(apiParams);
      if (!alive) return;
      setReturns(res.data);
      setMeta({
        totalPages: res.meta?.totalPages,
        totalItems: res.meta?.totalItems,
      });
      setHasNext(!!res.hasNext);
      setHasPrev(!!res.hasPrev);
    } catch (e) {
      console.error("Failed to fetch returns:", e);
      if (alive) {
        setReturns([]);
        setMeta(undefined);
      }
    } finally {
      if (alive) setLoading(false);
    }
  };

  const handleStatusUpdate = async (returnData: Return, newStatus: string, additionalData?: { adminNote?: string; rejectedReason?: string; refundAmount?: string }) => {
    try {
      setUpdating(true);
      
      if (newStatus === "qc_check") {
        setSelectedReturn(returnData);
        setShowQcDialog(true);
        setUpdating(false);
        return;
      }
      
      if (newStatus === "completed") {
        await completeRefund(returnData.id);
        toast.success("Đã hoàn tất yêu cầu trả hàng");
        await fetchData();
        setUpdating(false);
        return;
      }
      
      await updateReturnStatus(
        returnData.id, 
        newStatus,
        additionalData?.adminNote,
        additionalData?.rejectedReason,
        additionalData?.refundAmount
      );
      
      // Show specific success messages based on status
      const successMessages: Record<string, string> = {
        'approved': 'Đã duyệt yêu cầu trả hàng thành công',
        'rejected': 'Đã từ chối yêu cầu trả hàng',
        'received_at_warehouse': 'Đã xác nhận nhận hàng tại kho',
      };
      
      toast.success(successMessages[newStatus] || "Đã cập nhật trạng thái thành công");
      await fetchData();
      
      setShowRejectDialog(false);
      setRejectedReason("");
    } catch (error: any) {
      console.error("Failed to update status:", error);
      const errorMessage = error.response?.data?.detail || error.detail || "Không thể cập nhật trạng thái";
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handleQcCheck = async () => {
    if (!selectedReturn) return;

    try {
      setUpdating(true);
      await performQualityCheck(
        selectedReturn.id, 
        qcResult, 
        qcNote || undefined,
        shouldRefund,
        refundAmount || undefined
      );
      toast.success(`Đã kiểm tra chất lượng: ${qcResult === 'pass' ? 'Đạt' : 'Không đạt'}`);
      
      await fetchData();
      
      setShowQcDialog(false);
      setQcResult('pass');
      setQcNote("");
      setShouldRefund(true);
      setRefundAmount("");
      setSelectedReturn(null);
    } catch (error: any) {
      console.error("Failed to perform QC:", error);
      const errorMessage = error.response?.data?.detail || error.detail || "Không thể thực hiện kiểm tra chất lượng";
      toast.error(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusActions = (returnItem: Return) => {
    switch (returnItem.status) {
      case "requested":
        return [
          { label: "Duyệt yêu cầu", value: "approved", color: "blue" },
          { label: "Từ chối", value: "rejected", color: "red" },
        ];
      case "approved":
        return [
          {
            label: "Đã nhận hàng",
            value: "received_at_warehouse",
            color: "indigo",
          },
        ];
      case "received_at_warehouse":
        return [
          {
            label: "Kiểm tra chất lượng",
            value: "qc_check",
            color: "teal",
          },
        ];
      case "qc_pass":
        return [
          {
            label: "Cập nhật hoàn tiền",
            value: "update_refund",
            color: "blue",
          },
          {
            label: "Hoàn tất yêu cầu",
            value: "completed",
            color: "green",
          },
        ];
      case "qc_fail":
        return [
          {
            label: "Hoàn tất yêu cầu",
            value: "completed",
            color: "green",
          },
        ];
      default:
        return [];
    }
  };

  // Click-outside handler for action menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (openActionMenu && !target.closest('.action-menu-container')) {
        setOpenActionMenu(null);
        setMenuPosition(null);
      }
    };
    
    if (openActionMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openActionMenu]);

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Trả hàng
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý yêu cầu trả hàng và hoàn tiền
            </p>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng đơn trả hàng</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.total ?? 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Yêu cầu mới</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {stats.requested ?? 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.approved ?? 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã từ chối</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.rejected ?? 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">QC đạt</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.qcPass ?? 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">QC không đạt</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {stats.qcFail ?? 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hoàn tất</p>
                <p className="text-2xl font-bold text-teal-600 mt-1">
                  {stats.completed ?? 0}
                </p>
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trả hàng mới</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {stats.newReturns ?? 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 bg-white rounded-lg shadow border border-gray-200 p-3"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
              placeholder="Tìm kiếm theo mã đơn hàng, mã trả hàng, lý do..."
              value={q.search || ""}
              onChange={(e) =>
                setAndResetPage({ search: e.target.value, page: 1 })
              }
            />
          </div>
          <CustomSelect
            value={q.status || ""}
            onChange={(v) => {
              setQ((prev) => ({
                ...prev,
                status: v || undefined,
                page: 1,
              }));
            }}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "requested", label: "Yêu cầu mới" },
              { value: "approved", label: "Đã duyệt" },
              { value: "waiting_item", label: "Chờ hàng về" },
              { value: "received_at_warehouse", label: "Đã nhận hàng" },
              { value: "qc_pass", label: "QC đạt" },
              { value: "qc_fail", label: "QC không đạt" },
              { value: "completed", label: "Hoàn tất" },
              { value: "rejected", label: "Đã từ chối" },
              { value: "canceled", label: "Đã hủy" },
            ]}
          />
        </div>
      </motion.div>

      {/* Returns Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <p className="text-gray-600">Đang tải...</p>
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-500">
            Không có yêu cầu trả hàng nào
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Mã
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase whitespace-nowrap ">
                    Lý do
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Thông tin hoàn tiền
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {returns.map((returnItem, idx) => (
                  <motion.tr
                    key={returnItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Trả hàng:</span>
                          <span className="font-semibold text-blue-600">
                            {returnItem.returnCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Đơn hàng:</span>
                          <span className="font-semibold text-gray-900">
                            {returnItem.orderCode}
                          </span>
                          {returnItem.adminNote &&
                            Object.keys(returnItem.adminNote).length > 0 && (
                              <div
                                className="relative inline-block"
                                onMouseEnter={() => setHoveredReturnId(returnItem.id)}
                                onMouseLeave={() => setHoveredReturnId(null)}
                              >
                                <Shield className="w-4 h-4 text-blue-600 cursor-help" />
                                {hoveredReturnId === returnItem.id && (
                                  <div className="absolute left-0 top-6 z-50 min-w-[200px] max-w-[300px] p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-normal break-words">
                                    {getAdminNoteValue(returnItem.adminNote)}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="max-w-[200px]">
                        <p className="text-sm text-gray-700 truncate">
                          {returnItem.reason}
                        </p>
                        {returnItem.customerNote && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            Ghi chú: {typeof returnItem.customerNote === 'string' 
                              ? returnItem.customerNote 
                              : JSON.stringify(returnItem.customerNote)}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="space-y-1">
                        {returnItem.calculatedRefundAmount && (
                          <div className="text-sm">
                            <span className="text-xs text-gray-500">Tính toán: </span>
                            <span className="font-semibold text-blue-600">
                              {typeof returnItem.calculatedRefundAmount === 'string' 
                                ? parseFloat(returnItem.calculatedRefundAmount).toLocaleString("en-US") 
                                : '-'}đ
                            </span>
                          </div>
                        )}
                        {returnItem.refundAmount && (
                          <div className="text-sm">
                            <span className="text-xs text-gray-500">Thực tế: </span>
                            <span className="font-semibold text-gray-900">
                              {typeof returnItem.refundAmount === 'string' 
                                ? parseFloat(returnItem.refundAmount).toLocaleString("en-US") 
                                : '-'}đ
                            </span>
                          </div>
                        )}
                        {!returnItem.calculatedRefundAmount && !returnItem.refundAmount && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(returnItem.status)}`}
                      >
                        {getStatusLabel(returnItem.status)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="text-base text-gray-700">
                        {new Date(returnItem.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            if (openActionMenu === returnItem.id) {
                              setOpenActionMenu(null);
                              setMenuPosition(null);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
                            } else {
                              setOpenActionMenu(returnItem.id);
                              setMenuPosition({
                                top: rect.bottom + window.scrollY + 4,
                                left: rect.right + window.scrollX - 192, 
                              });
                            }
                          }}
                          className="p-2 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors"
                          title="Thao tác"
                        >
                          <MoreVertical className="text-gray-600 size-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <TablePagination
            page={q.page}
            limit={q.limit}
            totalPages={meta?.totalPages}
            totalItems={meta?.totalItems}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPageChange={(p) => setQ((prev) => ({ ...prev, page: p }))}
            onLimitChange={(l) => setAndResetPage({ limit: l, page: 1 })}
            limitOptions={[10, 20, 50, 100]}
          />
        </motion.div>
      )}

      {/* Action Menu - Rendered outside table to avoid overflow issues */}
      {openActionMenu && menuPosition && (
        <div 
          className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 action-menu-container"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          <div className="py-1">
            {/* View Details */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentReturn = returns.find(r => r.id === openActionMenu);
                if (currentReturn) {
                  router.push(Routes.orders.returnDetails(currentReturn.id));
                }
                setOpenActionMenu(null);
                setMenuPosition(null);
              }}
              className="w-full px-4 py-2 cursor-pointer text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-blue-600"
            >
              <Eye className="w-4 h-4" />
              Xem chi tiết
            </button>

            {(() => {
              const currentReturn = returns.find(r => r.id === openActionMenu);
              if (!currentReturn) return null;
              const actions = getStatusActions(currentReturn);
              if (actions.length === 0) return null;

              return (
                <>
                  {actions.map((action) => {
                    if (action.value === "approved") {
                      return (
                        <ConfirmPopover
                          key={action.value}
                          title="Xác nhận duyệt"
                          message={
                            <>
                              Bạn có chắc chắn muốn <span className="font-semibold">duyệt yêu cầu trả hàng</span> này không?
                            </>
                          }
                          confirmText="Xác nhận"
                          cancelText="Hủy"
                          confirmClassName="h-10 bg-green-600 hover:bg-green-700 text-white"
                          confirmLoading={updating}
                          onConfirm={async () => {
                            try {
                              await handleStatusUpdate(currentReturn, action.value);
                              setOpenActionMenu(null);
                              setMenuPosition(null);
                            } catch (error) {
                              // Error already handled in handleStatusUpdate
                            }
                          }}
                        >
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-4 py-2 cursor-pointer text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-green-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {action.label}
                          </button>
                        </ConfirmPopover>
                      );
                    }

                    if (action.value === "rejected") {
                      return (
                        <button
                          key={action.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReturn(currentReturn);
                            setShowRejectDialog(true);
                            setOpenActionMenu(null);
                            setMenuPosition(null);
                          }}
                          className="w-full px-4 cursor-pointer py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                        >
                          <XCircle className="w-4 h-4" />
                          {action.label}
                        </button>
                      );
                    }

                    if (action.value === "received_at_warehouse") {
                      return (
                        <ConfirmPopover
                          key={action.value}
                          title="Xác nhận nhận hàng"
                          message={
                            <>
                              Bạn có chắc chắn đã <span className="font-semibold">nhận hàng tại kho</span> chưa?
                            </>
                          }
                          confirmText="Xác nhận"
                          cancelText="Hủy"
                          confirmClassName="h-10 bg-indigo-600 hover:bg-indigo-700 text-white"
                          confirmLoading={updating}
                          onConfirm={async () => {
                            try {
                              await handleStatusUpdate(currentReturn, action.value);
                              setOpenActionMenu(null);
                              setMenuPosition(null);
                            } catch (error) {
                              // Error already handled in handleStatusUpdate
                            }
                          }}
                        >
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-4 py-2 cursor-pointer text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-indigo-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {action.label}
                          </button>
                        </ConfirmPopover>
                      );
                    }

                    if (action.value === "qc_check") {
                      return (
                        <button
                          key={action.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(currentReturn, action.value);
                            setOpenActionMenu(null);
                            setMenuPosition(null);
                          }}
                          className="w-full px-4 py-2 cursor-pointer text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-teal-600"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {action.label}
                        </button>
                      );
                    }

                    if (action.value === "update_refund") {
                      return (
                        <button
                          key={action.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReturn(currentReturn);
                            setRefundDialogData({
                              shouldRefund: true,
                              refundAmount: "",
                              reason: ""
                            });
                            setShowRefundDialog(true);
                            setOpenActionMenu(null);
                            setMenuPosition(null);
                          }}
                          className="w-full px-4 py-2 cursor-pointer text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-blue-600"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {action.label}
                        </button>
                      );
                    }

                    if (action.value === "completed") {
                      return (
                        <ConfirmPopover
                          key={action.value}
                          title="Xác nhận hoàn tất"
                          message={
                            <>
                              Bạn có chắc chắn muốn <span className="font-semibold">hoàn tất yêu cầu trả hàng</span> này?
                            </>
                          }
                          confirmText="Xác nhận"
                          cancelText="Hủy"
                          confirmClassName="h-10 bg-green-600 hover:bg-green-700 text-white"
                          confirmLoading={updating}
                          onConfirm={async () => {
                            try {
                              await handleStatusUpdate(currentReturn, action.value);
                              setOpenActionMenu(null);
                              setMenuPosition(null);
                            } catch (error) {
                              // Error already handled in handleStatusUpdate
                            }
                          }}
                        >
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-4 py-2 cursor-pointer text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-green-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {action.label}
                          </button>
                        </ConfirmPopover>
                      );
                    }

                    return null;
                  })}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Từ chối yêu cầu trả hàng
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do từ chối <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none min-h-[120px]"
                placeholder="Nhập lý do từ chối..."
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center gap-3">
            <Button
              onClick={() => {
                setShowRejectDialog(false);
                setRejectedReason("");
              }}
              disabled={updating}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (!rejectedReason.trim()) {
                  toast.error("Vui lòng nhập lý do từ chối");
                  return;
                }
                if (selectedReturn) {
                  handleStatusUpdate(selectedReturn, "rejected", {
                    rejectedReason,
                  });
                }
              }}
              disabled={updating || !rejectedReason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg"
            >
              {updating ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QC Dialog */}
      <Dialog open={showQcDialog} onOpenChange={setShowQcDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Kiểm tra chất lượng hàng trả
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kết quả kiểm tra <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setQcResult('pass')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all cursor-pointer ${
                    qcResult === 'pass'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  Đạt
                </button>
                <button
                  onClick={() => setQcResult('fail')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all cursor-pointer ${
                    qcResult === 'fail'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <XCircle className="w-5 h-5 inline mr-2" />
                  Không đạt
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú kiểm tra
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none min-h-[120px]"
                placeholder="Nhập ghi chú về tình trạng hàng..."
                value={qcNote}
                onChange={(e) => setQcNote(e.target.value)}
              />
            </div>

            {qcResult === 'pass' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hoàn tiền <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setShouldRefund(true)}
                      className={`flex items-center justify-center cursor-pointer gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        shouldRefund
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5" />
                      Có
                    </button>
                    <button
                      type="button"
                      onClick={() => setShouldRefund(false)}
                      className={`flex items-center justify-center cursor-pointer gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        !shouldRefund
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <XCircle className="w-5 h-5" />
                      Không
                    </button>
                  </div>
                </div>

                {shouldRefund && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số tiền hoàn lại
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:border-blue-500 outline-none"
                        placeholder="0"
                        value={refundAmount ? parseFloat(refundAmount.replace(/,/g, '')).toLocaleString('en-US') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/,/g, '');
                          if (value === '' || /^\d+$/.test(value)) {
                            setRefundAmount(value);
                          }
                        }}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                        đ
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="flex items-center gap-3">
            <Button
              onClick={() => {
                setShowQcDialog(false);
                setQcResult('pass');
                setQcNote("");
                setShouldRefund(true);
                setRefundAmount("");
              }}
              disabled={updating}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg"
            >
              Hủy
            </Button>
            <Button
              onClick={handleQcCheck}
              disabled={updating}
              className={`flex-1 ${
                qcResult === 'pass'
                  ? 'bg-teal-600 hover:bg-teal-700'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white font-medium py-2 rounded-lg`}
            >
              {updating ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Cập nhật hoàn tiền
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hoàn tiền <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setRefundDialogData(prev => ({ ...prev, shouldRefund: true }))}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    refundDialogData.shouldRefund
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className={`w-5 h-5 ${refundDialogData.shouldRefund ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`font-medium ${refundDialogData.shouldRefund ? 'text-green-700' : 'text-gray-600'}`}>
                      Có
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setRefundDialogData(prev => ({ ...prev, shouldRefund: false }))}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    !refundDialogData.shouldRefund
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className={`w-5 h-5 ${!refundDialogData.shouldRefund ? 'text-red-600' : 'text-gray-400'}`} />
                    <span className={`font-medium ${!refundDialogData.shouldRefund ? 'text-red-700' : 'text-gray-600'}`}>
                      Không
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {refundDialogData.shouldRefund && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền hoàn lại
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:border-blue-500 outline-none"
                    placeholder="0"
                    value={refundDialogData.refundAmount ? parseFloat(refundDialogData.refundAmount.replace(/,/g, '')).toLocaleString('en-US') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      if (value === '' || /^\d+$/.test(value)) {
                        setRefundDialogData(prev => ({ ...prev, refundAmount: value }));
                      }
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    đ
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none min-h-[100px]"
                placeholder="Nhập lý do hoặc ghi chú..."
                value={refundDialogData.reason}
                onChange={(e) => setRefundDialogData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center gap-3">
            <Button
              onClick={() => {
                setShowRefundDialog(false);
                setRefundDialogData({ shouldRefund: true, refundAmount: "", reason: "" });
              }}
              disabled={updating}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg"
            >
              Hủy
            </Button>
            <Button
              onClick={async () => {
                if (!selectedReturn) return;
                
                try {
                  setUpdating(true);
                  await updateShouldRefund(
                    selectedReturn.id,
                    refundDialogData.shouldRefund,
                    refundDialogData.refundAmount || undefined,
                    refundDialogData.reason || undefined
                  );
                  toast.success(`Đã ${refundDialogData.shouldRefund ? 'cập nhật hoàn tiền' : 'hủy hoàn tiền'} thành công`);
                  
                  await fetchData();
                  
                  setShowRefundDialog(false);
                  setRefundDialogData({ shouldRefund: true, refundAmount: "", reason: "" });
                  setSelectedReturn(null);
                } catch (error: any) {
                  console.error("Failed to update refund:", error);
                  const errorMessage = error.response?.data?.detail || error.detail || "Không thể cập nhật hoàn tiền";
                  toast.error(errorMessage);
                } finally {
                  setUpdating(false);
                }
              }}
              disabled={updating}
              className={`flex-1 ${
                refundDialogData.shouldRefund
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white font-medium py-2 rounded-lg`}
            >
              {updating ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
