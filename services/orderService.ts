import { Order } from "@/types/order";
import { api } from "./api";

export interface GetOrdersParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  minGrandTotal?: string;
  maxGrandTotal?: string;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface GetOrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
  meta: {
    requestId: string;
    timestamptz: string;
    itemCount: number;
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
  hasNext?: boolean;
  hasPrev?: boolean;
}

export async function getOrders(
  params: GetOrdersParams
): Promise<GetOrdersResponse> {
  const response = await api.get("/admin/orders", { params });
  return response.data;
}

export async function getOrderById(id: string): Promise<Order> {
  const response = await api.get(`/admin/orders/${id}`);
  return response.data.data;
}

export async function confirmOrder(id: string): Promise<Order> {
  const response = await api.patch(`/admin/orders/${id}/confirm`);
  return response.data.data;
}

export async function cancelOrder(
  id: string,
  reason: string
): Promise<Order> {
  const response = await api.patch(`/admin/orders/${id}/cancel`, { reason });
  return response.data.data;
}

export async function updateOrder(
  id: string,
  data: {
    recipientName?: string;
    recipientPhone?: string;
    addressLine?: string;
    adminNote?: string;
  }
): Promise<Order> {
  const response = await api.patch(`/admin/orders/${id}`, data);
  return response.data.data;
}

export interface GetPackingOrdersParams {
  search?: string;
  page?: number;
  limit?: number;
  isPrinted?: boolean;
  hasTrackingCode?: boolean;
  sortField?: string;
  sortOrder?: "ASC" | "DESC";
}

export async function getPackingOrders(
  params: GetPackingOrdersParams
): Promise<GetOrdersResponse> {
  const response = await api.get("/admin/orders/packing-queue", { params });
  return response.data;
}

export interface BulkConfirmOrdersParams {
  orderIds: string[];
}

export interface BulkConfirmOrdersResponse {
  success: string[];
  failed: Array<{
    id: string;
    reason: string;
  }>;
}

export async function bulkConfirmOrders(
  params: BulkConfirmOrdersParams
): Promise<BulkConfirmOrdersResponse> {
  const response = await api.patch("/admin/orders/bulk-confirm", params);
  return response.data;
}

export interface OrderStatistics {
  total: number;
  awaitingPayment: number;
  pending: number;
  processing: number;
  shipping: number;
  delivered: number;
  completed: number;
  cancelledOrReturned: number;
}

export interface GetOrderStatisticsParams {
  preset?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetOrderStatisticsResponse {
  success: boolean;
  message: string;
  data: OrderStatistics;
}

export async function getOrderStatistics(
  params?: GetOrderStatisticsParams
): Promise<GetOrderStatisticsResponse> {
  const response = await api.get("/admin/orders/statistics", { params });
  return response.data;
}
