import { api, handleError, ListQuery, Paginated } from "./frameCommon";

export type CreateFrameShapePayload = {
  name: string;
  slug: string;
  isActive: boolean;
};

function toFrameShape(row: any): FrameShape {
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

export const getFrameShapes = async (
  q: ListQuery = {}
): Promise<Paginated<FrameShape>> => {
  try {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;

    const res = await api.get("/admin/frame-shapes", {
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
      data: rows.map(toFrameShape),
      meta: { totalPages, totalItems, page: pageFromRes, limit: limitFromRes },
      hasNext,
      hasPrev,
    };
  } catch (err) {
    return handleError(err, "Failed to fetch frame shapes");
  }
};

export const createFrameShapes = async (data: CreateFrameShapePayload) => {
  try {
    const res = await api.post("/admin/frame-shapes", data);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to create frame shape");
  }
};

export const updateFrameShapes = async (
  id: string,
  data: CreateFrameShapePayload
) => {
  try {
    const res = await api.patch(`/admin/frame-shapes/${id}`, data);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to update frame shape");
  }
};

export const getFrameShapeById = async (
  id: string
): Promise<FrameShape | null> => {
  try {
    const res = await api.get(`/admin/frame-shapes/${id}`);
    return toFrameShape(res.data?.data ?? null);
  } catch (err) {
    return handleError(err, "Failed to fetch frame shape by ID");
  }
};

export const softDeleteFrameShape = async (id: string) => {
  try {
    const res = await api.delete(`/admin/frame-shapes/${id}`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to soft delete frame shape");
  }
};

export const getTrashedFrameShapes = async (
  search?: string
): Promise<FrameShape[]> => {
  try {
    const q = search?.trim();
    const res = await api.get("/admin/frame-shapes/trash", {
      params: q ? { search: q } : undefined,
    });
    return res.data?.data ?? [];
  } catch (err) {
    return handleError(err, "Failed to fetch trashed frame shapes");
  }
};

export const restoreFrameShape = async (id: string): Promise<FrameShape> => {
  try {
    const res = await api.patch(`/admin/frame-shapes/${id}/restore`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to restore frame shape");
  }
};

export const forceDeleteFrameShape = async (id: string): Promise<void> => {
  try {
    await api.delete(`/admin/frame-shapes/${id}/force`);
  } catch (err) {
    return handleError(err, "Failed to permanently delete frame shape");
  }
};

export const countFrameShapesClient = async (
  baseQuery: Partial<ListQuery> = {}
): Promise<number> => {
  let page = 1;
  const limit = 500;
  let total = 0;

  while (true) {
    const { data, hasNext } = await getFrameShapes({
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
