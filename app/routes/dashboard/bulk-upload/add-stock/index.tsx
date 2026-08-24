import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API } from "~/constants";
import CommonService from "~/services/CommonService";
import { BulkFileUpload, BulkUploadInfo } from "../components";
import { useState } from "react";
import BulkUploadService from "~/services/BulkUploadService";
import useAppToast from "~/hooks/useAppToast";
import Preview from "./components/Preview";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import PageAccessService from "~/services/PageAccessService";
import ReportService from "~/services/ReportService";
import AuthService from "~/services/AuthService";

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

const AddStockTab = () => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const [busyLoader, setBusyLoader] = useState({
    show: false,
    message: "",
  });

  const [dispaly, setDisplay] = useState<"upload" | "preview">("upload");

  const [products, setProducts] = useState<any[]>([]);

  const [validProductCount, setValidProductCount] = useState(0);
  const [invalidProductCount, setInvalidProductCount] = useState(0);

  const handleDownloadTemplate = () => {
    const url =
      location.origin + "/assets/samples/product-stock-upload-sample.xlsx";
    CommonService.windowOpenHandler(url, () => {});
  };

  const handleDownloadInventory = () => {
    ReportService.getInventoryReport(AuthService.getLoggedInUserId());
  };

  const handleFileUpload = async (r: any) => {
    const batchId = r.uploadInfo?.batchId;

    if (!batchId) {
      appToast.show({
        msg: "Failed to upload file. Please try again.",
        color: "error",
      });
      return;
    }

    setBusyLoader({ show: true, message: "Uploading file..." });

    const response = await BulkUploadService.getBatchStatus(batchId);

    if (response.statusCode === 200) {
      const deals = response.data?.data?.records || [];
      const validDeals = deals.filter((deal: any) => deal.status === "VALID");
      const invalidDeals = deals.filter(
        (deal: any) => deal.status === "INVALID",
      );

      if (validDeals.length > 0) {
        setDisplay("preview");
        setProducts([...validDeals, ...invalidDeals]);
        setValidProductCount(validDeals.length);
        setInvalidProductCount(invalidDeals.length);
        appToast.show({
          msg: "File uploaded successfully.",
          color: "success",
        });
      } else {
        appToast.show({
          msg: "No valid deals found.",
          color: "error",
        });
      }
    }

    setBusyLoader({ show: false, message: "" });
  };

  const resetToUpload = () => {
    setValidProductCount(0);
    setInvalidProductCount(0);
    setProducts([]);
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
      {dispaly === "upload" && (
        <div className="tw:space-y-6">
          {/* Bulk Upload Information */}
          <BulkUploadInfo
            title="Bulk Stock Upload"
            icon={
              <Package className="app-accent-icon tw:text-blue-600" size={20} />
            }
            requiredFormat="Your Excel file should contain the following columns: Deal Id, Quantity, Mrp, Purchase Price. Only 50 products can be updated at a time."
            columns={["Deal Id", "Quantity", "Mrp", "Purchase Price"]}
            limitNote="Up to 50 products per upload"
            onDownloadTemplate={handleDownloadTemplate}
            showDownloadInventory={true}
            description="Upload your stock data in bulk using our Excel template. This will help you update multiple product stock quantities at once."
          />

          {/* File Upload */}
          <BulkFileUpload
            title="Upload Excel File"
            description="Select your Excel file containing the stock data to upload."
            onUpload={handleFileUpload}
            acceptedFormats={[".xlsx", ".xls"]}
            maxSizeMB={10}
            uploadUrl={API + "purchase/inventory/excel/stock-upload?"}
          />
        </div>
      )}
      {dispaly === "preview" && (
        <Preview
          products={products}
          validProductCount={validProductCount}
          invalidProductCount={invalidProductCount}
          callback={handlePreviewCallback}
        />
      )}

      <BusyLoader show={busyLoader.show} message={busyLoader.message} />
    </>
  );
};

export default AddStockTab;

export function meta() {
  return [
    {
      title: "Bulk Upload - Add Stock",
    },
  ];
}
