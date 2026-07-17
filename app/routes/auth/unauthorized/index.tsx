import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";

const Unauthorized = () => {
  const appNav = useAppNav();

  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:h-full">
      <div className="tw:text-2xl tw:font-bold tw:text-center">
        Oops! You are not authorized to access this page.
      </div>
      <div className="tw:text-sm tw:text-gray-700 tw:mt-2 tw:mb-6">
        Please contact your administrator to get access to this page.
      </div>
      <AppButton onClick={() => appNav.to("/dashboard")} fill="outline">
        Go to Home
      </AppButton>
    </div>
  );
};

export default Unauthorized;
