import { Package, Upload, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
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
  // theme-2 reads this sub-nav as free-standing pills (the filled brand chip)
  // rather than the grey segmented bar the other themes use.
  const isTheme2 = useTheme() === "theme-2";
  const [invalidCount, setInvalidCount] = useState(0);

  useEffect(() => {
    // The badge only exists on the tab theme-2 hides, so skip the count call.
    if (isTheme2) return;
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
  }, [refreshKey, isTheme2]);

  // theme-2 keeps only the two upload flows here — single product lives in the
  // catalog add flow and the not-found barcodes are surfaced from the preview.
  const tabs = TABS.filter(
    (t) =>
      !isTheme2 || (t.key !== "single" && t.key !== "invalid-barcodes"),
  ).map((t) =>
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
      variant={isTheme2 ? "pills" : "tabs"}
      // theme-2 pins the chips on their own white band under the app header
      // (same treatment as the barcode scan sub-nav), so the caller's margins
      // are dropped — the band has to sit flush.
      className={
        isTheme2
          ? "subscribe-tabs-sticky barcode-tabs-pills"
          : className
      }
    />
  );
};

export default BulkUploadMainTab;
