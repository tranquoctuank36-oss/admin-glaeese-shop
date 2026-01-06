import { ImageItem } from "@/types/image";
import { api } from "./api";
import { AxiosError } from "axios";

export const handleError = (err: unknown, msg: string) => {
  const error = err as AxiosError;
  console.error(`${msg}:`, error.response?.data || error.message);
  throw err;
};

export type PresignRequest = {
  ownerType: "product_variant" | "brand" | "discount" | "banner" | "review" | "order_return";
  contentType: string;     // ví dụ: "image/jpeg"
};

export type PresignResponse = {
  imageId: string;
  putUrl: string;
  publicUrl: string;
  key?: string;
  contentType?: string;
};

export type ImageListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "draft" | "used" | "all";
  ownerType?: "product_variant" | "brand" | "discount" | "all";
  sortField?: "createdAt" | "name";
  sortOrder?: "ASC" | "DESC";
};

export type PaginatedImages = {
  data: ImageItem[];
  meta?: {
    itemCount?: number;
    currentPage?: number;
    itemsPerPage?: number;
    totalItems?: number;
    totalPages?: number;
  };
};

function toImage(row: any): ImageItem {
  if (!row) return row;
  return {
    id: row.id,
    publicUrl: row.publicUrl ?? row.public_url,
    altText: row.altText ?? row.alt_text ?? null,
    sortOrder: row.sortOrder ?? row.sort_order ?? null,
    key: row.key,
    status: row.status ?? "all",
    ownerType: row.ownerType ?? row.owner_type ?? "all",
    createdAt: row.createdAt ?? row.created_at,
  };
}

function buildListParams(q: ImageListQuery) {
  const params: any = {};
  
  if (q.search) params.search = q.search;
  if (q.page) params.page = q.page;
  if (q.limit) params.limit = q.limit;
  if (q.status && q.status !== "all") params.status = q.status;
  if (q.ownerType && q.ownerType !== "all") params.ownerType = q.ownerType;
  if (q.sortField) params.sortField = q.sortField;
  if (q.sortOrder) params.sortOrder = q.sortOrder;

  return params;
}

export async function getImages(q: ImageListQuery = {}): Promise<PaginatedImages> {
  try {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    const res = await api.get("/admin/images", {
      params: buildListParams({ ...q, page, limit }),
    });

    const payload = res.data ?? {};
    const rows: any[] = payload.data ?? payload.rows ?? [];

    return {
      data: rows.map(toImage),
      meta: payload.meta ?? {},
    };
  } catch (err) {
    return handleError(err, "Failed to fetch images");
  }
}

export async function getPresignedUrl(
  body: PresignRequest
): Promise<PresignResponse> {
  const res = await api.post("/admin/images/presigned-url", body);
  return res.data?.data as PresignResponse;
}

export async function uploadWithPresignedUrl(
  putUrl: string,
  file: File,
  contentType: string
): Promise<void> {
  const r = await fetch(putUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!r.ok) throw new Error(`Upload failed: ${r.status} ${r.statusText}`);
}

export interface UploadImageResponse {
  id: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export async function uploadImage(
  file: File,
  ownerType: "product_variant" | "brand" | "discount" | "banner" | "review" | "order_return"
): Promise<UploadImageResponse> {
  try {
    // Step 1: Get presigned URL from backend
    const response = await api.post("/admin/images/presigned-url", {
      contentType: file.type,
      ownerType: ownerType,
    });

    const { imageId, putUrl, publicUrl } = response.data.data;

    // Step 2: Upload file to presigned URL
    await fetch(putUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    // Step 3: Return image information
    return {
      id: imageId,
      publicUrl: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (error: any) {
    console.error("Upload image failed:", error.response || error.message);
    throw error;
  }
}

export async function deleteImage(id: string): Promise<void> {
  try {
    await api.delete(`/admin/images/${id}`);
  } catch (err) {
    return handleError(err, "Failed to delete image");
  }
}

export async function bulkDeleteImages(imageIds: string[]): Promise<void> {
  try {
    await api.delete("/admin/images", {
      data: { imageIds },
    });
  } catch (err) {
    return handleError(err, "Failed to bulk delete images");
  }
}
