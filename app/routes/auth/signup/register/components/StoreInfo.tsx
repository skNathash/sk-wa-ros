import { AppInput, AppSelect } from "~/components/core/form";
import InpBlock from "./InpBlock";
import { useFormContext, Controller } from "react-hook-form";
import { useMemo } from "react";
import FranchiseService from "~/services/FranchiseService";
import { Clock, Store } from "lucide-react";
import { useTranslation } from "react-i18next";

const StoreInfo = () => {
  const { register, setValue, getValues, control } = useFormContext();
  const { t } = useTranslation(["signup"]);

  const timeOptions = useMemo(() => FranchiseService.generateTimeOptions(), []);

  const handleStoreNameChange = () => {
    const value = getValues("storeName");
    setValue("storeName", value.replace(/[^A-z\.\s]/g, ""));
  };

  return (
    <InpBlock
      className="tw:h-full"
      title={t("register.store.title")}
      icon={<Store size={20} />}
    >
      <div className="tw:flex tw:flex-col tw:gap-6">
        <AppInput
          name="storeName"
          register={register}
          label={t("register.store.storeName.label")}
          placeholder={t("register.store.storeName.placeholder")}
          isRequired={true}
          onChange={handleStoreNameChange}
        />

        <AppInput
          name="doorNo"
          register={register}
          label={t("register.store.doorNo.label")}
          placeholder={t("register.store.doorNo.placeholder")}
          isRequired={true}
        />

        <div>
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
            <Clock className="tw:text-app-primary" size={16} />
            <div className="tw:font-semibold">
              {t("register.store.timings.title")}
            </div>
          </div>
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
            <Controller
              name="storeOpenTime"
              control={control}
              render={({ field }) => (
                <AppSelect
                  label={t("register.store.timings.openTime.label")}
                  options={timeOptions}
                  placeholder={t("register.store.timings.openTime.placeholder")}
                  onChange={field.onChange}
                  value={field.value}
                  isRequired={true}
                  inputClassName="tw:w-full"
                />
              )}
            />
            <Controller
              name="storeCloseTime"
              control={control}
              render={({ field }) => (
                <AppSelect
                  label={t("register.store.timings.closeTime.label")}
                  options={timeOptions}
                  placeholder={t(
                    "register.store.timings.closeTime.placeholder"
                  )}
                  onChange={field.onChange}
                  value={field.value}
                  isRequired={true}
                  inputClassName="tw:w-full"
                />
              )}
            />
          </div>
        </div>
      </div>
    </InpBlock>
  );
};

export default StoreInfo;
