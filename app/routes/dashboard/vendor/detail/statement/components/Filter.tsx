import { debounce } from "lodash";
import { SearchIcon, SlidersHorizontal } from "lucide-react";
import { useCallback, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { DayPickerProps } from "react-day-picker";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AccountService from "~/services/AccountService";
import { type FilterFormData } from "../helper";
import FilterModal from "../modals/FilterModal";

const dateConfig: DayPickerProps = {
  mode: "range",
  disabled: { after: new Date() },
  endMonth: new Date(),
  showOutsideDays: false,
};

const sourceTypeChips = [
  { label: "All", value: "All" },
  ...AccountService.getSourceTypeOptions(),
];

type FilterProps = {
  callback: (args: { action: string; data: FilterFormData }) => void;
};

const Filter = ({ callback }: FilterProps) => {
  const { register, getValues, setValue, control } =
    useFormContext<FilterFormData>();
  const [showModal, setShowModal] = useState(false);

  const activeSourceType =
    useWatch({ control, name: "sourceType" }) || "All";
  const typeValue = useWatch({ control, name: "type" });

  const hasAdvancedFilters = Boolean(typeValue && typeValue !== "All");

  // Inform the parent about the combined filter form data (search + chips +
  // modal filters). The form context is shared, so getValues() carries the
  // latest of every field.
  const notifyParent = useCallback(
    (action: string) => {
      callback({ action, data: getValues() });
    },
    [callback, getValues],
  );

  const debounceSearch = useCallback(
    debounce(() => {
      notifyParent("search");
    }, 500),
    [notifyParent],
  );

  const handleSourceTypeChip = (value: string) => {
    setValue("sourceType", value);
    notifyParent("sourceType");
  };

  const handleDateChange = useCallback(
    (value: Date | Date[]) => {
      setValue("dateRange", Array.isArray(value) ? value : [value]);
      notifyParent("dateRange");
    },
    [setValue, notifyParent],
  );

  // Forward the modal's form data up to the parent.
  const handleModalCallback = useCallback(
    (args: { action: string; data: FilterFormData }) => {
      callback(args);
    },
    [callback],
  );

  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      <div className="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-center">
        <AppInput
          name="search"
          register={register}
          onChange={debounceSearch}
          size="sm"
          placeholder="Search on Reference ID"
          className="tw:flex-1"
          leftIcon={<SearchIcon size={16} className="tw:text-gray-500" />}
        />

        <div className="tw:flex tw:items-center tw:gap-2">
          <Controller
            control={control}
            name="dateRange"
            render={({ field }) => (
              <AppDateInput
                callback={handleDateChange}
                value={field.value}
                dateConfig={dateConfig}
                placeholder="Date range"
                size="sm"
                className="tw:flex-1 tw:sm:w-56"
              />
            )}
          />

          <AppButton
            size="small"
            color="light"
            fill="outline"
            onClick={() => setShowModal(true)}
            className="tw:shrink-0"
          >
            <SlidersHorizontal className="tw:w-4 tw:h-4" />
            <span className="tw:hidden tw:sm:inline">More Filters</span>
            {hasAdvancedFilters && (
              <span className="tw:ml-1 tw:w-2 tw:h-2 tw:rounded-full tw:bg-primary" />
            )}
          </AppButton>
        </div>
      </div>

      {/* Source-type quick-filter chips */}
      <div className="hide-scrollbar tw:flex tw:items-center tw:gap-2 tw:overflow-x-auto">
        {sourceTypeChips.map((chip) => {
          const isActive = activeSourceType === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => handleSourceTypeChip(chip.value)}
              className={`tw:shrink-0 tw:rounded-full tw:border tw:px-3 tw:py-1 tw:text-xs tw:font-medium tw:transition-colors ${
                isActive
                  ? "tw:border-primary/25 tw:bg-primary/10 tw:text-primary"
                  : "tw:border-gray-300 tw:bg-white tw:text-gray-700 tw:hover:bg-gray-50"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <FilterModal
        show={showModal}
        onClose={() => setShowModal(false)}
        callback={handleModalCallback}
      />
    </div>
  );
};

export default Filter;
