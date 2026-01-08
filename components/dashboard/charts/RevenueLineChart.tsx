"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { RevenueByPeriod } from "@/types/dashboard";
import { formatCurrency } from "@/lib/dashboardUtils";

interface RevenueLineChartProps {
  data: RevenueByPeriod[];
  loading?: boolean;
}

export default function RevenueLineChart({
  data,
  loading = false,
}: RevenueLineChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="h-80 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const chartData = data.map((item) => ({
    label: item.label,
    revenue: parseFloat(item.revenue),
    orderCount: item.orderCount,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Doanh thu theo thời gian
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
            tickFormatter={(value) => formatCurrency(value).replace(/\s?₫/, "")}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ paddingTop: "10px" }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: "#3B82F6", r: 4 }}
            activeDot={{ r: 6 }}
            name="Doanh thu"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
