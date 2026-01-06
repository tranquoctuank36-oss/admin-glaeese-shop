"use client";

import React from "react";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";
import { motion } from "motion/react";
import type { OverviewStats } from "@/types/dashboard";
import { formatCurrency, formatCompactNumber, GRID_LAYOUTS } from "@/lib/dashboardUtils";
import EnhancedStatCard from "./EnhancedStatCard";

interface OverviewCardsProps {
  data: OverviewStats | null;
  loading?: boolean;
}

export default function OverviewCards({ data, loading = false }: OverviewCardsProps) {
  return (
    <motion.div
      className={GRID_LAYOUTS.overviewCards}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <EnhancedStatCard
        title="Tổng doanh thu"
        value={data ? formatCurrency(data.totalRevenue) : "0đ"}
        icon={DollarSign}
        growth={data?.revenueGrowth}
        subtitle={data ? `TB: ${formatCurrency(data.averageOrderValue)}/đơn` : undefined}
        loading={loading}
        color="blue"
      />
      <EnhancedStatCard
        title="Tổng đơn hàng"
        value={data ? formatCompactNumber(data.totalOrders) : "0"}
        icon={ShoppingCart}
        growth={data?.ordersGrowth}
        subtitle={data ? `${data.pendingOrders} đang chờ, ${data.shippingOrders} đang giao` : undefined}
        loading={loading}
        color="green"
      />
      <EnhancedStatCard
        title="Khách hàng"
        value={data ? formatCompactNumber(data.totalCustomers) : "0"}
        icon={Users}
        subtitle={data ? `Tỉ lệ chuyển đổi: ${data.conversionRate % 1 === 0 ? data.conversionRate.toFixed(0) : data.conversionRate.toFixed(1)}%` : undefined}
        loading={loading}
        color="purple"
      />
      <EnhancedStatCard
        title="Sản phẩm"
        value={data ? formatCompactNumber(data.totalProducts) : "0"}
        icon={Package}
        loading={loading}
        color="orange"
      />
    </motion.div>
  );
}
