"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

export default function CategoryDistributionChart() {
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [isSmallOrMediumScreen, setIsSmallOrMediumScreen] = useState(false);

  useEffect(() => {
    const data = {
      categories: [
        { name: "Kính Nam", value: 4500 },
        { name: "Kính Nữ", value: 3200 },
        { name: "Kính Trẻ Em", value: 2800 },
        { name: "Kính Thể Thao", value: 3900 },
        { name: "Kính Bảo Hộ", value: 2000 },
      ],
    };
    setCategoryData(data.categories);
  }, []);

  useEffect(() => {
    const updateScreenSize = () => {
      setIsSmallOrMediumScreen(window.innerWidth <= 768);
    };
    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  const outerRadius = isSmallOrMediumScreen ? 80 : 100;

  const COLORS = ["#FF6B6B", "#4D96FF", "#FFD166", "#06D6A0", "#A29BFE"];

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
        Phân bố theo danh mục
      </h2>

      <div className="h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%" >
          <PieChart margin={{ top: -30, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={categoryData}
              dataKey="value"
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={outerRadius}
              label={renderCustomizedLabel}
            >
              {categoryData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(31, 41, 55, 0.8)",
                borderBlock: "#4b5563",
                borderRadius: "8px",
                padding: "8px",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#e5e7eb" }}
            />

            <Legend
              iconType="circle"
              layout="horizontal"
              align="center"
              height={40}
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
