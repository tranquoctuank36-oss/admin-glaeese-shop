"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { getOrderStatistics, OrderStatistics } from "@/services/orderService";
import {
  ShoppingCart,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";

// Custom Select Component
interface CustomSelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
}

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
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
        className={`w-full px-4 py-2 text-left bg-white border rounded-lg cursor-pointer transition-all flex items-center justify-between ${
          open ? "border-2 border-blue-400" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <span className="text-gray-900">
          {selectedOption ? selectedOption.label : placeholder || "Chọn..."}
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
              className={`px-4 py-2 cursor-pointer transition-colors ${
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

export default function OrdersOverviewPage() {
  const [stats, setStats] = useState<OrderStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState("this_month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const params: any = {};

        // Ưu tiên dùng startDate/endDate nếu có nhập
        if (startDate || endDate) {
          if (startDate) params.startDate = startDate;
          if (endDate) params.endDate = endDate;
        } else if (preset) {
          // Nếu không có ngày thủ công thì dùng preset
          params.preset = preset;
        }

        const response = await getOrderStatistics(params);
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch order statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [preset, startDate, endDate]);

  const statCards = [
    {
      title: "Tổng đơn hàng",
      value: stats?.total || 0,
      icon: ShoppingCart,
      color: "bg-blue-500",
      iconColor: "text-white",
      textColor: "text-blue-600",
    },
    {
      title: "Chờ xác nhận",
      value: stats?.pending || 0,
      icon: Clock,
      color: "bg-yellow-500",
      iconColor: "text-white",
      textColor: "text-yellow-600",
    },
    {
      title: "Đang xử lý",
      value: stats?.processing || 0,
      icon: Package,
      color: "bg-purple-500",
      iconColor: "text-white",
      textColor: "text-purple-600",
    },
    {
      title: "Đang giao",
      value: stats?.shipping || 0,
      icon: Truck,
      color: "bg-indigo-500",
      iconColor: "text-white",
      textColor: "text-indigo-600",
    },
    {
      title: "Đã giao",
      value: stats?.delivered || 0,
      icon: CheckCircle,
      color: "bg-green-500",
      iconColor: "text-white",
      textColor: "text-green-600",
    },
    {
      title: "Hoàn thành",
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: "bg-emerald-500",
      iconColor: "text-white",
      textColor: "text-emerald-600",
    },
    {
      title: "Đã hủy/Trả lại",
      value: stats?.cancelledOrReturned || 0,
      icon: XCircle,
      color: "bg-red-500",
      iconColor: "text-white",
      textColor: "text-red-600",
    },
  ];

  const handleReset = () => {
    setPreset("this_month");
    setStartDate("");
    setEndDate("");
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
        <h1 className="text-3xl font-bold text-gray-800">Thống kê đơn hàng</h1>
        <p className="text-gray-600 mt-1">Tổng quan và thống kê đơn hàng</p>
      </motion.div>

      {/* Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CustomSelect
              value={preset}
              onChange={(v) => setPreset(v)}
              options={[
                { value: "today", label: "Hôm nay" },
                { value: "yesterday", label: "Hôm qua" },
                { value: "this_week", label: "Tuần này" },
                { value: "last_week", label: "Tuần trước" },
                { value: "this_month", label: "Tháng này" },
                { value: "last_month", label: "Tháng trước" },
                { value: "this_year", label: "Năm này" },
              ]}
            />

            <input
              type="date"
              className="px-4 py-2 cursor-pointer border border-gray-300 rounded-lg focus:border-blue-500 outline-none bg-white"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value) setPreset("");
              }}
              placeholder="Ngày bắt đầu"
            />
            <input
              type="date"
              className="px-4 py-2 cursor-pointer border border-gray-300 rounded-lg focus:border-blue-500 outline-none bg-white"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (e.target.value) setPreset("");
              }}
              placeholder="Ngày kết thúc"
            />
          </div>

          <button
            onClick={handleReset}
            className="px-4 py-2 cursor-pointer border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đặt lại
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <p className="text-gray-600">Đang tải thống kê...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${card.color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm mb-1">{card.title}</h3>
                <p className={`text-3xl font-bold ${card.textColor}`}>
                  {card.value}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
