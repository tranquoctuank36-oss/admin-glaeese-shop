import { AxiosError } from "axios";
import { api } from "./api";
import { Tag } from "@/types/tag";

const handleError = (err: unknown, msg: string) => {
  const e = err as AxiosError;
  console.error(`${msg}:`, e.response?.data || e.message);
  throw err;
};

export type CreateTagPayload = {
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
};

export type UpdateTagPayload = Partial<CreateTagPayload>;

export type TagListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  sortField?: "name" | "createdAt";
  sortOrder?: "ASC" | "DESC";
};

export type PaginatedTags = {
  data: Tag[];
  meta?: {
    totalPages?: number;
    totalItems?: number;
    page?: number;
    limit?: number;
  };
  hasNext?: boolean;
  hasPrev?: boolean;
};

function toTag(row: any): Tag {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isActive: Boolean(row.is_active ?? row.isActive),
    isDeleted: Boolean(row.is_deleted ?? row.isDeleted),
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    deletedAt: row.deleted_at ?? row.deletedAt,
  };
}

function buildListParams(q: TagListQuery) {
  const params: Record<string, any> = {};
  if (q.page) params.page = q.page;
  if (q.limit) params.limit = q.limit;
  if (q.search && q.search.trim()) params.search = q.search.trim();
  if (typeof q.isActive === "boolean") params.isActive = q.isActive;
  if (typeof q.isDeleted === "boolean") params.isDeleted = q.isDeleted;
  if (q.sortOrder) params.sortOrder = q.sortOrder;

  const sortFieldMap: Record<NonNullable<TagListQuery["sortField"]>, string> = {
    name: "name",
    createdAt: "createdAt",
  };
  params.sortField = q.sortField ? sortFieldMap[q.sortField] : "createdAt"; 
  return params;
}

export async function getTags(q: TagListQuery): Promise<PaginatedTags> {
  try {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const res = await api.get("/admin/tags", {
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
      data: rows.map(toTag),
      meta: { totalPages, totalItems, page: pageFromRes, limit: limitFromRes },
      hasNext,
      hasPrev,
    };
  } catch (err) {
    return handleError(err, "Failed to fetch tags");
  }
}

export const getTagById = async (id: string): Promise<Tag> => {
  try {
    const res = await api.get(`/admin/tags/${id}`);
    return toTag(res.data?.data ?? res.data);
  } catch (err) {
    return handleError(err, "Failed to fetch tag by ID");
  }
};

export const createTag = async (data: CreateTagPayload) => {
  try {
    const res = await api.post("/admin/tags", data);
    return toTag(res.data?.data ?? res.data);
  } catch (err) {
    return handleError(err, "Failed to create tag");
  }
};

export const updateTag = async (id: string, data: UpdateTagPayload) => {
  try {
    const res = await api.patch(`/admin/tags/${id}`, data);
    return toTag(res.data?.data ?? res.data);
  } catch (err) {
    return handleError(err, "Failed to update tag");
  }
};

export const softDeleteTag = async (id: string) => {
  try {
    const res = await api.delete(`/admin/tags/${id}`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to soft delete tag");
  }
};

export const restoreTag = async (id: string) => {
  try {
    const res = await api.patch(`/admin/tags/${id}/restore`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to restore tag");
  }
};

export const forceDeleteTag = async (id: string) => {
  try {
    const res = await api.delete(`/admin/tags/${id}/force`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to permanently delete tag");
  }
};

export const countTrashTagsClient = async (
  baseQuery: Partial<TagListQuery> = {}
) => {
  let page = 1;
  const limit = 500;
  let total = 0;
  while (true) {
    const { data, hasNext } = await getTags({ ...baseQuery, page, limit });
    total += data.length;
    if (!hasNext) break;
    page += 1;
  }
  return total;
};

export async function getTagCounts() {
  try {
    const tagsTrash = await countTrashTagsClient({ isDeleted: true });
    return { tagsTrash };
  } catch (err) {
    console.error("Failed to fetch tag counts:", err);
    return { tagsTrash: 0 };
  }
}
