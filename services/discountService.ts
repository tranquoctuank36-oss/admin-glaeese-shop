import type { DiscountFilters, PaginatedDiscountsResponse, Discount, DiscountStatisticsResponse } from "@/types/discount";
import { api } from "./api";

export async function getDiscounts(
  filters: DiscountFilters = {}
): Promise<PaginatedDiscountsResponse> {
  const {
    search,
    page = 1,
    limit = 20,
    sortField = "createdAt",
    sortOrder = "DESC",
    type,
    status,
    startDate,
    endDate,
    isDeleted,
  } = filters;

  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  queryParams.append("sortField", sortField);
  queryParams.append("sortOrder", sortOrder);
  if (type) queryParams.append("type", type);
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  if (isDeleted !== undefined) queryParams.append("isDeleted", isDeleted.toString());
  if (status) {
    queryParams.append("status", status);
  }

  const response = await api.get<PaginatedDiscountsResponse>(
    `/admin/discounts?${queryParams.toString()}`
  );
  return response.data;
}

export async function getDiscountById(id: string): Promise<Discount> {
  const response = await api.get<{ data: Discount }>(
    `/admin/discounts/${id}`
  );
  return response.data.data;
}

export async function createDiscount(data: Partial<Discount>): Promise<Discount> {
  const response = await api.post<{ data: Discount }>(
    "/admin/discounts",
    data
  );
  return response.data.data;
}

export async function updateDiscount(
  id: string,
  data: Partial<Discount>
): Promise<Discount> {
  const response = await api.patch<{ data: Discount }>(
    `/admin/discounts/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteDiscount(id: string): Promise<void> {
  await api.delete(`/admin/discounts/${id}`);
}

export async function cancelDiscount(id: string): Promise<Discount> {
  const response = await api.patch<{ data: Discount }>(
    `/admin/discounts/${id}/cancel`
  );
  return response.data.data;
}

export async function scheduleDiscount(
  id: string,
  data: { startAt: string; endAt: string }
): Promise<Discount> {
  const response = await api.patch<{ data: Discount }>(
    `/admin/discounts/${id}/schedule`,
    data
  );
  return response.data.data;
}

export async function unscheduleDiscount(id: string): Promise<Discount> {
  const response = await api.patch<{ data: Discount }>(
    `/admin/discounts/${id}/unschedule`
  );
  return response.data.data;
}

export async function restoreDiscount(id: string): Promise<Discount> {
  const response = await api.patch<{ data: Discount }>(
    `/admin/discounts/${id}/restore`
  );
  return response.data.data;
}

export async function forceDeleteDiscount(id: string): Promise<void> {
  await api.delete(`/admin/discounts/${id}/force`);
}

export async function addDiscountTargets(
  id: string,
  targetIds: string[]
): Promise<void> {
  await api.put(`/admin/discounts/${id}/targets`, { targetIds });
}

export async function getDiscountTargets(
  id: string,
  filters: {
    page?: number;
    limit?: number;
    search?: string;
    sortField?: string;
    sortOrder?: "ASC" | "DESC";
    productType?: string;
    brandId?: string;
    gender?: string;
  } = {}
): Promise<any> {
  const {
    page = 1,
    limit = 20,
    search,
    sortField = "createdAt",
    sortOrder = "DESC",
    productType,
    brandId,
    gender,
  } = filters;

  const queryParams = new URLSearchParams();
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  queryParams.append("sortField", sortField);
  queryParams.append("sortOrder", sortOrder);
  if (search) queryParams.append("search", search);
  if (productType) queryParams.append("productType", productType);
  if (brandId) queryParams.append("brandId", brandId);
  if (gender) queryParams.append("gender", gender);

  const response = await api.get(
    `/admin/discounts/${id}/targets?${queryParams.toString()}`
  );
  return response.data;
}

export async function removeDiscountTarget(
  discountId: string,
  targetId: string
): Promise<void> {
  await api.delete(`/admin/discounts/${discountId}/targets`, {
    data: { targetIds: [targetId] }
  });
}

export async function getDiscountStatistics(): Promise<DiscountStatisticsResponse> {
  const response = await api.get<DiscountStatisticsResponse>(
    "/admin/discounts/statistics"
  );
  return response.data;
}
