import debounce from "lodash/debounce";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AppInput } from "~/components/core/form";

type Props = {
  callback: (params: { formData: any; action: string }) => void;
};

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues } = useForm({
    defaultValues: {
      search: "",
    },
  });

  const debouncedSearch = debounce(() => {
    callback({ formData: { ...getValues() }, action: "apply" });
  }, 500);

  return (
    <div className="tw:mb-3">
      <AppInput
        name="search"
        placeholder={t("searchProducts", "Search products")}
        register={register}
        onChange={() => debouncedSearch()}
        size="sm"
        leftIcon={<Search className="tw:text-gray-400" size={16} />}
        className="tw:w-full"
      />
    </div>
  );
};

export default Filter;
