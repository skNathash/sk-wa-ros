import {
  addYears,
  endOfMonth,
  isAfter,
  startOfDay,
  startOfYear,
  subYears,
} from "date-fns";
import React, { useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";

interface EditSnapshotModalProps {
  show: boolean;
  callback: (args: { action: string; data?: any }) => void;
  data: {
    productName: string;
    batchId: string;
    _id: string;
    manufactureDate?: Date;
    expiryDate?: Date;
    remarks?: string;
  };
}

interface FormData {
  manufactureDate: Date | undefined;
  expiryDate: Date | undefined;
  remarks: string;
}

// Date picker configurations (moved out of component)
const today = new Date();
const manufactureDateConfig: DayPickerProps = {
  defaultMonth: today,
  disabled: { after: today },
};

const expiryDateConfig: DayPickerProps = {
  defaultMonth: today,
  disabled: {
    before: startOfYear(subYears(today, 1)),
    after: endOfMonth(addYears(today, 5)),
  },
  endMonth: endOfMonth(addYears(today, 5)),
  startMonth: startOfYear(subYears(today, 1)),
};

const EditSnapshotModal: React.FC<EditSnapshotModalProps> = ({
  show,
  callback,
  data,
}) => {
  const { t } = useTranslation(["common"]);

  const [isLoading, setIsLoading] = useState(false);
  const appToast = useAppToast();

  const {
    register,
    handleSubmit,
    control,

    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      manufactureDate: undefined,
      expiryDate: undefined,
      remarks: "",
    },
  });

  // Only reset form when modal opens
  React.useEffect(() => {
    if (show) {
      reset({
        manufactureDate: data.manufactureDate
          ? new Date(data.manufactureDate)
          : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        remarks: data.remarks || "",
      });
    }
  }, [show, data, reset]);

  const handleClose = () => {
    reset();
    callback({ action: "close" });
  };

  const onSubmit = async (formData: FormData) => {
    // Validate dates before submission
    if (!formData.manufactureDate || !formData.expiryDate) {
      appToast.show({
        msg: "Please select both manufacture date and expiry date",
        color: "error",
      });
      return;
    }

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

    setIsLoading(true);
    try {
      const fid = AuthService.getLoggedInUserId();
      const payload = {
        manufactureDate: formData.manufactureDate,
        expiry: formData.expiryDate,
        remarks: formData.remarks,
      };

      const response = await RackBinService.updateStockMasterDates(
        fid,
        data._id,
        payload
      );

      // Handle different status codes
      if (response.statusCode === 200 || response.statusCode === 201) {
        appToast.show({
          msg: "Dates updated successfully",
          color: "success",
        });

        callback({
          action: "save",
          data: {
            manufactureDate: formData.manufactureDate,
            expiryDate: formData.expiryDate,
            remarks: formData.remarks,
          },
        });
        reset(formData);
      } else {
        // Handle non-success status codes
        const errorMessage =
          response.data?.message || "Failed to update dates. Please try again.";
        appToast.show({
          msg: errorMessage,
          color: "error",
        });
      }
    } catch (error: any) {
      console.error("Error updating dates:", error);

      // Handle network errors or unexpected errors
      let errorMessage = "Failed to update dates. Please try again.";

      appToast.show({
        msg: errorMessage,
        color: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:max-w-md tw:w-full">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold tw:text-base tw:mb-1">
          {data?.productName}
        </div>
        <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
          Batch ID: {data?.batchId}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-4">
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
            <Controller
              name="manufactureDate"
              control={control}
              render={({ field }) => (
                <AppDateInput
                  label={t("manufactureDate")}
                  value={field.value}
                  callback={field.onChange}
                  error={errors.manufactureDate?.message}
                  isRequired
                  placeholder={t("choose")}
                  dateConfig={manufactureDateConfig}
                />
              )}
            />
            <Controller
              name="expiryDate"
              control={control}
              render={({ field }) => (
                <AppDateInput
                  label={t("expiryDate")}
                  value={field.value}
                  callback={field.onChange}
                  error={errors.expiryDate?.message}
                  isRequired
                  placeholder={t("choose")}
                  dateConfig={expiryDateConfig}
                />
              )}
            />
          </div>
          <AppTextarea
            name="remarks"
            label={t("remarks")}
            placeholder={t("enterRemarks")}
            register={register}
            error={errors.remarks?.message}
            rows={3}
          />
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
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
            {isLoading ? t("saving") : t("save")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default EditSnapshotModal;
