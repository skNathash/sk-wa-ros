import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import OmsService from "~/services/OmsService";
import type { DayPickerProps } from "react-day-picker";
import MiscService from "~/services/MiscService";
import { sub } from "date-fns";

interface FilterModalProps {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  data: {
    type: string;
    status: string;
    dateRange: any[];
  };
}

const dateConfig: DayPickerProps = {
  mode: "range" as const,
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const statusOptions = OmsService.getOrderStatuses().map((x) => ({
  label: x.name,
  value: x.value,
}));
statusOptions.unshift({
  label: "All Statuses",
  value: "All",
});

const types = [
  {
    label: "All Orders",
    value: "All",
    langKey: "allOrders",
  },
  {
    label: "B2B Orders",
    value: "B2B",
    langKey: "b2bOrders",
  },
  {
    label: "B2C Orders",
    value: "B2C",
    langKey: "b2cOrders",
  },
];

const FilterModal = ({ show, callback, data }: FilterModalProps) => {
  const { t } = useTranslation(["common"]);

  const { control, getValues, reset } = useForm({
    defaultValues: data,
  });

  const handleApply = () => {
    callback({ action: "apply", data: getValues() });
  };

  const handleReset = () => {
    reset();
    handleApply();
  };

  const handleCancel = () => {
    callback({ action: "cancel" });
  };

  const handleClose = () => {
    callback({ action: "cancel" });
  };

  // Reset form when data changes
  useEffect(() => {
    if (show) {
      reset(data);
    }
  }, [data, reset, show]);

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-md">
      <AppModal.Title onClose={handleClose}>{t("filter")}</AppModal.Title>
      <AppModal.Content>
        <div className="tw:space-y-4">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <AppSelect
                label={t("orderType")}
                options={types}
                value={field.value}
                onChange={field.onChange}
                inputClassName="tw:w-full"
              />
            )}
          />

          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <AppSelect
                label={t("status")}
                options={statusOptions}
                value={field.value}
                onChange={field.onChange}
                inputClassName="tw:w-full"
                placeholder={t("selectStatus")}
              />
            )}
          />

          <Controller
            control={control}
            name="dateRange"
            render={({ field }) => (
              <AppDateInput
                label={t("dateRange")}
                value={field.value}
                callback={field.onChange}
                dateConfig={dateConfig}
                placeholder={t("selectDateRange")}
              />
            )}
          />
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <AppButton fill="outline" onClick={handleReset}>
          {t("reset")}
        </AppButton>
        <AppButton onClick={handleApply}>{t("apply")}</AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
