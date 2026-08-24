import {
  CalendarClock,
  QrCode,
  PackageMinus,
  Package,
  IndianRupee,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import PageAccessService from "~/services/PageAccessService";
import DownloadInventoryModal from "../modals/DownloadInventoryModal";
import { BulkUploadInfo } from "../components";
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

/* Picking a correction is the same kind of choice bulk pricing's "Upload by"
   row makes — one small, mutually exclusive switch that reshapes the sheet
   below it — so it wears the same segmented control (`app-mode-seg`) rather
   than a second tab strip under the page's own. `name` is the segment's label;
   `fullName` is what assistive tech and the info card read out. */
const CORRECTIONS: {
  key: string;
  name: string;
  fullName: string;
  icon: LucideIcon;
}[] = [
  {
    key: "update-mfg-exp",
    name: "MFG & Expiry",
    fullName: "Update MFG & Expiry",
    icon: CalendarClock,
  },
  {
    key: "update-barcode",
    name: "Barcode",
    fullName: "Update Barcode",
    icon: QrCode,
  },
  {
    key: "update-mrp",
    name: "MRP",
    fullName: "MRP Updates",
    icon: IndianRupee,
  },
  {
    key: "stock-adjustment",
    name: "Stock",
    fullName: "Stock Adjustment",
    icon: PackageMinus,
  },
];

/* Stock correction has no separate Excel template: the downloaded inventory
   sheet IS the template, so each tab states which of its columns to fill in
   and hands the download off to the inventory modal (which filters to the rows
   that tab can correct). Same info-card + upload-card shape the pricing tab
   uses, so the two flows read alike. */
const tabInfo: Record<string, { fields: string[]; description: string }> = {
  "update-mfg-exp": {
    fields: ["MFG Date", "Expiry Date", "Remarks"],
    description:
      "Download the inventory of products with no shelf life recorded, fill in the manufacturing and expiry dates, then upload the sheet back.",
  },
  "update-barcode": {
    fields: ["Barcode"],
    description:
      "Download the inventory of products with no barcode, fill in the barcode against each product, then upload the sheet back.",
  },
  "update-mrp": {
    fields: ["New MRP"],
    description:
      "Download the inventory, set the revised MRP against each product, then upload the sheet back.",
  },
  "stock-adjustment": {
    fields: ["New Quantity"],
    description:
      "Download the inventory, enter the physically counted quantity against each product, then upload the sheet back.",
  },
};

const DEFAULT_CORRECTION = "update-mfg-exp";

const StockCorrectionTab = () => {
  const { t } = useTranslation(["common"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("tab") || DEFAULT_CORRECTION,
  );
  const [downloadModal, setDownloadModal] = useState({ show: false });
  const segRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") || DEFAULT_CORRECTION;
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [activeTab, searchParams]);

  // Phones scroll the track instead of splitting it four ways, so the chosen
  // segment can start off screen — pull it into view whenever it changes.
  useEffect(() => {
    segRef.current
      ?.querySelector('[aria-checked="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeTab]);

  const handleTabChange = (key: string) => {
    if (key === activeTab) return;
    setActiveTab(key);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", key);
    setSearchParams(nextParams);
  };

  const handleDownloadModal = ({ action }: any) => {
    if (action === "close") {
      setDownloadModal({ show: false });
    }
  };

  const correction =
    CORRECTIONS.find((c) => c.key === activeTab) || CORRECTIONS[0];
  const info = tabInfo[activeTab] || tabInfo[DEFAULT_CORRECTION];

  /* Rendered by the active tab above its upload box, so it goes away with it
     once a file is in preview — a standing "download the sheet" card over a
     table of parsed rows is just noise. */
  const infoCard = (
    <BulkUploadInfo
      title={correction.fullName}
      icon={<Package className="app-accent-icon tw:text-blue-600" size={20} />}
      description={info.description}
      formatTitle="Columns to fill"
      columns={info.fields}
      limitNote="Leave every other column as it is"
      requiredFormat={`Fill in ${info.fields.join(
        ", ",
      )} in the downloaded sheet and leave every other column as it is.`}
      templateLabel="Inventory"
      onDownloadTemplate={() => setDownloadModal({ show: true })}
    />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "update-barcode":
        return <UpdateBarcode info={infoCard} />;
      case "update-mrp":
        return <UpdateMrp info={infoCard} />;
      case "stock-adjustment":
        return <StockAdjustment info={infoCard} />;
      default:
        return <UpdateMfgExp info={infoCard} />;
    }
  };

  return (
    <>
      {/* Same segmented switch bulk pricing uses for "Upload by" — same page
          background, same right-hand parking from sm up — captioned for the
          choice it makes here. `-scroll` keeps the four segments at their
          natural width on phones, where pricing's two can split the row. */}
      <div
        className="app-mode-seg-row app-mode-seg-scroll tw:sm:justify-end"
        role="radiogroup"
        aria-label="Correction type"
      >
        <span className="app-mode-seg-label">Correction</span>
        <div className="app-mode-seg" ref={segRef}>
          {CORRECTIONS.map(({ key, name, fullName, icon: Icon }) => {
            const isActive = key === activeTab;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={fullName}
                className={`app-mode-seg-btn ${
                  isActive ? "app-mode-seg-btn-active" : ""
                }`}
                onClick={() => handleTabChange(key)}
              >
                <Icon size={15} />
                <span>{name}</span>
              </button>
            );
          })}
        </div>
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
