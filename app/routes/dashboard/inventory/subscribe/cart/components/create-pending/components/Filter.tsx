import { debounce } from "lodash";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Search } from "lucide-react";
import { AppInput } from "~/components/core/form/AppInput";

interface FilterFormData {
  search: string;
}

interface FilterProps {
  callback: (filters: { formData: FilterFormData }) => void;
  className?: string;
}

const Filter = ({ callback, className }: FilterProps) => {
  const { getValues, register } = useForm<FilterFormData>({
    defaultValues: {
      search: "",
    },
  });

  // Trigger callback function
  const triggerCallback = () => {
    callback({ formData: getValues() });
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback],
  );

  return (
    <div className={className || ""}>
      <div className="tw:grid tw:gap-2 tw:grid-cols-1 tw:md:grid-cols-2 tw:max-w-2xl">
        {/* Search Input */}
        <div>
          <AppInput
            name="search"
            placeholder="Search by name or barcode..."
            register={register}
            onChange={debouncedSearch}
            className="tw:w-full tw:bg-white"
            size="sm"
            leftIcon={<Search size={16} className="tw:text-gray-500" />}
          />
        </div>
      </div>
    </div>
  );
};

export default Filter;
