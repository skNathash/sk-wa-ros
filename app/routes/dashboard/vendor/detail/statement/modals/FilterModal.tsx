import { SlidersHorizontal } from "lucide-react";
import { useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppSelect } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import { type FilterFormData } from "../helper";

type Props = {
  show: boolean;
  onClose: () => void;
  callback: (args: { action: string; data: FilterFormData }) => void;
};

const typeOptions = [
  { label: "All", value: "All" },
  { label: "Credit", value: "credit" },
  { label: "Debit", value: "debit" },
];

const FilterModal = ({ show, onClose, callback }: Props) => {
  const { t } = useTranslation(["common"]);
  const { control, setValue, getValues } = useFormContext<FilterFormData>();

  const handleApply = useCallback(() => {
    callback({ action: "apply", data: getValues() });
    onClose();
  }, [callback, getValues, onClose]);

  const handleReset = useCallback(() => {
    setValue("type", "All");
    callback({ action: "reset", data: getValues() });
    onClose();
  }, [setValue, callback, getValues, onClose]);

  const handleTypeChange = useCallback(
    (value: string) => {
      setValue("type", value);
    },
    [setValue],
  );

  return (
    <AppModal show={show} callback={({ action }) => action === "close" && onClose()}>
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <SlidersHorizontal className="tw:w-5 tw:h-5" />
          <span className="tw:font-semibold">{t("filters")}</span>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-4">
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <AppSelect
                label={t("type")}
                options={typeOptions}
                value={field.value}
                onChange={handleTypeChange}
                size="sm"
                placeholder={t("selectType")}
                inputClassName="tw:w-full"
              />
            )}
          />
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:w-full tw:justify-end tw:gap-2">
          <AppButton
            fill="outline"
            color="dark"
            size="small"
            onClick={handleReset}
          >
            {t("reset")}
          </AppButton>
          <AppButton size="small" onClick={handleApply}>
            {t("apply")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default FilterModal;
