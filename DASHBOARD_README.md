# Admin Dashboard - Documentation

## 📋 Tổng quan

Dashboard Admin cho hệ thống E-commerce bán kính mắt đã được triển khai đầy đủ với Next.js 14+, TypeScript, TailwindCSS và Recharts.

## 🎯 Chức năng đã triển khai

### 1. **Period Selector**
- ✅ Chọn khoảng thời gian: Hôm nay, Tuần, Tháng, Quý, Năm
- ✅ UI dạng tabs với highlight cho lựa chọn hiện tại

### 2. **Overview Cards (4 cards)**
- ✅ Tổng doanh thu (với growth indicator)
- ✅ Tổng đơn hàng (hiển thị pending + shipping)
- ✅ Khách hàng (với conversion rate)
- ✅ Sản phẩm

### 3. **Charts**

#### Revenue Line Chart
- ✅ Biểu đồ đường hiển thị doanh thu theo thời gian
- ✅ Hiển thị số lượng đơn hàng
- ✅ Tooltip với định dạng VNĐ

#### Orders Pie Chart
- ✅ Biểu đồ tròn phân bố đơn hàng theo trạng thái
- ✅ Màu sắc phân biệt cho từng trạng thái
- ✅ Hiển thị phần trăm

#### Category Donut Chart
- ✅ Biểu đồ donut cho loại sản phẩm
- ✅ Hiển thị doanh thu và phần trăm
- ✅ Màu sắc gradient đẹp mắt

#### Payment Methods Bar
- ✅ Biểu đồ cột so sánh doanh thu theo phương thức thanh toán
- ✅ Hiển thị cả doanh thu và số đơn

### 4. **Tables**

#### Top Products Table
- ✅ Bảng top sản phẩm bán chạy
- ✅ Rank với icon medal cho top 3
- ✅ Hiển thị thumbnail, tên, SKU
- ✅ Số lượng đã bán và doanh thu

#### Low Stock Table
- ✅ Bảng cảnh báo tồn kho
- ✅ Badge màu cho trạng thái (hết hàng/sắp hết)
- ✅ So sánh với mức an toàn

### 5. **Recent Activities**

#### Recent Orders List
- ✅ Danh sách đơn hàng gần đây
- ✅ Badge trạng thái với màu sắc
- ✅ Hiển thị thời gian relative (VD: "2 phút trước")
- ✅ Thông tin khách hàng, số sản phẩm, phương thức thanh toán

#### Recent Reviews List
- ✅ Danh sách đánh giá gần đây
- ✅ Rating stars với màu vàng
- ✅ Trạng thái duyệt (pending/approved/rejected)
- ✅ Truncate comment dài

### 6. **Additional Stats Cards (4 cards)**
- ✅ Trả hàng (returns stats)
- ✅ Hoàn tiền (refunds stats)
- ✅ Khuyến mãi (promotions stats)
- ✅ Tồn kho (inventory stats)

### 7. **Loading & Error States**
- ✅ Skeleton loading cho toàn bộ dashboard
- ✅ Skeleton riêng cho từng component
- ✅ Error boundary với nút "Thử lại"
- ✅ Loading state khi đang fetch data

### 8. **Auto-refresh**
- ✅ Tự động refresh data mỗi 5 phút
- ✅ Cleanup interval khi unmount

## 📁 Cấu trúc File

```
types/
  └── dashboard.ts                    # TypeScript interfaces

services/
  └── dashboardService.ts            # API service layer

lib/
  └── dashboardUtils.ts              # Format utilities & constants

components/
  └── dashboard/
      ├── PeriodSelector.tsx         # Period selection tabs
      ├── DashboardSkeleton.tsx      # Loading skeleton
      ├── DashboardError.tsx         # Error state
      ├── cards/
      │   ├── EnhancedStatCard.tsx   # Base stat card component
      │   ├── OverviewCards.tsx      # 4 overview cards
      │   └── AdditionalStatsCards.tsx # 4 additional cards
      ├── charts/
      │   ├── RevenueLineChart.tsx   # Line chart
      │   ├── OrdersPieChart.tsx     # Pie chart
      │   ├── CategoryDonutChart.tsx # Donut chart
      │   └── PaymentMethodsBar.tsx  # Bar chart
      ├── tables/
      │   ├── TopProductsTable.tsx   # Top products table
      │   └── LowStockTable.tsx      # Low stock alerts
      └── lists/
          ├── RecentOrdersList.tsx   # Recent orders list
          └── RecentReviewsList.tsx  # Recent reviews list

app/
  └── overview/
      └── page.tsx                   # Main dashboard page
```

## 🎨 Design Features

