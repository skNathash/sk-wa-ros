import { format } from "date-fns";
import { orderBy } from "lodash";
import {
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  Clock,
  FileText,
  Hash,
  History,
  Pencil,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import { AppDateInput, AppInput } from "~/components/core/form";
import KeyValue from "~/components/core/key-value/KeyValue";
import useAppToast from "~/hooks/useAppToast";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import FranchiseService from "~/services/FranchiseService";
import FssaiHistoryModal from "./modals/FssaiHistoryModal";

type FssaiLicenseProps = {
  profileRequestLogs?: any[];
  callback?: () => void;
};

type FormValues = {
  licenseNo: string;
};

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const MAX_VALIDITY = new Date();
MAX_VALIDITY.setFullYear(MAX_VALIDITY.getFullYear() + 5);

const dateConfig = {
  mode: "single" as const,
  disabled: { before: TODAY, after: MAX_VALIDITY },
  startMonth: TODAY,
  endMonth: MAX_VALIDITY,
};

const FssaiLicense: React.FC<FssaiLicenseProps> = ({
  profileRequestLogs,
  callback,
}) => {
  const toast = useAppToast();

  const fssaiLogs = useMemo(() => {
    const all = Array.isArray(profileRequestLogs) ? profileRequestLogs : [];
    return orderBy(
      all.filter((l) => l?.type === "FSSAI_UPDATE"),
      "createdAt",
      "desc",
    );
  }, [profileRequestLogs]);

  const pendingRequest = fssaiLogs.find(
    (l) => String(l.status).toLowerCase() === "pending",
  );
  const lastApproved = fssaiLogs.find(
    (l) => String(l.status).toLowerCase() === "approved",
  );
  const lastRejected = fssaiLogs.find(
    (l) => String(l.status).toLowerCase() === "rejected",
  );

  const hasApproved = !!lastApproved;

  const [editing, setEditing] = useState(false);
  const [pendingExpanded, setPendingExpanded] = useState(false);
  const [validity, setValidity] = useState<Date | undefined>(undefined);
  const [docFile, setDocFile] = useState<any>(null);
  const [confirmShow, setConfirmShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [historyShow, setHistoryShow] = useState(false);
  const [imgPreview, setImgPreview] = useState<{
    show: boolean;
    images: { id: string }[];
    initialImageId: string;
  }>({ show: false, images: [], initialImageId: "" });

  const [fssaiCheckStatus, setFssaiCheckStatus] = useState<
    "idle" | "checking" | "available" | "duplicate" | "error"
  >("idle");
  const checkFssaiDuplicate = useDebouncedCallback(
    async (licenseNo: string) => {
      if (!/^\d{14}$/.test(licenseNo)) return;
      setFssaiCheckStatus("checking");
      try {
        const resp = await FranchiseService.checkFssaiDuplicate(licenseNo);
        const isDuplicate = resp?.data?.exists === true;
        if (isDuplicate) {
          setFssaiCheckStatus("duplicate");
          const msg =
            (resp as any)?.data?.message ||
            "This FSSAI license is already registered";
          toast.show({ msg, color: "danger" });
        } else if ((resp as any)?.statusCode === 200) {
          setFssaiCheckStatus("available");
        } else {
          setFssaiCheckStatus("error");
          toast.show({
            msg:
              (resp as any)?.data?.message || "Unable to verify FSSAI license",
            color: "danger",
          });
        }
      } catch (e: any) {
        setFssaiCheckStatus("error");
        toast.show({
          msg: e?.message || "Unable to verify FSSAI license",
          color: "danger",
        });
      }
    },
    500,
  );

  const openImagePreview = (imageId: string) => {
    if (!imageId) return;
    setImgPreview({
      show: true,
      images: [{ id: imageId }],
      initialImageId: imageId,
    });
  };

  const closeImagePreview = () => {
    setImgPreview({ show: false, images: [], initialImageId: "" });
  };

  const {
    register,
    formState: { errors },
    getValues,
    reset,
    setValue,
  } = useForm<FormValues>({ defaultValues: { licenseNo: "" } });

  const handleLicenseNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 14);
    setValue("licenseNo", digitsOnly, { shouldValidate: false });
    if (digitsOnly.length === 14) {
      setFssaiCheckStatus("checking");
      checkFssaiDuplicate(digitsOnly);
    } else {
      checkFssaiDuplicate.cancel();
      setFssaiCheckStatus("idle");
    }
  };

  const openForm = () => {
    reset({ licenseNo: "" });
    setValidity(undefined);
    setDocFile(null);
    setFssaiCheckStatus("idle");
    setEditing(true);
  };

  const closeForm = () => {
    setEditing(false);
    reset({ licenseNo: "" });
    setValidity(undefined);
    setDocFile(null);
    checkFssaiDuplicate.cancel();
    setFssaiCheckStatus("idle");
  };

  const validate = (): string => {
    const { licenseNo } = getValues();
    if (!licenseNo || !/^\d{14}$/.test(licenseNo.trim())) {
      return "Please enter a valid 14-digit FSSAI license number";
    }
    if (fssaiCheckStatus === "checking") {
      return "Please wait while we verify the FSSAI license number";
    }
    if (fssaiCheckStatus === "duplicate") {
      return "This FSSAI license is already registered";
    }
    if (!validity) return "Please select the validity date";
    if (!docFile?._id && !docFile?.id) {
      return "Please upload the FSSAI license document";
    }
    return "";
  };

  const handleSubmitClick = () => {
    const msg = validate();
    if (msg) {
      toast.show({ msg, color: "danger" });
      return;
    }
    setConfirmShow(true);
  };

  const handleConfirm = async () => {
    setConfirmShow(false);
    setSubmitting(true);
    try {
      const { licenseNo } = getValues();
      const assetId = docFile?._id || docFile?.id;
      const payload = {
        profileRequest: {
          type: "FSSAI_UPDATE",
          value: {
            licenseNo: licenseNo.trim(),
            docs: [assetId],
            validity: validity ? format(validity, "yyyy-MM-dd") : "",
          },
        },
      };
      const resp = await FranchiseService.updateFranchise(payload);
      if (resp && (resp as any).statusCode === 200) {
        toast.show({
          msg: "FSSAI update submitted for approval",
          color: "success",
        });
        closeForm();
        callback?.();
      } else {
        toast.show({
          msg: (resp as any)?.data?.message || "Failed to submit request",
          color: "danger",
        });
      }
    } catch (e: any) {
      toast.show({
        msg: e?.message || "Failed to submit request",
        color: "danger",
      });
    }
    setSubmitting(false);
  };

  const renderApprovedBlock = () => {
    if (!lastApproved) return null;
    const v = lastApproved.value || {};
    const docId = Array.isArray(v.docs) && v.docs.length > 0 ? v.docs[0] : null;
    return (
      <div className="tw:rounded-lg tw:border tw:border-emerald-200 tw:bg-linear-to-br tw:from-emerald-50 tw:to-white tw:p-4">
        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
          <div className="tw:w-8 tw:h-8 tw:rounded-full tw:bg-emerald-500 tw:text-white tw:flex tw:items-center tw:justify-center">
            <BadgeCheck className="tw:w-4 tw:h-4" />
          </div>
          <div className="tw:flex-1">
            <div className="tw:text-sm tw:font-semibold tw:text-emerald-900">
              FSSAI License Approved
            </div>
            <div className="tw:text-xs tw:text-emerald-700">
              Approved on{" "}
              {lastApproved.approvedAt ? (
                <DateFormat value={lastApproved.approvedAt} />
              ) : (
                "--"
              )}
            </div>
          </div>
          <AppBadge variant="success">Active</AppBadge>
        </div>
        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-3">
          <KeyValue label="License Number" size="sm">
            <div className="tw:flex tw:items-center tw:gap-1 tw:font-mono tw:text-sm">
              <Hash className="tw:w-3 tw:h-3 tw:text-emerald-700" />
              {v.licenseNo || "--"}
            </div>
          </KeyValue>
          <KeyValue label="Valid Until" size="sm">
            <div className="tw:flex tw:items-center tw:gap-1 tw:text-sm">
              <CalendarClock className="tw:w-3 tw:h-3 tw:text-emerald-700" />
              {v.validity ? (
                <DateFormat value={v.validity} formatStr="dd MMM yyyy" />
              ) : (
                "--"
              )}
            </div>
          </KeyValue>
        </div>
        {docId ? (
          <div className="tw:mt-3">
            <div className="tw:text-xs tw:font-medium tw:text-gray-700 tw:mb-2">
              Uploaded Document
            </div>
            <FileUploadPreview
              image={docId}
              hideRemove
              onImageClick={openImagePreview}
            />
          </div>
        ) : null}
      </div>
    );
  };

  const renderPendingBlock = () => {
    if (!pendingRequest) return null;
    const v = pendingRequest.value || {};
    const docId = Array.isArray(v.docs) && v.docs.length > 0 ? v.docs[0] : null;
    const collapsible = hasApproved;
    const expanded = collapsible ? pendingExpanded : true;

    const details = (
      <>
        <div className="tw:text-xs tw:text-amber-800 tw:mb-3">
          Your update will reflect in the profile once approved.
        </div>
        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-3">
          <KeyValue label="Submitted License No" size="sm">
            <span className="tw:font-mono tw:text-sm">
              {v.licenseNo || "--"}
            </span>
          </KeyValue>
          <KeyValue label="Submitted Validity" size="sm">
            <span className="tw:text-sm">
              {v.validity ? (
                <DateFormat value={v.validity} formatStr="dd MMM yyyy" />
              ) : (
                "--"
              )}
            </span>
          </KeyValue>
        </div>
        {docId ? (
          <div className="tw:mt-3">
            <div className="tw:text-xs tw:font-medium tw:text-amber-900 tw:mb-2">
              Submitted Document
            </div>
            <FileUploadPreview
              image={docId}
              hideRemove
              onImageClick={openImagePreview}
            />
          </div>
        ) : null}
        <div className="tw:text-[11px] tw:text-amber-700 tw:mt-2">
          Submitted on{" "}
          {pendingRequest.createdAt ? (
            <DateFormat value={pendingRequest.createdAt} />
          ) : (
            "--"
          )}
        </div>
      </>
    );

    return (
      <div className="tw:rounded-lg tw:border tw:border-amber-300 tw:bg-amber-50 tw:p-4 tw:mt-3">
        <button
          type="button"
          onClick={
            collapsible ? () => setPendingExpanded((p) => !p) : undefined
          }
          className={`tw:flex tw:items-center tw:gap-2 tw:w-full tw:text-left ${
            expanded ? "tw:mb-2" : ""
          } ${collapsible ? "tw:cursor-pointer" : "tw:cursor-default"}`}
          aria-expanded={expanded}
        >
          <Clock className="tw:w-4 tw:h-4 tw:text-amber-700" />
          <div className="tw:flex-1">
            <div className="tw:text-sm tw:font-semibold tw:text-amber-900">
              Awaiting StoreKing Approval
            </div>
            {collapsible && !expanded ? (
              <div className="tw:text-[11px] tw:text-amber-700 tw:mt-0.5">
                Submitted{" "}
                {pendingRequest.createdAt ? (
                  <DateFormat value={pendingRequest.createdAt} />
                ) : (
                  "--"
                )}
                {v.licenseNo ? ` · ${v.licenseNo}` : ""}
              </div>
            ) : null}
          </div>
          <AppBadge variant="warning">Pending</AppBadge>
          {collapsible ? (
            <ChevronDown
              className={`tw:w-4 tw:h-4 tw:text-amber-700 tw:transition-transform ${
                expanded ? "tw:rotate-180" : ""
              }`}
            />
          ) : null}
        </button>
        {expanded ? details : null}
      </div>
    );
  };

  const renderRejectedBlock = () => {
    if (!lastRejected || pendingRequest) return null;
    if (
      lastApproved &&
      new Date(lastApproved.createdAt || 0) >
        new Date(lastRejected.createdAt || 0)
    ) {
      return null;
    }
    return (
      <div className="tw:rounded-lg tw:border tw:border-red-200 tw:bg-red-50 tw:p-3 tw:mt-3">
        <div className="tw:flex tw:items-center tw:gap-2">
          <X className="tw:w-4 tw:h-4 tw:text-red-700" />
          <div className="tw:text-xs tw:font-semibold tw:text-red-900 tw:flex-1">
            Last request was rejected
          </div>
          <AppBadge variant="danger">Rejected</AppBadge>
        </div>
        {lastRejected.comment ? (
          <div className="tw:text-xs tw:text-red-800 tw:mt-2">
            Reason: {lastRejected.comment}
          </div>
        ) : null}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="tw:rounded-lg tw:border tw:border-dashed tw:border-gray-300 tw:bg-gray-50 tw:p-6 tw:text-center">
      <div className="tw:mx-auto tw:w-10 tw:h-10 tw:rounded-full tw:bg-blue-100 tw:flex tw:items-center tw:justify-center tw:mb-2">
        <ShieldCheck className="tw:w-5 tw:h-5 tw:text-blue-600" />
      </div>
      <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
        No FSSAI license added yet
      </div>
      <div className="tw:text-xs tw:text-gray-600 tw:mt-1">
        Add your FSSAI license number, validity and document. The update will go
        through StoreKing approval.
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="tw:mt-3 tw:rounded-lg tw:border tw:border-blue-200 tw:bg-blue-50/40 tw:p-4">
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
        <ClipboardList className="tw:w-4 tw:h-4 tw:text-blue-700" />
        <div className="tw:text-sm tw:font-semibold tw:text-blue-900">
          {hasApproved ? "Request FSSAI Update" : "Submit FSSAI License"}
        </div>
      </div>

      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-3">
        <AppInput
          name="licenseNo"
          label="FSSAI License Number"
          placeholder="Enter 14-digit license number"
          register={register}
          isRequired
          maxLength={14}
          onChange={handleLicenseNoChange}
          error={errors.licenseNo?.message as any}
          className="tw:w-full"
        />
        <AppDateInput
          label="Validity"
          isRequired
          value={validity}
          dateConfig={dateConfig}
          callback={(d) => setValidity(Array.isArray(d) ? d[0] : d)}
          placeholder="Select validity date"
        />
      </div>

      <div className="tw:mt-3">
        <label className="tw:text-xs tw:font-medium tw:text-gray-700 tw:mb-2 tw:block">
          Upload License Document <span className="tw:text-red-500">*</span>
        </label>
        {!docFile?._id && !docFile?.id ? (
          <FileUpload
            onFileUpload={(r: any) => setDocFile(r)}
            allowedExtensions={["jpg", "jpeg", "png", "webp"]}
            accept="image/*"
            maxSizeMB={10}
            label="Upload Document"
          >
            <div className="tw:border-2 tw:border-dashed tw:border-blue-300 tw:bg-white tw:rounded-lg tw:p-4 tw:text-center tw:hover:border-blue-500 tw:transition-colors tw:cursor-pointer">
              <Upload className="tw:mx-auto tw:h-8 tw:w-8 tw:text-blue-500 tw:mb-2" />
              <p className="tw:text-sm tw:text-gray-700">
                Click to upload FSSAI license
              </p>
              <p className="tw:text-xs tw:text-gray-500 tw:mt-1">
                JPG, PNG or WEBP (Max 10MB)
              </p>
            </div>
          </FileUpload>
        ) : (
          <FileUploadPreview
            image={docFile?._id || docFile?.id}
            onRemove={() => setDocFile(null)}
          />
        )}
      </div>

      <div className="tw:flex tw:justify-end tw:gap-2 tw:mt-4">
        <AppButton
          type="button"
          color="medium"
          fill="outline"
          onClick={closeForm}
          disabled={submitting}
        >
          Cancel
        </AppButton>
        <AppButton
          type="button"
          color="primary"
          onClick={handleSubmitClick}
          isLoading={submitting}
          disabled={
            submitting ||
            fssaiCheckStatus === "checking" ||
            fssaiCheckStatus === "duplicate"
          }
        >
          Submit for Approval
        </AppButton>
      </div>
    </div>
  );

  const showHeaderAction = !editing && !pendingRequest;
  const hasHistory = fssaiLogs.length > 0;

  return (
    <>
      <AppCard
        title={
          <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
            <span className="tw:flex tw:items-center tw:gap-2">
              <FileText className="tw:w-4 tw:h-4 tw:text-blue-600" />
              FSSAI License
            </span>
            <span className="tw:flex tw:items-center tw:gap-2">
              {hasHistory && !editing ? (
                <AppButton
                  type="button"
                  color="light"
                  fill="outline"
                  size="small"
                  onClick={() => setHistoryShow(true)}
                  className="tw:flex tw:items-center tw:gap-1"
                >
                  <History className="tw:w-4 tw:h-4" />
                  History
                </AppButton>
              ) : null}
              {showHeaderAction ? (
                <AppButton
                  type="button"
                  color="light"
                  fill="outline"
                  size="small"
                  onClick={openForm}
                  className="tw:flex tw:items-center tw:gap-1"
                >
                  <Pencil className="tw:w-4 tw:h-4" />
                  {hasApproved ? "Request Update" : "Add License"}
                </AppButton>
              ) : null}
            </span>
          </div>
        }
      >
        {!hasApproved && !pendingRequest && !editing
          ? renderEmptyState()
          : null}
        {hasApproved && !editing ? renderApprovedBlock() : null}
        {renderPendingBlock()}
        {renderRejectedBlock()}
        {editing ? renderForm() : null}
      </AppCard>

      <AppAlertDialog
        show={confirmShow}
        title="Submit FSSAI Update?"
        description="Your FSSAI license details will be sent to StoreKing for approval. Once approved, they will be reflected on your profile."
        okText="Yes, Submit"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmShow(false)}
      />

      <FssaiHistoryModal
        show={historyShow}
        logs={fssaiLogs}
        onClose={() => setHistoryShow(false)}
        onImageClick={openImagePreview}
      />

      <ImgPreviewModal
        show={imgPreview.show}
        callback={closeImagePreview}
        images={imgPreview.images}
        initialImageId={imgPreview.initialImageId}
      />
    </>
  );
};

export default FssaiLicense;
