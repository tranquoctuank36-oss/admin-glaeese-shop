import { api, handleError, ListQuery, Paginated } from "./frameCommon";

export type CreateFrameMaterialPayload = {
  name: string;
  slug: string;
  isActive: boolean;
};

function toFrameMaterial(row: any): FrameMaterials {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isActive: Boolean(row.isActive ?? row.is_active),
    isDeleted: Boolean(row.isDeleted ?? row.is_deleted),
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
    deletedAt: row.deletedAt ?? row.deleted_at,
  };
}

function buildListParams(q: ListQuery, page: number, limit: number) {
  const sortFieldMap: Record<NonNullable<ListQuery["sortField"]>, string> = {
    name: "name",
    createdAt: "createdAt",
  };

  const params: Record<string, any> = { page, limit };
  if (q.search?.trim()) params.search = q.search.trim();
  if (q.sortField) params.sortField = sortFieldMap[q.sortField] ?? q.sortField;
  if (q.sortOrder) params.sortOrder = q.sortOrder.toUpperCase();
  if (typeof q.isActive === "boolean") params.isActive = q.isActive;
  if (typeof q.isDeleted === "boolean") params.isDeleted = q.isDeleted;
  return params;
}


export const getFrameMaterials = async (
  q: ListQuery = {}
): Promise<Paginated<FrameMaterials>> => {
  try {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;

    const res = await api.get("/admin/frame-materials", {
      params: buildListParams(q, page, limit),
    });

    const payload = res.data ?? {};
    const rows: any[] = payload.data ?? payload.rows ?? [];

    const totalItems: number | undefined =
      payload.total ?? payload.meta?.total ?? undefined;

    const limitFromRes: number = payload.limit ?? limit;
    const pageFromRes: number = payload.page ?? page;

    const totalPages: number | undefined =
      typeof totalItems === "number" && limitFromRes
        ? Math.ceil(totalItems / limitFromRes)
        : undefined;

    const hasNext =
      totalPages != null ? page < totalPages : rows.length === limit;

    const hasPrev = page > 1;

    return {
      data: rows.map(toFrameMaterial),
      meta: { totalPages, totalItems, page: pageFromRes, limit: limitFromRes },
      hasNext,
      hasPrev,
    };
  } catch (err) {
    return handleError(err, "Failed to fetch frame materials");
  }
};

export const createFrameMaterials = async (
  data: CreateFrameMaterialPayload
) => {
  try {
    const res = await api.post("/admin/frame-materials", data);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to create frame material");
  }
};

export const updateFrameMaterials = async (
  id: string,
  data: CreateFrameMaterialPayload
) => {
  try {
    const res = await api.patch(`/admin/frame-materials/${id}`, data);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to update frame material");
  }
};

export const getFrameMaterialById = async (
  id: string
): Promise<FrameMaterials | null> => {
  try {
    const res = await api.get(`/admin/frame-materials/${id}`);
    return toFrameMaterial(res.data?.data ?? null);
  } catch (err) {
    return handleError(err, "Failed to fetch frame material by ID");
  }
};

export const softDeleteFrameMaterial = async (id: string) => {
  try {
    const res = await api.delete(`/admin/frame-materials/${id}`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to soft delete frame material");
  }
};

export const restoreFrameMaterial = async (
  id: string
): Promise<FrameMaterials> => {
  try {
    const res = await api.patch(`/admin/frame-materials/${id}/restore`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to restore frame material");
  }
};

export const forceDeleteFrameMaterial = async (id: string): Promise<void> => {
  try {
    await api.delete(`/admin/frame-materials/${id}/force`);
  } catch (err) {
    return handleError(err, "Failed to permanently delete frame material");
  }
};

export const countFrameMaterialsClient = async (
  baseQuery: Partial<ListQuery> = {}
): Promise<number> => {
  let page = 1;
  const limit = 500; // tăng để giảm số lần gọi
  let total = 0;

  while (true) {
    const { data, hasNext } = await getFrameMaterials({
      ...baseQuery,
      page,
      limit,
    });
    total += data.length;
    if (!hasNext) break;
    page += 1;
  }
  return total;
};
