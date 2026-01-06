"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { CategorySales } from "@/types/dashboard";
import { formatCurrency, CHART_COLORS } from "@/lib/dashboardUtils";

interface CategoryDonutChartProps {
  data: CategorySales[];
  loading?: boolean;
}

const COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
];

export default function CategoryDonutChart({
  data,
  loading = false,
}: CategoryDonutChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="h-80 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.categoryName,
    value: parseFloat(item.revenue),
    percentage: item.revenuePercentage,
    totalSold: item.totalSold,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Doanh thu theo loại sản phẩm
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => {
              const pct = entry.percentage % 1 === 0 ? entry.percentage.toFixed(0) : entry.percentage.toFixed(1);
              return `${entry.name}: ${pct}%`;
            }}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
