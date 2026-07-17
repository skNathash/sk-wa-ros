export interface PurchaseOrderVendor {
  id: string;
  name: string;
  mobile?: string;
  email?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  gstNumber?: string;
}

export interface PurchaseOrderItem {
  dealId: string;
  pid: string;
  name: string;
  barcode: string;
  hsn?: string;
  mrp: number;
  price: number;
  sellingPrice: number;
  discount: number;
  requestedQuantity: number;
  receivedQuantity: number;
  pendingQuantity: number;
  status: "Pending" | "Partially Received" | "Received" | "Cancelled";
  currentStock: number;
  pendingOrder: number;
  openPo: number;
  suggested: number;
  taxInfo: {
    gst: number;
  };
  shelfLife?: string;
  purchasedIn?: {
    fifteenDays: number;
    thirtyDays: number;
    sixtyDays: number;
  };
  unitType?: string;
  packSize?: number;
  uom?: string;
  sellInLooseQty?: boolean;
  allowedUnitTypes?: string[];
  preferredUnitType?: string;
}

export interface PurchaseOrderPayment {
  invoiceAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  status: "Pending" | "Paid" | "Partially Paid";
}

export interface PurchaseOrder {
  _id: string;
  franchiseId: string;
  vendorDetails: PurchaseOrderVendor;
  invoiceDetails: PurchaseOrderItem[];
  status:
    | "Draft"
    | "Approval Pending"
    | "Approved"
    | "Partially Received"
    | "Received"
    | "Received - Payment Pending"
    | "Cancelled";
  totalValue: number;
  totalItems: number;
  totalQuantity: number;
  receivedValue: number;
  pendingValue: number;
  paymentSettlement?: PurchaseOrderPayment[];
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  // Computed fields
  _statusColor?: string;
  _statusLabel?: string;
  _formattedCreatedAt?: Date;
  _formattedUpdatedAt?: Date;
  _totalItems?: number;
  _totalQuantity?: number;
  _totalPaidAmount?: number;
  _pendingPayment?: number;
}

export interface PurchaseOrderSummary {
  status: string;
  label: string;
  color: string;
  count: number;
  totalValue: number;
  totalQuantity: number;
  value: number;
  priority: number;
  orders: PurchaseOrder[];
}

export interface PurchaseOrderFilter {
  search?: string;
  dateRange?: Date[] | null;
  status?: string;
  vendorId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PurchaseOrderListParams {
  page?: number;
  count?: number;
  sort?: Record<string, 1 | -1>;
  filter?: Record<string, any>;
  groupBy?: string;
  outputType?: "list" | "count" | "summary";
}

export interface PurchaseOrderIntakeSummary {
  poId: string;
  invoiceNumber: string;
  invoiceDate: string;
  productList: Array<{
    dealId: string;
    name: string;
    barcode: string;
    requestedQuantity: number;
    receivedQuantity: number;
    price: number;
    mrp: number;
    shelfLife: string;
    unitType: string;
    packSize: number;
    UoM: string;
    sellInLooseQty: boolean;
    _totalValue: number;
    _displayUnitType: string;
    _shelfLifeLeftDays: number;
  }>;
  totalValue: number;
  receivedValue: number;
  pendingValue: number;
}

export interface PurchaseOrderCreatePayload {
  vendorDetails: PurchaseOrderVendor;
  invoiceDetails: Omit<
    PurchaseOrderItem,
    "_id" | "receivedQuantity" | "pendingQuantity"
  >[];
  expectedDeliveryDate?: string;
  notes?: string;
  status: "Draft" | "Approval Pending";
}

export interface PurchaseOrderReceivePayload {
  poId: string;
  invoiceNumber: string;
  invoiceDate: string;
  receivedItems: Array<{
    dealId: string;
    receivedQuantity: number;
    shelfLife?: string;
    damageQuantity?: number;
    damageReason?: string;
    shortageQuantity?: number;
  }>;
  notes?: string;
}

// Status type guards
export const isPurchaseOrderDraft = (po: PurchaseOrder): boolean =>
  po.status === "Draft";
export const isPurchaseOrderPending = (po: PurchaseOrder): boolean =>
  po.status === "Approval Pending";
export const isPurchaseOrderApproved = (po: PurchaseOrder): boolean =>
  po.status === "Approved";
export const isPurchaseOrderReceived = (po: PurchaseOrder): boolean =>
  po.status === "Received";
export const isPurchaseOrderPartiallyReceived = (po: PurchaseOrder): boolean =>
  po.status === "Partially Received";
export const isPurchaseOrderPaymentPending = (po: PurchaseOrder): boolean =>
  po.status === "Received - Payment Pending";
export const isPurchaseOrderCancelled = (po: PurchaseOrder): boolean =>
  po.status === "Cancelled";

// Status helpers
export const canEditPurchaseOrder = (po: PurchaseOrder): boolean =>
  isPurchaseOrderDraft(po) || isPurchaseOrderPending(po);

export const canReceivePurchaseOrder = (po: PurchaseOrder): boolean =>
  isPurchaseOrderApproved(po) || isPurchaseOrderPartiallyReceived(po);

export const canCancelPurchaseOrder = (po: PurchaseOrder): boolean =>
  isPurchaseOrderDraft(po) ||
  isPurchaseOrderPending(po) ||
  isPurchaseOrderApproved(po);
