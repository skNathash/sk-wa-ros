/**
 * Normalises the franchise profile into the model the theme-2 profile
 * overview renders — the identity card's fields, the KYC checklist and the
 * stat tiles — so the components stay free of derivation logic.
 */

import { differenceInDays, differenceInYears, format, isValid } from "date-fns";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import OmsService from "~/services/OmsService";
import ProfileScoreService from "~/services/ProfileScoreService";
import RbacService from "~/services/RbacService";

export type KycStatus = "verified" | "pending" | "missing";

/** What a checklist row's button does — resolved by the overview. */
export type KycAction =
  | "verify-email"
  | "add-bank"
  | "upload-address-proof"
  | "upload-business-proof"
  | "store-photos"
  | "documents"
  | "edit-fssai"
  | "edit-gst"
  | "edit-owner"
  | "edit-store";

export interface KycCheck {
  key: string;
  title: string;
  /** Second line — the value behind the check, or why it is needed. */
  detail: string;
  status: KycStatus;
  /** Absent on a satisfied check. */
  actionLabel?: string;
  action?: KycAction;
}

export interface IdentityField {
  key: string;
  label: string;
  value: string;
  /** Verification pill beside the value. */
  badge?: { label: string; tone: "ok" | "warn" };
}

export interface ProfileOverviewModel {
  storeName: string;
  storeImage: string;
  /** Membership badge, e.g. "SK RETAILER". */
  membership: string;
  fid: string;
  /** "01 Jul 2020", or "" when the store has no registration date. */
  registeredOn: string;
  /** Time on the platform spelled out, e.g. "6 yr 21 d". */
  tenure: string;
  /** Public club link behind "View public store" and the QR. */
  clubUrl: string;
  phone: string;
  fields: IdentityField[];
  address: string;
  checks: KycCheck[];
  counts: { all: number; verified: number; pending: number; missing: number };
  /** "6 verified · 1 pending · 2 missing". */
  countsLabel: string;
  /** Widths of the three progress segments, as percentages of the bar. */
  progress: { verified: number; pending: number; missing: number };
  trust: {
    percent: number;
    /** Checks still outstanding — pending plus missing. */
    remaining: number;
    /** "3 checks to go", or "All checks done". */
    remainingLabel: string;
    headline: string;
  };
}

/** One label/value pair inside a store-detail card. */
export interface DetailValue {
  key: string;
  label: string;
  value: string;
}

export interface SocialLink {
  key: string;
  label: string;
  url: string;
}

/**
 * Everything the overview's detail cards render — the fields the legacy card
 * stack used to carry, normalised the same way so the cards stay markup-only.
 */
export interface StoreDetailsModel {
  branding: {
    logo: string;
    caption: string;
    links: SocialLink[];
    /** True once the store has set any branding at all. */
    hasAny: boolean;
  };
  business: DetailValue[];
  tax: DetailValue[];
  location: {
    address: string;
    latitude?: number;
    longitude?: number;
    /** Address change requests already raised. */
    logCount: number;
  };
  locationRows: DetailValue[];
  owner: DetailValue[];
  ownerAddress: string;
  bank: DetailValue[];
  hasBank: boolean;
  legal: {
    signedBy: string;
    /** When the signup declaration was accepted, if it ever was. */
    signedAt?: Date;
    terms: Array<{
      code?: string;
      name?: string;
      version?: string;
      agreedAt: string;
    }>;
  };
  /** Set only while the store is linked to an SK seller. */
  linkedFranchiseId: string;
  /** Feeds the store-information and GST request-history modals. */
  requestLogs: any[];
  /** Values the store-information edit modal opens with. */
  storeEditData: {
    storeName: string;
    storeOpenTime: string;
    storeCloseTime: string;
    primaryBusiness?: string;
    secondaryBusiness?: string;
    primaryBusinessId?: string;
    secondaryBusinessId?: string;
    storeSize: string;
    deliveryRadius: number;
    monthlyTurnover?: string;
    yearsOfExperience?: string;
    latitude?: number;
    longitude?: number;
  };
  /** Values the owner edit modal opens with. */
  ownerEditData: {
    name: string;
    phone: string;
    email: string;
    alternateMobile?: string;
    addressLine1?: string;
    addressLine2?: string;
    pincode?: string;
    state?: string;
    district?: string;
    city?: string;
  };
  /** Values the location edit modal opens with. */
  locationEditData: Record<string, any>;
  /** Values the branding edit modal opens with. */
  brandingEditData: Record<string, any>;
}

/** Window the sales tile reports on. */
export const SALES_WINDOW_DAYS = 30;

