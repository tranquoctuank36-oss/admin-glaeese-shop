"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatGrowth } from "@/lib/dashboardUtils";

interface EnhancedStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  growth?: number;
  subtitle?: string;
  loading?: boolean;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "indigo";
}

const colorStyles = {
  blue: {
    gradient: "from-blue-50 to-white",
    border: "border-blue-100",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  green: {
    gradient: "from-green-50 to-white",
    border: "border-green-100",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  purple: {
    gradient: "from-purple-50 to-white",
    border: "border-purple-100",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  orange: {
    gradient: "from-orange-50 to-white",
    border: "border-orange-100",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  red: {
    gradient: "from-red-50 to-white",
    border: "border-red-100",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  indigo: {
    gradient: "from-indigo-50 to-white",
    border: "border-indigo-100",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
};

export default function EnhancedStatCard({
  title,
  value,
  icon: Icon,
  growth,
  subtitle,
  loading = false,
  color = "blue",
}: EnhancedStatCardProps) {
  const styles = colorStyles[color];
  const growthInfo = growth !== undefined ? formatGrowth(growth) : null;

  return (
    <div
      className={cn(
        "bg-gradient-to-br rounded-xl shadow-sm p-6 border transition-all hover:shadow-md",
        styles.gradient,
        styles.border
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-lg", styles.iconBg)}>
          <Icon className={cn("w-6 h-6", styles.iconColor)} />
        </div>
        {growthInfo && (
          <span
            className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full",
              growthInfo.type === "increase" &&
                "bg-green-100 text-green-700 border border-green-200",
              growthInfo.type === "decrease" &&
                "bg-red-100 text-red-700 border border-red-200",
              growthInfo.type === "neutral" &&
                "bg-gray-100 text-gray-700 border border-gray-200"
            )}
          >
            {growthInfo.text}
          </span>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
