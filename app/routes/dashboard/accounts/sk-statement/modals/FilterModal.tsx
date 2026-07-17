import React, { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { DayPickerProps } from "react-day-picker";
import { useTranslation } from "react-i18next";
import { sub } from "date-fns";
import AppModal from "~/components/core/modal/AppModal";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppSelect } from "~/components/core/form";
import AppButton from "~/components/core/button/AppButton";
import { defaultFilter, type FilterFormData } from "../helper";

type Props = {
  show: boolean;
  callback: (a: { data: any; action: string }) => void;
  data: Record<string, any>;
};

const payoutTypeOptions = [
  { value: "all", label: "All Entry" },
  { value: "Credit", label: "Credit" },
  { value: "Debit", label: "Debit" },
];

const FilterModal = ({ show, callback, data }: Props) => {
  const { t } = useTranslation();

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { ...defaultFilter },
  });

  useEffect(() => {
    if (show) {
      reset({ ...defaultFilter, ...data });
    }
  }, [show, reset, data]);

  const onSubmit = useCallback(
    (data: any) => {
      callback({ data, action: "apply" });
    },
    [callback]
  );

  const handleReset = useCallback(() => {
    reset({ ...defaultFilter });
    callback({ data: defaultFilter, action: "reset" });
  }, [reset, callback]);

  const handleClose = () => {
    callback({ data: defaultFilter, action: "close" });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">{t("filters")}</div>
      </AppModal.Title>
      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="tw:grid tw:grid-cols-1 tw:gap-4">
            {/* <Controller
              control={control}
              name="dateRange"
              render={({ field }) => (
                <AppDateInput
                  callback={(v) => field.onChange(Array.isArray(v) ? v : [v])}
                  value={field.value}
                  dateConfig={dateConfig}
                  size="sm"
                  placeholder={t("selectDateRange")}
                  hideClose={true}
                  label={t("dateRange")}
                />
              )}
            /> */}

            <Controller
              control={control}
              name="payoutType"
              render={({ field }) => (
                <AppSelect
                  options={payoutTypeOptions}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  placeholder={t("allEntry")}
                  inputClassName="tw:w-full"
                  label={t("entry")}
                />
              )}
            />
          </div>
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:w-full tw:justify-end tw:gap-2">
          <AppButton
            onClick={handleReset}
            color="light"
            fill="outline"
            size="small"
          >
            {t("reset")}
          </AppButton>
          <AppButton
            onClick={handleSubmit(onSubmit)}
            color="primary"
            size="small"
          >
            {t("apply")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
};

export default FilterModal;
