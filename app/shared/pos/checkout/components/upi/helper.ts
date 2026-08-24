import FranchiseService from "~/services/FranchiseService";

/** One configured collection rail, flattened for the picker and the QR panel. */
export type UpiConfig = {
  /** `paymentMethod` on the config — what the order payload calls `paidVia`. */
  value: string;
  label: string;
  refCode: string;
  merchantName: string;
  /** Asset id of the QR image, absent when the store never uploaded one. */
  qrAssetId?: string;
  note: string;
};

/**
 * The store's configured payment modes (Settings › Payment config). The same
 * `franchise/order/config` read the b2c-checkout payment step uses — flattened
 * here so the UI never digs through the raw response.
 */
export const fetchUpiConfigs = async (): Promise<UpiConfig[]> => {
  const response = await FranchiseService.getConfigs();
  const configs = response.data?.data?.[0]?.paymentMethodConfig || [];

  return configs
    .filter((config: any) => config?.paymentMethod)
    .map((config: any) => ({
      value: config.paymentMethod,
      label: config.displayName || config.paymentMethod,
      refCode: config.refCode || "",
      merchantName: config.merchantName || "",
      qrAssetId: config.images?.[0] || undefined,
      note: config.additionalNotes || "",
    }));
};
