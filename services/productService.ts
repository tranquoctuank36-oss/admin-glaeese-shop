// services/productService.ts
import { AxiosError } from "axios";
import { api } from "./api";
import type { Gender, Product, UUID } from "@/types/product";

const handleError = (err: unknown, msg: string) => {
  const e = err as AxiosError;
  console.error(`${msg}:`, e.response?.data || e.message);
  throw err;
};

export type Order = "ASC" | "DESC";

export type ProductListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: "name" | "createdAt";
  sortOrder?: Order;
  isDeleted?: boolean;

  productTypes?: string[];
  genders?: Gender[];
  frameShapesIds?: UUID[];
  frameTypesIds?: UUID[];
  frameMaterialsIds?: UUID[];
  brandsIds?: UUID[];
  categoriesIds?: UUID[];
  tagsIds?: UUID[];

  minLenseWidth?: number;  maxLenseWidth?: number;
  minBridgeWidth?: number; maxBridgeWidth?: number;
  minTempleLength?: number; maxTempleLength?: number;
  minLensHeight?: number;  maxLensHeight?: number;

  minPrice?: string;
  maxPrice?: string;

  status?: Array<"draft" | "published" | "unlisted" | "archived">;
};

export type PaginatedProducts = {
  data: Product[];
  meta?: {
    totalPages?: number;
    totalItems?: number;
    page?: number;
    limit?: number;
  };
  hasNext?: boolean;
  hasPrev?: boolean;
};

function toProduct(row: any): Product {
  if (!row) return {} as Product;

  const { status, frameDetail, variants, thumbnail_url, thumbnailUrl, ...rest } = row;

  return {
    ...rest,
    productStatus: status ?? null,
    thumbnailUrl: thumbnail_url ?? thumbnailUrl ?? null,
    // Map frameDetail fields to root level
    lensWidth: frameDetail?.lensWidth ?? null,
    lensHeight: frameDetail?.lensHeight ?? null,
    bridgeWidth: frameDetail?.bridgeWidth ?? null,
    templeLength: frameDetail?.templeLength ?? null,
    frameShape: frameDetail?.frameShape ?? null,
    frameType: frameDetail?.frameType ?? null,
    frameMaterial: frameDetail?.frameMaterial ?? null,
    // Map variants to productVariants and map images field
    productVariants: variants?.map((v: any) => ({
      ...v,
      productImages: v.images ?? v.productImages ?? [],
    })) ?? [],
  } as Product;
}


function buildListParams(q: ProductListQuery) {
  const params: Record<string, any> = {};

  if (q.page) params.page = q.page;
  if (q.limit) params.limit = q.limit;
  if (Array.isArray(q.status)) {
    const arr = q.status.filter(Boolean);
    if (arr.length > 0) params.status = arr;
  }
  if (q.search && q.search.trim()) params.search = q.search.trim();
  if (typeof q.isDeleted === "boolean") params.isDeleted = q.isDeleted;

  if (q.sortOrder) params.sortOrder = q.sortOrder;

  const sortFieldMap: Record<NonNullable<ProductListQuery["sortField"]>, string> = {
    name: "name",
    createdAt: "createdAt",
  };
  params.sortField = q.sortField ? sortFieldMap[q.sortField] : "createdAt";

  const copy = [
    "productTypes","genders","frameShapesIds","frameTypesIds","frameMaterialsIds",
    "brandsIds","categoriesIds","tagsIds",
    "minLenseWidth","maxLenseWidth","minBridgeWidth","maxBridgeWidth",
    "minTempleLength","maxTempleLength","minLensHeight","maxLensHeight",
    "minPrice","maxPrice",
  ] as const;
  for (const k of copy) {
    const v = (q as any)[k];
    if (v !== undefined && v !== null && `${v}` !== "") params[k] = v;
  }

  return params;
}


export async function getProducts(q: ProductListQuery = {}): Promise<PaginatedProducts> {
  try {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;

    const res = await api.get("/admin/products", {
      params: buildListParams({ ...q, page, limit }),
      headers: { Accept: "application/json" },
    });

    const payload = res .data ?? {};
    const rows: any[] = payload.data ?? payload.rows ?? [];
    const totalItems: number | undefined =
      payload.total ?? payload.meta?.total ?? payload.meta?.totalItems ?? undefined;

    const limitFromRes: number = payload.limit ?? payload.meta?.limit ?? limit;
    const pageFromRes: number = payload.page ?? payload.meta?.page ?? page;

    const totalPages: number | undefined =
      typeof totalItems === "number" && limitFromRes
        ? Math.ceil(totalItems / limitFromRes)
        : payload.meta?.totalPages;

    const hasNext =
      totalPages != null
        ? pageFromRes < totalPages
        : rows.length === limitFromRes;

    const hasPrev = pageFromRes > 1;

    return {
      data: rows.map(toProduct),
      meta: { totalPages, totalItems, page: pageFromRes, limit: limitFromRes },
      hasNext,
      hasPrev,
    };
  } catch (err) {
    return handleError(err, "Failed to fetch products");
  }
}

