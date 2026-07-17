import { useForm, useWatch } from "react-hook-form";
import { useCallback } from "react";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form/AppInput";
import { AppCheckbox } from "~/components/core/form";
import Alpha from "~/components/core/alpha/Alpha";

interface FilterFormData {
  search: string;
  alpha?: string;
  isConsumerOffer?: boolean;
}

interface FilterProps {
  callback: (filters: { formData: FilterFormData }) => void;
  className?: string;
}

const Filter = ({ callback, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { setValue, getValues, register, control } = useForm<FilterFormData>({
    defaultValues: {
      search: "",
      alpha: "",
      isConsumerOffer: false,
    },
  });

  // Watch form values for changes
  const [alpha] = useWatch({
    control,
    name: ["alpha"],
  });

  // Trigger callback function
  const triggerCallback = () => {
    callback({ formData: getValues() });
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      setValue("alpha", "");
      triggerCallback();
    }, 500),
    [triggerCallback]
  );

  // Handle alpha selection
  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback();
  };

  return (
    <div className={`tw:space-y-4 ${className || ""}`}>
      {/* Search Input */}
      <div className="tw:w-full tw:flex tw:gap-2 tw:flex-col">
        <AppInput
          name="search"
          placeholder={t("searchByName")}
          register={register}
          onChange={debouncedSearch}
          className="tw:w-full tw:bg-white"
        />

        <AppCheckbox
          label="Show consumer offers"
          value={getValues("isConsumerOffer")}
          onChange={(checked) => {
            setValue("isConsumerOffer", !!checked);
            triggerCallback();
          }}
          size="xs"
        />
      </div>

      {/* Alpha Navigation */}
      <Alpha
        selected={alpha || ""}
        callback={handleAlphaChange}
        className="tw:mb-4"
      />
    </div>
  );
};

export default Filter;
