import AuthService from "./AuthService";

/** One verification the profile score counts, and whether it is satisfied. */
export interface ProfileScoreItem {
  key: string;
  /** Short label for the chip/row that reports this check. */
  label: string;
  ok: boolean;
}

export interface ProfileScore {
  /** Share of the checks that pass, 0-100, rounded. */
  percent: number;
  /** Every check, in display order — satisfied or not. */
  items: ProfileScoreItem[];
  /** How many checks pass, out of how many there are. */
  completed: number;
  total: number;
}

/**
 * How complete (and therefore how trustworthy) a store's profile is, scored
 * over the verifications the store can actually complete: contact details,
 * tax and bank registration, its licence and its photos.
 *
 * This is the single definition of the "trust score" shown in the theme-2
 * side menu and the profile side pane — both read it from here so the number
 * and the chips behind it can never disagree.
 */
export default class ProfileScoreService {
  /**
   * Scores the given profile, defaulting to the logged-in user. Pass the
   * franchise data explicitly on pages that already loaded a fresher copy
   * than the cached session user.
   */
  static get(profileData?: any): ProfileScore {
    const data = profileData ?? AuthService.getLoggedInUser() ?? {};

    const phone = data.mobile || data.ownerDetails?.phone || "";

    const items: ProfileScoreItem[] = [
      { key: "phone", label: "Phone", ok: !!phone },
      { key: "email", label: "Email", ok: !!data.isEmailVerified },
      { key: "gst", label: "GST", ok: !!data.gstNumber },
      { key: "bank", label: "Bank", ok: (data.bankList?.length || 0) > 0 },
      { key: "fssai", label: "FSSAI", ok: !!data.fssaiLicense },
      {
        key: "photos",
        label: "Photos",
        ok: !!data.shopPhotosDetails?.some((p: any) => p.status === "Approved"),
      },
    ];

    const completed = items.filter((item) => item.ok).length;

    return {
      percent: items.length ? Math.round((completed / items.length) * 100) : 0,
      items,
      completed,
      total: items.length,
    };
  }

  /** Just the percentage, for callers that don't render the breakdown. */
  static getPercent(profileData?: any): number {
    return ProfileScoreService.get(profileData).percent;
  }
}
