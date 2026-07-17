import { Package, Upload, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { TabItem } from "~/types/CommonTypes";

const TABS: TabItem[] = [
  { key: "single", name: "Single Product", icon: <Package /> },
  {
    key: "bulk",
    name: "Bulk Upload",
    icon: <Upload />,
    langKey: "bulkProductUpload",
  },
  {
    key: "barcode",
    name: "Bulk Barcode Search",
    icon: <Upload />,
    langKey: "bulkBarcodeSearch",
  },
  {
    key: "invalid-barcodes",
    name: "Not Found Barcodes",
    icon: <AlertCircle />,
    langKey: "notFoundBarcodes",
  },
];

const BulkUploadMainTab = ({
  activeTab,
  className,
  refreshKey,
}: {
  activeTab: string;
  className?: string;
  refreshKey?: number | string;
}) => {
  const appNav = useAppNav();
  const [invalidCount, setInvalidCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await InventorySubscribeService.getInvalidBarcodes({
          filter: { status: "PENDING" },
          outputType: "count",
        });
        setInvalidCount(res?.data?.data?.count || 0);
      } catch (e) {
        console.error("Error fetching invalid barcode count:", e);
      }
    })();
  }, [refreshKey]);

  const tabs = TABS.map((t) =>
    t.key === "invalid-barcodes"
      ? { ...t, count: invalidCount, countColor: "tw:bg-red-600 tw:text-white" }
      : t,
  );

  const handleTabChange = (tab: { key: string; name: string }) => {
    if (tab.key === "single") {
      appNav.to(`/dashboard/inventory/subscribe/add-product`);
    } else if (tab.key === "bulk") {
      appNav.to(`/dashboard/inventory/subscribe/add-product/bulk`);
    } else if (tab.key === "barcode") {
      appNav.to(`/dashboard/inventory/subscribe/bulk-upload/barcode`);
    } else if (tab.key === "invalid-barcodes") {
      appNav.to(`/dashboard/inventory/subscribe/bulk-upload/invalid-barcodes`);
    }
  };

  return (
    <AppTab
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => handleTabChange(tab)}
      className={className}
    />
  );
};

export default BulkUploadMainTab;
