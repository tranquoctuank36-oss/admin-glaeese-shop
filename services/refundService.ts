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
