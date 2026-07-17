export interface AssignDeliveryPayload {
  orderId: string;
  deliveryAgentId: string;
  deliveryProcessType: string;
  orderType: string;
  orderValue: number;
  deliveryAgentType: string;
  remarks?: string;
  invoiceId: string;
}
