/**
 * Derives every display field the profile side pane renders from the raw
 * franchise profile, so the pane's JSX stays free of derivation logic.
 */

import { differenceInDays, differenceInYears, format, isValid } from "date-fns";
import { buildDocumentsModel } from "~/routes/user/documents/helper";
import ProfileScoreService from "~/services/ProfileScoreService";

export interface ProfilePaneModel {
  storeName: string;
  ownerName: string;
  fid: string;
  phone: string;
  email: string;
  emailVerified: boolean;
  storeImage: string;
  /** Membership badge, e.g. "SK RETAILER". */
  membership: string;
  /** How long the store has been on the platform, e.g. "6 YR". */
  tenure: string;
  trustScore: number;
  address: string;
  /** Store pin from `geoLocation.coordinates`; null when never dropped. */
  lat: number | null;
  lng: number | null;
  /** "01 Jul 2020", or "" when the store has no registration date. */
  registeredOn: string;
  /** Time on the platform spelled out, e.g. "6 yr 21 d". */
  registeredFor: string;
  /** Club link encoded in the shareable store QR. */
  clubUrl: string;
  documents: { verified: number; total: number; label: string };
  bank: { linked: boolean; label: string };
  photos: { approved: number; total: number; label: string };
}

/** "6 yr 21 d" / "7 mo" / "12 d" — however long the store has been registered. */
const formatTenure = (from: Date, to: Date) => {
  const years = differenceInYears(to, from);
  const days = differenceInDays(to, from);
  if (years >= 1) {
    const anniversary = new Date(from);
    anniversary.setFullYear(from.getFullYear() + years);
    return `${years} yr ${differenceInDays(to, anniversary)} d`;
  }
  return `${days} d`;
};

export const buildProfilePaneModel = (data: any): ProfilePaneModel => {
  const profile = data || {};

  const created = profile.createdAt ? new Date(profile.createdAt) : null;
  const hasCreated = !!created && isValid(created);
  const now = new Date();
  const years = hasCreated ? differenceInYears(now, created as Date) : 0;

  const docs = buildDocumentsModel(profile);

  const photos: any[] = Array.isArray(profile.shopPhotosDetails)
    ? profile.shopPhotosDetails
    : [];
  const approvedPhotos = photos.filter((p) => p?.status === "Approved").length;

  const bankList: any[] = Array.isArray(profile.bankList)
    ? profile.bankList
    : [];
  const bank = bankList[0] || {};
  const accountNo = String(bank.accountNumber || bank.accountNo || "");

  const phone = profile.mobile || profile.ownerDetails?.phone || "";

  // `geoLocation.coordinates` is GeoJSON order — [lng, lat].
  const coords: any[] = Array.isArray(profile.geoLocation?.coordinates)
    ? profile.geoLocation.coordinates
    : [];
  const lng = typeof coords[0] === "number" ? coords[0] : null;
  const lat = typeof coords[1] === "number" ? coords[1] : null;

  return {
    storeName: profile.name || "Store",
    ownerName: profile.ownerDetails?.name || "",
    fid: profile.franchiseId || profile.franchiseID || "",
    phone,
    email: profile.email || profile.ownerDetails?.email || "",
    emailVerified: !!profile.isEmailVerified,
    storeImage:
      profile.approvedStoreImage ||
      profile.approvedShopImage ||
      profile.storeImage ||
      "",
    membership: (profile.displayType?.name || "SK Retailer").toUpperCase(),
    tenure: hasCreated && years >= 1 ? `${years} YR` : "",
    trustScore: ProfileScoreService.getPercent(profile),
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
    lat,
    lng,
    registeredOn: hasCreated ? format(created as Date, "dd MMM yyyy") : "",
    registeredFor: hasCreated ? formatTenure(created as Date, now) : "",
    clubUrl: phone ? `https://storeking.in/${phone}` : "",
    documents: {
      verified: docs.counts.verified,
      total: docs.counts.all,
      label: `${docs.counts.verified} of ${docs.counts.all} verified`,
    },
    bank: {
      linked: bankList.length > 0,
      label: bankList.length
        ? `${bank.bank_name || bank.bankName || "Bank"} · ${accountNo ? `••••${accountNo.slice(-4)}` : "linked"}`
        : "Not linked · payout blocked",
    },
    photos: {
      approved: approvedPhotos,
      total: photos.length,
      label: photos.length
        ? `${approvedPhotos} of ${photos.length} approved`
        : "No photos uploaded",
    },
  };
};
