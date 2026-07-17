import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import LocationInput from "~/components/feature/inventory/location-input/LocationInput";
import { RACK_BIN_LOCATION_SELLABLE } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import Batches from "./components/Batches";
import { useTranslation } from "react-i18next";

interface MoveStockModalProps {
  show: boolean;
  callback: (a: { action: string }) => void;
  dealId: string;
  binId: string;
  dealName?: string;
  selectedStockUom?: string;
}

interface FormData {
  batches: any[];
  reason: string;
  selectedRack: Record<string, any>;
  selectedBin: Record<string, any>;
  rack: string;
  bin: string;
}

const MoveStockModal = ({
  show,
  callback,
  dealId,
  binId,
  dealName,
  selectedStockUom,
}: MoveStockModalProps) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();

  const { show: showToast } = useAppToast();

  const formMethods = useForm({
    defaultValues: {
      batches: [],
      reason: "",
      selectedRack: undefined,
      selectedBin: undefined,
      rack: undefined,
      bin: undefined,
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const batches = useWatch({
    control: formMethods.control,
    name: "batches",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      // Reset form to default values when modal is opened
      formMethods.reset({
        batches: [],
        reason: "",
        selectedRack: undefined,
        selectedBin: undefined,
        rack: undefined,
        bin: undefined,
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
                locationId: binId,
                dealId: dealId,
              },
            });
            // Filter batches to only show those with quantity > 0
            const filteredBatches = (res.data?.data || []).filter(
              (batch: any) => batch.quantity > 0
            );
            formMethods.setValue("batches", filteredBatches);
          } catch (e) {
            console.error("Failed to fetch master data", e);
          }
        }
        setLoading(false);
      };
      fetchMasterData();
    }
  }, [show, dealId, binId, formMethods]);

  const onClose = () => {
    callback({ action: "close" });
  };

  // Validation function
  const validateForm = (formData: any) => {
    // Check batches: at least one adjustment value must be given
    if (
      !Array.isArray(formData.batches) ||
      !formData.batches.some((b: any) => b.adjustment && b.adjustment !== 0)
    ) {
      return { msg: "Please enter adjustment for at least one batch." };
    }
    // Check rack and bin (selected or direct)
    const rack = formData.selectedRack || formData.rack;
    const bin = formData.selectedBin || formData.bin;
    if (!rack) {
      return { msg: "Please select a rack." };
    }
    if (!bin) {
      return { msg: "Please select a bin." };
    }
    return null;
  };

  // Function to handle save action
  const saveChanges = async () => {
    const values = formMethods.getValues();
    const validation = validateForm(values);
    if (validation) {
      showToast({ msg: validation.msg, color: "error" });
      return;
    }
    setSubmitting(true);
    const fid = AuthService.getLoggedInUserId();
    if (fid) {
      try {
        const res = await RackBinService.moveStock(fid, {
          from: {
            binId: binId,
            stockMasters: values.batches
              .filter((b: any) => b.adjustment > 0)
              .map((b: any) => ({
                stockMasterId: b.stockMasterId,
                quantity: b.adjustment,
              })),
          },
          to: {
            binId: values.bin,
          },
          dealId: dealId,
          dealName: dealName,
          reason: values.reason,
        });
        if (res.statusCode === 200) {
          showToast({ msg: "Stock moved successfully", color: "success" });
          callback({ action: "stock-moved" });
        } else {
          showToast({ msg: res.data.message, color: "error" });
        }
      } catch (e) {
        console.error("Failed to move stock", e);
      }
    }
    setSubmitting(false);
  };

  const handleLocationChange = (val: any) => {
    formMethods.setValue("rack", val.rack);
    formMethods.setValue("bin", val.bin);
    formMethods.setValue("selectedRack", val.rack);
    formMethods.setValue("selectedBin", val.bin);
  };

  return (
    <AppModal
      show={show}
      callback={onClose}
      className="tw:h-[90vh] tw:md:!max-w-2xl"
    >
      <AppModal.Title onClose={onClose}>
        <div className="tw:font-semibold tw:text-lg">
          <span>{t("moveStock")}</span>
          {dealName && <span className="tw:ml-1"> - {dealName}</span>}
        </div>
        <div className="tw:text-xs tw:text-gray-500">
          {t("selectQuantitiesFromAvailableSourcesToMoveToANewLocation")}
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[80vh]">
        <div className="tw:p-0.5">
          {loading ? (
            <div className="tw:text-center tw:py-4">{t("loading")}</div>
          ) : (
            <FormProvider {...formMethods}>
              {/* Pass batches to Batches */}
              <Batches
                masterData={batches || []}
                selectedStockUom={selectedStockUom}
              />

              <div className="tw:text-xs tw:font-medium tw:mb-2">
                {t("destinationLocation")}
              </div>

              <div className="tw:mb-4">
                <LocationInput
                  locationType="sellable"
                  locationId={RACK_BIN_LOCATION_SELLABLE}
                  callback={handleLocationChange}
                  autoLoadRack={true}
                  hideSuggestButton={true}
                  layout={isMobile ? "vertical" : "horizontal"}
                  isRequired={true}
                />
              </div>
              <AppTextarea
                label={t("reasonForMove")}
                name="reason"
                className="tw:mb-4"
                register={formMethods.register}
                placeholder={t("explainTheReasonForTheMove")}
              />
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
            onClick={saveChanges}
            disabled={submitting}
            isLoading={submitting}
          >
            <Save /> {t("saveChanges")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default MoveStockModal;
