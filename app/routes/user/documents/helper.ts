/**
 * Normalises the franchise profile response into the flat list of document
 * cards the page renders — one entry per document (or per missing
 * requirement), already carrying every display field so the JSX stays free of
 * derivation logic.
 */

import { format, isValid } from "date-fns";

export type DocStatus = "verified" | "pending" | "rejected" | "missing";

/** Proof containers under `franchise.documents`. */
export type ProofType = "photo" | "business" | "address";

export interface DocumentImage {
  id: string;
  face: string;
  status: string;
  remarks: string;
}

export interface DocumentItem {
  key: string;
  /** Two-letter tile shown in place of a thumbnail. */
  initials: string;
  title: string;
  /** Facet label — mirrors the proof container: "ID proof", "FSSAI"… */
  type: string;
  status: DocStatus;
  statusLabel: string;
  reference: string;
  expires: string;
  images: DocumentImage[];
  /** Tailwind classes for the initials tile. */
  accent: string;
  /** Container to preselect when the card's Upload action opens the modal. */
  proofType?: ProofType;
  /** Why the document is needed — shown on missing cards. */
  hint?: string;
  /** Missing cards that are fixed elsewhere (e.g. FSSAI) link out instead. */
  redirect?: string;
  /** Latest reviewer remark across the card's images. */
  remarks: string;
}

export interface DocumentsModel {
  items: DocumentItem[];
  /** Counts keyed by status, plus `all`. */
  counts: Record<"all" | DocStatus, number>;
  /** Facet rows for the type list, in descending count order. */
  types: Array<{ type: string; count: number }>;
  /** Missing documents, in the order the store should fix them. */
  missing: DocumentItem[];
}

interface CategoryConfig {
  proofType: ProofType;
  type: string;
  nameKey: string;
  noKey: string;
  fileKey: string;
  statusKey: string;
  remarksKey: string;
  accent: string;
  /** Card shown when the container holds nothing. */
  missingTitle: string;
  missingHint: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    proofType: "photo",
    type: "ID proof",
    nameKey: "photoID",
    noKey: "photoIDNo",
    fileKey: "photoIDFile",
    statusKey: "photoIdStatus",
    remarksKey: "photoIDComment",
    accent: "tw:bg-indigo-50 tw:text-indigo-700",
    missingTitle: "ID proof",
    missingHint: "Aadhaar, PAN or voter ID of the owner",
  },
  {
    proofType: "business",
    type: "Business proof",
    nameKey: "businessID",
    noKey: "businessIDNo",
    fileKey: "businessIDFile",
    statusKey: "businessIDStatus",
    remarksKey: "businessIDComment",
    accent: "tw:bg-emerald-50 tw:text-emerald-700",
    missingTitle: "Business proof",
    missingHint: "GST certificate, trade licence or shop act",
  },
  {
    proofType: "address",
    type: "Address proof",
    nameKey: "addressProof",
    noKey: "addressProofNo",
    fileKey: "addressProofFile",
    statusKey: "addressProofIdStatus",
    remarksKey: "addressProofComment",
    accent: "tw:bg-violet-50 tw:text-violet-700",
    missingTitle: "Address proof",
    missingHint: "Electricity bill or rent agreement of the store",
  },
];

const STATUS_LABELS: Record<DocStatus, string> = {
  verified: "Verified",
  pending: "Pending",
  rejected: "Rejected",
  missing: "Missing",
};

/** First letters of the first two words, e.g. "GST Certificate" → "GC". */
const getInitials = (title: string) => {
  const initials = (title || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
  return initials || "DC";
};

/** Expiry dates arrive as ISO strings; anything unparseable shows as a dash. */
const formatExpiry = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return isValid(date) ? format(date, "dd MMM yyyy") : "—";
};

/** Approved wins over pending — a card is verified once any face is approved. */
const resolveStatus = (statuses: string[]): DocStatus => {
  if (statuses.some((s) => s === "Approved")) return "verified";
  if (statuses.some((s) => s === "Rejected")) return "rejected";
  return "pending";
};

const buildItem = (item: Omit<DocumentItem, "statusLabel">): DocumentItem => ({
  ...item,
  statusLabel: STATUS_LABELS[item.status],
});

