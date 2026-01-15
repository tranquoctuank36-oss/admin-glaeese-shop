"use client";

import { useState, useEffect } from "react";
import { withAuthCheck } from "@/components/hoc/withAuthCheck";
import type { StatsPeriod, DashboardStats } from "@/types/dashboard";
import { dashboardService } from "@/services/dashboardService";
import { GRID_LAYOUTS } from "@/lib/dashboardUtils";

// Components
import PeriodSelector from "@/components/dashboard/PeriodSelector";
import OverviewCards from "@/components/dashboard/cards/OverviewCards";
import AdditionalStatsCards from "@/components/dashboard/cards/AdditionalStatsCards";
import RevenueLineChart from "@/components/dashboard/charts/RevenueLineChart";
import OrdersPieChart from "@/components/dashboard/charts/OrdersPieChart";
import CategoryDonutChart from "@/components/dashboard/charts/CategoryDonutChart";
import PaymentMethodsBar from "@/components/dashboard/charts/PaymentMethodsBar";
import TopProductsTable from "@/components/dashboard/tables/TopProductsTable";
import LowStockTable from "@/components/dashboard/tables/LowStockTable";
import RecentOrdersList from "@/components/dashboard/lists/RecentOrdersList";
import RecentReviewsList from "@/components/dashboard/lists/RecentReviewsList";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import DashboardError from "@/components/dashboard/DashboardError";

const OverviewPage = () => {
  const [period, setPeriod] = useState<StatsPeriod>("month");
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getFullStats({ period });
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [period]);

  if (error) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
          <DashboardError error={error} refetch={fetchDashboardData} />
        </main>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex-1 overflow-auto relative z-10">
        <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
            <p className="text-sm text-gray-500 mt-1">
              Tổng quan về hoạt động kinh doanh
            </p>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>

        {/* Overview Cards */}
        <OverviewCards data={data?.overview || null} loading={loading} />

        {/* Additional Stats Cards */}
        <AdditionalStatsCards
          returns={data?.returns || null}
          refunds={data?.refunds || null}
          promotions={data?.promotions || null}
          inventory={data?.inventory || null}
          loading={loading}
        />

        {/* Charts Row 1 */}
        <div className={GRID_LAYOUTS.twoColumns}>
          <RevenueLineChart
            data={data?.revenue.revenueByPeriod || []}
            loading={loading}
          />
          <OrdersPieChart
            data={data?.orders.ordersByStatus || []}
            loading={loading}
          />
        </div>

        {/* Charts Row 2 */}
        <div className={GRID_LAYOUTS.twoColumns}>
          <CategoryDonutChart
            data={data?.categories.topCategories || []}
            loading={loading}
          />
          <PaymentMethodsBar
            data={data?.paymentMethods || []}
            loading={loading}
          />
        </div>

        {/* Tables */}
        <div className={GRID_LAYOUTS.twoColumns}>
          <TopProductsTable
            data={data?.products.topSellingProducts || []}
            loading={loading}
          />
          <LowStockTable
            data={data?.products.lowStockAlerts || []}
            loading={loading}
          />
        </div>

        {/* Recent Activities */}
        <div className={GRID_LAYOUTS.twoColumns}>
          <RecentOrdersList
            data={data?.recentOrders || []}
            loading={loading}
          />
          <RecentReviewsList
            data={data?.recentReviews || []}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
};

export default withAuthCheck(OverviewPage);
