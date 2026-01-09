"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { PaymentMethodStats } from "@/types/dashboard";
import { formatCurrency, CHART_COLORS } from "@/lib/dashboardUtils";

interface PaymentMethodsBarProps {
  data: PaymentMethodStats[];
  loading?: boolean;
}

export default function PaymentMethodsBar({
  data,
  loading = false,
}: PaymentMethodsBarProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="h-80 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.label,
    revenue: parseFloat(item.revenue),
    orders: item.orderCount,
    percentage: item.percentage,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Doanh thu theo phương thức thanh toán
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            stroke={CHART_COLORS.primary}
            tickFormatter={(value) => formatCurrency(value).replace(/\s?₫/, "")}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            stroke={CHART_COLORS.success}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "Doanh thu") return formatCurrency(value);
              if (name === "Số đơn") return `${value} đơn`;
              return value;
            }}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px",
            }}
            labelStyle={{
              fontWeight: "600",
              marginBottom: "8px",
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" fill={CHART_COLORS.primary} name="Doanh thu" radius={[8, 8, 0, 0]} />
          <Bar yAxisId="right" dataKey="orders" fill={CHART_COLORS.success} name="Số đơn" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
