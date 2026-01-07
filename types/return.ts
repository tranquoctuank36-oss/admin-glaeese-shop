export interface ReturnImage {
  id: string;
  publicUrl: string;
  altText: string;
  sortOrder: number;
}

export interface Return {
  id: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  orderCode: string;
  returnCode: string;
  reason: string;
  customerNote: string | Record<string, any> | null;
  refundAmount: string | Record<string, any> | null;
  calculatedRefundAmount: string | Record<string, any> | null;
  bankAccountName: string | Record<string, any> | null;
  bankAccountNumber: string | Record<string, any> | null;
  bankName: string | Record<string, any> | null;
  bankBranch: string | Record<string, any> | null;
  status: 'requested' | 'approved' | 'waiting_item' | 'received_at_warehouse' | 'qc_pass' | 'qc_fail' | 'completed' | 'rejected' | 'canceled';
  rejectedReason: string | Record<string, any> | null;
  refundCompletedAt: string | Record<string, any> | null;
  receivedAt: string | Record<string, any> | null;
  qcResult: string | Record<string, any> | null;
  qcNote: string | Record<string, any> | null;
  qcAt: string | Record<string, any> | null;
  shouldRefund: boolean;
  completedAt: string | Record<string, any> | null;
  images: ReturnImage[];
  adminNote: string | Record<string, any> | null;
  order?: {
    id: string;
    code: string;
    grandTotal: string;
    paymentMethod: string;
    recipientName: string;
    recipientPhone: string; 
  };
}
