import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppSelect } from "~/components/core/form";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import { validateStoreTimings } from "../helper";

const timeOptions = FranchiseService.generateTimeOptions();

const StoreTimings = ({
  setActiveStep,
}: {
  setActiveStep: (step: number) => void;
}) => {
  const { t } = useTranslation(["common"]);
  const { control, getValues, register } = useFormContext();
  const appToast = useAppToast();

  const handleNext = () => {
    const formData = getValues();
    const { msg, status } = validateStoreTimings(formData);
    if (!status) {
      appToast.show({
        msg: t(msg),
        color: "danger",
      });
      return;
    }
    setActiveStep(2);
  };

  return (
    <>
      <AppCard title={t("storeTimings")} icon={<Clock />}>
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-6">
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
                isRequired={true}
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
                isRequired={true}
              />
            )}
          />

          {/* gst number */}
          <AppInput
            name="gstNumber"
            register={register}
            label={t("gstNumber")}
            placeholder={t("enterGstNumber")}
          />
        </div>

        <div className="tw:flex tw:justify-between tw:gap-2 tw:mt-6">
          <AppButton
            color="light"
            fill="outline"
            onClick={() => setActiveStep(0)}
          >
            <ChevronLeft />
            {t("back")}
          </AppButton>
          <AppButton color="primary" onClick={handleNext}>
            {t("next")}
            <ChevronRight />
          </AppButton>
        </div>
      </AppCard>
    </>
  );
};

export default StoreTimings;
