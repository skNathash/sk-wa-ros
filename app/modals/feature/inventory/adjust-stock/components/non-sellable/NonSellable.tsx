import { Controller, useFormContext } from "react-hook-form";
import { AppSelect } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";

const reasons = [
  {
    label: "Damaged",
    value: "damaged",
    langKey: "damaged",
  },
  {
    label: "Expired",
    value: "expired",
    langKey: "expired",
  },
  {
    label: "Other",
    value: "other",
    langKey: "other",
  },
];

import { useTranslation } from "react-i18next";
import Batches from "./Batches";
import DestinationLocation from "./DestinationLocation";

interface NonSellableProps {
  masterData: any[];
  selectedStockUom?: string;
}

const NonSellable = ({ masterData, selectedStockUom }: NonSellableProps) => {
  const { t } = useTranslation(["common"]);
  const { register, control } = useFormContext();

  return (
    <div>
      {/* Batches Section */}
      <Batches
        masterData={masterData || []}
        selectedStockUom={selectedStockUom}
      />

      {/* Destination Location Section */}
      <div className="tw:text-xs tw:font-medium tw:mb-2">
        {t("destinationLocation")}
      </div>
      <DestinationLocation />

      {/* Reason Section */}
      <Controller
        control={control}
        name="reason"
        render={({ field }) => (
          <AppSelect
            label={t("reason")}
            options={reasons}
            value={field.value}
            onChange={field.onChange}
            inputClassName="tw:w-full"
            className="tw:mb-4"
            placeholder={t("selectReason")}
            isRequired={true}
          />
        )}
      />

      {/* Additional Info Section */}
      <AppTextarea
        label={t("additionalInformation")}
        name="additionalInfo"
        register={register}
        className="tw:mb-4"
        placeholder={t("additionalInformationAboutTheNonSellableUnits")}
      />
    </div>
  );
};

export default NonSellable;
