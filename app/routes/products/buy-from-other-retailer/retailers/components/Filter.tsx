import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
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

const distanceOptions = [
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
  { value: "25", label: "25 km" },
  { value: "50", label: "50 km" },
  { value: "100", label: "100 km" },
];

const Filter = ({ callback, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);

  const { register, control, getValues, setValue } = useForm<FilterFormData>({
    defaultValues: { search: "", alpha: "" },
  });

  const [alpha] = useWatch({
    control,
    name: ["alpha"],
  });

  // trigger stable callback
  const triggerCallback = useCallback(() => {
    callback({ action: "apply", formData: getValues() });
  }, [callback, getValues]);

  // debounced search to avoid frequent calls
  const debouncedSearch = useCallback(
    debounce(() => {
      triggerCallback();
    }, 500),
    [triggerCallback],
  );

  const handleSearchChange = (e: any) => {
    debouncedSearch();
  };

  const handleDistanceChange = (chngFn: any) => (v: string) => {
    chngFn(v);
    triggerCallback();
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

      {/* Alpha navigation - quick A-Z filter */}
      <div className="tw:mt-3">
        <Alpha selected={alpha || ""} callback={handleAlphaChange} />
      </div>
    </div>
  );
};

export default Filter;
