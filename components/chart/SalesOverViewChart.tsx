"use client";

import { motion } from "motion/react";
import { useState, useEffect } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function SalesOverviewChart() {
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    const data = {
      sales: [
        { month: "Jan", sales: 4100 },
        { month: "Feb", sales: 3800 },
        { month: "Mar", sales: 5200 },
        { month: "Apr", sales: 4700 },
        { month: "May", sales: 6900 },
        { month: "Jun", sales: 6200 },
        { month: "Jul", sales: 7500 },
        { month: "Aug", sales: 2900 },
        { month: "Sep", sales: 6700 },
        { month: "Oct", sales: 6300 },
        { month: "Nov", sales: 7100 },
        { month: "Dec", sales: 7600 },
      ],
    };
    setSalesData(data.sales);
  }, []);

  return (
    <motion.div
      className="bg-white rounded-xl p-4 md:p-6 mx-2 md:mx-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-800 text-center md:text-left">
        Sales Overview
      </h2>

      <div className="h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="month"
              stroke="#818181ff"
              tick={{ fontSize: 12, fill: "#52555aff" }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#818181ff"
              tick={{ fontSize: 12, fill: "#52555aff" }}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #4b5563",
                borderRadius: "8px",
                color: "#e5e7eb",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#e5e7eb" }}
              labelStyle={{ color: "#e5e7eb" }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#738fffff"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#738fffff" }}
              activeDot={{ r: 6, strokeWidth: 2, fill: "#738fffff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}


