import { sub } from "date-fns";
import { orderBy } from "lodash";
import { useCallback, useEffect } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppSelect } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import AccountService from "~/services/AccountService";
import { defaultFilter } from "../helper";

type Props = {
  show: boolean;
  callback: (a: { data: any; action: string }) => void;
  data: Record<string, any>;
};

const sourceTypes = orderBy(
  AccountService.getSourceTypeOptions(),
  ["langKey"],
  ["asc"]
);
sourceTypes.unshift({ label: "All", value: "All", langKey: "all" });
const filteredSourceTypes = sourceTypes.filter(
  (st) => st.value !== "PO_CHARGE"
);

const FilterModal = ({ show, callback, data }: Props) => {
  const { t } = useTranslation();

  const getTypeOptions = (t: any) => [
    { label: t("all"), value: "All" },
    { label: t("credit"), value: "credit" },
    { label: t("debit"), value: "debit" },
  ];

  const typeOptions = getTypeOptions(t);

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

            <div className="tw:grid tw:grid-cols-2 tw:gap-4">
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <AppSelect
                    options={typeOptions}
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    placeholder={t("selectType")}
                    inputClassName="tw:w-full"
                    label={t("type")}
                  />
                )}
              />

              <Controller
                control={control}
                name="sourceType"
                render={({ field }) => (
                  <AppSelect
                    options={filteredSourceTypes}
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    placeholder={t("selectSourceType")}
                    inputClassName="tw:w-full"
                    label={t("sourceTypeLbl")}
                  />
                )}
              />
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
};

export default FilterModal;
