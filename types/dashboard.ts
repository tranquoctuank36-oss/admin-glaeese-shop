// ==================== QUERY PARAMS ====================
export type StatsPeriod = "today" | "week" | "month" | "quarter" | "year" | "custom";
export type GroupBy = "day" | "week" | "month";

export interface QueryParams {
  period?: StatsPeriod;
  startDate?: string; // YYYY-MM-DD (khi period = custom)
  endDate?: string; // YYYY-MM-DD (khi period = custom)
  groupBy?: GroupBy; // Chỉ cho /revenue
  limit?: number; // Chỉ cho /products/*
}

// ==================== OVERVIEW ====================
export interface OverviewStats {
  totalRevenue: string; // VNĐ (BigInt string)
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  shippingOrders: number;
  averageOrderValue: string; // VNĐ
  conversionRate: number; // %
  revenueGrowth: number; // % so với kỳ trước
  ordersGrowth: number; // % so với kỳ trước
}

// ==================== REVENUE ====================
export interface RevenueByPeriod {
  label: string; // "2025-01-06" hoặc "W01" hoặc "01"
  revenue: string;
  orderCount: number;
  averageOrderValue: string;
}

export interface RevenueStats {
  todayRevenue: string;
  weekRevenue: string;
  monthRevenue: string;
  yearRevenue: string;
  monthOverMonthGrowth: number; // %
  yearOverYearGrowth: number; // %
  dayOverDayGrowth: number; // %
  revenueByPeriod: RevenueByPeriod[];
}

// ==================== ORDERS ====================
export interface OrdersByStatus {
  status: string; // 'pending' | 'processing' | 'shipping' | ...
  statusLabel: string; // 'Chờ xử lý' | 'Đang xử lý' | ...
  count: number;
  percentage: number;
}

export interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  shippingOrders: number;
  completionRate: number; // %
  cancellationRate: number; // %
  totalRevenue: string;
  ordersByStatus: OrdersByStatus[];
}

// ==================== PRODUCTS ====================
export interface TopSellingProduct {
  productId: string;
  productName: string;
  sku: string;
  totalSold: number;
  revenue: string;
  thumbnailUrl?: string;
  rank: number;
}

export interface LowStockProduct {
  variantId: string;
  variantName: string;
  sku: string;
  currentStock: number;
  safetyStock: number;
  alertType: "out_of_stock" | "low_stock";
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  totalVariants: number;
  topSellingProducts: TopSellingProduct[];
  lowStockAlerts: LowStockProduct[];
}

// ==================== CUSTOMERS ====================
export interface CustomerStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  newCustomersThisWeek: number;
  returningCustomers: number;
  returningCustomerRate: number; // %
  averageCustomerLifetimeValue: string;
  customerGrowth: number; // %
}

// ==================== INVENTORY ====================
export interface InventoryStats {
  totalVariants: number;
  inStockVariants: number;
  outOfStockVariants: number;
  lowStockVariants: number;
  totalInventoryValue: string;
  outOfStockRate: number; // %
}

// ==================== RETURNS ====================
export interface ReturnsByStatus {
  status: string;
  statusLabel: string;
  count: number;
  percentage: number;
}

export interface ReturnStats {
  totalReturns: number;
  pendingReturns: number;
  completedReturns: number;
  rejectedReturns: number;
  returnRate: number; // %
  qcPassRate: number; // %
  returnsByStatus: ReturnsByStatus[];
}

// ==================== REFUNDS ====================
export interface RefundStats {
  totalRefunds: number;
  successfulRefunds: number;
  pendingRefunds: number;
  rejectedRefunds: number;
  totalRefundAmount: string;
  averageRefundAmount: string;
  refundRateByRevenue: number; // %
}

// ==================== CATEGORIES (ProductType) ====================
export interface CategorySales {
  categoryId: string; // 'sunglasses' | 'frame'
  categoryName: string; // 'Kính mát' | 'Gọng kính'
  categorySlug: string;
  totalSold: number;
  revenue: string;
  revenuePercentage: number; // %
  orderCount: number;
}

export interface CategoryStats {
  topCategories: CategorySales[];
  totalCategories: number;
  activeCategories: number;
}

// ==================== PROMOTIONS ====================
export interface PromotionStats {
  activeVouchers: number;
  activeDiscounts: number;
  totalVoucherUsed: number;
  totalDiscountAmount: string;
}

// ==================== PAYMENT METHODS ====================
export interface PaymentMethodStats {
  paymentMethod: string; // 'cod' | 'vnpay'
  label: string; // 'Thanh toán khi nhận hàng' | 'VNPAY'
  orderCount: number;
  revenue: string;
  percentage: number; // %
}

// ==================== TIME DISTRIBUTION ====================
export interface OrdersByTime {
  hour: number; // 0-23
  orderCount: number;
  revenue: string;
}

export interface OrdersTimeDistribution {
  byHour: OrdersByTime[];
  peakHour: number;
  peakOrderCount: number;
}

// ==================== RECENT ACTIVITIES ====================
export interface RecentOrder {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail?: string;
  grandTotal: string;
  status: string;
  paymentMethod: string;
  itemCount: number;
  createdAt: string; // ISO date
}

export interface RecentReview {
  id: string;
  productName: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  status: string;
  createdAt: string;
}

// ==================== FULL DASHBOARD ====================
export interface DashboardStats {
  overview: OverviewStats;
  revenue: RevenueStats;
  orders: OrderStats;
  products: ProductStats;
  customers: CustomerStats;
  inventory: InventoryStats;
  returns: ReturnStats;
  refunds: RefundStats;
  categories: CategoryStats;
  promotions: PromotionStats;
  paymentMethods: PaymentMethodStats[];
  recentOrders: RecentOrder[];
  recentReviews: RecentReview[];
}
