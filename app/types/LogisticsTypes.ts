export interface AssignDeliveryPayload {
  orderId: string;
  deliveryAgentId: string;
  deliveryAgentType: string;
  invoiceId: string;
  /* Marketplace hires post the four identifying keys alone; the internal
     dispatch desks add the order context below. */
  deliveryProcessType?: string;
  orderType?: string;
  orderValue?: number;
  remarks?: string;
}
