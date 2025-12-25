
import type {
  Stock,
  StockMovement,
  CreateStockMovementPayload,
  UpdateStockConfigPayload,
} from "@/types/stock";
import { api } from "./api";

interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
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

interface StocksQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: "unknown" | "out_of_stock" | "low_stock" | "in_stock";
  sortField?: "updatedAt" | "quantityAvailable" | "product";
  sortOrder?: "ASC" | "DESC";
}

export async function getStocks(
  params: StocksQueryParams = {}
): Promise<PaginatedResponse<Stock>> {
  const {
    search,
    page = 1,
    limit = 20,
    status,
    sortField = "updatedAt",
    sortOrder = "DESC",
  } = params;

  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  if (status) queryParams.append("status", status);
  queryParams.append("sortField", sortField);
  queryParams.append("sortOrder", sortOrder);

  const response = await api.get<PaginatedResponse<Stock>>(
    `/admin/stocks?${queryParams.toString()}`
  );
  return response.data;
}

export async function updateStockConfiguration(
  stockId: string,
  payload: UpdateStockConfigPayload
): Promise<void> {
  await api.patch(`/admin/stocks/${stockId}/configuration`, payload);
}

export async function getStockMovements(
  stockId: string,
  params: {
    search?: string;
    page?: number;
    limit?: number;
    type?: "inbound" | "outbound" | "adjustment" | "transfer";
    referenceType?: string;
  } = {}
): Promise<PaginatedResponse<StockMovement>> {
  const { search, page = 1, limit = 20, type, referenceType } = params;

  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());
  if (type) queryParams.append("type", type);
  if (referenceType) queryParams.append("referenceType", referenceType);

  const response = await api.get<PaginatedResponse<StockMovement>>(
    `/admin/stocks/${stockId}/stock-movements?${queryParams.toString()}`
  );
  return response.data;
}

export async function createStockMovement(
  stockId: string,
  payload: CreateStockMovementPayload
): Promise<StockMovement> {
  const response = await api.post<{ data: StockMovement }>(
    `/admin/stocks/${stockId}/stock-movements`,
    payload
  );
  return response.data.data;
}
