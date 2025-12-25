import { AxiosError } from "axios";
import { api } from "./api";
import type { User, UserRole, UserStatus } from "@/types/user";

export type Order = "ASC" | "DESC";

export type UserListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  roles?: UserRole[];
  statuses?: UserStatus[];
  sortField?: "email" | "role" | "status" | "createdAt";
  sortOrder?: Order;
};

export type PaginatedUsers = {
  data: User[];
  meta?: {
    totalPages?: number;
    totalItems?: number;
    page?: number;
    limit?: number;
  };
  hasNext?: boolean;
  hasPrev?: boolean;
};

const handleError = (err: unknown, msg: string) => {
  const e = err as AxiosError;
  console.error(`${msg}:`, e.response?.data || e.message);
  throw err;
};

function toUser(row: any): User {
  if (!row) return row;
  const firstName = row.first_name ?? row.firstName ?? null;
  const lastName = row.last_name ?? row.lastName ?? null;
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    row.name;

  return {
    id: row.id,
    email: row.email,
    firstName,
    lastName,
    fullName,
    gender: row.gender ?? null,
    dateOfBirth: row.date_of_birth ?? row.dateOfBirth ?? null,
    roles: Array.isArray(row.roles) ? row.roles : (row.role ? [row.role] : ["customer"]),
    status: row.status ?? row.statuses ?? "active",
    emailVerifiedAt: row.email_verified_at ?? row.emailVerifiedAt ?? null,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    deletedAt: row.deleted_at ?? row.deletedAt ?? null,
  };
}

function buildListParams(q: UserListQuery) {
  const params: Record<string, any> = {};
  params.page = q.page ?? 1;
  params.limit = q.limit ?? 10;
  if (q.search) params.search = q.search.trim();
  if (q.roles && q.roles.length > 0) params.roles = q.roles;
  if (q.statuses && q.statuses.length > 0) params.statuses = q.statuses;
  if (q.sortOrder) params.sortOrder = q.sortOrder;
  if (q.sortField) params.sortField = q.sortField;
  
  console.log("Sending to API:", params);
  return params;
}

export async function getUsers(q: UserListQuery = {}): Promise<PaginatedUsers> {
  try {
    const res = await api.get("/admin/users", { params: buildListParams(q) });
    const payload = res.data ?? {};
    const rows: any[] = payload.data ?? payload.rows ?? [];
    const totalItems =
      payload.total ?? payload.meta?.total ?? payload.meta?.totalItems ?? rows.length;

    const limit = payload.limit ?? q.limit ?? 10;
    const page = payload.page ?? q.page ?? 1;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: rows.map(toUser),
      meta: { totalItems, totalPages, page, limit },
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  } catch (err) {
    return handleError(err, "Failed to fetch users");
  }
}

export async function getUserById(id: string): Promise<User> {
  try {
    const res = await api.get(`/admin/users/${id}`);
    return toUser(res.data?.data ?? res.data);
  } catch (err) {
    return handleError(err, "Failed to fetch user by ID");
  }
}

export interface UserAddress {
  id: string;
  recipientName: string;
  recipientPhone: string;
  provinceName: string;
  districtName: string;
  wardName: string;
  addressLine: string;
  ghnDistrictId: number;
  ghnWardCode: string;
  isDefault: boolean;
}

export interface AddressesResponse {
  data: UserAddress[];
  total: number;
  meta: {
    requestId: string;
    timestamptz: string;
    totalItems: number;
  };
  success: boolean;
}

export async function getUserAddresses(userId: string): Promise<AddressesResponse> {
  try {
    const res = await api.get(`/admin/users/${userId}/addresses`);
    return res.data;
  } catch (err) {
    return handleError(err, "Failed to fetch user addresses");
  }
}

export interface OrderItem {
  id: string;
  productVariantId: string;
  productId: string;
  productName: string;
  productVariantName: string;
  sku: string;
  colors: string[];
  imageUrl: string;
  quantity: number;
  finalPrice: string;
  originalPrice: string;
}

export interface UserOrder {
  id: string;
  orderCode: string;
  shippingCode: string;
  items: OrderItem[];
  status: string;
  subtotal: string;
  discountFee: string;
  shippingFee: string;
  grandTotal: string;
  couponCode: string;
  paymentMethod: string;
  note: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  wardName: string;
  districtName: string;
  provinceName: string;
  createdAt: string;
  expiresAt: string;
  cancelledAt: string;
  cancelReason: string;
}

export interface OrdersResponse {
  data: UserOrder[];
  total: number;
  meta: {
    requestId: string;
    timestamptz: string;
    totalItems: number;
  };
  success: boolean;
}

export interface UserOrdersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  orderCode?: string;
  sortField?: "createdAt";
  sortOrder?: Order;
}

export async function getUserOrders(
  userId: string,
  query: UserOrdersQuery = {}
): Promise<OrdersResponse> {
  try {
    const params: Record<string, any> = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    if (query.orderCode) params.orderCode = query.orderCode;
    if (query.sortField) params.sortField = query.sortField;
    if (query.sortOrder) params.sortOrder = query.sortOrder;

    const res = await api.get(`/admin/users/${userId}/orders`, { params });
    return res.data;
  } catch (err) {
    return handleError(err, "Failed to fetch user orders");
  }
}

export interface UpdateUserPayload {
  status?: UserStatus;
  role?: UserRole;
}

export async function updateUser(userId: string, payload: UpdateUserPayload): Promise<User> {
  try {
    const res = await api.patch(`/admin/users/${userId}`, payload);
    return toUser(res.data?.data ?? res.data);
  } catch (err) {
    return handleError(err, "Failed to update user");
  }
}

