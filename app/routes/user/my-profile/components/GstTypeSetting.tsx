import {
  Check,
  FileCheck2,
  History,
  Info,
  Plus,
  ReceiptText,
  Save,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import ConfigLogModal from "~/routes/configs/settings/others/modals/logs/ConfigLogModal";
import GenericUpdateModal from "../modals/GenericUpdateModal";
import ProfileRequestLogModal from "../modals/ProfileRequestLogModal";

const CONFIG_TYPE = "ORDER_INVOICE_CONFIG";

// compositionGST === false  -> Regular GST  (tax details shown on invoices)
// compositionGST === true   -> Composite GST (tax details hidden on invoices)
type GstType = "regular" | "composite";

const OPTIONS: Array<{
  value: GstType;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: "regular",
    title: "Regular GST",
    description:
      "Tax / GST details (CGST, SGST, IGST and HSN) are shown on your invoices.",
    icon: <ReceiptText className="tw:w-4 tw:h-4" />,
  },
  {
    value: "composite",
    title: "Composite GST",
    description:
      "Tax / GST details are hidden on your invoices. Use this if you are registered under the composition scheme.",
    icon: <FileCheck2 className="tw:w-4 tw:h-4" />,
  },
];

interface GstTypeSettingProps {
  gstNumber?: string;
  profileRequestLogs?: any[];
  callback?: () => void;
}

