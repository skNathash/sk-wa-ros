import { Building2, Package, User } from "lucide-react";
import { AppRadio } from "~/components/core/form/AppRadio";
import { useTranslation } from "react-i18next";
import { API } from "~/constants";
import CommonService from "~/services/CommonService";
import { BulkFileUpload, BulkUploadInfo } from "../components";
import { useState, useMemo } from "react";
import BulkUploadService from "~/services/BulkUploadService";
import useAppToast from "~/hooks/useAppToast";
import Preview from "./components/Preview";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AuthService from "~/services/AuthService";
import PageAccessService from "~/services/PageAccessService";

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

// Define tabs for B2B and B2C
const baseTabs: TabItem[] = [
  {
    name: "B2C Pricing",
    key: "b2c",
    icon: <User />,
  },
  {
    name: "B2B Pricing",
    key: "b2b",
    icon: <Building2 />,
  },
];

const PricingTab = () => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  // Determine if current user is a buyer (should not see B2B tab)
  const isBuyer = AuthService.isBuyerUser() || AuthService.isSkBuyer();

  const [busyLoader, setBusyLoader] = useState({
    show: false,
    message: "",
  });

  const [dispaly, setDisplay] = useState<"upload" | "preview">("upload");
  const [activeTab, setActiveTab] = useState<string>(isBuyer ? "b2c" : "b2c");
  const [uploadMode, setUploadMode] = useState<"dealId" | "barcode">("dealId");

  // Compute tabs based on user role: hide B2B for buyer users
  const tabs: TabItem[] = isBuyer
    ? baseTabs.filter((t) => t.key === "b2c")
    : baseTabs;

  const [products, setProducts] = useState<any[]>([]);
  const [batchId, setBatchId] = useState<string>("");

  // Derive counts dynamically so they update correctly when items are removed
  const validProductCount = useMemo(() => {
    return products.filter((p) => p.status === "VALID").length;
  }, [products]);

  const invalidProductCount = useMemo(() => {
    return products.filter((p) => p.status === "INVALID").length;
  }, [products]);

  // Dynamically identify items with duplicate barcodes
  const processedProducts = useMemo(() => {
    const getBarcode = (p: any) => {
      if (!p) return "";
      if (typeof p.barcode === "string") return p.barcode.trim();
      if (Array.isArray(p.barcode) && p.barcode.length > 0) {
        return (p.barcode[0] || "").toString().trim();
      }
      if (p.dealRef) return p.dealRef.trim();
      return "";
    };

    const barcodeCounts: Record<string, number> = {};
    products.forEach((p) => {
      const bc = getBarcode(p);
      if (bc) {
        barcodeCounts[bc] = (barcodeCounts[bc] || 0) + 1;
      }
    });

    return products.map((p) => {
      const bc = getBarcode(p);
      const isDuplicate = bc ? barcodeCounts[bc] > 1 : false;
      return {
        ...p,
        isDuplicate,
      };
    });
  }, [products]);

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
    // Reset the display and products when switching tabs
    resetToUpload();
  };

  const handleModeChange = (mode: "dealId" | "barcode") => {
    setUploadMode(mode);
    // Reset the display and products when switching upload mode
    resetToUpload();
  };

  const getUploadUrl = () => {
    const type = activeTab === "b2c" ? "B2C_PRICE" : "B2B_PRICE";
    const path =
      uploadMode === "barcode"
        ? "purchase/inventory/excel/price-barcode-upload?type="
        : "purchase/inventory/excel/price-upload?type=";
    return `${API}${path}${type}`;
  };

  const handleDownloadTemplate = () => {
    const type = activeTab === "b2c" ? "B2C_PRICE" : "B2B_PRICE";
    const path =
      uploadMode === "barcode"
        ? "purchase/inventory/excel/template/price-barcode"
        : "purchase/inventory/excel/template/price";
    const url = `${API}${path}/${type}`;
    CommonService.windowOpenHandler(url, () => {});
  };

  const handleFileUpload = async (r: any) => {
    const batchId = r.uploadInfo?.batchId;

    if (!batchId) {
      appToast.show({
        msg: r?.data?.message || "Failed to upload file. Please try again.",
        color: "error",
      });
      return;
    }

    setBusyLoader({ show: true, message: "Uploading file..." });

    const response = await BulkUploadService.getBatchStatus(batchId);

    if (response.statusCode === 200) {
      const deals = (response.data?.data?.records || []).map((deal: any) => {
        const dt = (deal.discountType || "").toLowerCase();
        const isPercentage = !dt || dt === "normal" || dt === "percentage";
        return {
          ...deal,
          type: activeTab === "b2c" ? "B2C" : "B2B",
          isPercentage,
          discountLabel: isPercentage ? "Percentage" : deal.discountType,
        };
      });
      const validDeals = deals.filter((deal: any) => deal.status === "VALID");
      const invalidDeals = deals.filter(
        (deal: any) => deal.status === "INVALID",
      );

      if (deals.length > 0) {
        setDisplay("preview");
        setBatchId(batchId);
        setProducts([...validDeals, ...invalidDeals]);
        appToast.show({
          msg: "File uploaded successfully.",
          color: "success",
        });
      } else {
        appToast.show({
          msg: "No deals found.",
          color: "error",
        });
      }
    }

    setBusyLoader({ show: false, message: "" });
  };

  const resetToUpload = () => {
    setProducts([]);
    setBatchId("");
    setDisplay("upload");
  };

  const handlePreviewCallback = (a: { action: string; data?: any }) => {
    if (a.action === "back") {
      resetToUpload();
    }
    if (a.action === "submit") {
      resetToUpload();
    }
    if (a.action === "remove") {
      setProducts((prev: any[]) => {
        const newProducts = [...prev];
        newProducts.splice(a.data.index, 1);
        return newProducts;
      });
      if (products.length === 1) {
        resetToUpload();
      }
    }
  };

  return (
    <>
      {/* B2C/B2B selector and upload mode selector on a single row */}
      <div className="tw:mb-4 tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
        <AppTab
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          variant="tabs"
        />
        <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-md tw:border tw:border-gray-200 tw:bg-white tw:px-3 tw:py-2">
          <span className="tw:text-sm tw:font-medium tw:text-gray-600 tw:whitespace-nowrap">
            Upload by
          </span>
          <AppRadio
            name="uploadMode"
            inline
            defaultValue={uploadMode}
            options={[
              { value: "dealId", label: "Deal Id" },
              { value: "barcode", label: "Barcode" },
            ]}
            onChange={(v) => handleModeChange(v as "dealId" | "barcode")}
          />
        </div>
      </div>

      {dispaly === "upload" && (
        <div className="tw:space-y-6">
          {/* Bulk Upload Information */}
          <BulkUploadInfo
            title={`Bulk ${activeTab.toUpperCase()} Pricing Upload`}
            icon={<Package className="tw:text-blue-600" size={20} />}
            requiredFormat={
              uploadMode === "barcode"
                ? `Your Excel file should contain the following columns: Barcode, ${
                    activeTab === "b2c" ? "B2C Price" : "B2B Price"
                  }, Mrp. Only 50 products can be updated at a time.`
                : `Your Excel file should contain the following columns: Deal Id, ${
                    activeTab === "b2c" ? "B2C Price" : "B2B Price"
                  }, Mrp. Only 50 products can be updated at a time.`
            }
            onDownloadTemplate={handleDownloadTemplate}
            showDownloadInventory={true}
            description={`Upload your ${activeTab.toUpperCase()} pricing data in bulk using our Excel template. This will help you update multiple product prices at once.`}
          />

          {/* File Upload */}
          <BulkFileUpload
            title="Upload Excel File"
            description={`Select your Excel file containing the ${activeTab.toUpperCase()} pricing data to upload.`}
            onUpload={handleFileUpload}
            acceptedFormats={[".xlsx", ".xls"]}
            maxSizeMB={10}
            uploadUrl={getUploadUrl()}
          />
        </div>
      )}
      {dispaly === "preview" && (
        <Preview
          products={processedProducts}
          validProductCount={validProductCount}
          invalidProductCount={invalidProductCount}
          callback={handlePreviewCallback}
          activeTab={activeTab}
          batchId={batchId}
          uploadMode={uploadMode}
        />
      )}

      <BusyLoader show={busyLoader.show} message={busyLoader.message} />
    </>
  );
};

export default PricingTab;

export function meta() {
  return [
    {
      title: "Bulk Upload - Pricing",
    },
  ];
}
