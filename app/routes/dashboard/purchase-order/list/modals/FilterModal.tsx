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
import PurchaseOrderService from "~/services/PurchaseOrderService";

// Filter values owned by the modal — `search` stays on the inline filter bar.
export const defaultFilterValues = {
  dateRange: [] as Date[],
  status: "All",
  source: "All",
};

type Props = {
  show: boolean;
  callback: (a: { data: any; action: string }) => void;
  data: Record<string, any>;
  hideStatus?: boolean;
  hideSource?: boolean;
};

const FilterModal = ({
  show,
  callback,
  data,
  hideStatus,
  hideSource,
}: Props) => {
  const { t } = useTranslation(["common"]);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: { ...defaultFilterValues },
  });

  const statusOptions = PurchaseOrderService.getStatuses()
    .map((x) => ({ value: x.value, label: x.label }))
    .sort((a, b) => a.label.localeCompare(b.label));
  statusOptions.unshift({ value: "All", label: t("allStatus") });

  const sourceOptions = PurchaseOrderService.getSourceTypes()
    .map((x) => ({ value: x.value, label: x.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  sourceOptions.unshift({ value: "All", label: t("all") });

  useEffect(() => {
    if (show) {
      reset({ ...defaultFilterValues, ...data });
    }
  }, [show, reset, data]);

  const onSubmit = useCallback(
    (formData: any) => {
      callback({ data: formData, action: "apply" });
    },
    [callback]
  );

  const handleReset = useCallback(() => {
    reset({ ...defaultFilterValues });
  }, [reset]);

  const handleClose = () => {
    callback({ data: defaultFilterValues, action: "close" });
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
                  placeholder={t("filterByDateRange")}
                  label={t("dateRange")}
                />
              )}
            />

            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
              {!hideStatus && (
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <AppSelect
                      options={statusOptions}
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      placeholder={t("filterByStatus")}
                      inputClassName="tw:w-full"
                      label={t("status")}
                    />
                  )}
                />
              )}

              {!hideSource && (
                <Controller
                  control={control}
                  name="source"
                  render={({ field }) => (
                    <AppSelect
                      options={sourceOptions}
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      placeholder={t("selectType")}
                      inputClassName="tw:w-full"
                      label={t("type")}
                    />
                  )}
                />
              )}
            </div>
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
