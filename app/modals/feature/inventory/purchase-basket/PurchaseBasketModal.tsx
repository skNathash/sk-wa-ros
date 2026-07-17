import { useState } from "react";
import useScreenView from "~/hooks/useScreenView";
import DesktopView from "./components/DesktopView";
// import MobileView from "./components/MobileView"; // Uncomment when MobileView is available
import AppModal from "~/components/core/modal/AppModal";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import AppButton from "~/components/core/button/AppButton";

const tabs: TabItem[] = [
  {
    name: "Recommended",
    key: "recommended",
  },
  {
    name: "All Products",
    key: "all",
  },
];

const PurchaseBasketModal = ({
  show,
  callback,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
}) => {
  const { isMobile } = useScreenView();

  const [activeTab, setActiveTab] = useState(tabs[0]);

  const onClose = () => {
    callback({ action: "close" });
  };

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab);
  };

  // Dummy data for demonstration
  const data = [
    {
      id: 1,
      product: "Product A",
      stock: 100,
      category: "Category 1",
      qty: 2,
      unitPrice: 50,
      total: 100,
    },
    {
      id: 2,
      product: "Product B",
      stock: 50,
      category: "Category 2",
      qty: 1,
      unitPrice: 75,
      total: 75,
    },
  ];
  const loading = false;

  // Dummy summary values for demonstration
  const selectedCount = 3;
  const estimatedValue = 471.2;

  return (
    <AppModal show={show} callback={onClose} className="tw:!max-w-3xl">
      <AppModal.Title onClose={onClose}>Purchase Basket</AppModal.Title>
      <AppModal.Content>
        <AppTab
          tabs={tabs}
          activeTab={activeTab.key}
          onTabChange={handleTabChange}
        />
        <div className="tw:mt-4">
          {isMobile ? (
            // <MobileView data={data} loading={loading} />
            <div>Mobile view coming soon</div>
          ) : (
            <DesktopView data={data} loading={loading} />
          )}
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:items-center tw:justify-between tw:bg-gray-50 tw:rounded-b-lg tw:border-t tw:border-gray-200 tw:mt-0 tw:w-full">
          <div>
            <span className="tw:font-semibold tw:text-lg">
              {selectedCount} items selected
            </span>
            <div className="tw:text-gray-500 tw:text-base tw:mt-1">
              Total Estimated Value:{" "}
              <span className="tw:font-medium">
                ${estimatedValue.toFixed(2)}
              </span>
            </div>
          </div>
          <AppButton size="small">
            <span className="tw:text-xl tw:font-bold">+</span>
            Add Selected to Basket
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default PurchaseBasketModal;
