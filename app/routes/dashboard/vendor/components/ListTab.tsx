import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";

type Props = {
  activeTab: string;
  className?: string;
};

const tabs: TabItem[] = [
  {
    name: "Analytics",
    key: "analytics",
    langKey: "vendorAnalytics",
  },
  {
    name: "All Vendors",
    key: "all",
    langKey: "allVendors",
  },
];

const ListTab = ({ activeTab, className }: Props) => {
  const appNav = useAppNav();

  const onTabChange = (tab: TabItem) => {
    if (tab.key === "analytics") {
      appNav.replace("/dashboard/vendor/analytics");
    } else {
      appNav.replace("/dashboard/vendor/list");
    }
  };

  return (
    <AppTab
      activeTab={activeTab}
      tabs={tabs}
      onTabChange={onTabChange}
      className={className}
    />
  );
};

export default ListTab;
