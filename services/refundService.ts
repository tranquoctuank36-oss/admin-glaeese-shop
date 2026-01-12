import { Refund } from "@/types/refund";
import { api } from "./api";

export interface GetRefundsParams {
  search?: string;
  orderId?: string;
  orderReturnId?: string;
  status?: string;
  statuses?: string[];
  trigger?: string;
  refundType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: string;
}

export interface GetRefundsResponse {
  success: boolean;
  message: string;
  data: Refund[];
  meta: {
    requestId: string;
    timestamptz: string;
    itemCount: number;
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export async function getRefunds(
  params: GetRefundsParams = {}
): Promise<GetRefundsResponse> {
  const response = await api.get("/admin/refunds", { params });
  return response.data;
}

export async function getRefundById(id: string): Promise<Refund> {
  const response = await api.get(`/admin/refunds/${id}`);
  return response.data.data;
}

export interface RefundActionPayload {
  note?: string;
  reason?: string;
  providerTransactionId?: string;
}

export interface CreateManualRefundPayload {
  orderId: string;
  amount: number;
  reason: string;
  trigger: string;
  orderReturnId?: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankName: string;
}

export async function createManualRefund(payload: CreateManualRefundPayload): Promise<any> {
  const response = await api.post("/admin/refunds/manual", payload);
  return response.data;
}

export async function approveRefund(id: string, payload: RefundActionPayload): Promise<any> {
  const response = await api.patch(`/admin/refunds/${id}/approve`, payload);
  return response.data;
}

export async function rejectRefund(id: string, payload: RefundActionPayload): Promise<any> {
  const response = await api.patch(`/admin/refunds/${id}/reject`, payload);
  return response.data;
}

export async function completeRefund(id: string, payload: RefundActionPayload): Promise<any> {
  const response = await api.patch(`/admin/refunds/${id}/complete`, payload);
  return response.data;
}

export async function cancelRefund(id: string, payload: RefundActionPayload): Promise<any> {
  const response = await api.patch(`/admin/refunds/${id}/cancel`, payload);
  return response.data;
}

export async function failRefund(id: string, payload: RefundActionPayload): Promise<any> {
  const response = await api.patch(`/admin/refunds/${id}/fail`, payload);
  return response.data;
}

export async function getRefundSummaryByOrderId(orderId: string): Promise<any> {
  const response = await api.get(`/admin/refunds/summary/${orderId}`);
  return response.data;
}

export interface RefundStatistics {
  total: number;
  pending: number;
  rejected: number;
  processing: number;
  success: number;
  failed: number;
  newRefunds: number;
  totalRefundAmount: string;
  averageRefundAmount: string;
  successRate: number;
  statusBreakdown: Array<{ status: string; count: number }>;
  triggerBreakdown: Array<{ trigger: string; count: number }>;
}

export async function getRefundStatistics(): Promise<RefundStatistics> {
  const response = await api.get("/admin/refunds/statistics");
  return response.data.data;
}
