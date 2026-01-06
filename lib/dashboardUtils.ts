// Format VNĐ currency
export function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const formatted = new Intl.NumberFormat("en-US").format(num);
  return `${formatted}đ`;
}

// Format percentage with trend
export function formatGrowth(value: number): {
  text: string;
  type: "increase" | "decrease" | "neutral";
} {
  const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  if (value > 0) return { text: `+${formatted}%`, type: "increase" };
  if (value < 0) return { text: `${formatted}%`, type: "decrease" };
  return { text: "0%", type: "neutral" };
}

// Format compact number
export function formatCompactNumber(value: number): string {
  const formatNumber = (num: number) => num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);
  if (value >= 1_000_000_000) return `${formatNumber(value / 1_000_000_000)}B`;
  if (value >= 1_000_000) return `${formatNumber(value / 1_000_000)}M`;
  if (value >= 1_000) return `${formatNumber(value / 1_000)}K`;
  return value.toString();
}

// Format percentage display
export function formatPercentage(value: number, decimals: number = 1): string {
  const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(decimals);
  return `${formatted}%`;
}

// Chart colors
export const CHART_COLORS = {
  primary: "#3B82F6", // Blue
  success: "#10B981", // Green
  warning: "#F59E0B", // Yellow
  danger: "#EF4444", // Red
  info: "#6366F1", // Indigo
  purple: "#8B5CF6", // Purple
  pink: "#EC4899", // Pink
  gray: "#6B7280", // Gray
} as const;

// Order status colors
export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  processing: "#3B82F6",
  shipping: "#6366F1",
  delivered: "#10B981",
  completed: "#059669",
  cancelled: "#EF4444",
  expired: "#9CA3AF",
  returned: "#EC4899",
};

// Stock alert colors
export const STOCK_ALERT_COLORS = {
  out_of_stock: "#EF4444",
  low_stock: "#F59E0B",
};

// Grid layout responsive classes
export const GRID_LAYOUTS = {
  overviewCards: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
  twoColumns: "grid grid-cols-1 lg:grid-cols-2 gap-6",
  threeColumns: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  fourColumns: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
};
