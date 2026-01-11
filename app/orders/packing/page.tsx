"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, ChevronDown, Printer, MoreVertical, AlertTriangle, RefreshCw, Package, Pencil, Filter, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmPopover from "@/components/shared/ConfirmPopover";
import { getPackingOrders } from "@/services/orderService";
import { Order } from "@/types/order";
import { calculateShippingFee, createShipment, printLabel } from "@/services/shippingService";
import { useListQuery } from "@/components/listing/hooks/useListQuery";
import TablePagination from "@/components/shared/TablePagination";
import toast from "react-hot-toast";

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

export default function PackingOrdersPage() {
  const { q, setQ, setAndResetPage, apiParams, apiKey } = useListQuery(
    {
      limit: 20,
      sortField: "createdAt",
      sortOrder: "DESC",
    },
    {
      allowedsortField: ["createdAt", "updatedAt"] as const,
      extraFilters: {},
    }
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<{
    totalPages?: number;
    totalItems?: number;
  }>();
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasTrackingCodeFilter, setHasTrackingCodeFilter] = useState<string>("all");
  const [isPrintedFilter, setIsPrintedFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [showMenuForOrder, setShowMenuForOrder] = useState<string | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  
  // Shipping form state
  const [weight, setWeight] = useState<number>(300);
  const [length, setLength] = useState<number>(20);
  const [width, setWidth] = useState<number>(15);
  const [height, setHeight] = useState<number>(10);
  const [note, setNote] = useState<string>("");
  const [requiredNote, setRequiredNote] = useState<string>("CHOTHUHANG");
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [creatingShipment, setCreatingShipment] = useState(false);

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

  // Fetch orders from API
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const params: any = { ...apiParams };
        
        // Apply filters only when not "all"
        if (hasTrackingCodeFilter !== "all") {
          params.hasTrackingCode = hasTrackingCodeFilter === "true";
        }
        if (isPrintedFilter !== "all") {
          params.isPrinted = isPrintedFilter === "true";
        }

        const res = await getPackingOrders(params);
        if (!alive) return;
        setOrders(res.data);
        setMeta({
          totalPages: res.meta?.totalPages,
          totalItems: res.meta?.totalItems,
        });
        setHasNext(!!res.hasNext);
        setHasPrev(!!res.hasPrev);
      } catch (e) {
        console.error("Failed to fetch packing orders:", e);
        if (alive) {
          setOrders([]);
          setMeta(undefined);
          toast.error("Không thể tải danh sách đơn hàng");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [apiKey, hasTrackingCodeFilter, isPrintedFilter]);

  const getOrderStatus = (order: Order): "no-code" | "has-code" | "printed" => {
    if (order.trackingCode && Object.keys(order.trackingCode).length > 0) {
      // Has tracking code
      if (order.isPrinted) {
        return "printed";
      }
      return "has-code";
    }
    return "no-code";
  };

  const getTrackingCodeValue = (trackingCode: Record<string, any> | string): string | null => {
    if (!trackingCode) return null;
    
    // If it's a string, return it directly
    if (typeof trackingCode === 'string') {
      return trackingCode;
    }
    
    // If it's an object, extract the value
    if (typeof trackingCode === 'object' && Object.keys(trackingCode).length === 0) return null;
    const keys = Object.keys(trackingCode);
    if (keys.length > 0) {
      return trackingCode[keys[0]] || keys[0];
    }
    return null;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const handleCreateShippingCode = (order: Order) => {
    setSelectedOrderForModal(order);
    setShowCreateModal(true);
    // Reset form
    setWeight(300);
    setLength(20);
    setWidth(15);
    setHeight(10);
    setNote("");
    setRequiredNote("CHOTHUHANG");
    setEstimatedFee(null);
    setCalculatingFee(true);
  };

  const calculateShippingFeeHandler = async () => {
    if (!selectedOrderForModal || !weight || !length || !width || !height) return;
    
    setCalculatingFee(true);
    try {
      const response = await calculateShippingFee({
        orderId: selectedOrderForModal.id,
        weight,
        length,
        width,
        height,
      });

      if (response.success && response.data) {
        setEstimatedFee(response.data.total || 0);
      }
    } catch (error) {
      console.error("Failed to calculate shipping fee:", error);
      toast.error("Không thể tính phí vận chuyển");
    } finally {
      setCalculatingFee(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!selectedOrderForModal || !weight || !length || !width || !height) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setCreatingShipment(true);
    try {
      const codAmount = selectedOrderForModal.paymentMethod === "COD" 
        ? Number(selectedOrderForModal.grandTotal) 
        : 0;

      const response = await createShipment({
        orderId: selectedOrderForModal.id,
        weight,
        length,
        width,
        height,
        codAmount,
        note: note || undefined,
        requiredNote,
      });

      if (response.success) {
        toast.success("Tạo vận đơn thành công!");
        setShowCreateModal(false);
        // Reload orders to get updated tracking code
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Failed to create shipment:", error);
      const errorMessage = error?.response?.data?.detail || "Không thể tạo vận đơn";
      toast.error(errorMessage);
    } finally {
      setCreatingShipment(false);
    }
  };

  // Calculate fee when weight or dimensions change
  useEffect(() => {
    if (showCreateModal && selectedOrderForModal && weight && length && width && height) {
      const timer = setTimeout(() => {
        calculateShippingFeeHandler();
      }, 500); // Debounce 500ms
      return () => clearTimeout(timer);
    }
  }, [weight, length, width, height, showCreateModal, selectedOrderForModal]);

  const handleBatchPrint = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Vui lòng chọn ít nhất một đơn hàng");
      return;
    }

    // Get selected order objects
    const ordersToPrint = orders.filter(order => selectedOrders.includes(order.id));
    
    // Extract tracking codes from selected orders
    const trackingCodes: string[] = [];
    for (const order of ordersToPrint) {
      const trackingCode = getTrackingCodeValue(order.trackingCode);
      if (trackingCode) {
        trackingCodes.push(trackingCode);
      }
    }

    if (trackingCodes.length === 0) {
      toast.error("Không có đơn hàng nào có mã vận đơn để in");
      return;
    }

    try {
      const response = await printLabel({
        carrierOrderCodes: trackingCodes,
        pageSize: "A5",
      });

      if (response.success && response.data?.url) {
        // Open PDF in new tab
        window.open(response.data.url, "_blank");
        toast.success(`Đang mở tem vận chuyển cho ${trackingCodes.length} đơn hàng...`);
        
        // Reload to fetch updated isPrinted status from backend
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Failed to batch print labels:", error);
      const errorMessage = error?.response?.data?.message || "Không thể in tem vận chuyển";
      toast.error(errorMessage);
    }
  };

  const handlePrintLabel = async (order: Order) => {
    const trackingCode = getTrackingCodeValue(order.trackingCode);
    if (!trackingCode) {
      toast.error("Không tìm thấy mã vận đơn");
      return;
    }

    try {
      const response = await printLabel({
        carrierOrderCodes: [trackingCode],
        pageSize: "A5",
      });

      if (response.success && response.data?.url) {
        // Open PDF in new tab
        window.open(response.data.url, "_blank");
        toast.success("Đang mở tem vận chuyển...");
        
        // Reload to fetch updated isPrinted status from backend
        window.location.reload();
      }
    } catch (error: any) {
      console.error("Failed to print label:", error);
      const errorMessage = error?.response?.data?.message || "Không thể in tem vận chuyển";
      toast.error(errorMessage);
    }
  };
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
              Đơn hàng chờ đóng gói ({meta?.totalItems})
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý đóng gói và tạo vận đơn
            </p>
          </div>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        ref={filtersRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
              placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng, số điện thoại, email..."
              value={q.search || ""}
              onChange={(e) => setAndResetPage({ search: e.target.value, page: 1 })}
            />
          </div>
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
              {/* Tracking Code Filter */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Mã vận đơn
                </label>
                <CustomSelect
                  value={hasTrackingCodeFilter}
                  onChange={(v) => setHasTrackingCodeFilter(v)}
                  options={[
                    { value: "all", label: "Tất cả" },
                    { value: "true", label: "Có mã" },
                    { value: "false", label: "Chưa có mã" },
                  ]}
                />
              </div>

              {/* Print Status Filter */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Trạng thái in tem
                </label>
                <CustomSelect
                  value={isPrintedFilter}
                  onChange={(v) => setIsPrintedFilter(v)}
                  options={[
                    { value: "all", label: "Tất cả" },
                    { value: "true", label: "Đã in" },
                    { value: "false", label: "Chưa in" },
                  ]}
                />
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Sắp xếp
                </label>
                <CustomSelect
                  value={`${q.sortField}-${q.sortOrder}`}
                  onChange={(v) => {
                    const [field, order] = v.split('-');
                    setQ((prev) => ({ ...prev, sortField: field, sortOrder: order as "ASC" | "DESC", page: 1 }));
                  }}
                  options={[
                    { value: "createdAt-DESC", label: "Ngày tạo giảm dần" },
                    { value: "createdAt-ASC", label: "Ngày tạo tăng dần" },
                    { value: "updatedAt-DESC", label: "Trạng thái mới cập nhật" },
                  ]}
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setHasTrackingCodeFilter("all");
                  setIsPrintedFilter("all");
                  setQ((prev) => ({
                    ...prev,
                    sortField: "createdAt",
                    sortOrder: "DESC",
                    page: 1,
                  }));
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Đặt lại
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Batch Action Bar */}
      {selectedOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between"
        >
          <span className="text-sm font-medium text-blue-900">
            Đã chọn: {selectedOrders.length} đơn
          </span>
          <ConfirmPopover
            title="Xác nhận in hàng loạt"
            message={`Bạn có chắc muốn in tem cho ${selectedOrders.length} đơn hàng?`}
            confirmText="In tem"
            cancelText="Hủy"
            onConfirm={handleBatchPrint}
            confirmClassName="h-10 bg-blue-600 hover:bg-blue-700 text-white"
            widthClass="w-[320px]"
          >
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Printer className="w-4 h-4 mr-2" />
              In hàng loạt
            </Button>
          </ConfirmPopover>
        </motion.div>
      )}

      {/* Orders List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
            {/* Header Row */}
            <div className="bg-white rounded-t-lg shadow border border-gray-200 px-6 py-3">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  checked={selectedOrders.length === orders.length && orders.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <div className="flex-1 text-sm font-semibold text-gray-600">
                  Đã chọn: {selectedOrders.length} đơn
                </div>
              </div>
            </div>

            {/* Order Cards */}
            {loading ? (
              <div className="bg-white rounded-b-lg shadow border-x border-b border-gray-200 p-12 text-center">
                <p className="text-gray-600">Đang tải...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-b-lg shadow border-x border-b border-gray-200 p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-500">
                  Không có đơn hàng chờ đóng gói
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white shadow border-x border-gray-200 p-6 hover:shadow-md transition-shadow ${
                  idx === 0 ? '' : 'border-t'
                } ${idx === orders.length - 1 ? 'border-b' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 mt-1 cursor-pointer"
                    checked={selectedOrders.includes(order.id)}
                    onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                  />

                  {/* Order Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-4">
                      {/* Order ID */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{order.orderCode}</h3>
                        {order.customerNote && (
                          <div className="mt-1 inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                            <Pencil className="w-3 h-3" />
                            {order.customerNote}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {getOrderStatus(order) === "no-code" && (
                          <Button
                            onClick={() => handleCreateShippingCode(order)}
                            className="bg-white hover:bg-gray-100 text-blue-600 border-2 border-blue-600 px-6"
                          >
                            Tạo mã GHN
                          </Button>
                        )}
                        {getOrderStatus(order) === "has-code" && (
                          <div className="flex items-center gap-2">
                            <div className="px-4 py-2 bg-blue-100 text-blue-900 font-bold rounded">
                              {getTrackingCodeValue(order.trackingCode)}
                            </div>
                            <ConfirmPopover
                              title="Xác nhận in tem"
                              message={`In tem cho đơn hàng ${order.orderCode}?`}
                              confirmText="In tem"
                              cancelText="Hủy"
                              onConfirm={() => handlePrintLabel(order)}
                              confirmClassName="h-10 bg-blue-600 hover:bg-blue-700 text-white"
                              widthClass="w-[320px]"
                            >
                              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Printer className="w-4 h-4 mr-2" />
                                In tem
                              </Button>
                            </ConfirmPopover>
                          </div>
                        )}
                        {getOrderStatus(order) === "printed" && (
                          <div className="px-4 py-2 bg-green-600 text-white font-semibold rounded inline-flex items-center gap-2">
                            <span>✓</span>
                            <span>Đã in</span>
                            <span className="text-green-100">{getTrackingCodeValue(order.trackingCode)}</span>
                            {/* <button 
                              onClick={() => handlePrintLabel(order)}
                              className="ml-2 p-1 hover:bg-green-700 rounded cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button> */}
                          </div>
                        )}

                        {/* 3-dot Menu */}
                        <div className="relative">
                          <button
                            onClick={() => setShowMenuForOrder(showMenuForOrder === order.id ? null : order.id)}
                            className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                          {showMenuForOrder === order.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                  console.log("Report out of stock:", order.id);
                                  setShowMenuForOrder(null);
                                }}
                              >
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                <span>Báo thiếu hàng</span>
                              </button>
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                  console.log("Cancel and recreate:", order.id);
                                  setShowMenuForOrder(null);
                                }}
                              >
                                <RefreshCw className="w-4 h-4 text-blue-500" />
                                <span>Hủy & Tạo lại</span>
                              </button>
                              <ConfirmPopover
                                title="Xác nhận in lại tem"
                                message={`In lại tem cho đơn hàng ${order.orderCode}?`}
                                confirmText="In lại"
                                cancelText="Hủy"
                                onConfirm={() => {
                                  handlePrintLabel(order);
                                  setShowMenuForOrder(null);
                                }}
                                confirmClassName="h-10 bg-blue-600 hover:bg-blue-700 text-white"
                                widthClass="w-[320px]"
                              >
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Printer className="w-4 h-4 text-gray-500" />
                                  <span>In lại tem</span>
                                </button>
                              </ConfirmPopover>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 gap-4 max-h-[200px] overflow-y-auto">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                          <div className="w-12 h-12 bg-white rounded flex items-center justify-center overflow-hidden">
                            {item.thumbnailUrl ? (
                              <img
                                src={item.thumbnailUrl}
                                alt={item.productName}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm">
                              {item.productName}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {item.productVariantName}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Màu: {item.colors}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-white px-2 py-1 rounded border border-gray-200 text-sm font-medium">
                              x{item.quantity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && orders.length > 0 && (
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
                className="rounded-b-lg border-x border-b border-gray-200"
              />
            )}
      </motion.div>

      {/* Create Shipping Code Modal */}
      {showCreateModal && selectedOrderForModal && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-50 transition-opacity duration-300"
            onClick={() => setShowCreateModal(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-lg shadow-2xl z-[60]"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Tạo vận đơn GHN
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Đơn hàng {selectedOrderForModal.orderCode} - {selectedOrderForModal.recipientName}
              </p>

              {/* Thông tin gói hàng */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Thông tin gói hàng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Trọng lượng (gram):
                    </label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value <= 50000) {
                          setWeight(value);
                        } else {
                          toast.error("Trọng lượng không được vượt quá 50000g");
                        }
                      }}
                      max={50000}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tối đa: 50000g</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Kích thước (cm):
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={length}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (value <= 200) {
                            setLength(value);
                          } else {
                            toast.error("Chiều dài không được vượt quá 200cm");
                          }
                        }}
                        max={200}
                        placeholder="Dài"
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                      />
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (value <= 200) {
                            setWidth(value);
                          } else {
                            toast.error("Chiều rộng không được vượt quá 200cm");
                          }
                        }}
                        max={200}
                        placeholder="Rộng"
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                      />
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (value <= 200) {
                            setHeight(value);
                          } else {
                            toast.error("Chiều cao không được vượt quá 200cm");
                          }
                        }}
                        max={200}
                        placeholder="Cao"
                        className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Tối đa: 200cm mỗi chiều</p>
                  </div>
                </div>
              </div>

              {/* Thông tin vận chuyển */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Thông tin vận chuyển
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-700 flex items-center gap-1">
                      <Lock className="w-4 h-4" />
                      Thu hộ (COD):
                    </span>
                    <span className="font-semibold">
                      {selectedOrderForModal.paymentMethod === "COD" 
                        ? `${Number(selectedOrderForModal.grandTotal).toLocaleString("en-US")} đ`
                        : "0 đ"
                      }
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Lưu ý GHN:
                    </label>
                    <CustomSelect
                      value={requiredNote}
                      onChange={(v) => setRequiredNote(v)}
                      options={[
                        { value: "CHOXEMHANGKHONGTHU", label: "Cho xem hàng không thử" },
                        { value: "CHOTHUHANG", label: "Cho thử hàng" },
                        { value: "KHONGCHOXEMHANG", label: "Không cho xem hàng" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Ghi chú:
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Nhập ghi chú cho đơn hàng..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Fee */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Phí dự kiến:</span>
                  {calculatingFee ? (
                    <span className="text-lg font-bold text-blue-600">Đang tính...</span>
                  ) : estimatedFee !== null ? (
                    <span className="text-lg font-bold text-blue-600">{estimatedFee.toLocaleString("en-US")} đ</span>
                  ) : (
                    <span className="text-lg font-bold text-gray-400">-- đ</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white border border-gray-300"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateShipment}
                  disabled={creatingShipment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {creatingShipment ? "Đang tạo..." : "Tạo & Lấy mã"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
