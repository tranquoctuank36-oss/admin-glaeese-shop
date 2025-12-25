export interface Voucher {
  id: string;
  code: string;
  description: string;
  minOrderAmount: string;
  maxDiscountValue: string | null;
  maxUsage: number;
  usedCount: number;
  type: "fixed" | "percentage" | "free_shipping";
  value: string;
  validFrom: string;
  validTo: string;
  status: "upcoming" | "happening" | "canceled" | "expired";
  createdAt: string;
  deletedAt: string | null;
  canceledAt: string;
}

export interface VoucherFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortField?: "validFrom" | "validTo" | "createdAt" | "deletedAt";
  sortOrder?: "ASC" | "DESC";
  type?: "fixed" | "percentage" | "free_shipping";
  status?: "upcoming" | "happening" | "canceled" | "expired";
  validFrom?: string;
  validTo?: string;
  isDeleted?: boolean;
}

export interface PaginatedVouchersResponse {
  success: boolean;
  message: string;
  data: Voucher[];
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
