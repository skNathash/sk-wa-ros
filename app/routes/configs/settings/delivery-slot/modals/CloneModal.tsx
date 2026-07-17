import React, { useMemo, useState } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppDateInput from "~/components/core/form/AppDateInput";
import PosService from "~/services/PosService";
import useAppToast from "~/hooks/useAppToast";

type Props = {
  show: boolean;
  callback: (a: { action: "submit" | "close"; data?: any }) => void;
  data?: any;
};

type FormData = {
  startDate?: Date | undefined;
};

const dateConfig = {
  mode: "single",
  defaultMonth: new Date(),
  disabled: { before: new Date() },
  fromDate: new Date(),
} as DayPickerProps;

const CloneModal: React.FC<Props> = ({ show, callback, data }) => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: { startDate: new Date() },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onClose = () => {
    callback({ action: "close" });
  };

  const onSubmit = handleSubmit(async (vals) => {
    setIsSubmitting(true);

    const res = await PosService.cloneDeliveryTimeSlot({
      targetDate: vals.startDate,
    });

    setIsSubmitting(false);

    if (res.statusCode === 200) {
      callback({ action: "submit", data: { ...vals, source: data } });
    } else {
      appToast.show({
        msg: res.data.message || t("failedToCloneDeliverySlot"),
        color: "error",
      });
    }
  });

  return (
    <AppModal show={show} callback={onClose} className="offcanvas-modal">
      <AppModal.Title onClose={onClose} noShadow>
        {t("cloneDeliverySlot")}
        <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
          {t("cloneDeliverySlotDescription")}
        </div>
      </AppModal.Title>

      <AppModal.Content className="modal-bg">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="tw:grid tw:grid-cols-1 tw:gap-4">
            <Controller
              control={control}
              name="startDate"
              render={({ field }) => (
                <AppDateInput
                  label={t("startDate")}
                  placeholder={t("selectStartDate")}
                  dateConfig={dateConfig}
                  callback={(dt) => {
                    // AppDateInput returns Date | Date[]; ensure single Date
                    if (Array.isArray(dt)) {
                      field.onChange(dt[0]);
                    } else {
                      field.onChange(dt as Date | undefined);
                    }
                  }}
                  value={field.value}
                  size="sm"
                  isRequired
                />
              )}
            />
          </div>
        </form>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2 tw:w-full">
          <AppButton fill="outline" color="light" onClick={onClose}>
            {t("close")}
          </AppButton>
          <AppButton
            color="primary"
            onClick={onSubmit as any}
            isLoading={isSubmitting}
          >
            {t("submit")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default CloneModal;
