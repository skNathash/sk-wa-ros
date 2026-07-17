import React, { useState } from "react";
import { Package, PackageCheck } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import BoxOverview from "./components/BoxOverview";

interface BoxReceiveModalProps {
  show: boolean;
  onClose: () => void;
  boxes?: any[];
  onReceive?: (data: any) => void;
}

const BoxReceiveModal: React.FC<BoxReceiveModalProps> = ({
  show,
  onClose,
  boxes = [],
  onReceive,
}) => {
  const [activeTab, setActiveTab] = useState("box-level");

  const tabs: TabItem[] = [
    {
      key: "box-level",
      name: "Box Level Receiving",
      icon: "Package",
    },
    {
      key: "item-level",
      name: "Item Level Receiving",
      icon: "PackageCheck",
    },
  ];

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
  };

  const handleReceive = (data: any) => {
    if (onReceive) {
      onReceive(data);
    }
  };

  const handleModalCallback = ({ action }: { action: string; data: any }) => {
    if (action === "close") {
      onClose();
    }
  };

  return (
    <AppModal
      show={show}
      callback={handleModalCallback}
      className="tw:max-w-4xl tw:h-[80vh]"
    >
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <Package className="tw:w-5 tw:h-5 tw:text-primary" />
          <h2 className="tw:text-lg tw:font-semibold tw:text-gray-900">
            Receive Shipment Boxes
          </h2>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:flex tw:flex-col tw:gap-4">
        {/* Tabs */}
        <AppTab
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          variant="tabs"
          className="tw:mb-4"
        />

        {/* Tab Content */}
        <div className="tw:flex-1 tw:overflow-hidden">
          {activeTab === "box-level" && (
            <div className="tw:h-full tw:flex tw:flex-col">
              <BoxOverview boxes={boxes} />
            </div>
          )}

          {activeTab === "item-level" && (
            <div className="tw:h-full tw:flex tw:flex-col">
              <div className="tw:bg-gray-50 tw:p-4 tw:rounded-lg tw:border tw:border-gray-200">
                <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
                  <PackageCheck className="tw:w-5 tw:h-5 tw:text-primary" />
                  <h3 className="tw:text-md tw:font-medium tw:text-gray-900">
                    Item Level Receiving
                  </h3>
                </div>
                <p className="tw:text-sm tw:text-gray-600">
                  Receive individual items from each box. This allows for
                  partial receiving and detailed item tracking.
                </p>
                {/* Item level receiving content will go here */}
                <div className="tw:mt-4 tw:text-center tw:text-gray-500">
                  Item level receiving interface coming soon...
                </div>
              </div>
            </div>
          )}
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-3">
          <button
            onClick={onClose}
            className="tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:text-gray-700 tw:bg-white tw:border tw:border-gray-300 tw:rounded-md tw:hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleReceive({ type: activeTab, boxes })}
            className="tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:text-white tw:bg-primary tw:border tw:border-transparent tw:rounded-md tw:hover:bg-primary/90"
          >
            Receive {activeTab === "box-level" ? "Boxes" : "Items"}
          </button>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default BoxReceiveModal;