export interface ProfileStats {
  /** Takings over {@link SALES_WINDOW_DAYS}, in rupees. */
  salesAmount: number;
  /** Lifetime order count, cancelled orders excluded. */
  orders: number;
  staffTotal: number;
  /** "1 active", or "" when the store has no staff. */
  staffLabel: string;
}

/**
 * The trading figures behind the overview's stat tiles. Each source fails
 * independently — a broken staff endpoint must not blank the sales tile.
 */
export const fetchProfileStats = async (): Promise<ProfileStats> => {
  const fid = AuthService.getLoggedInUserId() || "";

  const [sales, orders, staff] = await Promise.all([
    OmsService.getRecentSalesSummary(SALES_WINDOW_DAYS).catch(() => ({
      amount: 0,
      orderCount: 0,
    })),
    OmsService.getSalesOrders(fid, {
      outputType: "count",
      filter: { status: { $nin: ["Cancelled"] } },
    }).catch(() => null),
    RbacService.getManpowerCount().catch(() => null),
  ]);

  const staffCounts = staff?.data?.data || {};
  const staffTotal = Number(staffCounts.grandTotal) || 0;
  const activeStaff = Number(staffCounts.activeUsers) || 0;

  return {
    salesAmount: sales.amount,
    orders: Number(orders?.data?.data) || 0,
    staffTotal,
    staffLabel: staffTotal ? `${activeStaff} active` : "",
  };
};

/** "6 yr 21 d" / "12 d" — however long the store has been registered. */
const formatTenure = (from: Date, to: Date) => {
  const years = differenceInYears(to, from);
  if (years >= 1) {
    const anniversary = new Date(from);
    anniversary.setFullYear(from.getFullYear() + years);
    return `${years} yr ${differenceInDays(to, anniversary)} d`;
  }
  return `${differenceInDays(to, from)} d`;
};

/** Operating hours arrive as ISO timestamps; unparseable values drop out. */
const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return isValid(date) ? format(date, "hh:mm a") : "";
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return isValid(date) ? format(date, "dd MMM yyyy") : "";
};

/** Approved wins over pending, so a container reads as verified once any face is. */
const resolveDocStatus = (docs: any[], statusKey: string): KycStatus => {
  if (!docs.length) return "missing";
  if (docs.some((d) => d?.[statusKey] === "Approved")) return "verified";
  if (docs.some((d) => d?.[statusKey] === "Rejected")) return "missing";
  return "pending";
};

const MASKED_ACCOUNT_DIGITS = 4;

