import { AxiosError } from "axios";
import { api } from "./api";

const handleError = (err: unknown, msg: string) => {
  const e = err as AxiosError;
  console.error(`${msg}:`, e.response?.data || e.message);
  throw err;
};

export type CreateCategoryPayload = {
  name: string;
  slug: string;
  status?: string;
  priority?: number;
  parentId?: string | null;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export type CategoryFlatQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  depth?: "all" | `${number}`;
  sortField?: "name" | "priority" | "level" | "createdAt";
  sortOrder?: "ASC" | "DESC";
};

export type CategoryTreeQuery = {
  search?: string;
  status?: string;
  depth?: "all" | `${number}`;
  sortField?: "name" | "priority" | "level" | "createdAt";
  sortOrder?: "ASC" | "DESC";
};

export type PaginatedCategories = {
  data: Category[];
  meta?: {
    totalPages?: number;
    totalItems?: number;
    page?: number;
    limit?: number;
  };
  hasNext?: boolean;
  hasPrev?: boolean;
};

function toCategory(row: any): Category {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? null,
    relativeUrl: row.relative_url ?? row.relativeUrl ?? null,
    categoryStatus: row.status ?? null,
    level: Number(row.level ?? 0) as CategoryLevel,
    priority: Number(row.priority ?? 100),
    parentId: row.parent_id ?? row.parentId ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
}

export type CategoryTree = Category & { children?: CategoryTree[] };

function toCategoryTree(row: any): CategoryTree {
  const base = toCategory(row);
  return {
    ...base,
    children: Array.isArray(row?.children)
      ? row.children.map(toCategoryTree)
      : undefined,
  };
}

function buildFlatParams(q: CategoryFlatQuery) {
  const params: Record<string, any> = {};
  if (q.page) params.page = q.page;
  if (q.limit) params.limit = q.limit;
  if (q.search && q.search.trim()) params.search = q.search.trim();
  if (q.status) params.status = q.status;
  if (typeof q.depth !== "undefined" && q.depth !== "all") {
    const n = Number(q.depth);
    params.depth = Number.isFinite(n) ? n : q.depth;
  }
  if (q.sortOrder) params.sortOrder = q.sortOrder;

  const sortFieldMap: Record<
    NonNullable<CategoryFlatQuery["sortField"]>,
    string
  > = {
    name: "name",
    priority: "priority",
    level: "level",
    createdAt: "createdAt",
  };
  params.sortField = q.sortField ? sortFieldMap[q.sortField] : "createdAt";
  return params;
}

function buildTreeParams(q: CategoryTreeQuery) {
  const params: Record<string, any> = {};
  if (q.search && q.search.trim()) params.search = q.search.trim();
  if (q.status) params.status = q.status;
  if (typeof q.depth !== "undefined" && q.depth !== "all") {
    const n = Number(q.depth);
    params.depth = Number.isFinite(n) ? n : q.depth;
  }

  if (q.sortOrder) params.sortOrder = q.sortOrder;

  const sortFieldMap: Record<
    NonNullable<CategoryTreeQuery["sortField"]>,
    string
  > = {
    name: "name",
    priority: "priority",
    level: "level",
    createdAt: "createdAt",
  };
  if (q.sortField) params.sortField = sortFieldMap[q.sortField];

  return params;
}

export async function getCategoriesFlat(
  q: CategoryFlatQuery
): Promise<PaginatedCategories> {
  try {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const res = await api.get("/admin/categories/flat-tree", {
      params: buildFlatParams({ ...q, page, limit }),
    });

    const payload = res.data ?? {};
    const rows: any[] = payload.data ?? payload.rows ?? [];
    const totalItems: number | undefined =
      payload.total ??
      payload.meta?.total ??
      payload.meta?.totalItems ??
      undefined;

    const limitFromRes: number = payload.limit ?? payload.meta?.limit ?? limit;
    const pageFromRes: number = payload.page ?? payload.meta?.page ?? page;
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
      data: rows.map(toCategory),
      meta: { totalPages, totalItems, page: pageFromRes, limit: limitFromRes },
      hasNext,
      hasPrev,
    };
  } catch (err) {
    return handleError(err, "Failed to fetch categories (flat)");
  }
}

export async function getCategoriesTree(
  q: CategoryTreeQuery
): Promise<{ data: CategoryTree[] }> {
  try {
    const res = await api.get("/admin/categories/tree", {
      params: buildTreeParams(q),
    });
    const payload = res.data ?? {};
    const rows: any[] = payload.data ?? payload.rows ?? payload ?? [];
    return { data: rows.map(toCategoryTree) };
  } catch (err) {
    return handleError(err, "Failed to fetch categories (tree)");
  }
}

export async function getCategoryChildren(id: string) {
  const d = await getCategoryById(id);
  return d?.children ?? [];   // 👈 lấy trực tiếp từ chi tiết
}

export async function getCategoryById(id: string): Promise<Category> {
  try {
    const res = await api.get(`/admin/categories/${id}`);
    const data = res.data?.data ?? res.data;
    const normalized = {
      ...data,
      parentId: data.parentId ?? data.parent?.id ?? data.parent ?? null,
    };

    return toCategory(normalized);
  } catch (err) {
    return handleError(err, "Failed to fetch category by ID");
  }
}
export async function createCategory(
  data: CreateCategoryPayload
): Promise<Category> {
  try {
    const res = await api.post("/admin/categories", data);
    return toCategory(res.data?.data ?? res.data);
  } catch (err) {
    return handleError(err, "Failed to create category");
  }
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryPayload
): Promise<Category> {
  try {
    const res = await api.patch(`/admin/categories/${id}`, data);
    return toCategory(res.data?.data ?? res.data);
  } catch (err) {
    return handleError(err, "Failed to update category");
  }
}

export async function deleteCategory(id: string) {
  try {
    const res = await api.delete(`/admin/categories/${id}`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to delete category");
  }
}
