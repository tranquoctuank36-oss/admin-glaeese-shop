import { Return } from "@/types/return";
import { api } from "./api";

export interface GetReturnsParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
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
  refundAmount?: string
): Promise<Return> {
  const response = await api.patch(`/admin/returns/${id}`, { 
    status, 
    adminNote, 
    rejectedReason,
    refundAmount 
  });
  return response.data.data;
}

export async function completeRefundForCOD(id: string): Promise<Return> {
  const response = await api.patch(`/admin/returns/${id}/complete-refund`);
  return response.data.data;
}
