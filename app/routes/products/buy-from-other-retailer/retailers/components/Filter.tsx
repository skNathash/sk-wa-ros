import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput } from "~/components/core/form/AppInput";
import DistanceChooser from "../../products/components/DistanceChooser";

interface FilterFormData {
  search: string;
  alpha: string;
}

interface FilterProps {
  callback: (a: { action: string; formData: FilterFormData }) => void;
  className?: string;
}

const Filter = ({ callback, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { register, control, getValues, setValue } =
    useFormContext<FilterFormData>();

  const [alpha] = useWatch({
    control,
    name: ["alpha"],
  });

  // trigger stable callback
  const triggerCallback = () => {
    callback({ action: "apply", formData: getValues() });
  };

  // debounced search to avoid frequent calls
  const debouncedSearch = debounce(() => {
    triggerCallback();
  }, 500);

  const handleSearchChange = () => {
    debouncedSearch();
  };

  // Handle alpha selection
  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    triggerCallback();
  };

  return (
    <div className={`tw:space-y-3 ${className || ""}`}>
      <div className="tw:flex tw:items-center tw:gap-2">
        <AppInput
          name="search"
          placeholder={"Search by name, ID or phone"}
          register={register}
          onChange={handleSearchChange}
          className="tw:flex-1"
          leftIcon={<Search className="tw:text-gray-500" size={16} />}
          size="sm"
        />

        <div>
          <DistanceChooser />
        </div>
      </div>

      {/* Alpha navigation — horizontal strip on desktop; mobile uses the
          sticky vertical alpha rail rendered beside the list. */}
      <div className="tw:mt-3 tw:hidden md:tw:block">
        <Alpha selected={alpha || ""} callback={handleAlphaChange} />
      </div>
    </div>
  );
};

export default Filter;
