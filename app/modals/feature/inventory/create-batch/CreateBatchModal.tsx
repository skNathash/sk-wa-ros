import { isAfter, startOfDay } from "date-fns";
import React, { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import Batches from "./Batches";
import CreateBatchForm from "./CreateBatchForm";
import SelectedBatch from "./SelectedBatch";
import { useTranslation } from "react-i18next";

interface CreateBatchModalProps {
  show: boolean;
  callback: (args: { action: string; data?: any }) => void;
  dealId?: string;
  dealRefId?: string;
  dealName?: string;
  // No stockMasterContext prop — modal receives dealId/dealRefId/dealName and fetches batches by dealId/binId
  binId?: string;
  selectedStockUom?: string;
}

interface FormData {
  quantity: number;
  barcode: string;
  mrp: number;
  manufactureDate: Date | undefined;
  expiryDate: Date | undefined;
  remarks: string;
  updateMasterDates?: boolean;
}

const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  show,
  callback,
  dealId,
  dealRefId,
  dealName,
  binId,
  selectedStockUom,
}) => {
  const { t } = useTranslation(["common"]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [display, setDisplay] = useState<"batches" | "form">("batches");
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const appToast = useAppToast();

  const methods = useForm<FormData>({
    defaultValues: {
      quantity: 1,
      barcode: "",
      mrp: 0,
      manufactureDate: undefined,
      expiryDate: undefined,
      remarks: "",
      updateMasterDates: false,
    },
  });

  const { handleSubmit, reset } = methods;

  // Reset form when modal opens — clear previous values
  React.useEffect(() => {
    if (show) {
      reset({
        quantity: 1,
        barcode: "",
        mrp: 0,
        manufactureDate: undefined,
        expiryDate: undefined,
        remarks: "",
      });
    }
  }, [show, reset, selectedBatch]);

  // Fetch related batches when modal opens
  React.useEffect(() => {
    const fetchBatches = async () => {
      setLoadingBatches(true);
      const fid = AuthService.getLoggedInUserId();
      if (!fid) {
        setLoadingBatches(false);
        return;
      }
      try {
        // Fetch master data filtered by binId (locationId) similar to AdjustStockModal
        const filter: any = { isUsable: true };
        if (binId) filter.locationId = binId;
        // include dealId if provided
        if (dealId) filter.dealId = dealId;

        const res = await RackBinService.getMasterData(fid, { filter });
        const all = res.data?.data || [];

        // Only show batches with positive quantity
        setBatches(all.filter((x: any) => Number(x.quantity) > 0));
      } catch (e) {
        console.error("Failed to fetch batches for CreateBatchModal", e);
        appToast.show({ msg: "Failed to fetch batch data", color: "error" });
      } finally {
        setLoadingBatches(false);
      }
    };

    if (show) {
      // reset display to list when opened
      setDisplay("batches");
      setSelectedBatch(null);
      fetchBatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, dealId, binId]);

  const handleClose = () => {
    reset();
    callback({ action: "close" });
  };

  const handleEditClick = (batch: any) => {
    setSelectedBatch(batch);
    // populate form with selected batch
    reset({
      quantity: 1,
      barcode: batch.barcode || "",
      mrp: batch.mrp ?? batch.purchasePrice ?? 0,
      manufactureDate: batch.manufactureDate
        ? new Date(batch.manufactureDate)
        : undefined,
      expiryDate: batch.expiry ? new Date(batch.expiry) : undefined,
      remarks: batch.remarks || "",
    });
    setDisplay("form");
  };

  const onSubmit = async (formData: FormData) => {
    // Validate quantity
    if (formData.quantity <= 0) {
      appToast.show({
        msg: "Quantity must be greater than 0",
        color: "error",
      });
      return;
    }

    // Validate barcode
    // if (!formData.barcode.trim()) {
    //   appToast.show({
    //     msg: "Barcode is required",
    //     color: "error",
    //   });
    //   return;
    // }

    // Validate MRP
    if (!formData.mrp || formData.mrp <= 0) {
      appToast.show({
        msg: "MRP must be greater than 0",
        color: "error",
      });
      return;
    }

    // Validate dates if both are provided
    if (formData.manufactureDate && formData.expiryDate) {
      if (
        isAfter(
          startOfDay(formData.manufactureDate),
          startOfDay(formData.expiryDate)
        )
      ) {
        appToast.show({
          msg: "Manufacture date cannot be greater than expiry date",
          color: "error",
        });
        return;
      }
    }

    // Validate that if expiry date is provided, manufacture date should also be provided
    if (formData.expiryDate && !formData.manufactureDate) {
      appToast.show({
        msg: "Manufacture date is required when expiry date is provided",
        color: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      const fid = AuthService.getLoggedInUserId();
      const payload = {
        barcode: formData.barcode || "",
        stockMasterId: selectedBatch?._id,
        quantity: formData.quantity,
        expiry: formData.expiryDate
          ? formData.expiryDate.toISOString()
          : undefined,
        manufactureDate: formData.manufactureDate
          ? formData.manufactureDate.toISOString()
          : undefined,
        purchasePrice: 0,
        mrp: formData.mrp,
      };

      // Create new batch using RackBinService
      const response = await RackBinService.createBatch(fid, payload);

      if (response.statusCode === 200 || response.statusCode === 201) {
        appToast.show({
          msg: "Variation created successfully",
          color: "success",
        });

        // If user opted to update master dates and a selectedBatch exists, call updateStockMasterDates
        if (formData.updateMasterDates && selectedBatch && selectedBatch._id) {
          try {
            const updatePayload: any = {};
            if (formData.manufactureDate) {
              updatePayload.manufactureDate = formData.manufactureDate;
            }
            if (formData.expiryDate) {
              updatePayload.expiry = formData.expiryDate;
            }

            const editResp = await RackBinService.updateStockMasterDates(
              fid,
              selectedBatch._id,
              updatePayload
            );
            if (editResp.statusCode === 200 || editResp.statusCode === 201) {
              appToast.show({
                msg: "Master updated successfully",
                color: "success",
              });
            } else {
              appToast.show({
                msg: editResp.data?.message || "Failed to update master",
                color: "error",
              });
            }
          } catch (e) {
            console.error("Failed to update master dates:", e);
            appToast.show({
              msg: "Failed to update master dates",
              color: "error",
            });
          }
        }

        callback({ action: "save", data: { ...formData } });
        reset(formData);
      } else {
        const errorMessage =
          response.data?.message ||
          "Failed to create variation. Please try again.";
        appToast.show({
          msg: errorMessage,
          color: "error",
        });
      }
    } catch (error: any) {
      console.error("Error creating variation:", error);
      appToast.show({
        msg: "Failed to create variation. Please try again.",
        color: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render modal if data is not available
  // Render only when modal is asked to show and we have at least dealId or dealRefId/name (dealId preferred)
  if (!dealId && !dealRefId && !dealName) return null;

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:max-w-md tw:w-full tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold tw:text-base">
          {t("createNewVariationFor", { dealName })}
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[80vh]">
        {display === "batches" ? (
          <div>
            <Batches
              batches={batches}
              loading={loadingBatches}
              onSelect={handleEditClick}
              selectedStockUom={selectedStockUom}
            />
          </div>
        ) : (
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-4">
              {/* New form component will render inputs via useFormContext */}
              {selectedBatch && (
                <SelectedBatch
                  batch={selectedBatch}
                  selectedStockUom={selectedStockUom}
                />
              )}
              {/* CreateBatchForm will be imported dynamically below */}
              <CreateBatchForm
                selectedBatch={selectedBatch}
                modalShow={show}
                dealId={dealId}
              />
            </form>
          </FormProvider>
        )}
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          {display === "form" ? (
            <>
              <AppButton
                fill="outline"
                color="light"
                onClick={() => {
                  setDisplay("batches");
                  setSelectedBatch(null);
                }}
                disabled={isLoading}
              >
                {t("back")}
              </AppButton>
              <AppButton
                onClick={handleClose}
                fill="outline"
                color="secondary"
                disabled={isLoading}
              >
                {t("cancel")}
              </AppButton>
              <AppButton
                onClick={handleSubmit(onSubmit)}
                color="primary"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? t("saving") : t("saveChanges")}
              </AppButton>
            </>
          ) : (
            <>
              <AppButton onClick={handleClose} fill="outline" color="secondary">
                {t("cancel")}
              </AppButton>
              <AppButton
                onClick={() => {
                  if (selectedBatch) setDisplay("form");
                }}
                color="primary"
                disabled={!selectedBatch}
              >
                {t("next")}
              </AppButton>
            </>
          )}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default CreateBatchModal;
