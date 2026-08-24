/**
 * Normalises `franchise.shopPhotosDetails` into the gallery model the store
 * photos page renders — one slot per uploaded photo, already carrying every
 * display field so the JSX stays free of derivation logic.
 *
 * The backend stores photos as a plain ordered array with no per-shot tag, so
 * slots are positional: the first photo is the store's main photo, the rest
 * follow in upload order. Uploading appends, replacing swaps the file at that
 * slot's index, which keeps the rest of the mapping stable.
 */

export type PhotoStatus = "approved" | "pending" | "rejected";

/** How many photos a store may keep on its club page. */
export const MAX_PHOTOS = 6;

export interface PhotoSlot {
  key: string;
  /** "Main" for the first photo, "Photo 2", "Photo 3" … after it. */
  title: string;
  /** Position in `shopPhotosDetails`. */
  index: number;
  /** Asset id of the uploaded photo. */
  fileUrl: string;
  status: PhotoStatus;
  statusLabel: string;
  /** Reviewer remark, set when a photo is rejected. */
  comment: string;
}

export interface PhotoModel {
  slots: PhotoSlot[];
  filled: number;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  /** Whether the gallery still has room for another photo. */
  canAddMore: boolean;
  /** "2 of 6" — the header/progress caption. */
  progressLabel: string;
  progressPercent: number;
  /** Payload shape the franchise update endpoint expects. */
  payload: Array<{ fileUrl: string; status: string }>;
}

export interface RawPhoto {
  id: string;
  status: string;
  comment?: string;
}

/** Tips shown in the side pane. */
export const PHOTO_TIPS: string[] = [
  "Use natural light — daytime works best",
  "Avoid customers' faces in photos",
  "Minimum resolution 1080×1080",
  "The first photo is the one customers see first",
];

const STATUS_LABELS: Record<PhotoStatus, string> = {
  approved: "Approved",
  pending: "In review",
  rejected: "Rejected",
};

const toStatus = (value?: string): PhotoStatus => {
  const status = String(value || "").toLowerCase();
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return "pending";
};

/**
 * Reads `shopPhotosDetails` off a formatted franchise, tolerating both shapes
 * it comes in — `{ fileUrl }` straight from the api and `{ id }` after the
 * profile page's transform.
 */
export const readPhotos = (profile: any): RawPhoto[] => {
  const list: any[] = Array.isArray(profile?.shopPhotosDetails)
    ? profile.shopPhotosDetails
    : [];
  return list
    .map((photo) => ({
      id: photo?.id || photo?.fileUrl || "",
      status: photo?.status || "Pending",
      comment: photo?.comment || "",
    }))
    .filter((photo) => !!photo.id);
};

export const buildPhotoModel = (profile: any): PhotoModel => {
  const photos = readPhotos(profile);

  const slots: PhotoSlot[] = photos.map((photo, index) => {
    const status = toStatus(photo.status);
    return {
      key: `photo-${index}`,
      title: index === 0 ? "Main" : `Photo ${index + 1}`,
      index,
      fileUrl: photo.id,
      status,
      statusLabel: STATUS_LABELS[status],
      comment: photo.comment || "",
    };
  });

  const approved = slots.filter((slot) => slot.status === "approved").length;
  const rejected = slots.filter((slot) => slot.status === "rejected").length;
  // A store that somehow holds more than the cap keeps them, it just cannot
  // add another.
  const total = Math.max(MAX_PHOTOS, photos.length);

  return {
    slots,
    filled: photos.length,
    total,
    approved,
    rejected,
    pending: photos.length - approved - rejected,
    canAddMore: photos.length < MAX_PHOTOS,
    progressLabel: `${photos.length} of ${total}`,
    progressPercent: total ? Math.round((photos.length / total) * 100) : 0,
    payload: photos.map((photo) => ({
      fileUrl: photo.id,
      status: photo.status,
    })),
  };
};