export const buildProfileOverviewModel = (data: any): ProfileOverviewModel => {
  const profile = data || {};

  const created = profile.createdAt ? new Date(profile.createdAt) : null;
  const hasCreated = !!created && isValid(created);
  const now = new Date();

  const { gst, pan } = FranchiseService.getFranchiseDocumentInfo(profile);

  const phone = profile.mobile || profile.ownerDetails?.phone || "";
  const email = profile.email || profile.ownerDetails?.email || "";
  const emailVerified = !!profile.isEmailVerified;
  const ownerName = profile.ownerDetails?.name || profile.name || "";

  const category = [profile.primaryBusiness, profile.secondaryBusiness]
    .filter(Boolean)
    .join(" / ");

  const openTime = formatTime(profile.operatingHours?.openTime);
  const closeTime = formatTime(profile.operatingHours?.closeTime);
  const storeHours =
    openTime && closeTime ? `${openTime} – ${closeTime} · Mon–Sun` : "";

  const photos: any[] = Array.isArray(profile.shopPhotosDetails)
    ? profile.shopPhotosDetails
    : [];
  const approvedPhotos = photos.filter((p) => p?.status === "Approved");

  const bankList: any[] = Array.isArray(profile.bankList)
    ? profile.bankList
    : [];
  const bank = bankList[0] || {};
  const accountNo = String(bank.accountNumber || bank.accountNo || "");

  const documents = profile.documents || {};
  const addressDocs: any[] = Array.isArray(documents.address)
    ? documents.address
    : [];
  const addressDoc = addressDocs.find(
    (d) => d?.addressProofIdStatus === "Approved",
  );

  const fssaiLog = (
    Array.isArray(profile.profileUpdateRequest)
      ? profile.profileUpdateRequest
      : []
  ).filter((l: any) => l?.type === "FSSAI_UPDATE");
  const fssaiApproved = fssaiLog.find(
    (l: any) => String(l?.status).toLowerCase() === "approved",
  );
  const fssaiPending = fssaiLog.find(
    (l: any) => String(l?.status).toLowerCase() === "pending",
  );
  const fssaiNumber = profile.fssaiLicense || fssaiApproved?.value?.licenseNo;

  const checks: KycCheck[] = [
    {
      key: "owner",
      title: "Owner name",
      detail: ownerName || "Tell customers who runs the store",
      status: ownerName ? "verified" : "missing",
      ...(ownerName
        ? {}
        : { actionLabel: "Add", action: "edit-owner" as KycAction }),
    },
    {
      key: "whatsapp",
      title: "WhatsApp",
      detail: phone || "Orders and alerts reach you here",
      status: phone ? "verified" : "missing",
      ...(phone
        ? {}
        : { actionLabel: "Add", action: "edit-owner" as KycAction }),
    },
    {
      key: "email",
      title: "Email",
      detail: emailVerified
        ? email
        : email
          ? `${email} · not verified yet`
          : "Add an email for invoices and reports",
      status: emailVerified ? "verified" : email ? "pending" : "missing",
      ...(emailVerified
        ? {}
        : {
            actionLabel: email ? "Verify" : "Add",
            action: "verify-email" as KycAction,
          }),
    },
    {
      key: "gstin",
      title: "GSTIN",
      detail: gst || "Required to bill with tax",
      status: gst ? "verified" : "missing",
      ...(gst ? {} : { actionLabel: "Add", action: "edit-gst" as KycAction }),
    },
    {
      key: "pan",
      title: "PAN",
      detail: pan || "Required for payouts and settlements",
      status: pan ? "verified" : "missing",
      ...(pan
        ? {}
        : { actionLabel: "Add", action: "upload-business-proof" as KycAction }),
    },
    {
      key: "bank",
      title: "Bank account",
      detail: bankList.length
        ? `${bank.bank_name || bank.bankName || "Bank"} · ${
            accountNo
              ? `••••${accountNo.slice(-MASKED_ACCOUNT_DIGITS)}`
              : "linked"
          }`
        : "Required for UPI payouts",
      status: bankList.length ? "verified" : "missing",
      ...(bankList.length
        ? {}
        : { actionLabel: "Add", action: "add-bank" as KycAction }),
    },
    {
      key: "fssai",
      title: "FSSAI license",
      detail: fssaiApproved
        ? fssaiNumber || "Approved"
        : fssaiPending
          ? "Sent for approval"
          : "Add if you sell food",
      status: fssaiApproved ? "verified" : fssaiPending ? "pending" : "missing",
      ...(fssaiApproved
        ? {}
        : {
            actionLabel: fssaiPending ? "View" : "Add",
            action: "edit-fssai" as KycAction,
          }),
    },
    {
      key: "photos",
      title: "Store photos",
      detail: photos.length
        ? `${photos.length} photo${photos.length > 1 ? "s" : ""} · ${
            approvedPhotos.length
          } approved`
        : "A clear shot of the shop front",
      status: approvedPhotos.length
        ? "verified"
        : photos.length
          ? "pending"
          : "missing",
      // Photos stay actionable even once approved — a store keeps adding
      // shots, so the row always links out to the upload page.
      actionLabel: photos.length ? "View" : "Add",
      action: "store-photos" as KycAction,
    },
    {
      key: "address-proof",
      title: "Address proof",
      detail: addressDoc
        ? [addressDoc.addressProof, formatDate(addressDoc.createdAt)]
            .filter(Boolean)
            .join(" · ")
        : addressDocs.length
          ? "Under review"
          : "Electricity bill or rent agreement",
      status: resolveDocStatus(addressDocs, "addressProofIdStatus"),
      ...(addressDoc
        ? {}
        : {
            actionLabel: addressDocs.length ? "View" : "Add",
            action: "upload-address-proof" as KycAction,
          }),
    },
  ];

  const counts = checks.reduce(
    (acc, check) => {
      acc.all += 1;
      acc[check.status] += 1;
      return acc;
    },
    { all: 0, verified: 0, pending: 0, missing: 0 },
  );

  const toPercent = (value: number) =>
    counts.all ? (value / counts.all) * 100 : 0;

  const remaining = counts.pending + counts.missing;

  const fields: IdentityField[] = [
    { key: "owner", label: "Owner", value: ownerName || "—" },
    {
      key: "whatsapp",
      label: "WhatsApp",
      value: phone || "—",
      ...(phone ? { badge: { label: "OK", tone: "ok" as const } } : {}),
    },
    {
      key: "email",
      label: "Email",
      value: email || "—",
      ...(email
        ? {
            badge: emailVerified
              ? { label: "OK", tone: "ok" as const }
              : { label: "VERIFY", tone: "warn" as const },
          }
        : {}),
    },
    {
      key: "gstin",
      label: "GSTIN",
      value: gst || "—",
      ...(gst ? { badge: { label: "OK", tone: "ok" as const } } : {}),
    },
    {
      key: "pan",
      label: "PAN",
      value: pan || "—",
      ...(pan ? { badge: { label: "OK", tone: "ok" as const } } : {}),
    },
    { key: "category", label: "Category", value: category || "—" },
    { key: "hours", label: "Store hours", value: storeHours || "—" },
    {
      key: "delivery",
      label: "Delivery",
      value:
        profile.deliveryRadius !== undefined && profile.deliveryRadius !== null
          ? `${profile.deliveryRadius} km`
          : "—",
    },
  ];

  return {
    storeName: profile.name || "Store",
    storeImage:
      profile.approvedStoreImage ||
      profile.approvedShopImage ||
      profile.shopImg ||
      "",
    membership: (profile.displayType?.name || "SK Retailer").toUpperCase(),
    fid: profile.franchiseId || profile.franchiseID || "",
    registeredOn: hasCreated ? format(created as Date, "dd MMM yyyy") : "",
    tenure: hasCreated ? formatTenure(created as Date, now) : "",
    clubUrl: phone ? `https://storeking.in/${phone}` : "",
    phone,
    fields,
    address: [
      profile.addressLine1,
      profile.addressLine2,
      profile.city,
      profile.district,
      profile.state,
      profile.pincode,
    ]
      .filter(Boolean)
      .join(", "),
    checks,
    counts,
    countsLabel: `${counts.verified} verified · ${counts.pending} pending · ${counts.missing} missing`,
    progress: {
      verified: toPercent(counts.verified),
      pending: toPercent(counts.pending),
      missing: toPercent(counts.missing),
    },
    trust: {
      percent: ProfileScoreService.getPercent(profile),
      remaining,
      remainingLabel: remaining
        ? `${remaining} check${remaining > 1 ? "s" : ""} to go`
        : "All checks done",
      headline: remaining
        ? "Reach 100% — unlock UPI payouts + B2B sourcing"
        : "Profile complete — payouts and B2B sourcing are open",
    },
  };
};

