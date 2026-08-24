import { useSearchParams } from "react-router";
import CommonService from "~/services/CommonService";
import {
  ACCOUNTS_SUB_TAB_PARAM,
  getAccountsSubTabKey,
} from "~/shared/accounts/components/accounts-tabs/helper";
import FyView from "./components/tabs/fy-view";
import OsImpactTab from "./components/tabs/os-impact";
import Quarter from "./components/tabs/quarter";
import ThisMonth from "./components/tabs/this-months";
import Ytd from "./components/tabs/ytd";

const ProfitLoss = () => {
  const [searchParams] = useSearchParams();

  /* The P&L reads per period, picked from the accounts tab tray the layout
     renders for this route — the key lives in the URL so a reload, or a share,
     lands back on the same view. Each tab fetches through its own helper. */
  const pnlTab = getAccountsSubTabKey(
    "/dashboard/accounts/profit-loss",
    searchParams.get(ACCOUNTS_SUB_TAB_PARAM),
  );

  return (
    <div>
      {/* The period switch is the accounts tab tray, rendered by the layout
          above this page. */}
      {pnlTab === "quarter" ? (
        <Quarter />
      ) : pnlTab === "ytd" ? (
        <Ytd />
      ) : pnlTab === "fy-view" ? (
        <FyView />
      ) : pnlTab === "os-impact" ? (
        <OsImpactTab />
      ) : (
        <ThisMonth />
      )}
    </div>
  );
};

export default ProfitLoss;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Profit & Loss"),
    },
  ];
}
