import { AxiosError } from "axios";
import { api } from "./api";
import { Banner } from "@/types/banner";

const handleError = (err: unknown, msg: string) => {
  const e = err as AxiosError;
  console.error(`${msg}:`, e.response?.data || e.message);
  throw err;
};

export type CreateBannerPayload = {
  title: string;
  imageId: string;
  linkUrl?: string | null;
  sortOrder?: number;
  startDate?: string | null;
  endDate?: string | null;
};

export type UpdateBannerPayload = Partial<CreateBannerPayload>;

export type BannerListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  isDeleted?: boolean;
  sortField?: "title" | "createdAt";
  sortOrder?: "ASC" | "DESC";
};

export type PaginatedBanners = {
  data: Banner[];
  meta?: {
    totalPages?: number;
    totalItems?: number;
    page?: number;
    limit?: number;
  };
  hasNext?: boolean;
  hasPrev?: boolean;
};

function toBanner(row: any): Banner {
  if (!row) return row;
  return {
    id: row.id,
    title: row.title,
    imageId: row.image_id ?? row.imageId ?? "",
    imageUrl: row.image_url ?? row.imageUrl ?? "",
    linkUrl: row.link_url ?? row.linkUrl,
    sortOrder: row.sort_order ?? row.sortOrder ?? 0,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    isDeleted: Boolean(row.is_deleted ?? row.isDeleted),
    deletedAt: row.deleted_at ?? row.deletedAt,
  };
}

function buildListParams(q: BannerListQuery) {
  const params: Record<string, any> = {};
  if (q.page) params.page = q.page;
  if (q.limit) params.limit = q.limit;
  if (q.search && q.search.trim()) params.search = q.search.trim();
  if (typeof q.isDeleted === "boolean") params.isDeleted = q.isDeleted;
  if (q.sortOrder) params.sortOrder = q.sortOrder;

  const sortFieldMap: Record<NonNullable<BannerListQuery["sortField"]>, string> = {
    title: "title",
    createdAt: "createdAt",
  };
  params.sortField = q.sortField ? sortFieldMap[q.sortField] : "createdAt"; 
  return params;
}

export async function getBanners(q: BannerListQuery): Promise<PaginatedBanners> {
  try {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const res = await api.get("/admin/banners", {
      params: buildListParams({ ...q, page, limit }),
    });

    const data = Array.isArray(res.data?.data)
      ? res.data.data.map(toBanner)
      : [];
    const meta = res.data?.meta;
    const hasNext = Boolean(data.length === limit || res.data?.hasNext);
    const hasPrev = page > 1 || Boolean(res.data?.hasPrev);

    return {
      data,
      meta: meta ?? undefined,
      hasNext,
      hasPrev,
    };
  } catch (err) {
    handleError(err, "Error fetching banners");
    return { data: [], hasNext: false, hasPrev: false };
  }
}

export async function getBannerById(id: string): Promise<Banner | null> {
  try {
    const res = await api.get(`/admin/banners/${id}`);
    return toBanner(res.data?.data);
  } catch (err) {
    handleError(err, `Error fetching banner ${id}`);
    return null;
  }
}

export async function createBanner(payload: CreateBannerPayload): Promise<Banner> {
  try {
    const res = await api.post("/admin/banners", payload);
    return toBanner(res.data?.data);
  } catch (err) {
    handleError(err, "Error creating banner");
    throw err;
  }
}

export async function updateBanner(
  id: string,
  payload: UpdateBannerPayload
): Promise<Banner> {
  try {
    const res = await api.put(`/admin/banners/${id}`, payload);
    return toBanner(res.data?.data);
  } catch (err) {
    handleError(err, `Error updating banner ${id}`);
    throw err;
  }
}

export async function deleteBanner(id: string): Promise<void> {
  try {
    await api.delete(`/admin/banners/${id}`);
  } catch (err) {
    handleError(err, `Error deleting banner ${id}`);
    throw err;
  }
}