/** Groups one proof container into a card per document name + number. */
const buildCategoryItems = (
  docs: any[],
  config: CategoryConfig,
): DocumentItem[] => {
  const groups = new Map<string, DocumentItem>();

  docs.forEach((doc) => {
    if (!doc) return;
    const title = doc[config.nameKey] || "Document";
    const reference = doc[config.noKey] || "";
    const fileId = doc[config.fileKey];
    if (!fileId) return;

    const key = `${config.proofType}::${title}::${reference}`;
    if (!groups.has(key)) {
      groups.set(
        key,
        buildItem({
          key,
          initials: getInitials(title),
          title,
          type: config.type,
          status: "pending",
          reference: reference || "—",
          expires: "—",
          images: [],
          accent: config.accent,
          proofType: config.proofType,
          remarks: "",
        }),
      );
    }

    const group = groups.get(key)!;
    group.images.push({
      id: fileId,
      face: doc.documentFace || "",
      status: doc[config.statusKey] || "Pending",
      remarks: doc[config.remarksKey] || "",
    });
    if (!group.remarks && doc[config.remarksKey]) {
      group.remarks = doc[config.remarksKey];
    }
  });

  return Array.from(groups.values()).map((group) => {
    const status = resolveStatus(group.images.map((img) => img.status));
    return { ...group, status, statusLabel: STATUS_LABELS[status] };
  });
};

/**
 * FSSAI is not stored in `documents` — it is requested through the profile
 * update log, so the card mirrors the latest FSSAI request.
 */
const buildFssaiItem = (profile: any): DocumentItem => {
  const logs: any[] = Array.isArray(profile?.profileUpdateRequest)
    ? profile.profileUpdateRequest.filter(
        (l: any) => l?.type === "FSSAI_UPDATE",
      )
    : [];
  const approved = logs.find(
    (l) => String(l?.status).toLowerCase() === "approved",
  );
  const pending = logs.find(
    (l) => String(l?.status).toLowerCase() === "pending",
  );
  const source = approved || pending;
  const value = source?.value || {};
  const docs: string[] = Array.isArray(value.docs) ? value.docs : [];

  const status: DocStatus = approved
    ? "verified"
    : pending
      ? "pending"
      : "missing";

  return buildItem({
    key: "food-safety::fssai",
    initials: "FS",
    title: "FSSAI license",
    type: "FSSAI",
    status,
    reference: value.licenseNo || profile?.fssaiLicense || "—",
    expires: formatExpiry(value.validity),
    images: docs.map((id) => ({
      id,
      face: "",
      status: approved ? "Approved" : "Pending",
      remarks: "",
    })),
    accent: "tw:bg-rose-50 tw:text-rose-700",
    hint: "Only if you sell food",
    redirect: "/user/my-profile",
    remarks: source?.comment || "",
  });
};

/**
 * Builds every card the documents page shows: the uploaded proofs, plus a
 * missing placeholder for each proof container the store has not filled yet.
 */
export const buildDocumentsModel = (profile: any): DocumentsModel => {
  const documents = profile?.documents || {};
  const items: DocumentItem[] = [];

  CATEGORIES.forEach((config) => {
    const raw = Array.isArray(documents[config.proofType])
      ? documents[config.proofType]
      : [];
    const categoryItems = buildCategoryItems(raw, config);
    if (categoryItems.length) {
      items.push(...categoryItems);
      return;
    }
    items.push(
      buildItem({
        key: `${config.proofType}::missing`,
        initials: getInitials(config.missingTitle),
        title: config.missingTitle,
        type: config.type,
        status: "missing",
        reference: "—",
        expires: "—",
        images: [],
        accent: config.accent,
        proofType: config.proofType,
        hint: config.missingHint,
        remarks: "",
      }),
    );
  });

  items.push(buildFssaiItem(profile));

  const counts = items.reduce(
    (acc, item) => {
      acc.all += 1;
      acc[item.status] += 1;
      return acc;
    },
    { all: 0, verified: 0, pending: 0, rejected: 0, missing: 0 },
  );

  const typeMap = new Map<string, number>();
  items.forEach((item) => {
    typeMap.set(item.type, (typeMap.get(item.type) || 0) + 1);
  });
  const types = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));

  return {
    items,
    counts,
    types,
    missing: items.filter((item) => item.status === "missing"),
  };
};

/** Case-insensitive match on the document name and its reference number. */
export const matchesSearch = (item: DocumentItem, term: string) => {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return (
    item.title.toLowerCase().includes(q) ||
    item.reference.toLowerCase().includes(q) ||
    item.type.toLowerCase().includes(q)
  );
};
