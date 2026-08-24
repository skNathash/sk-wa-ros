import { useEffect } from "react";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import MiscService from "~/services/MiscService";
import SellerService from "~/services/SellerService";
import StorageService from "~/services/StorageService";

const AuthInit = () => {
  const appNav = useAppNav();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // Check if user is logged in
    if (AuthService.isLoggedIn()) {
      const token = AuthService.getLoggedInToken();

      // Check if JWT is expired
      if (MiscService.isJwtExpired(token)) {
        // JWT expired, redirect to login
        appNav.replace("/auth/login");
        return;
      }

      // JWT is valid, proceed with existing logic
      const userId = AuthService.getLoggedInUserId();
      if (userId) {
        // Runner login does not need franchise/profile setup
        if (AuthService.isRunnerLoggedIn()) {
          appNav.replace("/runner/home");
          return;
        }

        const franchise = await AuthService.getLoggedInFranchiseDetails();
        if (franchise.data?.data?._id) {
          StorageService.set("_f", franchise.data?.data);

          const sellerId =
            franchise?.data?.sk_franchise_details?.linkedSellerId || "";
          if (sellerId) {
            const seller = await SellerService.getSellerDetails(sellerId);
            if (seller.data?._id) {
              StorageService.set("_s", seller.data);
            }
          }
          redirect();
        }
      } else {
        appNav.replace("/auth/login");
      }
    } else {
      // User not logged in, redirect to login
      appNav.replace("/auth/login");
    }
  };

  const redirect = () => {
    const tok = MiscService.decodeJwt(StorageService.get("_t"));
    if (tok?.loginPlatform === "GuestUser") {
      appNav.replace("/auth/login");
    } else {
      appNav.replace("/dashboard/main");
    }
  };

  return (
    <div className="tw:min-h-dvh tw:flex tw:items-center tw:justify-center tw:bg-white">
      <ImgRender src="/ai/loader.gif" alt="StoreKing" className="tw:h-20" />
    </div>
  );
};

export default AuthInit;
