import { Return } from "@/types/return";
import { api } from "./api";

export interface GetReturnsParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  statuses?: string[];
  preset?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: string;
}

export interface GetReturnsResponse {
  success: boolean;
  message: string;
  data: Return[];
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

export async function getReturns(
  params: GetReturnsParams
): Promise<GetReturnsResponse> {
  const response = await api.get("/admin/returns", { params });
  return response.data;
}

export async function getReturnById(id: string): Promise<Return> {
  const response = await api.get(`/admin/returns/${id}`);
  return response.data.data;
}

export async function updateReturnStatus(
  id: string,
  status: string,
  adminNote?: string,
  rejectedReason?: string,
  refundAmount?: string,
  shouldRefund?: boolean
): Promise<Return> {
  const response = await api.patch(`/admin/returns/${id}`, { 
    status, 
    adminNote, 
    rejectedReason,
    refundAmount,
    shouldRefund
  });
  return response.data.data;
}

export async function completeRefund(id: string): Promise<Return> {
  const response = await api.patch(`/admin/returns/${id}/complete`);
  return response.data.data;
}

export async function performQualityCheck(
  id: string,
  result: 'pass' | 'fail',
  qcNote?: string,
  shouldRefund?: boolean,
  refundAmount?: string
): Promise<Return> {
  const response = await api.post(`/admin/returns/${id}/qc`, { 
    result, 
    qcNote,
    shouldRefund,
    refundAmount
  });
  return response.data.data;
}

export async function updateShouldRefund(
  id: string,
  shouldRefund: boolean,
  refundAmount?: string,
  reason?: string
): Promise<Return> {
  const response = await api.patch(`/admin/returns/${id}/should-refund`, { 
    shouldRefund,
    refundAmount,
    reason
  });
  return response.data.data;
}

export async function getReturnStatistics() {
  try {
    const res = await api.get("/admin/returns/statistics");
    return res.data ?? {};
  } catch (err) {
    console.error("Failed to fetch return statistics:", err);
    return {};
  }
}