export const getProductById = async (id: UUID, includeDeleted: boolean = false): Promise<Product> => {
  try {
    const params: any = {};
    if (includeDeleted) {
      params.isDeleted = true;
    }
    const res = await api.get(`/admin/products/${id}`, {
      params,
      headers: { Accept: "application/json" },
    });
    return toProduct(res.data?.data ?? res.data);
  } catch (err) {
    return handleError(err, "Failed to fetch product by ID");
  }
};

export const createProduct = async (data: Partial<Product>) => {
  try {
    const res = await api.post(`/admin/products`, data);
    return toProduct(res.data?.data ?? res.data);
  } catch (err) {
    return handleError(err, "Failed to create product");
  }
};

export const updateProduct = async (id: UUID, data: Partial<Product>) => {
  try {
    const res = await api.patch(`/admin/products/${id}`, data);
    return toProduct(res.data?.data ?? res.data);
  } catch (err) {
    return handleError(err, "Failed to update product");
  }
};

export const softDeleteProduct = async (id: UUID) => {
  try {
    const res = await api.delete(`/admin/products/${id}`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to soft delete product");
  }
};

export const restoreProduct = async (id: UUID) => {
  try {
    const res = await api.patch(`/admin/products/${id}/restore`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to restore product");
  }
};

export const forceDeleteProduct = async (id: UUID) => {
  try {
    const res = await api.delete(`/admin/products/${id}/force`);
    return res.data?.data ?? null;
  } catch (err) {
    return handleError(err, "Failed to permanently delete product");
  }
};

export const getProductCounts = async () => {
  try {
    const res = await api.get(`/admin/products/statistics`);
    return res.data ?? {};
  } catch (err) {
    console.error("Failed to fetch product counts:", err);
    return {};
  }
};

export const countTrashProductsClient = async (baseQuery: Partial<ProductListQuery> = {}) => {
  let page = 1;
  const limit = 500;
  let total = 0;
  while (true) {
    const { data, hasNext } = await getProducts({ ...baseQuery, page, limit, isDeleted: true });
    total += data.length;
    if (!hasNext) break;
    page += 1;
  }
  return total;
};

export const getVariantsByProductId = async (productId: string, isDeleted: boolean = false) => {
  try {
    const res = await api.get(`/admin/products-variants`, {
      params: {
        productId,
        isDeleted,
        limit: 100,
      },
      headers: { Accept: "application/json" },
    });
    const variants = res.data?.data ?? res.data?.rows ?? res.data ?? [];
    // Ensure isDeleted flag is set correctly and map images field
    return variants.map((v: any) => ({ 
      ...v, 
      isDeleted: isDeleted || v.isDeleted,
      productImages: v.images ?? v.productImages ?? [],
    }));
  } catch (err) {
    return handleError(err, "Failed to fetch variants");
  }
};

export const createVariant = async (productId: string, data: any) => {
  try {
    const res = await api.post(`/admin/products/${productId}/variants`, data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return handleError(err, "Failed to create variant");
  }
};

export const addImagesToVariant = async (variantId: string, imageIds: string[]) => {
  try {
    const res = await api.post(`/admin/products-variants/${variantId}/images`, {
      productImageIds: imageIds,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    return handleError(err, "Failed to add images to variant");
  }
};

export const removeImagesFromVariant = async (variantId: string, imageIds: string[]) => {
  try {
    const res = await api.delete(`/admin/products-variants/${variantId}/images`, {
      data: {
        productImageIds: imageIds,
      },
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    return handleError(err, "Failed to remove images from variant");
  }
};

export const updateVariant = async (variantId: string, data: any) => {
  try {
    const res = await api.patch(`/admin/products-variants/${variantId}`, data);
    return res.data?.data ?? res.data;
  } catch (err) {
    return handleError(err, "Failed to update variant");
  }
};

export const softDeleteVariant = async (variantId: string) => {
  try {
    const res = await api.delete(`/admin/products-variants/${variantId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    return handleError(err, "Failed to soft delete variant");
  }
};

export const restoreVariant = async (variantId: string) => {
  try {
    const res = await api.patch(`/admin/products-variants/${variantId}/restore`);
    return res.data?.data ?? res.data;
  } catch (err) {
    return handleError(err, "Failed to restore variant");
  }
};

export const updateVariantsOrder = async (productId: string, variantIdsInNewOrder: string[]) => {
  try {
    const res = await api.patch(`/admin/products/${productId}/variants-order`, {
      variantIdsInNewOrder,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    return handleError(err, "Failed to update variants order");
  }
};

export const updateVariantImagesOrder = async (variantId: string, productImageIds: string[]) => {
  try {
    const res = await api.patch(`/admin/products-variants/${variantId}/images-order`, {
      productImageIds,
    });
    return res.data?.data ?? res.data;
  } catch (err) {
    return handleError(err, "Failed to update variant images order");
  }
};

// Keep old name for backward compatibility
export const deleteVariant = softDeleteVariant;
