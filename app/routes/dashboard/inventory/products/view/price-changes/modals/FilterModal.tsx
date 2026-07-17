import { useEffect } from "react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppCheckbox } from "~/components/core/form/AppCheckbox";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppSelect } from "~/components/core/form/AppSelect";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { sub } from "date-fns";
import MiscService from "~/services/MiscService";

interface FilterModalProps {
  show: boolean;
  callback: (a: { action: string; data: any }) => void;
  data: any;
}

const typeOptions = [
  { label: "All", value: "All", langKey: "all" },
  { label: "B2B", value: "B2B", langKey: "B2B" },
  { label: "B2C", value: "B2C", langKey: "B2C" },
];

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { years: 10 }),
  numberOfMonths: MiscService.isMobile() ? 1 : 2,
};

const FilterModal = ({ show, callback, data }: FilterModalProps) => {
  const { t } = useTranslation(["common"]);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      type: data?.type || "All",
      isFixedPrice: data?.isFixedPrice || false,
      dateRange: data?.dateRange || undefined,
    },
  });

  // Update form when data prop changes or modal opens
  useEffect(() => {
    if (show) {
      reset({
        type: data?.type || "All",
        isFixedPrice: data?.isFixedPrice || false,
        dateRange: data?.dateRange || undefined,
      });
    }
  }, [show, data, reset]);

  const onSubmit = (formData: any) => {
    callback({ action: "apply", data: formData });
  };

  const onReset = () => {
    const defaultValues = {
      type: "All",
      isFixedPrice: false,
      dateRange: undefined,
    };
    reset(defaultValues);
    callback({ action: "apply", data: defaultValues });
  };

  const handleClose = () => {
    callback({ action: "close", data: {} });
  };

  return (
    <AppModal show={show} callback={callback} className="tw:max-w-md">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:text-lg tw:font-semibold">{t("filter")}</span>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <form>
          <div className="tw:grid tw:grid-cols-3 tw:items-end tw:gap-4 tw:mb-4">
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <AppSelect
                  label={t("type")}
                  options={typeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  size="sm"
                  placeholder={t("selectType")}
                  inputClassName="tw:w-full tw:rounded-lg tw:border-gray-200"
                />
              )}
            />

            <Controller
              name="dateRange"
              control={control}
              render={({ field }) => (
                <AppDateInput
                  label={t("dateRange")}
                  value={field.value}
                  callback={field.onChange}
                  placeholder={t("selectDateRange")}
                  size="sm"
                  dateConfig={dateConfig}
                  className="tw:w-full tw:col-span-2"
                />
              )}
            />
          </div>
          <Controller
            name="isFixedPrice"
            control={control}
            render={({ field }) => (
              <AppCheckbox
                label="Fixed Price"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </form>
      </AppModal.Content>

      <AppModal.Footer className="tw:grid tw:grid-cols-2 tw:gap-3 tw:pt-0">
        <AppButton fill="outline" className="tw:w-full" onClick={onReset}>
          {t("reset")}
        </AppButton>
        <AppButton className="tw:w-full" onClick={handleSubmit(onSubmit)}>
          {t("apply")}
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
