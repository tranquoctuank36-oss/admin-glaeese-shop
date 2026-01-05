import { Voucher } from "./voucher";

export interface OrderItem {
  id: string;
  productVariantId: string;
  productId: string;
  productName: string;
  productVariantName: string;
  sku: string;
  colors: string;
  quantity: number;
  finalPrice: string;
  originalPrice: string;
  thumbnailUrl: string;
}

export interface Order {
  id: string;
  orderCode: string;
  trackingCode: Record<string, any>;
  status: string;
  subtotal: string;
  shippingFee: string;
  voucherOrderDiscount: string;
  voucherShippingDiscount: string;
  grandTotal: string;
  couponCode: string;
  paymentMethod: string;
  customerNote: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  addressLine: string;
  wardName: string;
  districtName: string;
  provinceName: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string;
  cancelReason: string;
  isPrinted?: boolean;
  voucher: Voucher | null;
  items: OrderItem[];
  shippingFeeMerchant: Record<string, any>;
  adminNote: string | Record<string, any> | null;
}

