export type Item = {
  _id: string;
  productName: string;
  brandName: string;
  categoryName: string;
  mrp: number;
  price: number;
  weight?: number;
  unitType: string;
  barcode: string;
  hsn?: string;
  gst?: number;
  description: string;
  images?: string[];
  isConsumerOffer?: boolean;
  consumerOfferData?: string | null;
  consumerOfferPrice?: number | null;
};

export type FieldType =
  | "text"
  | "amount"
  | "image"
  | "boolean"
  | "percent"
  /** rich text arriving from the API as an HTML string */
  | "html";

export type CompareField = {
  key: string;
  label: string;
  type: FieldType;
  /** value as submitted by the retailer */
  submitted: any;
  /** value finalised by the StoreKing team */
  final: any;
  /** true when StoreKing changed the retailer's value */
  changed: boolean;
  /** span the full width of the grid (long form values) */
  wide?: boolean;
};

/** Strips tags/entities so `<p>&nbsp;</p>` reads as empty rich text. */
export const htmlToText = (v: any) =>
  typeof v === "string"
    ? v
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";

const isEmpty = (v: any, type?: FieldType) => {
  if (type === "html") return !htmlToText(v);
  return (
    v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)
  );
};

/** Normalised comparison — tolerant of "12" vs 12 and of image array order. */
export const isSameValue = (a: any, b: any, type: FieldType) => {
  if (isEmpty(a, type) && isEmpty(b, type)) return true;
  if (isEmpty(a, type) !== isEmpty(b, type)) return false;
  // compare rendered text so markup-only differences aren't flagged as edits
  if (type === "html") return htmlToText(a) === htmlToText(b);
  if (type === "image") {
    const l = Array.isArray(a) ? [...a].sort().join(",") : "";
    const r = Array.isArray(b) ? [...b].sort().join(",") : "";
    return l === r;
  }
  if (type === "amount" || type === "percent") {
    return Number(a ?? 0) === Number(b ?? 0);
  }
  if (type === "boolean") return Boolean(a) === Boolean(b);
  return String(a ?? "").trim() === String(b ?? "").trim();
};

const weightOf = (item: Partial<Item>) =>
  isEmpty(item.weight) ? "" : `${item.weight} ${item.unitType || ""}`.trim();

/**
 * Ordered field list shared by every comparison view, so the retailer's
 * submission and the StoreKing team's result always line up row for row.
 */
export const buildCompareFields = (
  submitted: Partial<Item>,
  final: Partial<Item>
): CompareField[] => {
  const rows: Array<Omit<CompareField, "changed">> = [
    {
      key: "productName",
      label: "Item Name",
      type: "text",
      submitted: submitted.productName,
      final: final.productName,
      wide: true,
    },
    {
      key: "brandName",
      label: "Brand",
      type: "text",
      submitted: submitted.brandName,
      final: final.brandName,
    },
    {
      key: "categoryName",
      label: "Category",
      type: "text",
      submitted: submitted.categoryName,
      final: final.categoryName,
    },
    {
      key: "mrp",
      label: "MRP",
      type: "amount",
      submitted: submitted.mrp,
      final: final.mrp,
    },
    {
      key: "price",
      label: "Price",
      type: "amount",
      submitted: submitted.price,
      final: final.price,
    },
    {
      key: "weight",
      label: "Weight",
      type: "text",
      submitted: weightOf(submitted),
      final: weightOf(final),
    },
    {
      key: "unitType",
      label: "Unit Type",
      type: "text",
      submitted: submitted.unitType,
      final: final.unitType,
    },
    {
      key: "barcode",
      label: "Barcode",
      type: "text",
      submitted: submitted.barcode,
      final: final.barcode,
    },
    {
      key: "hsn",
      label: "HSN",
      type: "text",
      submitted: submitted.hsn,
      final: final.hsn,
    },
    {
      key: "gst",
      label: "GST",
      type: "percent",
      submitted: submitted.gst,
      final: final.gst,
    },
    {
      key: "isConsumerOffer",
      label: "Consumer Offer",
      type: "boolean",
      submitted: submitted.isConsumerOffer,
      final: final.isConsumerOffer,
    },
  ];

  if (submitted.isConsumerOffer || final.isConsumerOffer) {
    rows.push(
      {
        key: "consumerOfferData",
        label: "Offer Title",
        type: "text",
        submitted: submitted.consumerOfferData,
        final: final.consumerOfferData,
        wide: true,
      },
      {
        key: "consumerOfferPrice",
        label: "Offer Price",
        type: "amount",
        submitted: submitted.consumerOfferPrice,
        final: final.consumerOfferPrice,
      }
    );
  }

  rows.push(
    {
      key: "description",
      label: "Description",
      type: "html",
      submitted: submitted.description,
      final: final.description,
      wide: true,
    },
    {
      key: "images",
      label: "Images",
      type: "image",
      submitted: submitted.images,
      final: final.images,
      wide: true,
    }
  );

  return rows.map((r) => ({
    ...r,
    changed: !isSameValue(r.submitted, r.final, r.type),
  }));
};

/** Field list for a single-sided (submission only) view. */
export const buildDetailFields = (item: Partial<Item>): CompareField[] =>
  buildCompareFields(item, item);
