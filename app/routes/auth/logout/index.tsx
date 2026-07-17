import { useEffect } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";

const Logout = () => {
  const appNav = useAppNav();

  useEffect(() => {
    const logout = async () => {
      await AuthService.doLogout(AuthService.getLoggedInUser()?.OwnerMobileNo);
      AuthService.clearLoggedInUser();
      appNav.replace("/auth/login");
    };
    logout();
  }, []);

  return (
    <div className="page-bg app-page">
      <div className="app-container">
        <div className="tw:flex tw:h-screen tw:items-center tw:justify-center">
          <div className="tw:flex tw:flex-col tw:items-center">
            <AppSpinner />
            <div className="tw:mt-4 tw:text-center tw:text-sm tw:font-medium tw:text-gray-700">
              Logging out, please wait...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logout;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Logout"),
    },
  ];
}
