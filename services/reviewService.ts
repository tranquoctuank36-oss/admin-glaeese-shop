import { api } from "./api";
import type { Review, ReviewListQuery, PaginatedReviews, UUID, ReviewStatus } from "@/types/review";
import { AxiosError } from "axios";

const handleError = (err: unknown, msg: string) => {
  const e = err as AxiosError;
  console.error(`${msg}:`, e.response?.data || e.message);
  throw err;
};

function buildListParams(q: ReviewListQuery) {
  const params: Record<string, any> = {};

  if (q.page) params.page = q.page;
  if (q.limit) params.limit = q.limit;
  if (q.search && q.search.trim()) params.search = q.search.trim();
  if (q.status) params.status = q.status;
  if (q.rating) params.rating = q.rating;
  if (q.startDate) params.startDate = q.startDate;
  if (q.endDate) params.endDate = q.endDate;
  if (q.sortField) params.sortField = q.sortField;
  if (q.sortOrder) params.sortOrder = q.sortOrder;

  return params;
}

export async function getReviews(q: ReviewListQuery = {}): Promise<PaginatedReviews> {
  try {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const res = await api.get("/admin/reviews", {
      params: buildListParams({ ...q, page, limit }),
      headers: { Accept: "application/json" },
    });

    const payload = res.data ?? {};
    const rows: Review[] = payload.data ?? [];
    const totalItems: number | undefined = payload.meta?.totalItems;

    const limitFromRes: number = payload.meta?.limit ?? limit;
    const pageFromRes: number = payload.meta?.page ?? page;

    const totalPages: number | undefined =
      typeof totalItems === "number" && limitFromRes
        ? Math.ceil(totalItems / limitFromRes)
        : payload.meta?.totalPages;

    return {
      data: rows,
      meta: { totalPages, totalItems, page: pageFromRes, limit: limitFromRes },
    };
  } catch (err) {
    return handleError(err, "Failed to fetch reviews");
  }
}

export async function getReviewById(id: UUID): Promise<Review> {
  try {
    const res = await api.get(`/admin/reviews/${id}`, {
      headers: { Accept: "application/json" },
    });
    const review = res.data?.data ?? res.data;
    
    // Normalize image to always be an array
    if (review.image && !Array.isArray(review.image)) {
      review.image = [review.image];
    }
    
    return review;
  } catch (err) {
    return handleError(err, "Failed to fetch review by ID");
  }
}

export interface BulkUpdateReviewsParams {
  reviewIds: UUID[];
  status: ReviewStatus;
}

export interface BulkUpdateReviewsResponse {
  success: boolean;
  message: string;
  data?: any;
}

export async function bulkUpdateReviews(
  params: BulkUpdateReviewsParams
): Promise<BulkUpdateReviewsResponse> {
  try {
    const res = await api.patch("/admin/reviews", params);
    return res.data;
  } catch (err) {
    return handleError(err, "Failed to bulk update reviews");
  }
}

