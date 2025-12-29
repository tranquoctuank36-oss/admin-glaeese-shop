"use client";

import { motion } from "motion/react";

type StatCardProps = {
  name?: string;
  icon: React.ElementType;
  value: string;
  count?: number;
  color?: "blue" | "green" | "purple" | "orange";
};

const colorStyles = {
  blue: {
    gradient: "from-blue-50 to-white",
    border: "border-blue-100",
    textColor: "text-blue-600",
    valueColor: "text-blue-500",
    iconColor: "text-blue-400",
  },
  green: {
    gradient: "from-green-50 to-white",
    border: "border-green-100",
    textColor: "text-green-600",
    valueColor: "text-green-500",
    iconColor: "text-green-400",
  },
  purple: {
    gradient: "from-purple-50 to-white",
    border: "border-purple-100",
    textColor: "text-purple-600",
    valueColor: "text-purple-500",
    iconColor: "text-purple-400",
  },
  orange: {
    gradient: "from-orange-50 to-white",
    border: "border-orange-100",
    textColor: "text-orange-600",
    valueColor: "text-orange-500",
    iconColor: "text-orange-400",
  },
};

export default function StatCard({
  name,
  icon: Icon,
  value,
  count,
  color = "blue",
}: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`bg-gradient-to-br ${styles.gradient} border-2 ${styles.border} rounded-2xl p-6 cursor-pointer shadow-sm hover:shadow-lg transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm ${styles.textColor} font-medium mb-1`}>
            {name}
          </p>
          <p className={`text-3xl font-bold ${styles.valueColor}`}>{value}</p>
          {count !== undefined && (
            <p className="text-xs text-gray-500 mt-1">{count} items</p>
          )}
        </div>
        <Icon className={styles.iconColor} size={40} />
      </div>
    </motion.div>
  );
}
