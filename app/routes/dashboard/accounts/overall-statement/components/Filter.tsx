import { debounce } from "lodash";
import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form";
import { SearchIcon } from "lucide-react";

interface FilterProps {
  /** Apply the current form values to the URL (debounced search / filters). */
  onFilterChange: () => void;
}

const Filter = ({ onFilterChange }: FilterProps) => {
  const { t } = useTranslation();
  const { register } = useFormContext();

  const debounceSearch = useCallback(
    debounce(() => {
      onFilterChange();
    }, 500),
    [onFilterChange],
  );

  return (
    <AppInput
      name="search"
      register={register}
      onChange={debounceSearch}
      placeholder={t("searchRefNoVendor")}
      className="statement-search"
      leftIcon={<SearchIcon size={16} className="tw:text-gray-500" />}
      inputClassName="tw:placeholder:text-xs tw:placeholder:md:text-sm"
    />
  );
};

export default Filter;
