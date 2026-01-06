# Dashboard API Endpoints - Quick Reference

## Base URL
```
https://backend.kltn.lol/api/v1/admin/dashboard
```

## Authentication
All endpoints require JWT token with ADMIN role:
```typescript
headers: {
  'Authorization': 'Bearer <your-jwt-token>'
}
```

## Endpoints

### 1. Get Full Dashboard Stats (Recommended)
```http
GET /admin/dashboard?period=month
```

**Response:**
```typescript
{
  data: DashboardStats {
    overview: {...},
    revenue: {...},
    orders: {...},
    products: {...},
    customers: {...},
    inventory: {...},
    returns: {...},
    refunds: {...},
    categories: {...},
    promotions: {...},
    paymentMethods: [...],
    recentOrders: [...],
    recentReviews: [...]
  }
}
```

### 2. Overview Stats
```http
GET /admin/dashboard/overview?period=month
```

**Response:**
```json
{
  "data": {
    "totalRevenue": "12450000",
    "totalOrders": 145,
    "totalCustomers": 89,
    "totalProducts": 234,
    "pendingOrders": 12,
    "shippingOrders": 8,
    "averageOrderValue": "85862",
    "conversionRate": 3.5,
    "revenueGrowth": 15.5,
    "ordersGrowth": 12.3
  }
}
```

### 3. Revenue Stats
```http
GET /admin/dashboard/revenue?period=month&groupBy=day
```

**Response:**
```json
{
  "data": {
    "todayRevenue": "450000",
    "weekRevenue": "3200000",
    "monthRevenue": "12450000",
    "yearRevenue": "145000000",
    "monthOverMonthGrowth": 15.5,
    "yearOverYearGrowth": 25.3,
    "dayOverDayGrowth": 8.2,
    "revenueByPeriod": [
      {
        "label": "2025-01-01",
        "revenue": "450000",
        "orderCount": 12,
        "averageOrderValue": "37500"
      }
    ]
  }
}
```

### 4. Order Stats
```http
GET /admin/dashboard/orders?period=month
```

**Response:**
```json
{
  "data": {
    "totalOrders": 145,
    "completedOrders": 120,
    "cancelledOrders": 5,
    "pendingOrders": 12,
    "shippingOrders": 8,
    "completionRate": 82.8,
    "cancellationRate": 3.4,
    "totalRevenue": "12450000",
    "ordersByStatus": [
      {
        "status": "pending",
        "statusLabel": "Chờ xử lý",
        "count": 12,
        "percentage": 8.3
      }
    ]
  }
}
```

### 5. Product Stats
```http
GET /admin/dashboard/products?period=month&limit=10
```

**Response:**
```json
{
  "data": {
    "totalProducts": 234,
    "activeProducts": 220,
    "outOfStockProducts": 8,
    "lowStockProducts": 15,
    "totalVariants": 456,
    "topSellingProducts": [
      {
        "productId": "uuid",
        "productName": "Kính mát Ray-Ban",
        "sku": "RB-001",
        "totalSold": 45,
        "revenue": "22500000",
        "thumbnailUrl": "https://...",
        "rank": 1
      }
    ],
    "lowStockAlerts": [
      {
        "variantId": "uuid",
        "variantName": "Kính mát - Đen - M",
        "sku": "RB-001-BLK-M",
        "currentStock": 2,
        "safetyStock": 10,
        "alertType": "low_stock"
      }
    ]
  }
}
```

### 6. Customer Stats
```http
GET /admin/dashboard/customers?period=month
```

**Response:**
```json
{
  "data": {
    "totalCustomers": 89,
    "newCustomersThisMonth": 15,
    "newCustomersThisWeek": 5,
    "returningCustomers": 34,
    "returningCustomerRate": 38.2,
    "averageCustomerLifetimeValue": "1250000",
    "customerGrowth": 25.0
  }
}
```

### 7. Inventory Stats
```http
GET /admin/dashboard/inventory?period=month
```

**Response:**
```json
{
  "data": {
    "totalVariants": 456,
    "inStockVariants": 433,
    "outOfStockVariants": 8,
    "lowStockVariants": 15,
    "totalInventoryValue": "245000000",
    "outOfStockRate": 1.8
  }
}
```

### 8. Returns Stats
```http
GET /admin/dashboard/returns?period=month
```

**Response:**
```json
{
  "data": {
    "totalReturns": 12,
    "pendingReturns": 3,
    "completedReturns": 8,
    "rejectedReturns": 1,
    "returnRate": 8.3,
    "qcPassRate": 66.7,
    "returnsByStatus": [
      {
        "status": "pending",
        "statusLabel": "Chờ xử lý",
        "count": 3,
        "percentage": 25.0
      }
    ]
  }
}
```

