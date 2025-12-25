import { AxiosError } from "axios";
import { api } from "../api"; 
import { countFrameMaterialsClient } from "./frameMaterialService";
import { countFrameTypesClient } from "./frameTypeService";
import { countFrameShapesClient } from "./frameShapeService";
    
export type BoolFilter = "all" | "true" | "false";

export type ListQuery = {
  search?: string;
  page?: number;
  limit?: number;
  sortField?: "name" | "createdAt";             
  sortOrder?: "ASC" | "DESC";
  isActive?: boolean;
  isDeleted?: boolean;
};

export type Paginated<T> = {
  data: T[];
  meta?: {
    page?: number;
    limit?: number;
    totalItems?: number;
    totalPages?: number;
  };
  hasNext?: boolean;
  hasPrev?: boolean;
};

export const handleError = (err: unknown, msg: string) => {
  const error = err as AxiosError;
  console.error(`${msg}:`, error.response?.data || error.message);
  throw err;
};

export async function getFrameCounts() {
  try {
    const [shapesTotal, typesTotal, materialsTotal] = await Promise.all([
      countFrameShapesClient({ isDeleted: false }),
      countFrameTypesClient({ isDeleted: false }),
      countFrameMaterialsClient({ isDeleted: false }),
    ]);

    return {
      frameShapes: shapesTotal,
      frameTypes: typesTotal,
      frameMaterials: materialsTotal,
    };
  } catch (err) {
    console.error("Failed to fetch frame counts:", err);
    return { frameShapes: 0, frameTypes: 0, frameMaterials: 0 };
  }
}

export async function getTrashFrameCounts() {
  try {
    const [shapesTotal, typesTotal, materialsTotal] = await Promise.all([
      countFrameShapesClient({ isDeleted: true }),
      countFrameTypesClient({ isDeleted: true }),
      countFrameMaterialsClient({ isDeleted: true }),
    ]);

    return {
      frameShapes: shapesTotal,
      frameTypes: typesTotal,
      frameMaterials: materialsTotal,
    };
  } catch (err) {
    console.error("Failed to fetch frame counts:", err);
    return { frameShapes: 0, frameTypes: 0, frameMaterials: 0 };
  }
}

export { api };
