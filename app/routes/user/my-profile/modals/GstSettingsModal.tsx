import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileCheck2,
  History,
  Info,
  Pencil,
  Plus,
  ReceiptText,
  Save,
  ShieldCheck,
} from "lucide-react";
import { orderBy } from "lodash";
import React, { useEffect, useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import ConfigLogModal from "~/routes/configs/settings/others/modals/logs/ConfigLogModal";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import ProfileRequestLogModal from "./ProfileRequestLogModal";

const CONFIG_TYPE = "ORDER_INVOICE_CONFIG";
type GstType = "regular" | "composite";

type Props = {
  show: boolean;
  gstNumber?: string;
  profileRequestLogs?: any[];
  callback: (a: { action: string; data?: any }) => void;
};

/**
 * Modern GST & Tax Invoicing Settings Modal.
 * Allows viewing/updating GSTIN with validation & approval logs,
 * and configuring invoice tax breakdown scheme (Regular vs Composite).
 */
const GstSettingsModal: React.FC<Props> = ({
  show,
  gstNumber,
  profileRequestLogs,
  callback,
}) => {
  const toast = useAppToast();

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingType, setSavingType] = useState(false);
  const [submittingGst, setSubmittingGst] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Scheme types
  const [savedType, setSavedType] = useState<GstType>("regular");
  const [selectedType, setSelectedType] = useState<GstType>("regular");

  // Inline GST edit state
  const [isEditingGst, setIsEditingGst] = useState(false);
  const [gstInput, setGstInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Logs sub-modals
  const [showNumberLogs, setShowNumberLogs] = useState(false);
  const [showTypeLogs, setShowTypeLogs] = useState(false);

  // Derive GST logs and pending request
  const gstLogs = Array.isArray(profileRequestLogs)
    ? FranchiseService.formatProfileUpdateRequestLog(
        profileRequestLogs.filter((l: any) => l && l.type === "GST_UPDATE"),
      )
    : [];

  const pendingGstRequest = orderBy(gstLogs, "createdAt", "desc").find(
    (l: any) => String(l.status).toLowerCase() === "pending",
  );

  const pendingGstCount = gstLogs.filter(
    (l: any) => String(l.status).toLowerCase() === "pending",
  ).length;

  useEffect(() => {
    if (!show) return;

    setIsEditingGst(false);
    setGstInput(gstNumber || "");
    setLoadingConfig(true);

    const loadSettings = async () => {
      try {
        const res = await FranchiseService.getFranchiseSettings({
          configType: CONFIG_TYPE,
        });
        const configValue = res?.data?.data?.configValue;
        const type: GstType =
          configValue?.compositionGST === true ? "composite" : "regular";
        setSavedType(type);
        setSelectedType(type);
      } catch (e: any) {
        toast.show({
          msg: e?.message || "Failed to load GST scheme settings",
          color: "danger",
        });
      } finally {
        setLoadingConfig(false);
      }
    };

    loadSettings();
  }, [show, gstNumber]);

  const handleCopyGst = () => {
    if (!gstNumber) return;
    navigator.clipboard.writeText(gstNumber);
    setCopied(true);
    toast.show({ msg: "GSTIN copied to clipboard", color: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveGstNumber = async () => {
    const trimmed = (gstInput || "").trim().toUpperCase();

    if (!trimmed) {
      toast.show({ msg: "Please enter a GST number", color: "danger" });
      return;
    }

    if (!CommonService.isValidGst(trimmed)) {
      toast.show({
        msg: "Invalid GST number format. Must be a 15-character alphanumeric GSTIN.",
        color: "danger",
      });
      return;
    }

    if (trimmed === (gstNumber || "").trim().toUpperCase()) {
      toast.show({
        msg: "New GST number must be different from current GST number.",
        color: "warning",
      });
      return;
    }

    if (AuthService.isMasterLogin()) {
      toast.show({
        msg: "You are not authorized to do this action.",
        color: "danger",
      });
      return;
    }

    setSubmittingGst(true);
    try {
      const resp = await FranchiseService.updateFranchise({
        profileRequest: {
          type: "GST_UPDATE",
          value: trimmed,
        },
      });

      if (resp && (resp.statusCode === 200 || resp.statusCode === 201)) {
        toast.show({
          msg: "GST update request submitted successfully for approval!",
          color: "success",
        });
        setIsEditingGst(false);
        callback({ action: "submit" });
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to submit GST update request.",
          color: "danger",
        });
      }
    } catch (e: any) {
      toast.show({
        msg: e?.message || "Error submitting GST update request.",
        color: "danger",
      });
    } finally {
      setSubmittingGst(false);
    }
  };

  const handleSaveScheme = async () => {
    try {
      setSavingType(true);

      const res = await FranchiseService.getFranchiseSettings({
        configType: CONFIG_TYPE,
      });
      const existing = res?.data?.data;

      const payload = {
        franchiseId: AuthService.getLoggedInUserId(),
        configType: CONFIG_TYPE,
        configValue: {
          ...(existing?.configValue || {}),
          compositionGST: selectedType === "composite",
        },
      };

      const upd = await FranchiseService.updateFranchiseSettings(payload);
      if (upd.statusCode === 200 || upd.statusCode === 201) {
        setSavedType(selectedType);
        toast.show({
          msg: "GST invoice scheme updated successfully!",
          color: "success",
        });
        callback({ action: "submit" });
      } else {
        toast.show({
          msg: upd?.data?.message || "Failed to update GST scheme.",
          color: "danger",
        });
      }
    } catch (e: any) {
      toast.show({
        msg: e?.message || "Error updating GST scheme.",
        color: "danger",
      });
    } finally {
      setSavingType(false);
    }
  };

  const hasSchemeChanges = selectedType !== savedType;
  const isGstInputValid =
    gstInput.length === 15 && CommonService.isValidGst(gstInput);

  return (
    <>
      <AppModal
        show={show}
        callback={callback}
        className="tw:max-w-2xl tw:w-full"
      >
        <AppModal.Title onClose={() => callback({ action: "close" })}>
          <div className="tw:flex tw:items-center tw:gap-2.5">
            <div className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-blue-50 tw:text-blue-600">
              <ReceiptText className="tw:h-5 tw:w-5" />
            </div>
            <div>
              <h3 className="tw:text-base tw:font-bold tw:text-gray-900">
                GST & Tax Settings
              </h3>
              <p className="tw:text-xs tw:text-gray-500">
                Manage your GSTIN registration and invoice tax scheme
              </p>
            </div>
          </div>
        </AppModal.Title>

        <AppModal.Content className="tw:max-h-[75vh] tw:overflow-y-auto">
          {/* AppModal.Content wraps children in its own padding div, so the
              section spacing has to live on this inner wrapper. */}
          <div className="tw:flex tw:flex-col tw:gap-4 tw:pt-1">
            {/* SECTION 1: GST Registration Number */}
            <div className="tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-4 tw:sm:p-5 tw:shadow-xs">
              <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2 tw:mb-3">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <span className="tw:text-xs tw:font-bold tw:uppercase tw:tracking-wider tw:text-gray-500">
                    GST Registration (GSTIN)
                  </span>
                  {pendingGstRequest ? (
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-amber-50 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold tw:text-amber-700 tw:border tw:border-amber-200">
                      <Clock className="tw:h-3 tw:w-3" />
                      Update In Review
                    </span>
                  ) : gstNumber ? (
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-emerald-50 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold tw:text-emerald-700 tw:border tw:border-emerald-200">
                      <ShieldCheck className="tw:h-3 tw:w-3" />
                      Registered
                    </span>
                  ) : (
                    <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-gray-100 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-medium tw:text-gray-600">
                      Not Registered
                    </span>
                  )}
                </div>

                <div className="tw:flex tw:items-center tw:gap-1.5">
                  {gstLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNumberLogs(true)}
                      className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:px-2.5 tw:py-1 tw:text-xs tw:font-medium tw:text-gray-600 tw:hover:bg-gray-50 tw:transition-colors"
                    >
                      <History className="tw:h-3.5 tw:w-3.5 tw:text-gray-500" />
                      <span>Logs</span>
                      {pendingGstCount > 0 && (
                        <span className="tw:flex tw:size-4 tw:items-center tw:justify-center tw:rounded-full tw:bg-amber-400 tw:text-[10px] tw:font-bold tw:text-amber-950">
                          {pendingGstCount}
                        </span>
                      )}
                    </button>
                  )}

                  {!isEditingGst && (
                    <button
                      type="button"
                      onClick={() => {
                        setGstInput(gstNumber || "");
                        setIsEditingGst(true);
                      }}
                      className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-lg tw:bg-blue-50 tw:px-2.5 tw:py-1 tw:text-xs tw:font-semibold tw:text-blue-700 tw:hover:bg-blue-100 tw:transition-colors"
                    >
                      {gstNumber ? (
                        <>
                          <Pencil className="tw:h-3.5 tw:w-3.5" />
                          <span>Update</span>
                        </>
                      ) : (
                        <>
                          <Plus className="tw:h-3.5 tw:w-3.5" />
                          <span>Add GSTIN</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Current GSTIN display or Active View */}
              {!isEditingGst && (
                <div className="tw:rounded-xl tw:border tw:border-gray-100 tw:bg-gray-50/80 tw:p-3.5">
                  {gstNumber ? (
                    <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
                      <div>
                        <div className="tw:text-[11px] tw:font-medium tw:text-gray-500 tw:mb-0.5">
                          Current GST Number
                        </div>
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <span className="tw:font-mono tw:text-base tw:font-bold tw:tracking-wider tw:text-gray-900">
                            {gstNumber}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyGst}
                            title="Copy GSTIN"
                            className="tw:flex tw:size-7 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-md tw:border tw:border-gray-200 tw:bg-white tw:text-gray-600 tw:hover:bg-gray-50 tw:hover:text-gray-900 tw:transition-colors"
                          >
                            {copied ? (
                              <Check className="tw:h-3.5 tw:w-3.5 tw:text-emerald-600" />
                            ) : (
                              <Copy className="tw:h-3.5 tw:w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="tw:text-xs tw:text-gray-500 tw:max-w-xs">
                        Used for B2B input tax credit and printed on customer
                        tax invoices.
                      </div>
                    </div>
                  ) : (
                    <div className="tw:flex tw:items-center tw:gap-3 tw:text-gray-500">
                      <AlertCircle className="tw:h-5 tw:w-5 tw:text-gray-400 tw:shrink-0" />
                      <span className="tw:text-xs">
                        No GSTIN linked to this store. Add your GST number to
                        enable tax invoicing and B2B orders.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Inline GST Edit / Add form */}
              {isEditingGst && (
                <div className="tw:rounded-xl tw:border tw:border-blue-200 tw:bg-blue-50/40 tw:p-4 tw:transition-all">
                  <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                    <label
                      htmlFor="gstInput"
                      className="tw:text-xs tw:font-semibold tw:text-gray-800"
                    >
                      Enter 15-Digit GST Number (GSTIN)
                    </label>
                    <span className="tw:text-[11px] tw:font-mono tw:text-gray-500">
                      {gstInput.length}/15 chars
                    </span>
                  </div>

                  <div className="tw:relative">
                    <input
                      id="gstInput"
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 29AAAAA0000A1Z5"
                      value={gstInput}
                      onChange={(e) =>
                        setGstInput(
                          e.target.value.toUpperCase().replace(/\s/g, ""),
                        )
                      }
                      className={`tw:w-full tw:rounded-lg tw:border tw:bg-white tw:px-3.5 tw:py-2.5 tw:font-mono tw:text-sm tw:font-semibold tw:tracking-wider tw:text-gray-900 tw:outline-none tw:transition-colors ${
                        gstInput.length === 15
                          ? isGstInputValid
                            ? "tw:border-emerald-500 tw:focus:ring-2 tw:focus:ring-emerald-200"
                            : "tw:border-red-500 tw:focus:ring-2 tw:focus:ring-red-200"
                          : "tw:border-gray-300 tw:focus:border-blue-500 tw:focus:ring-2 tw:focus:ring-blue-100"
                      }`}
                    />
                    {gstInput.length === 15 && (
                      <div className="tw:absolute tw:right-3 tw:top-1/2 tw:-translate-y-1/2">
                        {isGstInputValid ? (
                          <CheckCircle2 className="tw:h-4 tw:w-4 tw:text-emerald-600" />
                        ) : (
                          <AlertCircle className="tw:h-4 tw:w-4 tw:text-red-500" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between">
                    <span className="tw:text-[11px] tw:text-gray-500">
                      Format: 2-digit state code + 10-digit PAN + 1-digit entity
                      + Z + 1 check char.
                    </span>
                    {gstInput && !isGstInputValid && gstInput.length === 15 && (
                      <span className="tw:text-[11px] tw:font-medium tw:text-red-600">
                        Invalid GSTIN format
                      </span>
                    )}
                  </div>

                  <div className="tw:mt-3 tw:flex tw:items-center tw:justify-end tw:gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingGst(false);
                        setGstInput(gstNumber || "");
                      }}
                      disabled={submittingGst}
                      className="tw:cursor-pointer tw:rounded-lg tw:border tw:border-gray-300 tw:bg-white tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-gray-700 tw:hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveGstNumber}
                      disabled={submittingGst || !isGstInputValid}
                      className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-lg tw:bg-primary tw:px-3.5 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-white tw:shadow-xs tw:hover:bg-primary/90 tw:disabled:opacity-50 tw:disabled:cursor-not-allowed"
                    >
                      {submittingGst ? "Submitting..." : "Submit GST Request"}
                    </button>
                  </div>
                </div>
              )}

              {/* Pending Request Alert Callout */}
              {pendingGstRequest && (
                <div className="tw:mt-3 tw:flex tw:items-start tw:gap-3 tw:rounded-xl tw:border tw:border-amber-200 tw:bg-amber-50/70 tw:p-3">
                  <Clock className="tw:h-4 tw:w-4 tw:text-amber-600 tw:shrink-0 tw:mt-0.5" />
                  <div className="tw:min-w-0 tw:flex-1 tw:text-xs">
                    <div className="tw:font-semibold tw:text-amber-900">
                      GST Update Request Pending
                    </div>
                    <div className="tw:text-amber-800 tw:mt-0.5">
                      Requested new GSTIN:{" "}
                      <span className="tw:font-mono tw:font-bold tw:text-amber-950">
                        {pendingGstRequest.displayValue}
                      </span>
                    </div>
                    <p className="tw:text-[11px] tw:text-amber-700/90 tw:mt-1">
                      Your request is under review with StoreKing
                      administration. Current invoices will use your active GST
                      number until approved.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: Invoice Tax Scheme Selection */}
            <div className="tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-4 tw:sm:p-5 tw:shadow-xs">
              <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2 tw:mb-3">
                <div>
                  <span className="tw:text-xs tw:font-bold tw:uppercase tw:tracking-wider tw:text-gray-500">
                    Invoice Tax Scheme
                  </span>
                  <p className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                    Choose how taxes (CGST, SGST, IGST) are calculated and
                    printed on invoices
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTypeLogs(true)}
                  className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:px-2.5 tw:py-1 tw:text-xs tw:font-medium tw:text-gray-600 tw:hover:bg-gray-50 tw:transition-colors"
                >
                  <History className="tw:h-3.5 tw:w-3.5 tw:text-gray-500" />
                  <span>Scheme History</span>
                </button>
              </div>

              <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-3">
                {/* Option 1: Regular GST */}
                <button
                  type="button"
                  disabled={loadingConfig || savingType}
                  onClick={() => setSelectedType("regular")}
                  className={`tw:relative tw:flex tw:flex-col tw:text-left tw:rounded-xl tw:border-2 tw:p-4 tw:cursor-pointer tw:transition-all ${
                    selectedType === "regular"
                      ? "tw:border-blue-600 tw:bg-blue-50/40 tw:shadow-xs"
                      : "tw:border-gray-200 tw:bg-white tw:hover:border-gray-300"
                  }`}
                >
                  <div className="tw:flex tw:items-center tw:justify-between tw:w-full tw:mb-2">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <div
                        className={`tw:flex tw:size-8 tw:items-center tw:justify-center tw:rounded-lg ${
                          selectedType === "regular"
                            ? "tw:bg-blue-600 tw:text-white"
                            : "tw:bg-gray-100 tw:text-gray-600"
                        }`}
                      >
                        <ReceiptText className="tw:h-4 tw:w-4" />
                      </div>
                      <div>
                        <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                          Regular GST
                        </div>
                        <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-blue-700">
                          Itemized Tax
                        </span>
                      </div>
                    </div>

                    <div
                      className={`tw:flex tw:size-5 tw:items-center tw:justify-center tw:rounded-full tw:border ${
                        selectedType === "regular"
                          ? "tw:border-blue-600 tw:bg-blue-600 tw:text-white"
                          : "tw:border-gray-300 tw:bg-white"
                      }`}
                    >
                      {selectedType === "regular" && (
                        <Check className="tw:h-3 tw:w-3 stroke-[3]" />
                      )}
                    </div>
                  </div>

                  <p className="tw:text-xs tw:text-gray-600 tw:leading-relaxed">
                    Tax / GST breakdown (CGST, SGST, IGST, and HSN) is clearly
                    shown on all customer invoices.
                  </p>
                </button>

                {/* Option 2: Composite GST */}
                <button
                  type="button"
                  disabled={loadingConfig || savingType}
                  onClick={() => setSelectedType("composite")}
                  className={`tw:relative tw:flex tw:flex-col tw:text-left tw:rounded-xl tw:border-2 tw:p-4 tw:cursor-pointer tw:transition-all ${
                    selectedType === "composite"
                      ? "tw:border-violet-600 tw:bg-violet-50/40 tw:shadow-xs"
                      : "tw:border-gray-200 tw:bg-white tw:hover:border-gray-300"
                  }`}
                >
                  <div className="tw:flex tw:items-center tw:justify-between tw:w-full tw:mb-2">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <div
                        className={`tw:flex tw:size-8 tw:items-center tw:justify-center tw:rounded-lg ${
                          selectedType === "composite"
                            ? "tw:bg-violet-600 tw:text-white"
                            : "tw:bg-gray-100 tw:text-gray-600"
                        }`}
                      >
                        <FileCheck2 className="tw:h-4 tw:w-4" />
                      </div>
                      <div>
                        <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                          Composite GST
                        </div>
                        <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-violet-700">
                          Composition Scheme
                        </span>
                      </div>
                    </div>

                    <div
                      className={`tw:flex tw:size-5 tw:items-center tw:justify-center tw:rounded-full tw:border ${
                        selectedType === "composite"
                          ? "tw:border-violet-600 tw:bg-violet-600 tw:text-white"
                          : "tw:border-gray-300 tw:bg-white"
                      }`}
                    >
                      {selectedType === "composite" && (
                        <Check className="tw:h-3 tw:w-3 stroke-[3]" />
                      )}
                    </div>
                  </div>

                  <p className="tw:text-xs tw:text-gray-600 tw:leading-relaxed">
                    Tax / GST breakdown is hidden on invoices. For stores
                    registered under the GST Composition Scheme.
                  </p>
                </button>
              </div>

              <div className="tw:mt-3 tw:flex tw:items-start tw:gap-2 tw:rounded-xl tw:border tw:border-gray-100 tw:bg-gray-50 tw:p-3">
                <Info className="tw:h-4 tw:w-4 tw:text-gray-500 tw:shrink-0 tw:mt-0.5" />
                <p className="tw:text-xs tw:text-gray-600">
                  {selectedType === "composite"
                    ? "Composite mode hides detailed tax splits on POS bills and customer invoices."
                    : "Regular mode prints detailed GST and HSN lines on all generated customer invoices."}
                </p>
              </div>
            </div>
          </div>
        </AppModal.Content>

        <AppModal.Footer>
          <div className="tw:flex tw:items-center tw:justify-between tw:w-full tw:gap-2">
            <AppButton
              type="button"
              color="light"
              fill="outline"
              onClick={() => callback({ action: "close" })}
            >
              Close
            </AppButton>

            <AppButton
              type="button"
              color="primary"
              disabled={loadingConfig || savingType || !hasSchemeChanges}
              isLoading={savingType}
              onClick={() => {
                if (AuthService.isMasterLogin()) {
                  toast.show({
                    msg: "You are not authorized to do this action.",
                    color: "danger",
                  });
                  return;
                }
                if (!gstNumber && selectedType === "regular") {
                  toast.show({
                    msg: "Please add a GST number before selecting Regular GST.",
                    color: "warning",
                  });
                  return;
                }
                setShowConfirm(true);
              }}
            >
              <Save size={14} />
              Save Scheme
            </AppButton>
          </div>
        </AppModal.Footer>
      </AppModal>

      {/* Confirmation Dialog for GST Scheme change */}
      <AppAlertDialog
        show={showConfirm}
        title="Confirm GST Invoice Scheme"
        description={
          selectedType === "composite"
            ? "Switch to Composite GST? Tax / GST details will be hidden on all future invoices issued from this store."
            : "Switch to Regular GST? Itemized tax details (CGST, SGST, IGST) will appear on all future invoices."
        }
        onConfirm={() => {
          setShowConfirm(false);
          handleSaveScheme();
        }}
        onCancel={() => setShowConfirm(false)}
      />

      {/* GST Number Change Log Sub-Modal */}
      <ProfileRequestLogModal
        show={showNumberLogs}
        callback={() => setShowNumberLogs(false)}
        profileRequestLogs={gstLogs}
        types={["GST_UPDATE"]}
        title="GST Number Change History"
      />

      {/* Composition GST Scheme Config Log Sub-Modal */}
      <ConfigLogModal
        show={showTypeLogs}
        type="compositionGST"
        callback={({ action }) => {
          if (action === "close") setShowTypeLogs(false);
        }}
      />
    </>
  );
};

export default GstSettingsModal;
