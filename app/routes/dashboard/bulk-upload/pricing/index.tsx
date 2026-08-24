import { Hash, Package, ScanBarcode } from "lucide-react";
import { API } from "~/constants";
import CommonService from "~/services/CommonService";
import { BulkFileUpload, BulkUploadInfo } from "../components";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router";
import BulkUploadService from "~/services/BulkUploadService";
import useAppToast from "~/hooks/useAppToast";
import Preview from "./components/Preview";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AuthService from "~/services/AuthService";
import PageAccessService from "~/services/PageAccessService";

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

type UploadMode = "dealId" | "barcode";

const UPLOAD_MODES: { value: UploadMode; label: string; icon: typeof Hash }[] = [
  { value: "dealId", label: "Deal Id", icon: Hash },
  { value: "barcode", label: "Barcode", icon: ScanBarcode },
];

const PricingTab = () => {
  const appToast = useAppToast();
  const [searchParams] = useSearchParams();

  // Determine if current user is a buyer (they get no B2B pricing)
  const isBuyer = AuthService.isBuyerUser() || AuthService.isSkBuyer();

  // B2C/B2B now live in the parent tab strip, so the type rides on the URL.
  const activeTab =
    searchParams.get("tab") === "b2b" && !isBuyer ? "b2b" : "b2c";

  const [busyLoader, setBusyLoader] = useState({
    show: false,
    message: "",
  });

  const [dispaly, setDisplay] = useState<"upload" | "preview">("upload");
  const [uploadMode, setUploadMode] = useState<UploadMode>("dealId");

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

  // B2C <-> B2B stays on the same route, so nothing remounts: clear any
  // pending upload/preview when the type changes.
  useEffect(() => {
    resetToUpload();
  }, [activeTab]);

  const handleModeChange = (mode: UploadMode) => {
    if (mode === uploadMode) return;
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
      {/* Upload mode selector; B2C/B2B is picked in the page's main tab strip.
          Right-aligned next to its caption on desktop, full-width segmented
          switch on phones (see `.app-mode-seg` in app.css). */}
      <div
        className="app-mode-seg-row tw:sm:justify-end"
        role="radiogroup"
        aria-label="Upload by"
      >
        <span className="app-mode-seg-label">Upload by</span>
        <div className="app-mode-seg">
          {UPLOAD_MODES.map(({ value, label, icon: Icon }) => {
            const isActive = uploadMode === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={`app-mode-seg-btn ${
                  isActive ? "app-mode-seg-btn-active" : ""
                }`}
                onClick={() => handleModeChange(value)}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {dispaly === "upload" && (
        <div className="tw:space-y-6">
          {/* Bulk Upload Information */}
          <BulkUploadInfo
            title={`Bulk ${activeTab.toUpperCase()} Pricing Upload`}
            icon={
              <Package className="app-accent-icon tw:text-blue-600" size={20} />
            }
            columns={[
              uploadMode === "barcode" ? "Barcode" : "Deal Id",
              activeTab === "b2c" ? "B2C Price" : "B2B Price",
              "Mrp",
            ]}
            limitNote="Up to 50 products per upload"
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
            /* theme-2 drops the page header that used to carry "Download
               Inventory", so the card has to offer it — same as add-stock. */
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
