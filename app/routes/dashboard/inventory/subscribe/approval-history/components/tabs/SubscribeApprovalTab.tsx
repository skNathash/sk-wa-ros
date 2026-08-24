import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
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
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";

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
          isSubscribed: false,
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
      // theme-2 keeps its sub-navs as free-standing pills; the underline bar
      // reads as a second heavy rule under the chip strip above it.
      variant={isTheme2 ? "pills" : "underline"}
      className={className}
      // Mobile only: the band around this row drops its side padding there
      // (`.app-tabs-band`), so the inset comes from the swiper instead — the row
      // lines up with the chip strip above while still scrolling out to the
      // screen edge. Desktop keeps the plain row with no leading gap.
      slideOffset={isMobile ? 16 : 0}
    />
  );
};

export default SubscribeApprovalTab;
