import { useTranslation } from "react-i18next";
import AppHeader from "~/components/core/header/AppHeader";

const NetworkAnalyticsList = () => {
  const { t } = useTranslation(["common"]);

  return (
    <>
      <AppHeader title="Network Analytics" showCart={true} />
      <div className="tw:p-4 app-page page-bg">
        <div className="tw:space-y-4">
          <h2 className="tw:text-xl tw:font-semibold">
            Network Analytics List
          </h2>
          <p>This is the basic layout for the network analytics list page.</p>
          {/* Placeholder for future content */}
          <div className="tw:bg-white tw:p-4 tw:rounded-lg tw:shadow">
            <p>Analytics data will be displayed here.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default NetworkAnalyticsList;