const GstTypeSetting: React.FC<GstTypeSettingProps> = ({
  gstNumber,
  profileRequestLogs,
  callback,
}) => {
  const toast = useAppToast();

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Currently saved value, and the value the user has selected (but not yet saved)
  const [savedType, setSavedType] = useState<GstType>("regular");
  const [selectedType, setSelectedType] = useState<GstType>("regular");

  // Add / update GST number modal
  const [genericModal, setGenericModal] = useState<{
    show: boolean;
    inputs: Array<string>;
    values: Record<string, any>;
  }>({ show: false, inputs: [], values: {} });

  // GST number change logs (profile update requests)
  const [showNumberLog, setShowNumberLog] = useState(false);
  // GST type (regular / composite) change logs
  const [showTypeLog, setShowTypeLog] = useState(false);

  const gstLogs = Array.isArray(profileRequestLogs)
    ? profileRequestLogs.filter((l) => l && l.type === "GST_UPDATE")
    : [];
  const pendingGstCount = gstLogs.filter(
    (l) => String(l.status).toLowerCase() === "pending",
  ).length;

  useEffect(() => {
    const load = async () => {
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
          msg: e?.message || "Failed to load GST type setting",
          color: "error",
        });
      } finally {
        setFetching(false);
      }
    };

    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Preserve any other keys already present in the invoice config
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
      if (upd.statusCode === 200) {
        setSavedType(selectedType);
        toast.show({ msg: "GST type updated", color: "success" });
      } else {
        toast.show({
          msg: upd?.data?.message || "Failed to update GST type",
          color: "error",
        });
      }
    } catch (e: any) {
      toast.show({
        msg: e?.message || "Error updating GST type",
        color: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenericModalCallback = ({ action }: { action: string }) => {
    setGenericModal({ show: false, inputs: [], values: {} });
    if (action === "submit" || action === "success") {
      callback?.();
    }
  };

  const hasChanges = selectedType !== savedType;

  return (
    <AppCard
      title="GST Type"
      subtitle="Choose how tax details appear on your invoices"
      icon={<ReceiptText />}
      iconClassName="tw:text-blue-600"
    >
      <div className="tw:flex tw:flex-col tw:gap-3">
        {/* GST Number */}
        <KeyValue
          label={
            <div className="tw:flex tw:items-center tw:gap-1 tw:justify-between">
              <span>GST Number</span>
              <div className="tw:flex tw:items-center tw:gap-1">
                <AppButton
                  type="button"
                  color="light"
                  fill="clear"
                  size="small"
                  onClick={() => setShowNumberLog(true)}
                  className="tw:px-0!"
                >
                  <History className="tw:w-4 tw:h-4" />
                  <span className="tw:flex tw:items-center tw:gap-1">
                    Logs
                    {pendingGstCount > 0 && (
                      <span className="tw:inline-flex tw:items-center tw:justify-center tw:w-5 tw:h-5 tw:rounded-full tw:text-xs tw:bg-amber-400 tw:text-black">
                        {pendingGstCount}
                      </span>
                    )}
                  </span>
                </AppButton>
                <AppButton
                  type="button"
                  color="primary"
                  fill="clear"
                  size="small"
                  onClick={() =>
                    setGenericModal({
                      show: true,
                      inputs: ["gstNo"],
                      values: { gstNo: gstNumber },
                    })
                  }
                  className="tw:text-primary tw:px-0!"
                >
                  <Plus className="tw:w-4 tw:h-4" />
                  Add
                </AppButton>
              </div>
            </div>
          }
          className="tw:mb-0"
          size="sm"
        >
          <div>{gstNumber || "--"}</div>
        </KeyValue>

        <hr className="tw:border-gray-100" />

        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-2">
          {OPTIONS.map((opt) => {
            const isSelected = selectedType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={fetching || saving}
                onClick={() => setSelectedType(opt.value)}
                aria-pressed={isSelected}
                className={`tw:relative tw:text-left tw:rounded-md tw:border tw:px-3 tw:py-2 tw:transition-colors tw:cursor-pointer tw:disabled:opacity-60 tw:disabled:cursor-not-allowed ${
                  isSelected
                    ? "tw:border-blue-600 tw:bg-blue-50"
                    : "tw:border-gray-300 tw:bg-white tw:hover:border-gray-400"
                }`}
              >
                <div
                  className={`tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-semibold ${
                    isSelected ? "tw:text-blue-700" : "tw:text-gray-900"
                  }`}
                >
                  {opt.icon}
                  <span>{opt.title}</span>
                  {isSelected ? (
                    <Check className="tw:w-4 tw:h-4 tw:ml-auto tw:text-blue-600" />
                  ) : null}
                </div>
                <p className="tw:mt-1 tw:text-xs tw:text-gray-500 tw:leading-snug">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
          <p className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-500">
            <Info className="tw:w-3.5 tw:h-3.5 tw:shrink-0" />
            <span>
              {selectedType === "composite"
                ? "Future invoices will hide tax / GST details."
                : "Future invoices will show tax / GST details."}
            </span>
          </p>
          <div className="tw:flex tw:items-center tw:gap-2">
            <AppButton
              type="button"
              color="light"
              fill="outline"
              size="small"
              onClick={() => setShowTypeLog(true)}
            >
              <History size={14} />
              History
            </AppButton>
            <AppButton
              type="button"
              size="small"
              disabled={fetching || saving || !hasChanges}
              onClick={() => {
                if (AuthService.isMasterLogin()) {
                  toast.show({
                    msg: "You are not authorized to do this action",
                    color: "danger",
                  });
                  return;
                }
                if (!gstNumber) {
                  toast.show({
                    msg: "Please add a GST number before updating the GST type.",
                    color: "error",
                  });
                  return;
                }
                setShowConfirm(true);
              }}
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save"}
            </AppButton>
          </div>
        </div>
      </div>

      <AppAlertDialog
        show={showConfirm}
        title="Confirm GST Type"
        description={
          selectedType === "composite"
            ? "Switch to Composite GST? Tax / GST details will be hidden on all future invoices."
            : "Switch to Regular GST? Tax / GST details will be shown on all future invoices."
        }
        onConfirm={() => {
          setShowConfirm(false);
          handleSave();
        }}
        onCancel={() => setShowConfirm(false)}
      />

      <GenericUpdateModal
        show={genericModal.show}
        callback={handleGenericModalCallback}
        inputs={genericModal.inputs}
        values={genericModal.values}
      />

      <ProfileRequestLogModal
        show={showNumberLog}
        callback={() => setShowNumberLog(false)}
        profileRequestLogs={gstLogs}
        types={["GST_UPDATE"]}
        title="GST Number Change Log"
      />

      <ConfigLogModal
        show={showTypeLog}
        type="compositionGST"
        callback={({ action }) => {
          if (action === "close") setShowTypeLog(false);
        }}
      />
    </AppCard>
  );
};

export default GstTypeSetting;
