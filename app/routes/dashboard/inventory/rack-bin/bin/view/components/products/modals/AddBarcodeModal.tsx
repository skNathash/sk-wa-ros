import React, { useState } from "react";
import { Barcode } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { Controller, useForm } from "react-hook-form";
import BarcodeScan from "~/components/core/barcode-scan/BarcodeScan";
import BarcodeInput from "~/shared/inventory/components/barcode-input/BarcodeInput";
import RackBinService from "~/services/RackBinService";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import { useTranslation } from "react-i18next";

interface AddBarcodeModalProps {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  masterId?: string;
  _id?: string;
  dealId?: string;
  uom?: string;
}

interface FormData {
  barcode: string;
}

const AddBarcodeModal: React.FC<AddBarcodeModalProps> = ({
  show,
  callback,
  masterId,
  _id,
  dealId,
  uom,
}) => {
  const { t } = useTranslation(["common"]);

  const [isLoading, setIsLoading] = useState(false);
  const { show: showToast } = useAppToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>();

  const handleClose = () => {
    reset();
    callback({ action: "close" });
  };

  const onSubmit = async (data: FormData) => {
    if (!data.barcode.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const fid = AuthService.getLoggedInUserId();
      if (!fid || !_id) {
        showToast({ msg: "Missing required data", color: "error" });
        return;
      }

      const response = await RackBinService.addBarcode(
        fid,
        _id,
        data.barcode.trim()
      );

      // Check if response has statusCode and handle accordingly
      if (response?.statusCode === 200) {
        showToast({ msg: "Barcode added successfully!", color: "success" });

        callback({
          action: "submit",
          data: {
            barcode: data.barcode.trim(),
            masterId,
            _id,
          },
        });
        reset();
      } else {
        // Handle non-200 responses as errors
        const errorMsg = response?.data?.message || "Failed to add barcode";
        showToast({ msg: errorMsg, color: "error" });
      }
    } catch (error: any) {
      console.error("Error adding barcode:", error);

      // Handle error based on status code
      if (error?.response?.statusCode) {
        const errorMsg =
          error.response.data?.message || "Failed to add barcode";
        showToast({ msg: errorMsg, color: "error" });
      } else {
        // Handle network or other errors
        showToast({
          msg: "Network error. Please check your connection",
          color: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppModal show={show} callback={handleClose}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <Barcode className="tw:w-5 tw:h-5 tw:text-gray-600" />
          <span>{t("addBarcode")}</span>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-4">
          <div>
            <label className="tw:block tw:text-xs tw:font-medium tw:text-gray-600 tw:mb-1.5">
              {t("barcode")} <span className="tw:text-red-600">*</span>
            </label>
            <div className="tw:flex tw:items-center tw:gap-2">
              <Controller
                name="barcode"
                control={control}
                rules={{
                  required: t("barcodeIsRequired"),
                  minLength: {
                    value: 3,
                    message: t("barcodeMustBeAtLeast3Characters"),
                  },
                }}
                render={({ field }) => (
                  <BarcodeInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder={t("enterBarcode")}
                    uom={uom}
                    dealId={dealId}
                  />
                )}
              />
              <BarcodeScan
                callback={(r: { action: string; data: any }) => {
                  if (r.action === "scan" && r.data) {
                    setValue("barcode", r.data);
                  }
                }}
                className="tw:cursor-pointer"
              />
            </div>
            {errors.barcode?.message && (
              <div className="tw:text-xs tw:text-red-600 tw:mt-1">
                {errors.barcode?.message}
              </div>
            )}
          </div>

          {masterId && (
            <div className="tw:text-sm tw:text-gray-500 tw:bg-gray-50 tw:p-3 tw:rounded">
              <span className="tw:font-medium">{t("snapshotId")}:</span>{" "}
              {masterId}
            </div>
          )}
        </form>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            onClick={handleClose}
            color="light"
            fill="outline"
            disabled={isLoading}
          >
            {t("cancel")}
          </AppButton>
          <AppButton
            onClick={handleSubmit(onSubmit)}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {t("addBarcode")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default AddBarcodeModal;
