"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { OrdersByStatus } from "@/types/dashboard";
import { ORDER_STATUS_COLORS } from "@/lib/dashboardUtils";

interface OrdersPieChartProps {
  data: OrdersByStatus[];
  loading?: boolean;
}

export default function OrdersPieChart({
  data,
  loading = false,
}: OrdersPieChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="h-80 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.statusLabel,
    value: item.count,
    percentage: item.percentage,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Phân bố đơn hàng theo trạng thái
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="45%"
            cy="50%"

            labelLine={true}
            label={(entry: any) => {
              const pct = entry.percentage.toFixed(2);
              return `${entry.name}: ${pct}%`;
            }}
            outerRadius={110}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  ORDER_STATUS_COLORS[data[index]?.status] || "#9CA3AF"
                }
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: any) => {
              const pct = props.payload.percentage.toFixed(2);
              return `${value} đơn (${pct}%)`;
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={60}
            wrapperStyle={{ paddingTop: "20px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
