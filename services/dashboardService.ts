import { api } from "./api";
import { AxiosError } from "axios";
import type {
  QueryParams,
  DashboardStats,
  OverviewStats,
  RevenueStats,
  OrderStats,
  ProductStats,
  CustomerStats,
  InventoryStats,
  ReturnStats,
  RefundStats,
  CategoryStats,
  PromotionStats,
  PaymentMethodStats,
  OrdersTimeDistribution,
  RecentOrder,
  RecentReview,
  TopSellingProduct,
  LowStockProduct,
} from "@/types/dashboard";

const handleError = (err: unknown, msg: string) => {
  const error = err as AxiosError;
  console.error(`${msg}:`, error.response?.data || error.message);
  throw err;
};

export const dashboardService = {
  // Main endpoint - Get all stats in one call
  getFullStats: async (params: QueryParams = {}): Promise<DashboardStats> => {
    try {
      const { data } = await api.get<{ data: DashboardStats }>(
        "/admin/dashboard",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch dashboard stats");
    }
  },

  // Individual endpoints for lazy loading
  getOverview: async (params: QueryParams = {}): Promise<OverviewStats> => {
    try {
      const { data } = await api.get<{ data: OverviewStats }>(
        "/admin/dashboard/overview",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch overview stats");
    }
  },

  getRevenue: async (params: QueryParams = {}): Promise<RevenueStats> => {
    try {
      const { data } = await api.get<{ data: RevenueStats }>(
        "/admin/dashboard/revenue",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch revenue stats");
    }
  },

  getOrders: async (params: QueryParams = {}): Promise<OrderStats> => {
    try {
      const { data } = await api.get<{ data: OrderStats }>(
        "/admin/dashboard/orders",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch order stats");
    }
  },

  getProducts: async (params: QueryParams = {}): Promise<ProductStats> => {
    try {
      const { data } = await api.get<{ data: ProductStats }>(
        "/admin/dashboard/products",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch product stats");
    }
  },

  getTopSellingProducts: async (
    params: QueryParams = {}
  ): Promise<TopSellingProduct[]> => {
    try {
      const { data } = await api.get<{ data: TopSellingProduct[] }>(
        "/admin/dashboard/products/top-selling",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch top selling products");
    }
  },

  getLowStockProducts: async (
    params: QueryParams = {}
  ): Promise<LowStockProduct[]> => {
    try {
      const { data } = await api.get<{ data: LowStockProduct[] }>(
        "/admin/dashboard/products/low-stock",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch low stock products");
    }
  },

  getCustomers: async (params: QueryParams = {}): Promise<CustomerStats> => {
    try {
      const { data } = await api.get<{ data: CustomerStats }>(
        "/admin/dashboard/customers",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch customer stats");
    }
  },

  getInventory: async (params: QueryParams = {}): Promise<InventoryStats> => {
    try {
      const { data } = await api.get<{ data: InventoryStats }>(
        "/admin/dashboard/inventory",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch inventory stats");
    }
  },

  getReturns: async (params: QueryParams = {}): Promise<ReturnStats> => {
    try {
      const { data } = await api.get<{ data: ReturnStats }>(
        "/admin/dashboard/returns",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch return stats");
    }
  },

  getRefunds: async (params: QueryParams = {}): Promise<RefundStats> => {
    try {
      const { data } = await api.get<{ data: RefundStats }>(
        "/admin/dashboard/refunds",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch refund stats");
    }
  },

  getCategories: async (params: QueryParams = {}): Promise<CategoryStats> => {
    try {
      const { data } = await api.get<{ data: CategoryStats }>(
        "/admin/dashboard/categories",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch category stats");
    }
  },

  getPromotions: async (params: QueryParams = {}): Promise<PromotionStats> => {
    try {
      const { data } = await api.get<{ data: PromotionStats }>(
        "/admin/dashboard/promotions",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch promotion stats");
    }
  },

  getPaymentMethods: async (
    params: QueryParams = {}
  ): Promise<PaymentMethodStats[]> => {
    try {
      const { data } = await api.get<{ data: PaymentMethodStats[] }>(
        "/admin/dashboard/payment-methods",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch payment method stats");
    }
  },

  getOrdersTimeDistribution: async (
    params: QueryParams = {}
  ): Promise<OrdersTimeDistribution> => {
    try {
      const { data } = await api.get<{ data: OrdersTimeDistribution }>(
        "/admin/dashboard/orders-time-distribution",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch orders time distribution");
    }
  },

  getRecentOrders: async (
    params: QueryParams = {}
  ): Promise<RecentOrder[]> => {
    try {
      const { data } = await api.get<{ data: RecentOrder[] }>(
        "/admin/dashboard/recent-orders",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch recent orders");
    }
  },

  getRecentReviews: async (
    params: QueryParams = {}
  ): Promise<RecentReview[]> => {
    try {
      const { data } = await api.get<{ data: RecentReview[] }>(
        "/admin/dashboard/recent-reviews",
        { params }
      );
      return data.data;
    } catch (err) {
      return handleError(err, "Failed to fetch recent reviews");
    }
  },
};
