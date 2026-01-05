export type UUID = string;

export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";

export interface ReviewImage {
  id: UUID;
  publicUrl: string;
  altText?: string | null;
}

export interface ReviewOrderItem {
  id: UUID;
  productVariantId: UUID;
  productId: UUID;
  productName: string;
  productVariantName: string;
  sku: string;
  colors: string;
  quantity: number;
  finalPrice: string;
  originalPrice: string;
  thumbnailUrl: string;
  isReviewed: boolean;
}

export interface ReviewUser {
  id: UUID;
  email: string;
  roles?: string[];
  status?: string;
  profile?: Record<string, any>;
}

export interface Review {
  id: UUID;
  rating: number;
  comment: any[];
  image: ReviewImage[];
  nameDisplay: Record<string, any>;
  status: ReviewStatus;
  productId: UUID;
  orderItem: ReviewOrderItem;
  user?: ReviewUser;
  deadlineUpdate: Record<string, any>;
  createdAt: string;
  isEdited: boolean;
  updatedAt: string;
}

export interface ReviewListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReviewStatus;
  rating?: number;
  startDate?: string;
  endDate?: string;
  sortField?: "createdAt";
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedReviews {
  data: Review[];
  meta?: {
    totalPages?: number;
    totalItems?: number;
    page?: number;
    limit?: number;
  };
}
