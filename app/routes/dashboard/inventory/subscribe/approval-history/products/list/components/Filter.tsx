import { useForm, useWatch } from "react-hook-form";
import { useCallback, useState } from "react";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form/AppInput";
import AppButton from "~/components/core/button/AppButton";
import { FilterIcon } from "lucide-react";
import Alpha from "~/components/core/alpha/Alpha";
import FilterModal from "../modals/FilterModal";

interface FilterFormData {
  search: string;
  dateRange: Date[] | null;
  status: string;
  alpha?: string;
  isConsumerOffer?: boolean;
  category: any;
  brand: any;
}

interface FilterProps {
  callback: (filters: { formData: FilterFormData }) => void;
  className?: string;
}

const defaultFilterValues: FilterFormData = {
  search: "",
  dateRange: null,
  status: "",
  alpha: "",
  isConsumerOffer: false,
  category: null,
  brand: null,
};

const Filter = ({ callback, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const [filterModal, setFilterModal] = useState({
    show: false,
    data: { ...defaultFilterValues },
  });

  const { control, setValue, getValues, register } = useForm<FilterFormData>({
    defaultValues: { ...defaultFilterValues },
  });

  // Watch alpha value
  const alpha = useWatch({
    control,
    name: "alpha",
  });

  // Trigger callback function
  const triggerCallback = () => {
    callback({ formData: getValues() });
  };

  // Handle alpha selection
  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback();
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      setValue("alpha", "");
      triggerCallback();
    }, 500),
    [triggerCallback]
  );

  const openFilterModal = useCallback(() => {
    setFilterModal({ show: true, data: getValues() });
  }, [getValues]);

  const handleFilterModalCallback = useCallback(
    (data: any) => {
      setFilterModal({ show: false, data: { ...defaultFilterValues } });
      if (data.action === "apply") {
        setValue("dateRange", data.data.dateRange || null);
        setValue("status", data.data.status || "");
        setValue("isConsumerOffer", data.data.isConsumerOffer || false);
        setValue("category", data.data.category || null);
        setValue("brand", data.data.brand || null);
        // Use the data from modal directly to ensure we have the latest values
        callback({
          formData: { ...getValues(), ...data.data },
        });
      }
    },
    [setValue, getValues, callback]
  );

  return (
    <div className={`tw:space-y-4 ${className || ""}`}>
      {/* Search Input with Filter Button */}
      <div className="tw:w-full tw:flex tw:items-center tw:gap-2">
        <div className="tw:flex-1">
          <AppInput
            name="search"
            placeholder={t("searchByName")}
            register={register}
            onChange={debouncedSearch}
            className="tw:bg-white"
          />
        </div>
        <AppButton
          fill="outline"
          color="light"
          size="small"
          onClick={openFilterModal}
        >
          <FilterIcon size={16} />
        </AppButton>
      </div>

      {/* Alpha Navigation */}
      <Alpha selected={alpha || ""} callback={handleAlphaChange} />

      <FilterModal
        show={filterModal.show}
        callback={handleFilterModalCallback}
        data={filterModal.data}
      />
    </div>
  );
};

export default Filter;
