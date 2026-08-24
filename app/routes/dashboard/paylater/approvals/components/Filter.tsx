import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useCallback } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput, AppSelect } from "~/components/core/form";
import type { ApprovalFilterFormData } from "../helper";

type Props = {
  callback: (a: { formData: ApprovalFilterFormData }) => void;
};

// The queue is pinned to Pending, so the only slicing left is who the request
// came from and how far their KYC has got.
const userTypeOptions = [
  { label: "All", value: "all" },
  { label: "B2B", value: "b2b" },
  { label: "B2C", value: "b2c" },
];

const kycOptions = [
  { label: "All", value: "All" },
  { label: "Approved", value: "Approved" },
  { label: "Pending", value: "Pending" },
  { label: "Rejected", value: "Rejected" },
];

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation();

  const { register, getValues, control, setValue } =
    useFormContext<ApprovalFilterFormData>();

  const [alpha] = useWatch({ control, name: ["alpha"] });

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleInput = debounce(() => {
    setValue("alpha", "");
    triggerCallback();
  }, 500);

  const handleSelectChange =
    (onChange: (value: string) => void) => (value: string) => {
      onChange(value);
      triggerCallback();
    };

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    setValue("search", "");
    triggerCallback();
  };

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-4">
        <AppInput
          name="search"
          register={register}
          onChange={handleInput}
          size="sm"
          placeholder={t("searchByNameOrMobile")}
          leftIcon={<Search size={16} className="tw:text-gray-500" />}
        />

        <div className="tw:grid tw:grid-cols-2 tw:items-center tw:gap-2">
          <Controller
            control={control}
            name="userType"
            render={({ field }) => (
              <AppSelect
                options={userTypeOptions}
                value={field.value}
                onChange={handleSelectChange(field.onChange)}
                size="sm"
                placeholder="Customer type"
                inputClassName="tw:w-full"
              />
            )}
          />

          <Controller
            control={control}
            name="kycStatus"
            render={({ field }) => (
              <AppSelect
                options={kycOptions}
                value={field.value}
                onChange={handleSelectChange(field.onChange)}
                size="sm"
                placeholder={t("selectKycStatus")}
                inputClassName="tw:w-full"
              />
            )}
          />
        </div>
      </div>

      <Alpha
        callback={handleAlphaChange}
        selected={alpha}
        className="tw:my-4"
      />
    </>
  );
};

export default Filter;
