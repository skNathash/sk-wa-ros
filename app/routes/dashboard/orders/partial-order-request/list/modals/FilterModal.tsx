import { sub } from "date-fns";
import { useCallback, useEffect } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppModal from "~/components/core/modal/AppModal";
import MiscService from "~/services/MiscService";
import { defaultFilter } from "../helper";

type Props = {
  show: boolean;
  callback: (a: { data: any; action: string }) => void;
  initialData: Record<string, any>;
};

const statusOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
  { label: "Approval Pending", value: "Pending" },
];

const FilterModal = ({ show, callback, initialData }: Props) => {
  const { t } = useTranslation(["common"]);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { ...defaultFilter, ...initialData },
  });

  useEffect(() => {
    if (show) {
      reset({ ...defaultFilter, ...initialData });
    }
  }, [show, reset, initialData]);

  const onSubmit = useCallback(
    (data: any) => {
      callback({ data, action: "apply" });
    },
    [callback],
  );

  const handleReset = useCallback(() => {
    reset({ ...defaultFilter });
  }, [reset]);

  const handleClose = () => {
    callback({ data: initialData, action: "close" });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">{t("filters")}</div>
      </AppModal.Title>
      <AppModal.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="tw:grid tw:grid-cols-1 tw:gap-4">
            <Controller
              control={control}
              name="dateRange"
              render={({ field }) => (
                <AppDateInput
                  callback={(v) => field.onChange(Array.isArray(v) ? v : [v])}
                  value={field.value}
                  dateConfig={dateConfig}
                  size="sm"
                  placeholder={t("selectDate")}
                  label="Date Range"
                />
              )}
            />

            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <AppSelect
                  options={statusOptions}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  placeholder={t("selectStatus")}
                  inputClassName="tw:w-full"
                  label="Status"
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
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

export default FilterModal;