/** Joins the parts of an address that are actually present. */
const joinAddress = (...parts: Array<string | undefined>) =>
  parts.filter(Boolean).join(", ");

const DASH = "—";

/**
 * The detail cards under the overview — branding, business, tax, location,
 * owner, bank and the legal record — plus the values each edit modal opens
 * with, so the cards themselves stay free of derivation.
 */
export const buildStoreDetailsModel = (data: any): StoreDetailsModel => {
  const profile = data || {};
  const owner = profile.ownerDetails || {};
  const social = profile.socialMediaLinks || {};

  const { gst, pan } = FranchiseService.getFranchiseDocumentInfo(profile);

  const openTime = formatTime(profile.operatingHours?.openTime);
  const closeTime = formatTime(profile.operatingHours?.closeTime);

  const bankList: any[] = Array.isArray(profile.bankList)
    ? profile.bankList
    : [];
  const bank = bankList[0] || {};

  const links: SocialLink[] = (
    [
      { key: "youtube", label: "YouTube" },
      { key: "instagram", label: "Instagram" },
      { key: "facebook", label: "Facebook" },
      { key: "google", label: "Google" },
    ] as Array<{ key: string; label: string }>
  )
    .map((link) => ({ ...link, url: social[link.key] || "" }))
    .filter((link) => !!link.url);

  const address = joinAddress(
    profile.addressLine1,
    profile.addressLine2,
    profile.city,
    profile.district,
    profile.state,
    profile.pincode,
  );

  const requestLogs = Array.isArray(profile.profileUpdateRequest)
    ? profile.profileUpdateRequest
    : [];

  return {
    branding: {
      logo: profile.storeLogo || "",
      caption: profile.storeCaption || "",
      links,
      hasAny: !!(profile.storeLogo || profile.storeCaption || links.length),
    },
    business: [
      {
        key: "primary",
        label: "Primary business",
        value: profile.primaryBusiness || DASH,
      },
      {
        key: "secondary",
        label: "Secondary",
        value: profile.secondaryBusiness || DASH,
      },
      {
        key: "hours",
        label: "Store hours",
        value: openTime && closeTime ? `${openTime} – ${closeTime}` : DASH,
      },
      {
        key: "size",
        label: "Store size",
        value: profile.storeSize ? `${profile.storeSize} sq ft` : DASH,
      },
      {
        key: "delivery",
        label: "Delivery radius",
        value:
          profile.deliveryRadius !== undefined &&
          profile.deliveryRadius !== null
            ? `${profile.deliveryRadius} km`
            : DASH,
      },
      {
        key: "turnover",
        label: "Turnover",
        value: profile.monthlyTurnOver || DASH,
      },
    ],
    tax: [
      { key: "gstin", label: "GSTIN", value: gst || DASH },
      { key: "pan", label: "PAN", value: pan || DASH },
      { key: "gstStatus", label: "GST status", value: gst ? "Registered" : "Unregistered" },
      { key: "fssai", label: "FSSAI license", value: profile.fssaiLicense || DASH },
    ],
    location: {
      address,
      latitude: profile.geoLocation?.coordinates?.[1],
      longitude: profile.geoLocation?.coordinates?.[0],
      logCount: Array.isArray(profile.addressLogs)
        ? profile.addressLogs.length
        : 0,
    },
    locationRows: [
      {
        key: "address",
        label: "Address",
        value:
          [profile.addressLine1, profile.addressLine2]
            .filter(Boolean)
            .join(", ") ||
          address ||
          DASH,
      },
      {
        key: "cityState",
        label: "City / State",
        value:
          [profile.city, profile.district, profile.state]
            .filter(Boolean)
            .join(", ") || DASH,
      },
      {
        key: "pincode",
        label: "Pincode",
        value: profile.pincode || DASH,
      },
      {
        key: "coordinates",
        label: "Coordinates",
        value:
          profile.geoLocation?.coordinates?.[1] &&
          profile.geoLocation?.coordinates?.[0]
            ? `${profile.geoLocation.coordinates[1]}, ${profile.geoLocation.coordinates[0]}`
            : DASH,
      },
    ],
    owner: [
      { key: "name", label: "Name", value: owner.name || DASH },
      {
        key: "phone",
        label: "Phone",
        value: owner.phone || profile.mobile || DASH,
      },
      {
        key: "alternate",
        label: "Alternate",
        value: owner.alternateMobile || DASH,
      },
      {
        key: "email",
        label: "Email",
        value: owner.email || profile.email || DASH,
      },
    ],
    ownerAddress: joinAddress(
      owner.addressLine1,
      owner.addressLine2,
      owner.city,
      owner.district,
      owner.state,
      owner.pincode,
    ),
    bank: [
      {
        key: "bankName",
        label: "Bank",
        value: bank.bank_name || bank.bankName || DASH,
      },
      {
        key: "holder",
        label: "Account holder",
        value: bank.accountHolderName || DASH,
      },
      {
        key: "account",
        label: "Account no.",
        value: bank.accountNumber || bank.accountNo || DASH,
      },
      { key: "ifsc", label: "IFSC", value: bank.ifsc || DASH },
    ],
    hasBank: bankList.length > 0,
    legal: {
      signedBy: owner.name || profile.name || "",
      signedAt: profile.declaration?.acceptedAt
        ? new Date(profile.declaration.acceptedAt)
        : undefined,
      terms: Array.isArray(profile.termAndConditions)
        ? profile.termAndConditions
        : [],
    },
    linkedFranchiseId: profile.linkedFranchise?._id || "",
    requestLogs,
    storeEditData: {
      storeName: profile.name || "",
      storeOpenTime: profile.operatingHours?.openTime || "",
      storeCloseTime: profile.operatingHours?.closeTime || "",
      primaryBusiness: profile.primaryBusiness,
      secondaryBusiness: profile.secondaryBusiness,
      primaryBusinessId: profile.primaryBusinessId,
      secondaryBusinessId: profile.secondaryBusinessId,
      storeSize: profile.storeSize || "",
      deliveryRadius: profile.deliveryRadius ?? 0,
      monthlyTurnover: profile.monthlyTurnOver,
      yearsOfExperience: profile.yearsOfExperience,
      latitude: profile.geoLocation?.coordinates?.[1],
      longitude: profile.geoLocation?.coordinates?.[0],
    },
    ownerEditData: {
      name: owner.name || "",
      phone: owner.phone || profile.mobile || "",
      email: owner.email || "",
      alternateMobile: owner.alternateMobile,
      addressLine1: owner.addressLine1,
      addressLine2: owner.addressLine2,
      pincode: owner.pincode,
      state: owner.state,
      district: owner.district,
      city: owner.city,
    },
    locationEditData: {
      address,
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2,
      pincode: profile.pincode,
      state: profile.state,
      district: profile.district,
      city: profile.city,
      latitude: profile.geoLocation?.coordinates?.[1],
      longitude: profile.geoLocation?.coordinates?.[0],
    },
    brandingEditData: {
      storeLogo: profile.storeLogo,
      storeCaption: profile.storeCaption,
      socialMediaLinks: social,
    },
  };
};
