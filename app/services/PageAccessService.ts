import { redirect } from "react-router";
import AuthService from "./AuthService";
import MiscService from "./MiscService";

interface PageAccessOptions {
  onlyMasterLogin?: boolean;
  blockForMasterLogin?: boolean;
  allowNoSubscribe?: boolean;
  allowIncompleteProfile?: boolean;
}

const subscribeUrls = [
  "/dashboard/inventory/subscribe/search",
  "/dashboard/inventory/subscribe/un-brands",
  "/dashboard/inventory/subscribe/browse-category",
  "/dashboard/inventory/subscribe/browse-brands",
  "/dashboard/inventory/subscribe/approval-history",
];

class PageAccessService {
  static canAccessPage(roles: Array<string> = [], options?: PageAccessOptions) {
    if (options && options.blockForMasterLogin) {
      if (
        AuthService.isMasterLogin() &&
        !AuthService.isMasterLoginWithFullAccess()
      ) {
        throw redirect("/auth/unauthorized");
      }
    }

    // If this page is only for master-login users, validate master token
    if (options && options.onlyMasterLogin) {
      if (!AuthService.isMasterLogin()) {
        throw redirect("/auth/master/login");
      }
      return null;
    }

    if (!AuthService.isLoggedIn()) {
      throw redirect("/auth/login");
    }

    if (
      AuthService.isLoggedIn() &&
      !AuthService.isFranchiseProfileComplete().status &&
      !(options && options.allowIncompleteProfile) &&
      !AuthService.isMasterLogin()
    ) {
      throw redirect("/user/my-profile");
    }

    if (MiscService.isJwtExpired(AuthService.getLoggedInToken())) {
      throw redirect("/auth/logout");
    }

    if (!AuthService.hasSubscribedToAnyDeal()) {
      if (options && options.allowNoSubscribe) {
        return null;
      } else {
        throw redirect("/dashboard/inventory/subscribe/search?tab=search");
      }
    }

    if (roles.length > 0) {
      if (!AuthService.isRbacEnabled(roles)) {
        throw redirect("/auth/unauthorized");
      }
    }

    return null;
  }
}

export default PageAccessService;
