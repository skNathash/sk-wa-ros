import debounce from "lodash/debounce";
import { Search } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form";

interface FilterProps {
  onFilterChange: (value: any) => void;
  className?: string;
  feature?: string;
}

const Filter = ({ onFilterChange, className }: FilterProps) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues } = useFormContext();

  // Debounced search
  const debouncedSearch = debounce(() => {
    triggerCallback();
  }, 500);

  const handleSearchChange = () => {
    debouncedSearch();
  };

  const triggerCallback = () => {
    const vals = getValues();
    onFilterChange({ ...vals });
  };

  return (
    <div className={`tw:flex tw:flex-col tw:gap-4 ${className || ""}`}>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-3">
        <AppInput
          name="search"
          placeholder={t("searchByBoxOrderInvoiceVendor")}
          register={register}
          onChange={handleSearchChange}
          size="sm"
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
        />
      </div>
    </div>
  );
};

export default Filter;
