import { api } from "./api";

export interface CalculateShippingFeeParams {
  orderId: string;
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface CreateShipmentParams {
  orderId: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  codAmount: number;
  note?: string;
  requiredNote: string;
}

export interface CreateShipmentResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    orderCode: string;
    carrierCode: string;
    carrierOrderCode: string;
    status: string;
    codAmount: number;
    shippingFee: number;
    insuranceValue: number;
    weight: number;
    length: number;
    width: number;
    height: number;
    note: string;
    requiredNote: string;
    expectedDeliveryTime: string;
    isPrinted: boolean;
    createdAt: string;
    updatedAt: string;
  };
  meta: {
    requestId: string;
    timestamptz: string;
  };
}

export interface CalculateShippingFeeResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    service_fee: number;
    insurance_fee: number;
    pick_station_fee: number;
    coupon_value: number;
    r2s_fee: number;
  };
  meta: {
    requestId: string;
    timestamptz: string;
  };
}

export async function calculateShippingFee(
  params: CalculateShippingFeeParams
): Promise<CalculateShippingFeeResponse> {
  const response = await api.post("/admin/shipping/calculate-fee", params);
  return response.data;
}

export async function createShipment(
  params: CreateShipmentParams
): Promise<CreateShipmentResponse> {
  const response = await api.post("/admin/shipping/shipments", params);
  return response.data;
}

export interface PrintLabelParams {
  carrierOrderCodes: string[];
  pageSize: string;
}

export interface PrintLabelResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
  };
  meta: {
    requestId: string;
    timestamptz: string;
  };
}

export async function printLabel(
  params: PrintLabelParams
): Promise<PrintLabelResponse> {
  const response = await api.post("/admin/shipping/print-label", params);
  return response.data;
}
