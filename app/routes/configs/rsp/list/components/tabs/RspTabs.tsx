import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import type { TabItem } from "~/types/CommonTypes";

const RspTabs = ({
  activeTab,
  className,
}: {
  activeTab: string;
  className?: string;
}) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();

  const tabs: TabItem[] = [
    {
      name: t("productPricing"),
      key: "productPricing",
    },
    {
      name: t("pricingHistory"),
      key: "pricingHistory",
    },
  ];

  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  const onTabChange = (tab: TabItem) => {
    const query = type ? `?type=${type}` : "";
    if (tab.key === "productPricing") {
      appNav.to(`/configs/rsp${query}`);
    } else if (tab.key === "pricingAnalysis") {
      appNav.to(`/configs/rsp/analysis${query}`);
    } else if (tab.key === "pricingHistory") {
      appNav.to(`/configs/rsp/history${query}`);
    }
  };

  return (
    <AppTab
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      className={className}
    />
  );
};

export default RspTabs;
