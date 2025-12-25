import { AxiosError } from "axios";
import { api } from "./api";

export const handleError = (err: unknown, msg: string) => {
  const error = err as AxiosError;
  console.error(`${msg}:`, error.response?.data || error.message);
  throw err;
};

export type CreateColorPayload = {
  name: string;
  slug: string;
  hexCode?: string;
  isActive?: boolean;
};
export type UpdateColorPayload = Partial<CreateColorPayload>;

export type ListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  sortField?: "name" | "createdAt" ;
  sortOrder?: "ASC" | "DESC";
};

export type PaginatedColors = {
  data: Color[];
  meta?: {
    totalPages?: number;
    totalItems?: number;
    page?: number;
    limit?: number;
  };
  hasNext?: boolean;
  hasPrev?: boolean;
};

function toColor(row: any): Color {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    hexCode: row.hex_code ?? row.hexCode,
    isActive: Boolean(row.is_active ?? row.isActive),
    isDeleted: Boolean(row.is_deleted ?? row.isDeleted),
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    deletedAt: row.deleted_at ?? row.deletedAt,
  };
}

function buildListParams(q: ListQuery) {
  const params: Record<string, any> = {};
  if (q.page) params.page = q.page;
  if (q.limit) params.limit = q.limit;
  if (q.search && q.search.trim()) params.search = q.search.trim();
  if (typeof q.isActive === "boolean") params.isActive = q.isActive;
  if (typeof q.isDeleted === "boolean") params.isDeleted = q.isDeleted;

  if (q.sortOrder) params.sortOrder = q.sortOrder;
  const sortFieldMap: Record<NonNullable<ListQuery["sortField"]>, string> = {
    name: "name",
    createdAt: "createdAt",
  };
  const sortKey = q.sortField ? sortFieldMap[q.sortField] : "createdAt";
  params.sortField = sortKey;

  return params;
}

export async function getColors(q: ListQuery): Promise<PaginatedColors> {
  try {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const res = await api.get("/admin/colors", {
      params: buildListParams({ ...q, page, limit }),
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
      totalPages != null
        ? pageFromRes < totalPages
        : rows.length === limitFromRes;

    const hasPrev = pageFromRes > 1;

    return {
      data: rows.map(toColor),
      meta: {
        totalPages,
        totalItems,
        page: pageFromRes,
        limit: limitFromRes,
      },
      hasNext,
      hasPrev,
    };
  } catch (err) {
    return handleError(err, "Failed to fetch colors");
  }
}

export const getColorById = async (id: string): Promise<Color> => {
  try {
    const res = await api.get(`/admin/colors/${id}`);
    return toColor(res.data?.data ?? null);
  } catch (err) {
    return handleError(err, "Failed to fetch color by ID");
  }
};

export const createColor = async (data: CreateColorPayload) => {
  try {
    const res = await api.post("/admin/colors", data);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to create color");
  }
};

export const updateColor = async (
  id: string,
  data: UpdateColorPayload
): Promise<void> => {
  try {
    const res = await api.patch(`/admin/colors/${id}`, data);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to update color");
  }
};

export const softDeleteColor = async (id: string): Promise<void> => {
  try {
    const res = await api.delete(`/admin/colors/${id}`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to soft delete color");
  }
};

export const restoreColor = async (id: string): Promise<Color> => {
  try {
    const res = await api.patch(`/admin/colors/${id}/restore`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to restore color");
  }
};

export const forceDeleteColor = async (id: string): Promise<void> => {
  try {
    const res = await api.delete(`/admin/colors/${id}/force`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to permanently delete color");
  }
};

export const countTrashColorsClient = async (baseQuery: Partial<ListQuery> = {}): Promise<number> => {
  let page = 1;
  const limit = 500;
  let total = 0;

  
    while (true) {
      const { data, hasNext } = await getColors({ ...baseQuery, page, limit });
      total += data.length;
      if (!hasNext) break;
      page += 1;
    }
  return total;
};

export async function getColorCounts() {
  try {
    const colorsTrash = await countTrashColorsClient({ isDeleted: true });
    return {
      colorsTrash
    };
  } catch (err) {
    console.error("Failed to fetch color counts:", err);
    return { colors: 0 };
  }
}
