import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form";
import type { FilterFormData } from "../helper";

type Props = {
  callback: (a: { formData: FilterFormData }) => void;
};

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation(["common"]);

  const { register, getValues } = useForm<FilterFormData>({
    defaultValues: {
      search: "",
    },
  });

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleInput = debounce(() => {
    triggerCallback();
  }, 500);

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2 tw:mb-4">
      <AppInput
        name="search"
        register={register}
        onChange={handleInput}
        size="sm"
        placeholder={t("searchByNameMobile")}
        leftIcon={<Search size={16} className="tw:text-gray-500" />}
      />
    </div>
  );
};

export default Filter;
