import { AxiosError } from "axios";
import { api } from "./api";
import { Brand } from "@/types/brand";

export const handleError = (err: unknown, msg: string) => {
  const error = err as AxiosError;
  console.error(`${msg}:`, error.response?.data || error.message);
  throw err;
};

export type CreateBrandPayload = {
  name: string;
  slug: string;
  websiteUrl?: string | null;
  description?: string | null;
  bannerImageId?: string | null;
  brandStatus?: string | null;
  priority?: number | null;
};

export type UpdateBrandPayload = Partial<CreateBrandPayload>;

export type BrandListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  brandStatus?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  sortField?: "name" | "createdAt" | "priority";
  sortOrder?: "ASC" | "DESC";
};

export type PaginatedBrands = {
  data: Brand[];
  meta?: {
    totalPages?: number;
    totalItems?: number;
    page?: number;
    limit?: number;
  };
  hasNext?: boolean;
  hasPrev?: boolean;
};

function toBrand(row: any): Brand {
  if (!row) return row;
  
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    websiteUrl: row.website_url ?? row.websiteUrl ?? null,
    description: row.description ?? null,
    brandStatus: row.status ?? row.brand_status ?? null,
    isActive: Boolean(row.is_active ?? row.isActive),
    isDeleted: Boolean(row.is_deleted ?? row.isDeleted),
    bannerImageId: row.banner_image_id ?? row.bannerImageId ?? row.bannerImage?.id ?? null,
    bannerImage: row.bannerImage ?? row.banner_image ?? null,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    deletedAt: row.deleted_at ?? row.deletedAt,
    priority: Number(row.priority ?? 100),
  };
}

function buildListParams(q: BrandListQuery) {
  const params: Record<string, any> = {};
  if (q.page) params.page = q.page;
  if (q.limit) params.limit = q.limit;
  if (q.search && q.search.trim()) params.search = q.search.trim();
  if (q.brandStatus) params.status = q.brandStatus;
  if (typeof q.isActive === "boolean") params.isActive = q.isActive;
  if (typeof q.isDeleted === "boolean") params.isDeleted = q.isDeleted;

  if (q.sortOrder) params.sortOrder = q.sortOrder;
  const sortFieldMap: Record<
    NonNullable<BrandListQuery["sortField"]>,
    string
  > = {
    name: "name",
    createdAt: "createdAt",
    priority: "priority",
  };
  params.sortField = q.sortField ? sortFieldMap[q.sortField] : "createdAt";
  return params;
}

export async function getBrands(q: BrandListQuery): Promise<PaginatedBrands> {
  try {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const res = await api.get("/admin/brands", {
      params: buildListParams({ ...q, page, limit }),
    });

    const payload = res.data ?? {};
    const rows: any[] = payload.data ?? payload.rows ?? [];

    const totalItems: number | undefined =
      payload.total ?? payload.meta?.total ?? payload.meta?.totalItems ?? undefined;

    const limitFromRes: number = payload.limit ?? limit;
    const pageFromRes: number = payload.page ?? page;

    const totalPages: number | undefined =
      typeof totalItems === "number" && limitFromRes
        ? Math.ceil(totalItems / limitFromRes)
        : undefined;

    const hasNext =
      totalPages != null
        ? pageFromRes < totalPages
        : rows.length === limitFromRes;

    const hasPrev = pageFromRes > 1;

    return {
      data: rows.map(toBrand),
      meta: { totalPages, totalItems, page: pageFromRes, limit: limitFromRes },
      hasNext,
      hasPrev,
    };
  } catch (err) {
    return handleError(err, "Failed to fetch brands");
  }
}

export const getBrandById = async (id: string): Promise<Brand> => {
  try {
    const res = await api.get(`/admin/brands/${id}`);
    const raw = res.data?.data ?? null;
    return toBrand(raw);
  } catch (err) {
    return handleError(err, "Failed to fetch brand by ID");
  }
};

export const createBrand = async (data: CreateBrandPayload) => {
  try {
    const res = await api.post("/admin/brands", data);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to create brand");
  }
};

export const updateBrand = async (id: string, data: UpdateBrandPayload) => {
  try {
    const res = await api.patch(`/admin/brands/${id}`, data);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to update brand");
  }
};

export const softDeleteBrand = async (id: string) => {
  try {
    const res = await api.delete(`/admin/brands/${id}`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to soft delete brand");
  }
};

export const restoreBrand = async (id: string) => {
  try {
    const res = await api.patch(`/admin/brands/${id}/restore`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to restore brand");
  }
};

export const forceDeleteBrand = async (id: string) => {
  try {
    const res = await api.delete(`/admin/brands/${id}/force`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to permanently delete brand");
  }
};

export const countTrashBrandsClient = async (
  baseQuery: Partial<BrandListQuery> = {}
): Promise<number> => {
  let page = 1;
  const limit = 500;
  let total = 0;

  while (true) {
    const { data, hasNext } = await getBrands({ ...baseQuery, page, limit });
    total += data.length;
    if (!hasNext) break;
    page += 1;
  }
  return total;
};

export async function getBrandCounts() {
  try {
    const brandsTrash = await countTrashBrandsClient({ isDeleted: true });
    return {
      brandsTrash,
    };
  } catch (err) {
    console.error("Failed to fetch color counts:", err);
    return { colors: 0 };
  }
}
