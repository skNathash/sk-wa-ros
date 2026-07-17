import { useEffect, useState } from "react";
import AppTab from "~/components/core/tab/AppTab";
import AppModal from "~/components/core/modal/AppModal";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import Overall from "./components/Overall";
import Batches from "./components/Batches";
import NonSellable from "./components/non-sellable/NonSellable";
import AppButton from "~/components/core/button/AppButton";
import { Save } from "lucide-react";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import { useTranslation } from "react-i18next";

const types = [
  {
    label: "Adjust Specific Batches",
    langKey: "adjustSpecificBatches",
    value: "batch",
  },
  {
    label: "Mark Units as Non-Sellable",
    langKey: "markUnitsAsNonSellable",
    value: "non-sellable",
  },
];

// Tab items derived from `types` for AppTab
const tabs = types.map((t) => ({
  name: t.label,
  key: t.value,
  langKey: t.langKey,
}));

interface AdjustStockModalProps {
  show: boolean;
  callback: (a: { action: string }) => void;
  dealId: string;
  dealName?: string;
  binId: string;
  selectedStockUom?: string;
}

const AdjustStockModal = ({
  show,
  callback,
  dealId,
  dealName,
  binId,
  selectedStockUom,
}: AdjustStockModalProps) => {
  const { t } = useTranslation(["common"]);
  const { show: showToast } = useAppToast();

  const formMethods = useForm({
    defaultValues: {
      type: "batch",
      batches: [],
      reason: "",
      location: "",
      rack: "",
      bin: "",
      additionalInfo: "",
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const [type, batches] = useWatch({
    control: formMethods.control,
    name: ["type", "batches"],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      // Reset form to default values when modal is opened
      formMethods.reset({
        type: "batch",
        batches: [],
        reason: "",
        location: "",
        rack: "",
        bin: "",
        additionalInfo: "",
      });
    }
    if (show && dealId && binId) {
      const fetchMasterData = async () => {
        setLoading(true);
        const fid = AuthService.getLoggedInUserId();
        if (fid) {
          try {
            const res = await RackBinService.getMasterData(fid, {
              filter: {
                dealId: dealId,
                locationId: binId,
                isUsable: true,
              },
            });
            // Filter batches to only show those with quantity > 0
            const filteredBatches = (res.data?.data || []).filter(
              (batch: any) => batch.quantity > 0
            );
            formMethods.setValue("batches", filteredBatches);
          } catch (e) {
            console.error("Failed to fetch master data", e);
            showToast({ msg: "Failed to fetch batch data", color: "error" });
          }
        }
        setLoading(false);
      };
      fetchMasterData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, dealId]);

  const onClose = () => {
    callback({ action: "close" });
  };

  const validateForm = () => {
    let msg = "";
    if (type === "batch") {
      const f = formMethods.getValues();

      const hasBatches = f.batches.some((b: any) => b.adjustment !== "");
      if (!hasBatches) {
        msg = "Please select at least one batch with quantity";
      } else {
        const sameStockBatch = f.batches.find(
          (b: any) =>
            b.adjustment !== "" &&
            Number(b.adjustment) === Number(b.quantity)
        );
        if (sameStockBatch) {
          const batchRef =
            (sameStockBatch as any).stockMasterId ||
            (sameStockBatch as any).batch ||
            "";
          msg = `Adjustment value cannot be the same as the current stock for batch ${batchRef}. Please enter a different value`;
        } else if (!f.reason?.trim()) {
          msg = "Please enter a reason";
        }
      }
    }
    return { msg };
  };

  const validateNonSellableForm = () => {
    let msg = "";
    const f = formMethods.getValues();

    // Check if at least one batch is selected with quantity
    const hasBatches = f.batches.some((b: any) => b.adjustment > 0);
    if (!hasBatches) {
      msg =
        "Please select at least one batch with quantity to move to non-sellable";
      return { msg };
    }

    // Check destination location details
    if (!f.location?.trim()) {
      msg = "Please select a destination location";
      return { msg };
    }

    if (!f.rack?.trim()) {
      msg = "Please select a destination rack";
      return { msg };
    }

    if (!f.bin?.trim()) {
      msg = "Please select a destination bin";
      return { msg };
    }

    // Check if reason is selected
    if (!f.reason?.trim()) {
      msg = "Please select a reason for moving stock to non-sellable";
      return { msg };
    }

    return { msg };
  };

  const handleSave = () => {
    let validationResult;

    if (type === "batch") {
      validationResult = validateForm();
    } else if (type === "non-sellable") {
      validationResult = validateNonSellableForm();
    } else {
      validationResult = { msg: "Invalid form type" };
    }

    if (validationResult.msg) {
      showToast({ msg: validationResult.msg, color: "error" });
      return;
    }

    if (type === "batch") {
      handleAdjustStock();
    } else if (type === "non-sellable") {
      handleMoveToNonSellable();
    }
  };

  const handleAdjustStock = async () => {
    setSubmitting(true);

    const f = formMethods.getValues();

    const params = {
      stockMasters: f.batches
        .filter((b: any) => b.adjustment !== "")
        .map((b: any) => ({
          stockMasterId: b.stockMasterId,
          qty: b.adjustment,
        })),
      dealId: dealId,
      reason: f.reason,
    };

    const resp = await RackBinService.adjustStock(
      AuthService.getLoggedInUserId() || "",
      params
    );

    setSubmitting(false);

    if (resp.statusCode === 200) {
      showToast({ msg: "Stock adjusted successfully", color: "success" });
      // Debug: log before emitting callback to parent
      // eslint-disable-next-line no-console
      console.debug("AdjustStockModal -> emitting action: adjust-stock");
      callback({ action: "adjust-stock" });
    } else {
      showToast({
        msg: resp.data?.message || "Failed to adjust stock",
        color: "error",
      });
    }
  };

  const handleMoveToNonSellable = async () => {
    setSubmitting(true);

    const f = formMethods.getValues();
    const fid = AuthService.getLoggedInUserId();

    if (fid) {
      try {
        const res = await RackBinService.moveStock(fid, {
          from: {
            binId: binId,
            stockMasters: f.batches
              .filter((b: any) => b.adjustment > 0)
              .map((b: any) => ({
                stockMasterId: b.stockMasterId,
                quantity: b.adjustment,
              })),
          },
          to: {
            binId: f.bin,
          },
          dealId: dealId,
          dealName: dealName,
          reason: f.reason,
        });

        if (res.statusCode === 200) {
          showToast({
            msg: "Stock moved to non-sellable successfully",
            color: "success",
          });
          // Debug: log before emitting callback to parent
          // eslint-disable-next-line no-console
          console.debug(
            "AdjustStockModal -> emitting action: move-to-non-sellable"
          );
          callback({ action: "move-to-non-sellable" });
        } else {
          showToast({
            msg: res.data?.message || "Failed to move stock to non-sellable",
            color: "error",
          });
        }
      } catch (e) {
        console.error("Failed to move stock to non-sellable", e);
        showToast({
          msg: "Failed to move stock to non-sellable",
          color: "error",
        });
      }
    }
    setSubmitting(false);
  };

  return (
    <AppModal show={show} callback={onClose} className="tw:h-[90vh]">
      <AppModal.Title onClose={onClose}>
        <div className="tw:text-lg tw:font-semibold">
          {t("adjustStock")}
          {dealName && <span className="tw:ml-1"> - {dealName}</span>}
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[80vh]">
        <div className="tw:p-0.5">
          {loading ? (
            <div className="tw:text-center tw:py-4">{t("loading")}</div>
          ) : (
            <FormProvider {...formMethods}>
              <div className="tw:mb-4">
                <div className="tw:mb-2">
                  <div className="tw:text-xs tw:font-medium tw:text-gray-700">
                    Choose Adjustment Type{" "}
                    <span className="tw:text-red-500">*</span>
                  </div>
                </div>
                <AppTab
                  tabs={tabs}
                  activeTab={type}
                  onTabChange={(tab) => formMethods.setValue("type", tab.key)}
                  variant="tabs"
                />
              </div>
              {type === "overall" && <Overall />}
              {type === "batch" && (
                <Batches
                  masterData={batches}
                  selectedStockUom={selectedStockUom}
                />
              )}
              {type === "non-sellable" && (
                <NonSellable
                  masterData={batches}
                  selectedStockUom={selectedStockUom}
                />
              )}
            </FormProvider>
          )}
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton color="light" fill="outline" onClick={onClose}>
            {t("cancel")}
          </AppButton>
          <AppButton
            color="dark"
            onClick={handleSave}
            isLoading={submitting}
            disabled={submitting}
          >
            <Save /> {t("saveChanges")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default AdjustStockModal;
