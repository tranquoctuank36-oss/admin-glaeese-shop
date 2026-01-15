export interface Refund {
  id: string;
  refundCode: string;
  orderCode: string;
  createdAt: string;
  updatedAt: string;
  orderId: Record<string, any>; 
  paymentId: Record<string, any>;
  orderReturnId: Record<string, any>;
  refundType: "online_payment" | "bank_transfer";
  trigger: "return" | "manual" | "cancel_order";
  amount: string;
  status: "pending" | "approved" | "rejected" | "processing" | "success" | "failed" | "cancelled";
  reason: Record<string, any>;
  rejectedReason: Record<string, any>;
  approvedAt: Record<string, any>;
  completedAt: Record<string, any>;
  bankAccountName: Record<string, any>;
  bankAccountNumber: Record<string, any>;
  bankName: Record<string, any>;
  providerTransactionId: string;
  requestedBy: Record<string, any>;
  approvedBy: Record<string, any>;
  completedBy: Record<string, any>;
  providerResponseCode: string;
  meta: Record<string, any>;
}
