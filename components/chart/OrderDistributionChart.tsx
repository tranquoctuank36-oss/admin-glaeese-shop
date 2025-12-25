"use client";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

const OrderDistributionChart = () => {
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [isSmallOrMediumScreen, setIsSmallOrMediumScreen] = useState(false);

  useEffect(() => {
    const updateScreenSize = () => {
      setIsSmallOrMediumScreen(window.innerWidth <= 768);
    };
    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  const outerRadius = isSmallOrMediumScreen ? 80 : 100;

  const COLORS = ["#FBC02D", "#03A9F4", "#EF4444", "#8BC34A", "#A29BFE"];

  useEffect(() => {
    const data = {
      orderStatus: [
        { name: "PENDING", value: 3500 },
        { name: "COMPLETED", value: 3000 },
        { name: "CANCELLED", value: 2000 },
        { name: "REFUNDED", value: 3900 },
        { name: "PROCESSING", value: 2800 },
      ],
    };
    setOrderStatusData(data.orderStatus);
  }, []);

  const renderCustomizedLabel = ({
    name,
    percent,
    cx,
    cy,
    midAngle,
    outerRadius,
    fill,
  }: PieLabelRenderProps) => {
    if (!name || percent == null || typeof percent !== "number") return null;

    const RADIAN = Math.PI / 180;

    const numericOuterRadius = Number(outerRadius) || 0;
    const numericMidAngle = Number(midAngle) || 0;
    const numericCx = Number(cx) || 0;
    const numericCy = Number(cy) || 0;

    const radius = numericOuterRadius + 20;

    const x = numericCx + radius * Math.cos(-numericMidAngle * RADIAN);
    const y = numericCy + radius * Math.sin(-numericMidAngle * RADIAN);

    const percentage = (percent * 100).toFixed(0);

    return (
      <text
        x={x}
        y={y}
        fill={fill}
        textAnchor={x > numericCx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={15}
        fontWeight={500}
      >
        {`${name} ${percentage}%`}
      </text>
    );
  };

  return (
    <motion.div
      className="bg-white backdrop-blur-md rounded-xl p-4 md:p-6 mx-2 md:mx-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <h2 className="text-base md:text-lg font-semibold mb-4 text-gray-800 text-center md:text-left">
        Order Status Distribution
      </h2>

      <div className="w-full h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: -30, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={orderStatusData}
              cx="50%"
              cy="50%"
              outerRadius={outerRadius}
              dataKey="value"
              label={renderCustomizedLabel}
              labelLine={{ stroke: "#9ca3af" }}
            >
              {orderStatusData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(31, 41, 55, 0.8)",
                borderColor: "#4b5563",
                borderRadius: "8px",
                padding: "8px",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#e5e7eb" }}
              cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
            />
            <Legend
              iconType="circle"
              layout="horizontal"
              align="center"
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default OrderDistributionChart;


