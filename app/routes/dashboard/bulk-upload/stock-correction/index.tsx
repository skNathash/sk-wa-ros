import {
  CalendarClock,
  QrCode,
  PackageMinus,
  Download,
  IndianRupee,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import AppTab from "~/components/core/tab/AppTab";
import AppButton from "~/components/core/button/AppButton";
import type { TabItem } from "~/types/CommonTypes";
import PageAccessService from "~/services/PageAccessService";
import DownloadInventoryModal from "../modals/DownloadInventoryModal";
import UpdateMfgExp from "./components/update-mfg-exp/UpdateMfgExp";
import UpdateBarcode from "./components/update-barcode/UpdateBarcode";
import StockAdjustment from "./components/stock-adjustment/StockAdjustment";
import UpdateMrp from "./components/update-mrp/UpdateMrp";

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

const stockCorrectionFeatureMap: Record<string, string> = {
  "update-mfg-exp": "no-shelf-life",
  "update-barcode": "no-barcode",
  "update-mrp": "update-mrp",
  "stock-adjustment": "adjustment",
};

const subTabs: TabItem[] = [
  {
    name: "Update MFG & Expiry",
    key: "update-mfg-exp",
    icon: <CalendarClock size={16} />,
  },
  {
    name: "Update Barcode",
    key: "update-barcode",
    icon: <QrCode size={16} />,
  },
  {
    name: "MRP Updates",
    key: "update-mrp",
    icon: <IndianRupee size={16} />,
  },
  {
    name: "Stock Adjustment",
    key: "stock-adjustment",
    icon: <PackageMinus size={16} />,
  },
];

const StockCorrectionTab = () => {
  const { t } = useTranslation(["common"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("tab") || "update-mfg-exp",
  );
  const [downloadModal, setDownloadModal] = useState({ show: false });

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") || "update-mfg-exp";
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [activeTab, searchParams]);

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", tab.key);
    setSearchParams(nextParams);
  };

  const handleDownloadModal = ({ action }: any) => {
    if (action === "close") {
      setDownloadModal({ show: false });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "update-mfg-exp":
        return <UpdateMfgExp />;
      case "update-barcode":
        return <UpdateBarcode />;
      case "update-mrp":
        return <UpdateMrp />;
      case "stock-adjustment":
        return <StockAdjustment />;
      default:
        return <UpdateMfgExp />;
    }
  };

  return (
    <>
      <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-3 tw:mb-4 tw:flex tw:flex-col tw:sm:flex-row tw:items-start tw:sm:items-center tw:justify-between tw:gap-3">
        <div className="tw:flex tw:items-start tw:gap-2 tw:min-w-0">
          <Download
            size={18}
            className="tw:text-blue-600 tw:mt-0.5 tw:shrink-0"
          />
          <div className="tw:text-sm">
            <p className="tw:font-medium tw:text-blue-900">
              Download Inventory
            </p>
            <p className="tw:text-blue-700 tw:text-xs tw:mt-0.5">
              All product data can be downloaded and updated.
            </p>
          </div>
        </div>
        <AppButton
          size="small"
          color="primary"
          onClick={() => setDownloadModal({ show: true })}
          className="tw:shrink-0"
        >
          <Download size={14} />
          <span>Download</span>
        </AppButton>
      </div>

      <div className="tw:mb-4">
        <AppTab
          tabs={subTabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          variant="tabs"
        />
      </div>

      {renderTabContent()}

      <DownloadInventoryModal
        show={downloadModal.show}
        callback={handleDownloadModal}
        feature={stockCorrectionFeatureMap[activeTab]}
        showDealIds
      />
    </>
  );
};

export default StockCorrectionTab;

export function meta() {
  return [
    {
      title: "Bulk Upload - Stock Correction",
    },
  ];
}
