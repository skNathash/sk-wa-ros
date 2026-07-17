import { useCallback, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form/AppInput";
import { Button } from "~/components/ui/button";
import { Filter as FilterIcon, Search } from "lucide-react";
import AppliedFilters from "./AppliedFilters";
import FilterModal from "../modals/FilterModal";

interface FilterFormData {
  search: string;
  type: string;
  isFixedPrice: boolean;
  dateRange: Date[] | undefined;
}

interface FilterProps {
  callback: (filters: { formData: FilterFormData }) => void;
}

const Filter = ({ callback }: FilterProps) => {
  const { t } = useTranslation(["common"]);
  const [filterModal, setFilterModal] = useState({
    show: false,
    data: {
      type: "All",
      isFixedPrice: false,
      dateRange: undefined,
    } as FilterFormData,
  });

  const { register, getValues, setValue, control } = useForm<FilterFormData>({
    defaultValues: {
      search: "",
      type: "All",
      isFixedPrice: false,
      dateRange: undefined,
    },
  });

  const watchedFilters = useWatch({ control });

  // Debounced callback for search
  const debouncedCallback = useCallback(
    debounce(() => {
      callback({ formData: getValues() });
    }, 500),
    [callback, getValues]
  );

  // Handle search input change
  const handleSearchChange = () => {
    debouncedCallback();
  };

  const handleRemoveFilter = useCallback(
    (key: string) => {
      const resetValues: Record<string, any> = {
        search: "",
        type: "All",
        isFixedPrice: false,
        dateRange: undefined,
      };
      setValue(key as keyof FilterFormData, resetValues[key]);
      callback({ formData: getValues() });
    },
    [setValue, getValues, callback]
  );

  const handleModalCallback = (payload: { action: string; data: any }) => {
    if (payload.action === "apply") {
      const data = payload.data;
      // Sync form values
      setValue("type", data.type);
      setValue("isFixedPrice", data.isFixedPrice);
      setValue("dateRange", data.dateRange);

      callback({ formData: getValues() });
      setFilterModal({ show: false, data });
    } else if (payload.action === "close") {
      setFilterModal((prev) => ({ ...prev, show: false }));
    }
  };

  return (
    <div>
      <div className="tw:flex tw:items-center tw:gap-3 tw:mb-4">
        <div className="tw:flex-1">
          <AppInput
            name="search"
            placeholder={t("searchPlaceholder")}
            register={register}
            onChange={handleSearchChange}
            size="sm"
            className="tw:w-full"
            leftIcon={<Search size={16} className="tw:text-gray-500" />}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="tw:flex tw:items-center tw:gap-2 tw:h-9 tw:px-4 tw:border-gray-200 tw:hover:tw:bg-gray-50 tw:text-gray-600"
          onClick={() => setFilterModal({ show: true, data: getValues() })}
        >
          <FilterIcon className="tw:w-4 tw:h-4" />
        </Button>

        <FilterModal
          show={filterModal.show}
          callback={handleModalCallback}
          data={filterModal.data}
        />
      </div>
      <AppliedFilters filters={watchedFilters} onRemove={handleRemoveFilter} />
    </div>
  );
};

export default Filter;
