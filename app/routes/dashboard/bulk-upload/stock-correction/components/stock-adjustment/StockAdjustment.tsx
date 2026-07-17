import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import { API } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import BulkUploadService from "~/services/BulkUploadService";
import Summary from "./Summary";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import AuthService from "~/services/AuthService";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import { ArrowLeft, FileText, Send } from "lucide-react";
import { BulkFileUpload } from "../../../components";

export interface AdjustmentRecord {
  slNo: number;
  snapshotId: string;
  stockMasterId: string;
  dealId: string;
  dealName: string;
  dealRefId: string;
  mrp: number;
  oldQuantity: number;
  quantity: number;
  remarks: string;
  status: string;
  validationMessage: string;
}

export interface AdjustmentFormValues {
  records: AdjustmentRecord[];
}

const StockAdjustment = () => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const { isMobile } = useScreenView();
  const methods = useForm<AdjustmentFormValues>({
    defaultValues: { records: [] },
  });
  const { reset } = methods;

  const watchedRecords = useWatch({ control: methods.control, name: "records" });

  const computedSummary = useMemo(() => {
    const records = watchedRecords || [];
    const total = records.length;
    const valid = records.filter((r) => r.status === "VALID" || r.status === "Success").length;
    const invalid = total - valid;
    return { total, valid, invalid };
  }, [watchedRecords]);

  useEffect(() => {
    if (display === "preview" && watchedRecords?.length === 0) {
      handleBackToUpload();
    }
  }, [watchedRecords?.length]);

  const isMasterLogin = AuthService.isMasterLogin();
  const isMasterWithFullAccess = AuthService.isMasterLoginWithFullAccess();
  const canSubmit = !isMasterLogin || isMasterWithFullAccess;

  const [busyLoader, setBusyLoader] = useState({
    show: false,
    message: "",
  });

  const [display, setDisplay] = useState<"upload" | "preview">("upload");
  const [batchData, setBatchData] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const getUploadUrl = () => {
    return API + "purchase/inventory/excel/stock-adjustment-upload?correctionType=adjustment";
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

    setBusyLoader({ show: true, message: "Processing file..." });

    const response = await BulkUploadService.getBatchStatus(batchId);

    setBusyLoader({ show: false, message: "" });

    if (response.statusCode === 200) {
      const data = response.data?.data;
      setBatchData(data);
      const sorted = [...(data.records || [])].sort((a: any, b: any) => {
        const aValid = a.status === "VALID" ? 0 : 1;
        const bValid = b.status === "VALID" ? 0 : 1;
        return aValid - bValid;
      });
      reset({
        records: sorted.map((rec: any, index: number) => ({
          slNo: index + 1,
          snapshotId: rec.snapshotId || "",
          stockMasterId: rec.stockMasterId || "",
          dealId: rec.dealId || "",
          dealName: rec.dealName || "",
          dealRefId: rec.dealRefId || "",
          mrp: rec.mrp || 0,
          oldQuantity: rec.oldQuantity ?? 0,
          quantity: rec.quantity ?? rec.qty ?? 0,
          remarks: rec.remarks || "",
          status: rec.status || "",
          validationMessage: rec.validationMessage || "",
        })),
      });
      setDisplay("preview");
    } else {
      appToast.show({
        msg: "Failed to process file. Please try again.",
        color: "error",
      });
    }
  };

  const validate = (records: AdjustmentRecord[]): { msg: string } | null => {
    const missing = records.filter(
      (r) => r.quantity === undefined || r.quantity === null || r.quantity === ("" as any),
    );
    if (missing.length > 0) {
      return {
        msg: `Please enter Quantity for all items. ${missing.length} row(s) are missing Quantity.`,
      };
    }
    return null;
  };

  const handleSubmitClick = () => {
    if (!canSubmit) {
      appToast.show({ msg: "Master login users cannot submit.", color: "error" });
      return;
    }
    const records = methods.getValues("records");
    const validRecords = records.filter((r) => r.status === "VALID" || r.status === "Success");
    if (validRecords.length === 0) {
      appToast.show({ msg: "No valid records found. Please check your data and try again.", color: "error" });
      return;
    }
    const error = validate(validRecords);
    if (error) {
      appToast.show({ msg: error.msg, color: "error" });
      return;
    }
    setShowConfirm(true);
  };

  const doSubmit = async () => {
    setShowConfirm(false);
    const records = methods.getValues("records");
    const validRecords = records.filter((r) => r.status === "VALID" || r.status === "Success");

    if (validRecords.length === 0) {
      appToast.show({ msg: "No valid records found. Please check your data and try again.", color: "error" });
      return;
    }

    setBusyLoader({ show: true, message: "Submitting records..." });

    const franchiseId = AuthService.getLoggedInUserId();
    const payload = validRecords.map((r) => ({
      stockMasterId: r.stockMasterId,
      qty: r.quantity,
      dealId: r.dealId,
      reason: r.remarks,
    }));
    const response = await BulkUploadService.submitStockAdjustmentBulk(
      franchiseId,
      payload,
    );

    setBusyLoader({ show: false, message: "" });

    if (response.statusCode === 200) {
      const successList = response.data?.data?.success || [];
      const errorsList = response.data?.data?.errors || [];

      if (errorsList.length > 0 && successList.length > 0) {
        appToast.show({
          msg: `${successList.length} record(s) submitted successfully. ${errorsList.length} record(s) failed.`,
          color: "warning",
        });
      } else if (errorsList.length > 0) {
        appToast.show({
          msg: `${errorsList.length} record(s) failed to submit.`,
          color: "error",
        });
      } else {
        appToast.show({
          msg: "All records submitted successfully.",
          color: "success",
        });
      }

      if (errorsList.length === 0) {
        handleBackToUpload();
      } else {
        const currentRecords = methods.getValues("records");
        const errorSnapshotIds = new Set(
          errorsList.map((e: any) => e.snapshotId),
        );
        const updatedRecords = currentRecords.map((rec) => {
          if (errorSnapshotIds.has(rec.snapshotId)) {
            const errorItem = errorsList.find(
              (e: any) => e.snapshotId === rec.snapshotId,
            );
            return {
              ...rec,
              status: "Error",
              validationMessage: errorItem?.message || "Submission failed",
            };
          }
          return { ...rec, status: "Success", validationMessage: "" };
        });
        reset({ records: updatedRecords });
      }
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to submit. Please try again.",
        color: "error",
      });
    }
  };

  const handleBackToUpload = () => {
    setDisplay("upload");
    setBatchData(null);
    reset({ records: [] });
  };

  if (display === "preview" && batchData) {
    return (
      <FormProvider {...methods}>
        <Summary valid={computedSummary.valid} invalid={computedSummary.invalid} total={computedSummary.total} />

        <AppCard
          noContentPadding
          title="Preview Uploaded Data"
          icon={<FileText />}
          subtitle="Review the records below."
        >
          {isMobile ? <MobileView /> : <DesktopView />}
        </AppCard>

        <div className="tw:sticky tw:bottom-0 tw:bg-white tw:py-4">
          <div className="tw:flex tw:justify-between tw:mt-4">
            <AppButton
              color="light"
              size="small"
              fill="outline"
              onClick={handleBackToUpload}
            >
              <ArrowLeft size={16} />
              Back to Upload
            </AppButton>
            <AppButton color="primary" size="small" onClick={handleSubmitClick}>
              <Send size={16} />
              Submit
            </AppButton>
          </div>
        </div>

        <BusyLoader show={busyLoader.show} message={busyLoader.message} />

        <AppAlertDialog
          show={showConfirm}
          title="Confirm Submission"
          description={`Are you sure you want to submit the stock adjustments? Only valid records (${computedSummary.valid} of ${computedSummary.total}) will be considered for submission.`}
          onConfirm={doSubmit}
          onCancel={() => setShowConfirm(false)}
          okText="Yes, Submit"
          cancelText="Cancel"
          type="confirm"
        />
      </FormProvider>
    );
  }

  return (
    <>
      <div className="tw:space-y-6">
        <BulkFileUpload
          title="Upload Excel File"
          description="Select your Excel file containing the stock adjustment data to upload."
          onUpload={handleFileUpload}
          acceptedFormats={[".xlsx", ".xls"]}
          maxSizeMB={10}
          uploadUrl={getUploadUrl()}
        />
      </div>

      <BusyLoader show={busyLoader.show} message={busyLoader.message} />
    </>
  );
};

export default StockAdjustment;
