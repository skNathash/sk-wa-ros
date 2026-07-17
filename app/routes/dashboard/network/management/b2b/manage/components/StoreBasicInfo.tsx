import { debounce, orderBy } from "lodash";
import { Store } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppSelect } from "~/components/core/form";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";

interface BusinessTypeOption {
  value: string;
  label: string;
}

const timeOptions = FranchiseService.generateTimeOptions();

const StoreBasicInfo = () => {
  const { t } = useTranslation(["common"]);
  const { register, control, setValue, getValues, watch } = useFormContext();
  const appToast = useAppToast();
  const [loadingBusinessTypes, setLoadingBusinessTypes] = useState(false);
  const [businessTypeOptions, setBusinessTypeOptions] = useState<
    BusinessTypeOption[]
  >([]);

  // Load business type data from API
  useEffect(() => {
    const loadBusinessTypes = async () => {
      setLoadingBusinessTypes(true);
      try {
        const response = await FranchiseService.getDocs("businessType");
        if (response && response.statusCode === 200 && response.data) {
          const options = orderBy(response.data, "name", "asc").map(
            (item: any) => ({
              value: item.name,
              label: item.name,
              langKey: item.name,
            })
          );
          setBusinessTypeOptions(options);
        } else {
          console.error("Failed to load business types:", response);
        }
      } catch (error) {
        console.error("Error loading business types:", error);
      } finally {
        setLoadingBusinessTypes(false);
      }
    };

    loadBusinessTypes();
  }, []);

  const handleStoreNameChange = () => {
    const value = getValues("storeName");
    setValue("storeName", value.replace(/[^A-z\.\s]/g, ""));
  };

  const debouncedCheck = useCallback(
    debounce(async (mobileVal: string) => {
      if (!CommonService.isValidMobileNo(mobileVal)) return;

      try {
        const resp = await FranchiseService.searchFranchise({
          mobile: parseInt(mobileVal, 10),
        });

        if (resp?.statusCode === 200 && resp?.data?.exists) {
          setValue("mobile", "");
          appToast.show({
            msg: t("mobileNumberAlreadyExists"),
            color: "danger",
          });
        }
      } catch (error) {
        console.error("Error checking mobile existence:", error);
      }
    }, 600),
    []
  );

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = CommonService.formatMobileNo(e.target.value || "");
    setValue("mobile", value);
    debouncedCheck(value);
  };

  const handleOwnerNameChange = () => {
    const value = getValues("ownerName");
    setValue("ownerName", value.replace(/[^A-z\.\s]/g, ""));
  };

  return (
    <AppCard
      title={t("storeBasicInformation")}
      subtitle={
        <div className="tw:text-xs">{t("provideStoreBasicInformation")}</div>
      }
      icon={<Store />}
    >
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mt-2">
        <AppInput
          name="mobile"
          register={register}
          label={t("mobileNumber")}
          placeholder={t("enterMobile")}
          isRequired={true}
          type="tel"
          maxLength={10}
          onChange={handleMobileChange}
        />

        <AppInput
          name="storeName"
          register={register}
          label={t("storeName")}
          placeholder={t("enterStoreName")}
          isRequired={true}
          onChange={handleStoreNameChange}
        />

        <AppInput
          name="ownerName"
          register={register}
          label={t("ownerName")}
          placeholder={t("enterOwnerName")}
          isRequired={true}
          onChange={handleOwnerNameChange}
        />

        <Controller
          name="primaryBusiness"
          control={control}
          render={({ field }) => (
            <AppSelect
              label={t("primaryBusiness")}
              options={businessTypeOptions}
              placeholder={
                loadingBusinessTypes ? t("loading") : t("selectPrimaryBusiness")
              }
              onChange={field.onChange}
              value={field.value}
              isRequired={true}
              inputClassName="tw:w-full"
            />
          )}
        />

        <AppInput
          name="gstNumber"
          register={register}
          label={t("gstNumber")}
          placeholder={t("enterGstNumber")}
        />

        <div>
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
            <Controller
              name="storeOpenTime"
              control={control}
              render={({ field }) => (
                <AppSelect
                  label={t("storeOpenTime")}
                  options={timeOptions}
                  placeholder={t("selectOpenTime")}
                  onChange={field.onChange}
                  value={field.value}
                  inputClassName="tw:w-full"
                />
              )}
            />
            <Controller
              name="storeCloseTime"
              control={control}
              render={({ field }) => (
                <AppSelect
                  label={t("storeCloseTime")}
                  options={timeOptions}
                  placeholder={t("selectCloseTime")}
                  onChange={field.onChange}
                  value={field.value}
                  inputClassName="tw:w-full"
                />
              )}
            />
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default StoreBasicInfo;
