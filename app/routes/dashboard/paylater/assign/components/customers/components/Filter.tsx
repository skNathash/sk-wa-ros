import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput } from "~/components/core/form";

type Props = {
  callback: (data: { formData: any }) => void;
};

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation();
  const { register, getValues, control, setValue } = useFormContext();

  const [alpha] = useWatch({ control, name: ["alpha"] });

  const handleInput = debounce(() => {
    setValue("alpha", "");
    triggerCallback();
  }, 500);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    setValue("search", "");
    triggerCallback();
  };

  return (
    <>
      <div className="tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder={t("searchByNameOrMobile", "Search by name or mobile...")}
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
        />
      </div>
      <Alpha
        callback={handleAlphaChange}
        selected={alpha}
        className="tw:mb-4"
      />
    </>
  );
};

export default Filter;
