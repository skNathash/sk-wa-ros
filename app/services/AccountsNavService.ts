import FranchiseService from "./FranchiseService";

/**
 * Single source of truth for where the "Accounts" navigation entry should
 * land, shared by the sidemenu ({@link SidemenuService}) and the section tabs
 * ({@link SectionTabService}) so the two stay in sync.
 */
export default class AccountsNavService {
  /**
   * Landing target for the Accounts section.
   * With an active plan, land on the Overall Statement tab; otherwise land on
   * the Platform Fee / Commission Invoices tab so the user can purchase a plan.
   */
  static getAccountsRedirect(): {
    path: string;
    params: Record<string, string>;
  } {
    if (FranchiseService.isActivePlanAvailable()) {
      return {
        path: "/dashboard/accounts/overall-statement",
        params: { tab: "overall-statement" },
      };
    }
    return {
      path: "/dashboard/accounts/platform-fee",
      params: { tab: "commission-invoices" },
    };
  }

  /** Same target as {@link getAccountsRedirect}, flattened to a url string. */
  static getAccountsRedirectUrl(): string {
    const { path, params } = AccountsNavService.getAccountsRedirect();
    const query = new URLSearchParams(params).toString();
    return query ? `${path}?${query}` : path;
  }
}
