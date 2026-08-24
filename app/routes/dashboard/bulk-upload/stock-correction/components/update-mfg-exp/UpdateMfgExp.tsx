import type { ReactNode } from "react";
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

export interface MfgExpRecord {
  slNo: number;
  snapshotId: string;
  stockMasterId: string;
  dealName: string;
  dealRefId: string;
  mrp: number;
  quantity: number;
  manufactureDate: string;
  expiry: string;
  remarks: string;
  status: string;
  validationMessage: string;
}

export interface MfgExpFormValues {
  records: MfgExpRecord[];
}

interface UpdateMfgExpProps {
  /** Info card rendered above the upload box (owned by the page, so it hides
      with the upload view once records are in preview). */
  info?: ReactNode;
}

const UpdateMfgExp = ({ info }: UpdateMfgExpProps) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();
  const { isMobile } = useScreenView();
  const methods = useForm<MfgExpFormValues>({
    defaultValues: { records: [] },
  });
  const { reset } = methods;

  const watchedRecords = useWatch({
    control: methods.control,
    name: "records",
  });

  const computedSummary = useMemo(() => {
    const records = watchedRecords || [];
    const total = records.length;
    const valid = records.filter(
      (r) => r.status === "VALID" || r.status === "Success",
    ).length;
    const invalid = total - valid;
    return { total, valid, invalid };
  }, [watchedRecords]);

  useEffect(() => {
    if (display === "preview" && watchedRecords?.length === 0) {
      handleBackToUpload();
    }
  }, [watchedRecords?.length]);

  const [busyLoader, setBusyLoader] = useState({
    show: false,
    message: "",
  });

  const isMasterLogin = AuthService.isMasterLogin();
  const isMasterWithFullAccess = AuthService.isMasterLoginWithFullAccess();
  const canSubmit = !isMasterLogin || isMasterWithFullAccess;

  const [display, setDisplay] = useState<"upload" | "preview">("upload");
  const [batchData, setBatchData] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const getUploadUrl = () => {
    return (
      API +
      "purchase/inventory/excel/stockmaster-correction-upload?correctionType=no-shelf-life"
    );
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
          dealName: rec.dealName || "",
          dealRefId: rec.dealRefId || "",
          mrp: rec.mrp || 0,
          manufactureDate: rec.manufactureDate || "",
          expiry: rec.expiry || "",
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

  const validate = (records: MfgExpRecord[]): { msg: string } | null => {
    for (const r of records) {
      if (!r.manufactureDate) {
        return {
          msg: `Please enter MFG Date for "${r.dealName}".`,
        };
      }
      if (!r.expiry) {
        return {
          msg: `Please enter Expiry Date for "${r.dealName}".`,
        };
      }
      if (new Date(r.expiry) <= new Date(r.manufactureDate)) {
        return {
          msg: `Expiry Date should be after MFG Date for "${r.dealName}".`,
        };
      }
    }
    return null;
  };

  const handleSubmitClick = () => {
    if (!canSubmit) {
      appToast.show({ msg: "Master login users cannot submit.", color: "error" });
      return;
    }
    const records = methods.getValues("records");
    const validRecords = records.filter(
      (r) => r.status === "VALID" || r.status === "Success",
    );
    if (validRecords.length === 0) {
      appToast.show({
        msg: "No valid records found. Please check your data and try again.",
        color: "error",
      });
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
    const validRecords = records.filter(
      (r) => r.status === "VALID" || r.status === "Success",
    );

    if (validRecords.length === 0) {
      appToast.show({
        msg: "No valid records found. Please check your data and try again.",
        color: "error",
      });
      return;
    }

    setBusyLoader({ show: true, message: "Submitting records..." });

    const franchiseId = AuthService.getLoggedInUserId();
    const payload = validRecords.map((r) => ({
      snapshotId: r.snapshotId,
      manufactureDate: r.manufactureDate,
      expiry: r.expiry,
      remarks: r.remarks,
    }));
    const response = await BulkUploadService.submitStockmasterCorrectionBulk(
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
        <Summary
          valid={computedSummary.valid}
          invalid={computedSummary.invalid}
          total={computedSummary.total}
        />

        <AppCard
          noContentPadding
          className="app-flat-sheet"
          title="Preview Uploaded Data"
          icon={<FileText />}
          subtitle="Review the records below."
        >
          {isMobile ? <MobileView /> : <DesktopView />}
        </AppCard>

        {/* Action bar: full-width thumb targets on mobile, right-aligned pair
            on desktop. */}
        <div className="app-bleed-x app-action-bar tw:sticky tw:bottom-0 tw:z-10 tw:border-t tw:border-gray-200 tw:bg-white tw:p-3 tw:sm:border-0 tw:sm:p-4">
          <div className="tw:flex tw:gap-2 tw:sm:justify-end">
            <AppButton
              color="light"
              size="small"
              fill="outline"
              onClick={handleBackToUpload}
              className="tw:flex-1 tw:justify-center tw:sm:flex-none"
            >
              <ArrowLeft size={16} />
              Back to Upload
            </AppButton>
            <AppButton
              color="primary"
              size="small"
              onClick={handleSubmitClick}
              className="tw:flex-1 tw:justify-center tw:sm:flex-none"
            >
              <Send size={16} />
              Submit
            </AppButton>
          </div>
        </div>
        {/* Height for the pinned bar on mobile; collapses on desktop. */}
        <div className="app-action-bar-spacer" aria-hidden="true" />

        <BusyLoader show={busyLoader.show} message={busyLoader.message} />

        <AppAlertDialog
          show={showConfirm}
          title="Confirm Submission"
          description={`Are you sure you want to submit the MFG & Expiry date corrections? Only valid records (${computedSummary.valid} of ${computedSummary.total}) will be considered for submission.`}
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
        {info}
        <BulkFileUpload
          title="Upload Excel File"
          description="Select your Excel file containing the MFG & Expiry date data to upload."
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

export default UpdateMfgExp;
