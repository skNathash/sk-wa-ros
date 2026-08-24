/** Peer price payload — `GET catalog/deals/peer-price/{dealId}`. */
export interface PeerPrice {
  dealId?: string;
  dealRefId?: string;
  dealName?: string;
  sellerId?: string;
  sellerRefId?: string;
  sellerName?: string;
  mrp?: number;
  purchasePrice?: number;
  b2cPrice?: number;
  b2bPrice?: number;
  avgNetworkb2c?: number;
  avgNetworkb2b?: number;
}

export type PriceEditType = "customer" | "network";

/** Selling channel the comparison is scoped to. */
export type PriceChannel = "b2c" | "b2b";

/** Bar + label colour, keyed to what the row represents. */
export type PriceTone = "you" | "peer" | "mrp" | "cost";

export type PriceRowData = {
  key: string;
  label: string;
  value: number;
  tone: PriceTone;
  editType?: PriceEditType;
};

export type PriceGroup = {
  key: string;
  title: string;
  rows: PriceRowData[];
};

export const rbacRoles = {
  editPrice: ["CONFIGS.PRICING"],
};

export const TONES: Record<
  PriceTone,
  { label: string; bar: string; amount: string }
> = {
  you: {
    label: "tw:text-blue-600",
    bar: "tw:bg-blue-500",
    amount: "tw:text-blue-600",
  },
  peer: {
    label: "tw:text-violet-600",
    bar: "tw:bg-violet-500",
    amount: "tw:text-violet-600",
  },
  mrp: {
    label: "tw:text-slate-600",
    bar: "tw:bg-slate-500",
    amount: "tw:text-slate-700",
  },
  cost: {
    label: "tw:text-teal-700",
    bar: "tw:bg-teal-400",
    amount: "tw:text-teal-700",
  },
};

/** The selected channel's own price vs. its network average. */
const CHANNEL_GROUPS: Record<PriceChannel, (data: PeerPrice) => PriceGroup> = {
  b2c: (data) => ({
    key: "b2c",
    title: "B2C · Consumer price",
    rows: [
      {
        key: "b2c-you",
        label: "You",
        value: data.b2cPrice || 0,
        tone: "you",
        editType: "customer",
      },
      {
        key: "b2c-seller",
        label: "Seller avg",
        value: data.avgNetworkb2c || 0,
        tone: "peer",
      },
    ],
  }),
  b2b: (data) => ({
    key: "b2b",
    title: "B2B · Network price",
    rows: [
      {
        key: "b2b-you",
        label: "You",
        value: data.b2bPrice || 0,
        tone: "you",
        editType: "network",
      },
      {
        key: "b2b-seller",
        label: "Seller avg",
        value: data.avgNetworkb2b || 0,
        tone: "peer",
      },
    ],
  }),
};

/**
 * The comparison groups for one selling channel — that channel's own price
 * against its network average, plus the MRP / cost anchors both are read
 * against.
 */
export const buildPriceGroups = (
  data: PeerPrice,
  channel: PriceChannel = "b2c",
): PriceGroup[] => [
  CHANNEL_GROUPS[channel](data),
  {
    key: "anchors",
    title: "Reference",
    rows: [
      { key: "mrp", label: "MRP", value: data.mrp || 0, tone: "mrp" },
      {
        key: "cost",
        label: `${data.sellerName || "You"} · your cost`,
        value: data.purchasePrice || 0,
        tone: "cost",
      },
    ],
  },
];

/**
 * Every bar shares one scale, otherwise the rows can't be read against each
 * other — the largest figure on screen becomes full width.
 */
export const getMaxValue = (groups: PriceGroup[]) =>
  Math.max(...groups.flatMap((g) => g.rows.map((r) => r.value)), 0);
