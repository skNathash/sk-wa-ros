import { useEffect } from "react";
import { useSearchParams } from "react-router";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AuthService from "~/services/AuthService";
import StorageService from "~/services/StorageService";
import useAppNav from "~/hooks/useAppNav";

const STORED_KEY = "auth_rd_search";

const RdRedirect = () => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const doRedirect = () => {
      const storedRaw = StorageService.get<string>(STORED_KEY) || "";
      const currentSearch = searchParams.toString()
        ? `?${searchParams.toString()}`
        : "";

      const used = currentSearch || storedRaw || "";

      const params = new URLSearchParams(used.replace(/^\?/, ""));

      const view = params.get("view") || "";

      const paramsObj: Record<string, any> = {};
      params.forEach((v, k) => (paramsObj[k] = v));

      if (view === "bfn") {
        const storeId = params.get("fid");
        if (storeId) {
          delete paramsObj.fid;
          appNav.replace(
            `/products/buy-from-other-retailer/retailer/${storeId}`,
          );
        } else {
          appNav.replace("/products/main", paramsObj);
        }
      } else if (view === "retailers") {
        appNav.replace(
          "/products/buy-from-other-retailer/retailers",
          paramsObj,
        );
      } else {
        appNav.replace("/");
      }

      try {
        StorageService.remove(STORED_KEY);
      } catch (e) {
        // ignore
      }
    };

    const loggedIn = AuthService.isLoggedIn();

    if (loggedIn) {
      doRedirect();
      return;
    }

    try {
      const currentSearch = searchParams.toString()
        ? `?${searchParams.toString()}`
        : "";
      if (currentSearch) {
        StorageService.set(STORED_KEY, currentSearch);
      }
    } catch (e) {
      // ignore storage errors
    }

    appNav.replace("/auth/login");
  }, [searchParams.toString()]);

  return (
    <div className="app-page">
      <div className="app-container">
        <div className="tw:flex tw:justify-center tw:items-center tw:h-screen">
          <div className="tw:flex tw:gap-4 tw:items-center">
            <AppSpinner />
            <span className="tw-text-xs">Redirecting...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RdRedirect;
