export interface Discount {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: "percentage" | "fixed";
  value: string;
  maxDiscountValue?: string;
  status: "draft" | "scheduled" | "happening" | "canceled" | "expired";
  startAt: string;
  endAt: string;
  bannerImage?: {
    id: string;
    publicUrl: string;
    altText?: string;
    sortOrder?: number;
    key: string;
    status: string;
    ownerType: string;
    createdAt: string;
  };
  createdAt: string;
  canceledAt?: string;
  deletedAt?: string;
}

export interface DiscountFilters {
  search?: string;
  page?: number;
  limit?: number;
  type?: "percentage" | "fixed";
  status?: "draft" | "scheduled" | "happening" | "canceled" | "expired";
  startDate?: string;
  endDate?: string;
  sortField?: "name" | "createdAt" | "startAt" | "endAt" | "type" | "scope" | "status";
  sortOrder?: "ASC" | "DESC";
  isDeleted?: boolean;
}

export interface PaginatedDiscountsResponse {
  success: boolean;
  message: string;
  data: Discount[];
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
