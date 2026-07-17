import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useCallback } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput, AppSelect } from "~/components/core/form";
import PaylaterService from "~/services/PaylaterService";

type Props = {
  callback: (a: { formData: any }) => void;
};

// Wallet status options
const walletStatusOptions = PaylaterService.getWalletStatusOptions().map(
  (option) => ({
    label: option.label,
    value: option.value,
  })
);
walletStatusOptions.unshift({ label: "All", value: "All" });
walletStatusOptions.push({ label: "Due Today", value: "DueToday" });
walletStatusOptions.push({ label: "Due Tomorrow", value: "DueTomorrow" });

// KYC status options
const kycOptions = [
  { label: "All", value: "All" },
  { label: "Approved", value: "Approved" },
  { label: "Pending", value: "Pending" },
  { label: "Rejected", value: "Rejected" },
];

const Filter = ({ callback }: Props) => {
  const { t } = useTranslation();
  const methods = useFormContext();
  const { register, getValues, control, setValue } = methods;

  const [alpha] = useWatch({ control, name: ["alpha"] });

  const handleInput = debounce(() => {
    setValue("alpha", "");
    triggerCallback();
  }, 500);

  const triggerCallback = useCallback(() => {
    callback({ formData: getValues() });
  }, [callback, getValues]);

  const handleStatusChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  const handleKycChange =
    (chngFrn: (value: string) => void) => (value: string) => {
      chngFrn(value);
      triggerCallback();
    };

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value);
    setValue("search", "");
    setValue("status", "");
    setValue("kycStatus", "");
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
            name="status"
            render={({ field }) => (
              <AppSelect
                options={walletStatusOptions}
                value={field.value}
                onChange={handleStatusChange(field.onChange)}
                size="sm"
                placeholder="Select status"
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
                onChange={handleKycChange(field.onChange)}
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
