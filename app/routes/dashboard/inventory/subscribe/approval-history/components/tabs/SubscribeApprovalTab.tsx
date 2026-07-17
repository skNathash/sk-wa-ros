import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import { produce } from "immer";
import { getSubscribeVersionParam } from "../../../helper";

interface SubscribeApprovalTabProps {
  activeTab: string;
  className?: string;
}

const SubscribeApprovalTab: React.FC<SubscribeApprovalTabProps> = ({
  activeTab,
  className,
}) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();

  // Preserve the active flow (`version=old`) when switching approval tabs so
  // the breadcrumb keeps pointing back to the right landing.
  const versionParam = getSubscribeVersionParam(searchParams.get("version"));

  const [tabItems, setTabItems] = useState<TabItem[]>([
    { key: "products", name: t("products") },
    { key: "bulk", name: t("bulkUpload") },
    { key: "subscribe-pending", name: t("approvedNotSubscribed") },
  ]);

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "bulk") {
      appNav.to(`/dashboard/inventory/subscribe/approval-history/bulk-upload`, {
        tab: "history",
        hideTab: true,
        ...versionParam,
      });
    } else if (tab.key === "subscribe-pending") {
      appNav.to(
        `/dashboard/inventory/subscribe/approval-history/subscribe-pending`,
        {
          tab: "history",
          ...versionParam,
        },
      );
    } else {
      appNav.to(`/dashboard/inventory/subscribe/approval-history/products`, {
        tab: "history",
        ...versionParam,
      });
    }
  };

  useEffect(() => {
    const fetchCount = async () => {
      const count = await InventorySubscribeService.getSellerImportProducts({
        outputType: "count",
        filter: {
          status: "Synced",
        },
      });
      setTabItems(
        produce((draft: TabItem[]) => {
          draft.forEach((tab: TabItem) => {
            if (tab.key === "subscribe-pending") {
              tab.count = count.data?.data?.totalProducts || 0;
            }
          });
        }),
      );
    };
    fetchCount();
  }, []);

  return (
    <AppTab
      tabs={tabItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      variant="underline"
      className={className}
    />
  );
};

export default SubscribeApprovalTab;
