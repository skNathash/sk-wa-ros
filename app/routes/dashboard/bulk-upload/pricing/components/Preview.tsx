import useScreenView from "~/hooks/useScreenView";
import MobileView from "./MobileView";
import DesktopView from "./DesktopView";
import AppCard from "~/components/core/card/AppCard";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import {
  ArrowLeft,
  Check,
  FileText,
  Package,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import { useEffect, useRef, useState } from "react";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import useAppToast from "~/hooks/useAppToast";
import BulkUploadService from "~/services/BulkUploadService";
import AuthService from "~/services/AuthService";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import useAppNav from "~/hooks/useAppNav";
import SummaryModal from "../modals/SummaryModal";

const Preview = ({
  products,
  validProductCount,
  invalidProductCount,
  callback,
  activeTab,
  batchId,
  uploadMode = "dealId",
}: {
  products: any[];
  validProductCount: number;
  invalidProductCount: number;
  callback: (a: { action: string; data?: any }) => void;
  activeTab: string;
  batchId: string;
  uploadMode?: "dealId" | "barcode";
}) => {
  const appToast = useAppToast();
  const appNav = useAppNav();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const isMasterLogin = AuthService.isMasterLogin();
  const isMasterWithFullAccess = AuthService.isMasterLoginWithFullAccess();
  const canSubmit = !isMasterLogin || isMasterWithFullAccess;

  const { isMobile } = useScreenView();

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [summary, setSummary] = useState<{
    show: boolean;
    total: number;
    completed: number;
    failed: number;
    status: "SUCCESS" | "FAILED" | "";
    failedDeals: { dealName: string; dealRefId: string; error: string }[];
  }>({
    show: false,
    total: 0,
    completed: 0,
    failed: 0,
    status: "",
    failedDeals: [],
  });

  const [busyLoader, setBusyLoader] = useState({
    show: false,
    message: "",
  });

  const handleBackToUpload = () => {
    callback({ action: "back" });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      appToast.show({ msg: "Master login users cannot submit.", color: "error" });
      return;
    }
    if (validProductCount === 0) {
      appToast.show({
        msg: "No valid deals to submit.",
        color: "error",
      });
      return;
    }
    setShowSubmitDialog(true);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollReport = async () => {
    const resp =
      uploadMode === "barcode"
        ? await BulkUploadService.getPriceBarcodeUploadSyncReport(batchId)
        : await BulkUploadService.getPriceUploadSyncReport(batchId);
    if (resp?.statusCode !== 200) return;

    const data = resp.data?.data;
    const status = data?.overallStatus;
    const total = data?.summary?.total ?? 0;
    const completed = data?.summary?.completed ?? 0;

    setBusyLoader({
      show: true,
      message: `Updating pricing... ${completed}/${total}`,
    });

    if (status === "SUCCESS") {
      stopPolling();
      setBusyLoader({ show: false, message: "" });
      setSummary({
        show: true,
        total,
        completed,
        failed: data?.summary?.failed ?? 0,
        status: "SUCCESS",
        failedDeals: data?.failed || [],
      });
    } else if (status === "FAILED" || status === "ERROR") {
      stopPolling();
      setBusyLoader({ show: false, message: "" });
      setSummary({
        show: true,
        total,
        completed,
        failed: data?.summary?.failed ?? 0,
        status: "FAILED",
        failedDeals: data?.failed || [],
      });
    }
  };

  const doUpload = async () => {
    setShowSubmitDialog(false);

    await new Promise((resolve) => setTimeout(resolve, 300));

    setBusyLoader({ show: true, message: "Updating pricing..." });

    try {
      const resp =
        uploadMode === "barcode"
          ? await BulkUploadService.syncPriceBarcodeUpload(batchId)
          : await BulkUploadService.syncPriceUpload(batchId);

      if (resp?.statusCode === 200) {
        await pollReport();
        pollRef.current = setInterval(pollReport, 5000);
      } else {
        setBusyLoader({ show: false, message: "" });
        appToast.show({
          msg: resp?.data?.message || "Pricing update failed",
          color: "danger",
        });
      }
    } catch (error) {
      setBusyLoader({ show: false, message: "" });
      appToast.show({
        msg: "An error occurred while updating pricing",
        color: "danger",
      });
      console.error("Error updating pricing:", error);
    }
  };

  const handleItemCallback = (a: { action: string; data?: any }) => {
    if (a.action === "remove") {
      callback({ action: "remove", data: { index: a.data.index } });
    }
  };

  return (
    <>
      <InfoBlock size="sm" variant="warning" bordered className="tw:mb-4">
        <div className="tw:font-bold">Please note:</div>
        This discount will be applicable on all available stock with different
        MRP's.
      </InfoBlock>
      <AppCard
        noContentPadding
        title="Preview Overall Uploaded Data"
        icon={<FileText />}
        subtitle="Review the data below before submitting."
      >
        {/* Summary Stats Cards */}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3 tw:mb-4 tw:mx-4">
          <AppStatsCard
            label="Valid Deals"
            icon={<CheckCircle />}
            color="success"
            template={2}
          >
            <div className="tw:text-xl tw:font-bold tw:text-green-600">
              {validProductCount}
            </div>
            <div className="tw:text-xs tw:text-gray-500">Ready to update</div>
          </AppStatsCard>

          <AppStatsCard
            label="Invalid Deals"
            icon={<AlertTriangle />}
            color="danger"
            template={2}
          >
            <div className="tw:text-xl tw:font-bold tw:text-red-600">
              {invalidProductCount}
            </div>
            <div className="tw:text-xs tw:text-gray-500">Need attention</div>
          </AppStatsCard>

          <AppStatsCard
            label="Total Deals"
            icon={<Package />}
            color="info"
            template={2}
          >
            <div className="tw:text-xl tw:font-bold tw:text-blue-600">
              {products.length}
            </div>
            <div className="tw:text-xs tw:text-gray-500">In this batch</div>
          </AppStatsCard>
        </div>

        {isMobile ? (
          <MobileView products={products} callback={handleItemCallback} />
        ) : (
          <DesktopView products={products} callback={handleItemCallback} />
        )}
      </AppCard>
      <div className="tw:sticky tw:bottom-0 tw:bg-white tw:p-4">
        <div className="tw:flex tw:justify-end tw:mt-4 tw:gap-2">
          <AppButton
            color="light"
            size="small"
            fill="outline"
            onClick={handleBackToUpload}
          >
            <ArrowLeft size={16} />
            Back to Upload
          </AppButton>

          <AppButton
            color="success"
            size="small"
            fill="solid"
            onClick={handleSubmit}
          >
            <Check size={16} />
            Submit
          </AppButton>
        </div>
      </div>

      <AppAlertDialog
        show={showSubmitDialog}
        title="Submit Pricing Updates"
        description="Are you sure you want to submit the pricing updates?"
        onConfirm={doUpload}
        onCancel={() => setShowSubmitDialog(false)}
      />

      <BusyLoader show={busyLoader.show} message={busyLoader.message} />

      <SummaryModal
        show={summary.show}
        total={summary.total}
        completed={summary.completed}
        failed={summary.failed}
        status={summary.status}
        failedDeals={summary.failedDeals}
        callback={() => {
          setSummary((s) => ({ ...s, show: false }));
          const type = activeTab === "b2c" ? "customer" : "network";
          appNav.to(`/configs/rsp?type=${type}`);
        }}
      />
    </>
  );
};

export default Preview;
