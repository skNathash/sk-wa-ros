import VendorService from "./VendorService";

const LAST_VENDOR_KEY = "sk-last-vendor-id";

/**
 * Resolves where the desktop "Vendors" nav item should land. In the theme-2
 * split layout the vendor detail page hosts the vendor list as a side pane,
 * so the rail jumps straight to a vendor detail page instead of the Vendors
 * list: the last vendor the user opened (remembered here), else the first
 * vendor from the same list API the side pane uses, else the Vendors list as
 * a final fallback.
 */
export default class VendorNavService {
  /** Remember the vendor id the user last opened. */
  static rememberLastVendor(id: string) {
    if (!id) return;
    try {
      localStorage.setItem(LAST_VENDOR_KEY, id);
    } catch {
      // storage unavailable (private mode etc.) — nav falls back to fetch
    }
  }

  static getLastVendorId(): string | null {
    try {
      return localStorage.getItem(LAST_VENDOR_KEY);
    } catch {
      return null;
    }
  }

  /** Redirect target for the desktop rail's "Vendors" item. */
  static async resolveVendorsRedirect(): Promise<{
    url: string;
    params?: Record<string, string>;
  }> {
    const lastId = VendorNavService.getLastVendorId();
    if (lastId) {
      return { url: `/dashboard/vendor/view/${lastId}` };
    }

    try {
      // Same source + default sort as the vendor-list side pane
      // (see shared/vendor/components/vendor-side-pane/vendors/helper.ts): first
      // vendor by name A–Z.
      const resp = await VendorService.getDashboardVendorList({
        page: 1,
        count: 1,
        sort: { name: 1 },
        filter: {},
      });
      const first = resp?.data?.data?.[0];
      if (first?._id) {
        return { url: `/dashboard/vendor/view/${first._id}` };
      }
    } catch (err) {
      console.error("Error resolving default vendor", err);
    }

    return { url: "/dashboard/vendor/list" };
  }
}