### Color Scheme
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Yellow/Orange (#F59E0B)
- **Danger**: Red (#EF4444)
- **Info**: Indigo (#6366F1)
- **Purple**: (#8B5CF6)

### Order Status Colors
```typescript
pending: Yellow
processing: Blue
shipping: Indigo
delivered/completed: Green
cancelled: Red
returned: Pink
```

### Responsive Design
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 4 columns cho cards, 2 columns cho charts/tables

### Animations
- ✅ Fade in animation với motion/react
- ✅ Hover effects trên cards
- ✅ Smooth transitions
- ✅ Pulse animation cho skeleton loading

## 🔧 Utility Functions

### Format Functions
```typescript
formatCurrency(value)        // Format to VNĐ currency
formatGrowth(value)          // Format growth with +/- indicator
formatCompactNumber(value)   // Format to K/M/B
formatPercentage(value)      // Format to percentage
```

### Constants
```typescript
CHART_COLORS                 // Color palette for charts
ORDER_STATUS_COLORS          // Status-specific colors
STOCK_ALERT_COLORS           // Alert-specific colors
GRID_LAYOUTS                 // Responsive grid classes
```

## 📊 API Integration

### Main Endpoint
```typescript
GET /admin/dashboard?period=month
```

### Query Parameters
```typescript
interface QueryParams {
  period?: "today" | "week" | "month" | "quarter" | "year" | "custom";
  startDate?: string;  // YYYY-MM-DD (for custom period)
  endDate?: string;    // YYYY-MM-DD (for custom period)
  groupBy?: "day" | "week" | "month";
  limit?: number;
}
```

### Service Methods
```typescript
dashboardService.getFullStats(params)           // Get all stats
dashboardService.getOverview(params)            // Get overview only
dashboardService.getRevenue(params)             // Get revenue stats
dashboardService.getOrders(params)              // Get order stats
dashboardService.getProducts(params)            // Get product stats
dashboardService.getCustomers(params)           // Get customer stats
dashboardService.getInventory(params)           // Get inventory stats
dashboardService.getReturns(params)             // Get returns stats
dashboardService.getRefunds(params)             // Get refunds stats
dashboardService.getCategories(params)          // Get category stats
dashboardService.getPromotions(params)          // Get promotion stats
dashboardService.getPaymentMethods(params)      // Get payment stats
dashboardService.getRecentOrders(params)        // Get recent orders
dashboardService.getRecentReviews(params)       // Get recent reviews
```

## 🚀 Usage

### Basic Usage
```tsx
import { useState, useEffect } from "react";
import { dashboardService } from "@/services/dashboardService";
import type { StatsPeriod, DashboardStats } from "@/types/dashboard";

const [period, setPeriod] = useState<StatsPeriod>("month");
const [data, setData] = useState<DashboardStats | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    const result = await dashboardService.getFullStats({ period });
    setData(result);
    setLoading(false);
  };
  fetchData();
}, [period]);
```

## 📝 Type Definitions

### Key Types
```typescript
StatsPeriod = "today" | "week" | "month" | "quarter" | "year" | "custom"

DashboardStats {
  overview: OverviewStats
  revenue: RevenueStats
  orders: OrderStats
  products: ProductStats
  customers: CustomerStats
  inventory: InventoryStats
  returns: ReturnStats
  refunds: RefundStats
  categories: CategoryStats
  promotions: PromotionStats
  paymentMethods: PaymentMethodStats[]
  recentOrders: RecentOrder[]
  recentReviews: RecentReview[]
}
```

## ⚡ Performance Optimizations

1. **Auto-refresh**: Data auto-refresh mỗi 5 phút
2. **Loading states**: Skeleton loading cho UX mượt mà
3. **Error handling**: Error boundary với retry mechanism
4. **Responsive**: Mobile-first design
5. **Code splitting**: Components được tách riêng
6. **Memoization**: Có thể thêm useMemo cho chart data

## 🎯 Next Steps (Optional)

- [ ] React Query integration cho caching
- [ ] Export to PDF functionality
- [ ] Custom date range picker
- [ ] Drill-down functionality
- [ ] Real-time updates với WebSocket
- [ ] Dark mode support
- [ ] Print-friendly layout
- [ ] Dashboard customization (drag & drop widgets)

## 🐛 Troubleshooting

### Common Issues

1. **API không trả về data**: Kiểm tra endpoint và authentication token
2. **Charts không hiển thị**: Đảm bảo data có đúng format và không null
3. **Format currency sai**: Kiểm tra locale và currency code
4. **Timezone issues**: Convert UTC sang Asia/Ho_Chi_Minh

### Debug Tips
```typescript
// Enable console logs in dashboardService.ts
console.log("Dashboard data:", data);
console.log("Period:", period);
```

## 📚 Dependencies

All required dependencies are already installed:
- ✅ recharts (3.3.0) - Charting library
- ✅ dayjs (1.11.19) - Date formatting with timezone
- ✅ lucide-react (0.546.0) - Icons
- ✅ motion (12.23.24) - Animations
- ✅ axios (1.12.2) - HTTP client

## 🎉 Summary

Dashboard Admin đã được triển khai đầy đủ với:
- ✅ 6 rows layout như thiết kế
- ✅ Period selector với 5 options
- ✅ 8 stat cards với growth indicators
- ✅ 4 charts (Line, Pie, Donut, Bar)
- ✅ 2 tables (Top Products, Low Stock)
- ✅ 2 lists (Recent Orders, Recent Reviews)
- ✅ Loading & Error states
- ✅ Auto-refresh functionality
- ✅ Responsive design
- ✅ TypeScript type-safe
- ✅ Clean code structure

Ready to integrate with backend API! 🚀
