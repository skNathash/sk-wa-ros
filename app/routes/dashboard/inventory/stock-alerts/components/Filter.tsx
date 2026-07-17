import { useForm, Controller, useWatch } from "react-hook-form";
import { useCallback } from "react";
import { debounce } from "lodash";
import { AppInput } from "~/components/core/form/AppInput";
import CategorySearchInput from "~/components/feature/search-input/category/CategorySearchInput";
import { AppSelect } from "~/components/core/form/AppSelect";
import Alpha from "~/components/core/alpha/Alpha";

interface FilterFormData {
  search: string;
  category: any;
  type: string;
  alpha?: string;
}

interface FilterProps {
  onFilterChange: (filters: { formData: FilterFormData }) => void;
  className?: string;
}

const typeOptions = [
  { value: "All", label: "All Types" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "low_stock", label: "Low Stock" },
  { value: "slow_moving", label: "Slow Moving" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "overstock", label: "Overstock" },
];

const Filter = ({ onFilterChange, className }: FilterProps) => {
  const { control, setValue, getValues, register } = useForm<FilterFormData>({
    defaultValues: {
      search: "",
      category: null,
      type: "",
      alpha: "",
    },
  });

  // Watch form values for changes using array destructuring
  const [category, alpha] = useWatch({
    control,
    name: ["category", "alpha"],
  });

  // Trigger callback function
  const triggerCallback = () => {
    onFilterChange({ formData: getValues() });
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback]
  );

  // Handle category selection
  const handleCategoryChange = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("category", item);
    } else {
      setValue("category", null);
    }
    triggerCallback();
  };

  // Handle type change
  const handleTypeChange = (chngFn: any) => (value: string) => {
    chngFn(value);
    triggerCallback();
  };

  // Handle alpha selection
  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback();
  };

  return (
    <div className={`tw:space-y-4 ${className || ""}`}>
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:gap-4">
        {/* Search Input */}
        <AppInput
          name="search"
          placeholder="Search by name, ID"
          register={register}
          onChange={debouncedSearch}
          className="tw:col-span-2 tw:md:col-span-1"
        />

        {/* Category Search */}

        <div>
          <CategorySearchInput
            multiSelect={false}
            callback={handleCategoryChange}
            values={category ? [category] : []}
            feature="product"
            placeholder="Search categories..."
            size="sm"
          />
        </div>

        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <AppSelect
              options={typeOptions}
              placeholder="Select type"
              onChange={handleTypeChange(field.onChange)}
              value={field.value}
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>
    </div>
  );
};

export default Filter;
