export interface TempPaymentData {
  moduleType: string;
  amount: number;
  transactionId?: string;
  physicalOrder?: {
    cartId: string;
    groups: any[];
    summary: any;
    amount: number;
    allCodOrder: boolean;
    checkoutParams: any;
  };
}
