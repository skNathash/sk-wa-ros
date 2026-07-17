import { format, subMonths } from "date-fns";
import { produce } from "immer";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { TabItem } from "~/types/CommonTypes";

interface PoListTabsProps {
  activeTab: string;
  className?: string;
}

const PoListTabs: React.FC<PoListTabsProps> = ({ activeTab, className }) => {
  const { t } = useTranslation(["common"]);
  const { to } = useAppNav();
  const [searchParams] = useSearchParams();

  const getQueryParams = (tabKey: string, searchParams: URLSearchParams) => {
    const params: Record<string, any> = {};

    if (tabKey === "all-po") {
      const dateFromParam = searchParams.get("dateFrom");
      const dateToParam = searchParams.get("dateTo");
      const today = new Date();
      const sixMonthsAgo = subMonths(today, 6);
      const dateFrom = dateFromParam ? new Date(dateFromParam) : sixMonthsAgo;
      const dateTo = dateToParam ? new Date(dateToParam) : today;
      params.dateFrom = format(dateFrom, "yyyy-MM-dd");
      params.dateTo = format(dateTo, "yyyy-MM-dd");
      params.groupByType = "total";
    }

    return params;
  };

  const [tabItems, setTabItems] = useState<TabItem[]>(() => {
    const items: TabItem[] = [
      {
        name: "Vendor Purchase",
        key: "summary",
        icon: "box",
        langKey: "vendorPurchase",
      },
    ];

    if (AuthService.canHandleB2B()) {
      items.push({
        name: "Network Purchase",
        key: "seller-orders",
        icon: "box",
        langKey: "networkPurchase",
      });
    }

    items.push(
      {
        name: t("notReceivedOrders"),
        key: "receive-orders",
        icon: "inbox",
        langKey: "notReceivedOrders",
      },
      {
        name: t("recentlyReceived"),
        key: "recently-received",
        icon: "package-check",
        langKey: "recentlyReceived",
      },
      {
        name: "All PO",
        key: "all-po",
        icon: "box",
        langKey: "All PO",
      },
    );

    return items;
  });

  const handleTabChange = (tab: TabItem) => {
    if (tab.key === "summary") {
      to("/dashboard/purchase-order/summary");
    } else if (tab.key === "recently-received") {
      to("/dashboard/purchase-order/recently-received");
    } else if (tab.key === "auto-allocation") {
      to("/dashboard/purchase-order/auto-allocation");
    } else if (tab.key === "receive-orders") {
      to("/dashboard/purchase-order/not-received");
    } else if (tab.key === "seller-orders") {
      to("/dashboard/purchase-order/seller-summary");
    } else if (tab.key === "all-po") {
      const params = getQueryParams(tab.key, searchParams);
      to("/dashboard/purchase-order/summary-po", params);
    } else {
      to("/dashboard/purchase-order/list", {
        tab: tab.key,
      });
    }
  };

  useEffect(() => {
    const fetchCount = async () => {
      const count = await PurchaseOrderService.getPoPackages(
        AuthService.getLoggedInUserId() || "",
        {
          outputType: "count",
          filter: {
            status: "Shipped",
          },
        },
      );
      setTabItems(
        produce((draft: TabItem[]) => {
          draft.forEach((tab: TabItem) => {
            if (tab.key === "receive-orders") {
              tab.count = count.data?.data?.count || 0;
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
      className={`theme-2-edge-tabs ${className ?? ""}`}
    />
  );
};

export default PoListTabs;
