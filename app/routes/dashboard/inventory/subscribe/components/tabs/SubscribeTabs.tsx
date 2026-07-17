import { produce } from "immer";
import {
  Award,
  Clock,
  LayoutGrid,
  MapPin,
  Package,
  Search,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { TabItem } from "~/types/CommonTypes";
import { SUBSCRIBE_VERSION_OLD } from "../../helper";

type SubscribeTabKey =
  | "search"
  | "categories"
  | "brands"
  | "top"
  | "history"
  | "un-brands";

interface SubscribeTabsProps {
  className?: string;
}

const SubscribeTabs: React.FC<SubscribeTabsProps> = ({ className }) => {
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();

  const [tabs, setTabs] = useState<TabItem[]>([
    {
      key: "search",
      langKey: "inventorySubscribe:tabs.search",
      name: "Search",
      icon: <Search />,
    },
    {
      key: "un-brands",
      langKey: "inventorySubscribe:tabs.un-brands",
      name: "Un Brands",
      icon: <Package />,
    },
    {
      key: "top",
      langKey: "inventorySubscribe:tabs.top",
      name: "Top",
      icon: <MapPin />,
    },

    {
      key: "categories",
      langKey: "inventorySubscribe:tabs.categories",
      name: "Categories",
      icon: <LayoutGrid />,
    },
    {
      key: "brands",
      langKey: "inventorySubscribe:tabs.brands",
      name: "Brands",
      icon: <Award />,
    },
    {
      key: "history",
      langKey: "inventorySubscribe:tabs.history",
      name: "History",
      icon: <Clock />,
    },
  ]);

  const activeTab = (searchParams.get("tab") || "search") as SubscribeTabKey;

  // Carry the active flow (`version=old`) across tab navigation so the
  // breadcrumb keeps resolving back to the right "Create My Catalog" landing.
  const version = searchParams.get("version");
  const versionSuffix =
    version === SUBSCRIBE_VERSION_OLD ? `&version=${version}` : "";

  const handleTabChange = (tab: SubscribeTabKey) => {
    if (tab === "categories") {
      appNav.to(
        `/dashboard/inventory/subscribe/browse-category?tab=categories${versionSuffix}`
      );
    } else if (tab === "brands") {
      appNav.to(
        `/dashboard/inventory/subscribe/browse-brands?tab=brands${versionSuffix}`
      );
    } else if (tab === "history") {
      appNav.to(
        `/dashboard/inventory/subscribe/approval-history/products?tab=history${versionSuffix}`
      );
    } else if (tab === "un-brands") {
      appNav.to(
        `/dashboard/inventory/subscribe/un-brands?tab=un-brands${versionSuffix}`
      );
    } else if (tab === "top") {
      appNav.to(
        `/dashboard/inventory/subscribe/search?tab=top&sortType=popular&radiusKms=5${versionSuffix}`
      );
    } else {
      appNav.to(
        `/dashboard/inventory/subscribe/search?tab=${tab}${versionSuffix}`
      );
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
      setTabs(
        produce((draft) => {
          draft.forEach((tab) => {
            if (tab.key === "history") {
              tab.count = count.data?.data?.totalProducts || 0;
            }
          });
        })
      );
    };
    fetchCount();
  }, []);

  return (
    <AppTab
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => handleTabChange(tab.key as SubscribeTabKey)}
      className={className}
    />
  );
};

export default SubscribeTabs;
