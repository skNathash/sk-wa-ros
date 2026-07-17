import AppTab from "~/components/core/tab/AppTab";
import useAppNav from "~/hooks/useAppNav";
import { Package, Barcode } from "lucide-react";
import type { TabItem } from "~/types/CommonTypes";

const tabs: TabItem[] = [
  {
    name: "Bulk Product Upload",
    key: "product",
    langKey: "bulkProductUpload",
    icon: <Package />,
  },
  {
    name: "Bulk Barcode Search",
    key: "barcode",
    langKey: "bulkBarcodeSearch",
    icon: <Barcode />,
  },
];

const BulkUploadSubTab = ({
  activeTab,
  className,
}: {
  activeTab: string;
  className?: string;
}) => {
  const appNav = useAppNav();

  const onTabChange = (tab: TabItem) => {
    if (tab.key === "product") {
      appNav.replace(`/dashboard/inventory/subscribe/add-product/bulk`);
    } else if (tab.key === "barcode") {
      appNav.replace(`/dashboard/inventory/subscribe/bulk-upload/barcode`);
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

export default BulkUploadSubTab;
