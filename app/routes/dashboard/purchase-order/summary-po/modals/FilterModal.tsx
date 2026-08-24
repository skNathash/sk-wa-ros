import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppSelect } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import PurchaseOrderService from "~/services/PurchaseOrderService";

interface FilterModalProps {
  show: boolean;
  data: { status: string };
  callback: (payload: { action: string; data?: any }) => void;
}

const statusOptions = PurchaseOrderService.getStatuses()
  .map((x) => ({
    value: x.value,
    label: x.label,
    langKey: x.langKey,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));
statusOptions.unshift({
  value: "All",
  label: "All Statuses",
  langKey: "allStatuses",
});

const FilterModal = ({ show, data, callback }: FilterModalProps) => {
  const { t } = useTranslation(["common"]);
  const { control, reset, getValues } = useForm({
    defaultValues: {
      status: "All",
    },
  });

  useEffect(() => {
    if (show && data) {
      reset(data);
    }
  }, [show, data, reset]);

  const handleApply = () => {
    const values = getValues();
    callback({ action: "apply", data: values });
  };

  const handleCancel = () => {
    callback({ action: "cancel" });
  };

  const handleReset = () => {
    reset({ status: "All" });
    handleApply();
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleCancel}>
        <div className="tw:font-semibold">{t("filter")}</div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:grid tw:grid-cols-1 tw:gap-4">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <AppSelect
                placeholder={t("filterByStatus")}
                value={field.value}
                onChange={field.onChange}
                options={statusOptions}
                size="sm"
                inputClassName="tw:w-full"
              />
            )}
          />
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton fill="outline" color="light" onClick={handleReset}>
            {t("reset")}
          </AppButton>
          <AppButton onClick={handleApply}>{t("apply")}</AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
