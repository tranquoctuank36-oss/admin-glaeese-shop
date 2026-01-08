import type { VoucherFilters, PaginatedVouchersResponse, Voucher, VoucherStatisticsResponse } from "@/types/voucher";
import { api } from "./api";

export async function getVouchers(
  filters: VoucherFilters = {}
): Promise<PaginatedVouchersResponse> {
  const {
    search,
    page = 1,
    limit = 20,
    sortField = "createdAt",
    sortOrder = "DESC",
    type,
    status,
    validFrom,
    validTo,
    isDeleted,
  } = filters;

  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  queryParams.append("sortField", sortField);
  queryParams.append("sortOrder", sortOrder);
  if (type) queryParams.append("type", type);
  if (validFrom) queryParams.append("validFrom", validFrom);
  if (validTo) queryParams.append("validTo", validTo);
  if (isDeleted !== undefined) queryParams.append("isDeleted", isDeleted.toString());
  if (status) {
    queryParams.append("status", status);
  }

  const response = await api.get<PaginatedVouchersResponse>(
    `/admin/vouchers?${queryParams.toString()}`
  );
  return response.data;
}

export async function getVoucherById(id: string): Promise<Voucher> {
  const response = await api.get<{ data: Voucher }>(
    `/admin/vouchers/${id}`
  );
  return response.data.data;
}

export async function createVoucher(data: Partial<Voucher>): Promise<Voucher> {
  const response = await api.post<{ data: Voucher }>(
    "/admin/vouchers",
    data
  );
  return response.data.data;
}

export async function updateVoucher(
  id: string,
  data: Partial<Voucher>
): Promise<Voucher> {
  const response = await api.patch<{ data: Voucher }>(
    `/admin/vouchers/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteVoucher(id: string): Promise<void> {
  await api.delete(`/admin/vouchers/${id}`);
}

export async function cancelVoucher(id: string): Promise<Voucher> {
  const response = await api.patch<{ data: Voucher }>(
    `/admin/vouchers/${id}/cancel`
  );
  return response.data.data;
}

export async function restoreVoucher(id: string): Promise<Voucher> {
  const response = await api.patch<{ data: Voucher }>(
    `/admin/vouchers/${id}/restore`
  );
  return response.data.data;
}

export async function forceDeleteVoucher(id: string): Promise<void> {
  await api.delete(`/admin/vouchers/${id}/force`);
}

export async function getVoucherStatistics(): Promise<VoucherStatisticsResponse> {
  try {
    const response = await api.get<VoucherStatisticsResponse>(
      "/admin/vouchers/stats"
    );
    return response.data;
  } catch (err) {
    console.error("Failed to fetch voucher statistics:", err);
    throw err;
  }
}