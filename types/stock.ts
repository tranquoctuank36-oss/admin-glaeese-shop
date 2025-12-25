export interface Stock {
  id: string;
  productVariant: {
    id: string;
    name: string;
    sku: string;
    quantityAvailable: number;
    finalPrice: string;
    originalPrice: string;
    images: {
      id: string;
      publicUrl: string;
      altText: string;
      sortOrder: number;
    }[];
  };
  quantityOnHand: number;
  quantityReserved: number;
  safetyStock: number;
  quantityAvailable: number;
  stockStatus: "unknown" | "out_of_stock" | "low_stock" | "in_stock";
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  type: "inbound" | "outbound" | "adjustment" | "transfer";
  stockId: string;
  deltaQuantity: number;
  quantityAfter: number;
  referenceType: string;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
}

export interface CreateStockMovementPayload {
  deltaQuantity: number;
  type: "inbound" | "outbound" | "adjustment" | "transfer";
  referenceType: string;
  referenceId?: string | null;
  note?: string | null;
}

export interface UpdateStockConfigPayload {
  safetyStock: number;
}