### 9. Refunds Stats
```http
GET /admin/dashboard/refunds?period=month
```

**Response:**
```json
{
  "data": {
    "totalRefunds": 8,
    "successfulRefunds": 7,
    "pendingRefunds": 1,
    "rejectedRefunds": 0,
    "totalRefundAmount": "4500000",
    "averageRefundAmount": "562500",
    "refundRateByRevenue": 3.6
  }
}
```

### 10. Category Stats
```http
GET /admin/dashboard/categories?period=month
```

**Response:**
```json
{
  "data": {
    "topCategories": [
      {
        "categoryId": "sunglasses",
        "categoryName": "Kính mát",
        "categorySlug": "kinh-mat",
        "totalSold": 85,
        "revenue": "8500000",
        "revenuePercentage": 68.3,
        "orderCount": 72
      }
    ],
    "totalCategories": 2,
    "activeCategories": 2
  }
}
```

### 11. Promotion Stats
```http
GET /admin/dashboard/promotions?period=month
```

**Response:**
```json
{
  "data": {
    "activeVouchers": 5,
    "activeDiscounts": 3,
    "totalVoucherUsed": 45,
    "totalDiscountAmount": "2250000"
  }
}
```

### 12. Payment Method Stats
```http
GET /admin/dashboard/payment-methods?period=month
```

**Response:**
```json
{
  "data": [
    {
      "paymentMethod": "cod",
      "label": "Thanh toán khi nhận hàng",
      "orderCount": 85,
      "revenue": "7650000",
      "percentage": 61.4
    },
    {
      "paymentMethod": "vnpay",
      "label": "VNPAY",
      "orderCount": 60,
      "revenue": "4800000",
      "percentage": 38.6
    }
  ]
}
```

### 13. Orders Time Distribution
```http
GET /admin/dashboard/orders-time-distribution?period=month
```

**Response:**
```json
{
  "data": {
    "byHour": [
      {
        "hour": 9,
        "orderCount": 15,
        "revenue": "1350000"
      }
    ],
    "peakHour": 14,
    "peakOrderCount": 25
  }
}
```

### 14. Recent Orders
```http
GET /admin/dashboard/recent-orders?limit=10
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "orderCode": "ORD-2025-001",
      "customerName": "Nguyễn Văn A",
      "customerEmail": "nguyenvana@email.com",
      "grandTotal": "850000",
      "status": "pending",
      "paymentMethod": "cod",
      "itemCount": 2,
      "createdAt": "2025-01-07T10:30:00Z"
    }
  ]
}
```

### 15. Recent Reviews
```http
GET /admin/dashboard/recent-reviews?limit=10
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "productName": "Kính mát Ray-Ban",
      "customerName": "Nguyễn Văn A",
      "rating": 5,
      "comment": "Sản phẩm rất đẹp và chất lượng",
      "status": "approved",
      "createdAt": "2025-01-07T10:30:00Z"
    }
  ]
}
```

## Query Parameters

### Common Parameters
```typescript
period?: "today" | "week" | "month" | "quarter" | "year" | "custom"
startDate?: string  // YYYY-MM-DD (required when period=custom)
endDate?: string    // YYYY-MM-DD (required when period=custom)
```

### Revenue Specific
```typescript
groupBy?: "day" | "week" | "month"  // Default: day
```

### Product Specific
```typescript
limit?: number  // Default: 10
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions. Admin role required."
}
```

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid period value"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Notes

1. **Timezone**: All datetime values are in UTC. Frontend should convert to `Asia/Ho_Chi_Minh` timezone.

2. **Currency**: All monetary values are returned as strings (BigInt) to prevent precision loss. Parse to number for calculations.

3. **Caching**: Consider implementing client-side caching with React Query or SWR for better performance.

4. **Rate Limiting**: API may have rate limits. Implement exponential backoff for retries.

5. **Auto-refresh**: Recommended refresh interval is 5 minutes to balance freshness and server load.

## Testing with cURL

```bash
# Get full dashboard stats
curl -X GET "https://backend.kltn.lol/api/v1/admin/dashboard?period=month" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get overview only
curl -X GET "https://backend.kltn.lol/api/v1/admin/dashboard/overview?period=week" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get revenue with grouping
curl -X GET "https://backend.kltn.lol/api/v1/admin/dashboard/revenue?period=month&groupBy=day" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get recent orders with limit
curl -X GET "https://backend.kltn.lol/api/v1/admin/dashboard/recent-orders?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Frontend Integration Example

```typescript
// Fetch dashboard data
const fetchDashboard = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      'https://backend.kltn.lol/api/v1/admin/dashboard?period=month',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch dashboard');
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Dashboard error:', error);
    throw error;
  }
};
```
