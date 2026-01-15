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
import { formatCurrency, formatCompactNumber } from "@/lib/dashboardUtils";

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

  const chartData = data.map((item) => {
    const [year, month, day] = item.label.split('-');
    const formattedLabel = `${day}-${month}-${year}`;
    
    return {
      label: formattedLabel,
      revenue: parseFloat(item.revenue),
      orderCount: item.orderCount,
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Doanh thu theo thời gian
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <YAxis
            width={70}
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
            tickFormatter={(value) => new Intl.NumberFormat("en-US").format(value) + "đ"}
          />
          <Tooltip
            formatter={(value: number, name: string, props: any) => {
              if (name === "Doanh thu") {
                return [formatCurrency(value), "Doanh thu"];
              }
              return [value, name];
            }}
            labelFormatter={(label) => label}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px",
            }}
            itemStyle={{
              padding: "4px 0",
            }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-gray-900 mb-2">{label}</p>
                    <p className="text-blue-600 font-medium">
                      Doanh thu: {formatCurrency(data.revenue)}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      Số đơn: {data.orderCount} đơn
                    </p>
                  </div>
                );
              }
              return null;
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
