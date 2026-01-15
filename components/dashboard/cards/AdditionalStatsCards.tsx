"use client";

import React from "react";
import { RotateCcw, AlertCircle } from "lucide-react";
import type { ReturnStats, RefundStats, PromotionStats, InventoryStats } from "@/types/dashboard";
import { formatCurrency, formatCompactNumber } from "@/lib/dashboardUtils";
import EnhancedStatCard from "./EnhancedStatCard";

interface AdditionalStatsCardsProps {
  returns: ReturnStats | null;
  refunds: RefundStats | null;
  promotions: PromotionStats | null;
  inventory: InventoryStats | null;
  loading?: boolean;
}

export default function AdditionalStatsCards({
  returns,
  refunds,
  promotions,
  inventory,
  loading = false,
}: AdditionalStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <EnhancedStatCard
        title="Trả hàng"
        value={returns ? formatCompactNumber(returns.totalReturns) : "0"}
        icon={RotateCcw}
        subtitle={returns ? `${returns.pendingReturns} đơn chờ • QC đạt: ${returns.qcPassRate % 1 === 0 ? returns.qcPassRate.toFixed(0) : returns.qcPassRate.toFixed(1)}%` : undefined}
        loading={loading}
        color="orange"
      />
      <EnhancedStatCard
        title="Hoàn tiền"
        value={refunds ? formatCurrency(refunds.totalRefundAmount) : "0đ"}
        icon={DollarSign}
        subtitle={refunds ? `${refunds.totalRefunds} giao dịch • Trung bình: ${formatCurrency(refunds.averageRefundAmount)}` : undefined}
        loading={loading}
        color="red"
      />
      <EnhancedStatCard
        title="Khuyến mãi"
        value={promotions ? `${promotions.activeVouchers + promotions.activeDiscounts}` : "0"}
        icon={Tag}
        subtitle={promotions ? `${promotions.totalVoucherUsed} lượt sử dụng voucher` : undefined}
        loading={loading}
        color="purple"
      />
      <EnhancedStatCard
        title="Tồn kho"
        value={inventory ? formatCompactNumber(inventory.totalVariants) : "0"}
        icon={AlertCircle}
        subtitle={inventory ? `${inventory.outOfStockVariants} hết • ${inventory.lowStockVariants} sắp hết` : undefined}
        loading={loading}
        color="indigo"
      />
    </div>
  );
}

// Import the missing icons
import { DollarSign, Tag } from "lucide-react";
