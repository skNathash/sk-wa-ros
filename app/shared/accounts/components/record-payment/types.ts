export type RecordPaymentFlow = "in" | "out";

export type RecordPaymentEntityType = "customer" | "franchise" | "vendor";

export type RecordPaymentEntity = {
  label: string;
  value: {
    id: string;
    name: string;
    type: RecordPaymentEntityType;
    refId?: string;
    mobile?: string;
    formattedAddress?: string;
    [key: string]: any;
  };
};

export type RecordPaymentAmountDetails = {
  entity: RecordPaymentEntity | null;
  step: RecordPaymentStep;
  outstanding?: number;
  amount?: number;
  paymentMethod: string;
  referenceId: string;
  paidOn: string;
  notes: string;
};

export type RecordPaymentStep = "amount" | "party" | "mode" | "confirm";
