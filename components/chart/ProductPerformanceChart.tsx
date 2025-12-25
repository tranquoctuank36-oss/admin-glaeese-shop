"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface productPerformance {
  name: string;
  retention: number;
  revenue: number;
  profit: number;
}

export default function ProductPerformanceChart() {
  const [productPerformanceData, setProductPerformanceData] = useState<productPerformance[]>([]);

  useEffect(() => {
    const data: productPerformance[] = [
      {
        name: "Men's Glasses",
        retention: 5200,
        revenue: 2800,
        profit: 2600,
      },
      {
        name: "Women's Glasses",
        retention: 4200,
        revenue: 2600,
        profit: 3200,
      },
      {
        name: "Kids' Glasses",
        retention: 2900,
        revenue: 6900,
        profit: 3900,
      },
      {
        name: "Sports Glasses",
        retention: 2500,
        revenue: 4100,
        profit: 2500,
      },
      {
        name: "Safety Glasses",
        retention: 1900,
        revenue: 9400,
        profit: 2700,
      },
    ];
    setProductPerformanceData(data);
  }, []);

  return (
    <motion.div
      className="bg-white backdrop-blur-md rounded-xl p-4 md:p-6 mx-2 md:mx-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <h2 className="text-base md:text-xl font-semibold text-gray-800 mb-4 text-center md:text-left">
        Product Performance
      </h2>

      <div className="h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={productPerformanceData}
            
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              angle={-15}
              textAnchor="end"
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 12 }} width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(31, 41, 55, 0.8)",
                borderColor: "#4B5563",
                borderRadius: "8px",
                padding: "8px",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#E5E7EB" }}
              cursor={{ fill: "rgba(238, 238, 238, 0.68)" }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "14px",
              }}
            />
            <Bar
              dataKey="retention"
              name="Retention"
              fill="#fd9b70ff"
              radius={[4, 4, 0, 0]}
              animationDuration={2000}
            />
            <Bar
              dataKey="revenue"
              name="Revenue"
              fill="#77c2ffff"
              radius={[4, 4, 0, 0]}
              animationDuration={2000}
            />
            <Bar
              dataKey="profit"
              name="Profit"
              fill="#55e1c7ff"
              radius={[4, 4, 0, 0]}
              animationDuration={2000}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
