import { ChevronRight, Building } from "lucide-react";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppSelect } from "~/components/core/form";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import { validateStoreDetails } from "../helper";
import CommonService from "~/services/CommonService";

const monthlyTurnoverOptions = CommonService.getMonthyTurnoverOptions();
monthlyTurnoverOptions.unshift({
  label: "Select Monthly Turnover",
  value: "choose",
  langKey: "selectMonthlyTurnover",
});

const yearsOfExperienceOptions = CommonService.getYearsOfExperienceOptions();
yearsOfExperienceOptions.unshift({
  label: "Select Years of Experience",
  value: "choose",
  langKey: "selectYearsOfExperience",
});

const StoreDetails = ({
  setActiveStep,
  primaryBusinessOptions = [],
}: {
  setActiveStep: (step: number) => void;
  primaryBusinessOptions?: any[];
}) => {
  const { t } = useTranslation(["common"]);
  const { register, control, getValues, setValue } = useFormContext();
  const appToast = useAppToast();

  const [checking, setChecking] = useState(false);

  const [loadingBusinessTypes, setLoadingBusinessTypes] = useState(false);

  const handleNext = async () => {
    const formData = getValues();
    const { msg, status } = validateStoreDetails(formData);
    if (!status) {
      appToast.show({
        msg: t(msg),
        color: "danger",
      });
      return;
    }

    try {
      setChecking(true);

      const mobileVal = String(formData.mobile || "").replace(/[^0-9]/g, "");
      const mobileNum = mobileVal ? parseInt(mobileVal, 10) : undefined;

      // Check if mobile number already exists
      const checkResp = await FranchiseService.searchFranchise({
        mobile: mobileNum,
      });

      if (checkResp?.statusCode === 200 && checkResp?.data?.exists) {
        appToast.show({ msg: t("mobileNumberAlreadyExists"), color: "danger" });
        setChecking(false);
        return;
      }

      setActiveStep(1);
    } catch (error: any) {
      console.error("Error checking mobile number:", error);
      appToast.show({
        msg: error?.response?.data?.message || t("somethingWentWrong"),
        color: "danger",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(
      "mobile",
      typeof value === "string" ? value.replace(/[^0-9]/g, "") : "",
    );
  };

  return (
    <AppCard title={t("storeDetails")} icon={<Building />}>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-4">
        {/* mobile */}
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

        {/* store name */}
        <AppInput
          name="storeName"
          register={register}
          label={t("storeName")}
          placeholder={t("enterStoreName")}
          isRequired={true}
        />
      </div>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 tw:mb-4">
        {/* owner name */}
        <AppInput
          name="ownerName"
          register={register}
          label={t("ownerName")}
          placeholder={t("enterOwnerName")}
          isRequired={true}
        />

        {/* primary business */}
        <Controller
          name="primaryBusiness"
          control={control}
          render={({ field }) => (
            <AppSelect
              loading={loadingBusinessTypes}
              label={t("primaryBusiness")}
              options={primaryBusinessOptions}
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

        {/* monthly turnover */}
        <Controller
          name="monthlyTurnover"
          control={control}
          render={({ field }) => (
            <AppSelect
              label={t("monthlyTurnover")}
              options={monthlyTurnoverOptions}
              placeholder={t("selectMonthlyTurnover")}
              onChange={field.onChange}
              value={field.value}
              isRequired={true}
              inputClassName="tw:w-full"
            />
          )}
        />

        {/* years of experience */}
        <Controller
          name="yearsOfExperience"
          control={control}
          render={({ field }) => (
            <AppSelect
              label={t("yearsOfExperience")}
              options={yearsOfExperienceOptions}
              placeholder={t("selectYearsOfExperience")}
              onChange={field.onChange}
              value={field.value}
              isRequired={true}
              inputClassName="tw:w-full"
            />
          )}
        />
      </div>

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <AppInput
          name="email"
          register={register}
          label={t("email")}
          placeholder={t("enterEmail")}
          isRequired={false}
          type="email"
        />
      </div>

      <div className="tw:text-end tw:mt-6">
        <AppButton
          color="primary"
          onClick={handleNext}
          isLoading={checking}
          disabled={checking}
        >
          {t("next")}
          <ChevronRight />
        </AppButton>
      </div>
    </AppCard>
  );
};

export default StoreDetails;
