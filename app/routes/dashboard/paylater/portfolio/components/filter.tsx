import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppSelect } from "~/components/core/form";

type Props = {
  /** Hands the current form values back to the page, which owns the URL. */
  callback: (payload: { formData: any }) => void;
  className?: string;
};

const userTypeOptions = [
  { label: "All", value: "All" },
  { label: "B2C", value: "B2C" },
  { label: "B2B", value: "B2B" },
];

const Filter = ({ callback, className }: Props) => {
  const { t } = useTranslation();
  const { register, control, getValues } = useFormContext();

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  // Typing rewrites the URL, so hold off until the customer stops typing.
  const handleInput = useMemo(
    () => debounce(triggerCallback, 500),
    [triggerCallback],
  );

  const handleUserTypeChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  // Mobile keeps both controls on one row: search takes the slack, the type
  // select gets just enough width for its labels.
  return (
    <AppCard
      noPadding
      className={className}
      bodyClassName="tw:grid tw:grid-cols-[minmax(0,1fr)_6.5rem] tw:md:grid-cols-2 tw:gap-2 tw:md:gap-3 tw:p-2 tw:md:p-3"
    >
      <AppInput
        name="search"
        register={register}
        onChange={handleInput}
        size="sm"
        placeholder={t("searchByNameOrMobile")}
        leftIcon={<Search size={16} className="tw:text-gray-500" />}
      />

      <Controller
        control={control}
        name="userType"
        render={({ field }) => (
          <AppSelect
            options={userTypeOptions}
            value={field.value}
            onChange={handleUserTypeChange(field.onChange)}
            size="sm"
            placeholder={t("type")}
            inputClassName="tw:w-full"
          />
        )}
      />
    </AppCard>
  );
};

export default Filter;
