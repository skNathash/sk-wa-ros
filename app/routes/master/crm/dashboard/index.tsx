import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Building2, Users, ClipboardList, UserRound } from "lucide-react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import AppTab from "~/components/core/tab/AppTab";
import CommonService from "~/services/CommonService";
import AuthService from "~/services/AuthService";
import useAppNav from "~/hooks/useAppNav";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import TodayOpenChip, {
  TODAY_OPEN_STATUS,
  todayDateParam,
} from "~/shared/crm/components/TodayOpenChip";
import AllRetailersButton from "~/shared/crm/components/AllRetailersButton";
import Employees from "./components/employees/Employees";
import Retailers from "./components/retailers/Retailers";
import Followups from "./components/followups/Followups";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/auth/master/stores",
    },
    langKey: "dashboard",
  },
  { label: "Follow-ups Dashboard" },
];

const TABS: TabItem[] = [
  { name: "Employees", key: "employees", icon: <Users /> },
  { name: "Retailers", key: "retailers", icon: <Building2 /> },
  // { name: "Follow-ups", key: "followups", icon: <ClipboardList /> },
];

const DEFAULT_TAB = "employees";
const RETAILERS_TAB = "retailers";

const CrmDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useAppNav();
  const activeTab = searchParams.get("tab") || DEFAULT_TAB;

  // The logged-in master employee's own id, used to jump straight to their own
  // follow-ups on the employee page. Empty outside a master login session.
  const myEmployeeId = useMemo(() => AuthService.getMasterEmployeeId(), []);

  // Switching tabs resets the query params to just the tab key so one tab's
  // filters never leak into another. Each tab owns its own filter params.
  const handleTabChange = useCallback(
    (tab: TabItem) => {
      setSearchParams({ tab: tab.key });
    },
    [setSearchParams],
  );

  // Quick filter alongside the breadcrumb: jump to the Retailers tab scoped to
  // today's open follow-ups. Tapping while active clears back to the default
  // tab; otherwise it switches to Retailers and applies the preset.
  const handleTodayOpenToggle = useCallback(
    (active: boolean) => {
      const params = new URLSearchParams();
      if (!active) {
        params.set("tab", RETAILERS_TAB);
        const today = todayDateParam();
        params.set("status", TODAY_OPEN_STATUS);
        params.set("startDate", today);
        params.set("endDate", today);
      } else {
        // Clearing the preset returns to the default tab rather than leaving the
        // user stranded on a filtered Retailers tab.
        params.set("tab", DEFAULT_TAB);
      }
      setSearchParams(params);
    },
    [setSearchParams],
  );

  return (
    <>
      <AppSimpleHeader title="CRM Follow-ups - Dashboard" />
      <div className="app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
            <div>
              <AppBreadcrumbs data={breadcrumbs} />
              <div className="tw:mt-1 tw:text-xs tw:text-gray-500 tw:mb-4">
                Track lead follow-ups across employees, retailers and regions.
              </div>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <TodayOpenChip
                status={searchParams.get("status") || ""}
                fromDate={searchParams.get("startDate") || ""}
                toDate={searchParams.get("endDate") || ""}
                onToggle={handleTodayOpenToggle}
              />
              {myEmployeeId && (
                <button
                  type="button"
                  onClick={() =>
                    nav.to("/master/crm/employee", { id: myEmployeeId })
                  }
                  className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:border-primary tw:bg-primary tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-white tw:shadow-sm tw:transition-colors tw:hover:opacity-90"
                >
                  <UserRound className="tw:h-3.5 tw:w-3.5" />
                  My Follow-ups
                </button>
              )}
              <AllRetailersButton />
            </div>
          </div>

          <AppTab
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant="underline"
            className="tw:mb-4"
          />

          {activeTab === "employees" && <Employees />}
          {activeTab === "retailers" && <Retailers />}
          {activeTab === "followups" && <Followups />}
        </div>
      </div>
    </>
  );
};

export default CrmDashboard;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle(
        "CRM Follow-ups - Dashboard",
      ),
    },
  ];
}
