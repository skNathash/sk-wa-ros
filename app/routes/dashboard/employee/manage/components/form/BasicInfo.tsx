import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppSelect } from "~/components/core/form";
import { Controller, useFormContext } from "react-hook-form";
import { useCallback, type ChangeEvent } from "react";
import { debounce } from "lodash";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import useAppToast from "~/hooks/useAppToast";
import AppDateInput from "~/components/core/form/AppDateInput";
import { sub, toDate } from "date-fns";
import type { DayPickerProps } from "react-day-picker";
import { useTranslation } from "react-i18next";

const getGenderOptions = (t: any) => [
  {
    label: t("male"),
    value: "Male",
  },
  {
    label: t("female"),
    value: "Female",
  },
];

const dobConfig: DayPickerProps = {
  fromDate: sub(new Date(), { years: 100 }),
  toDate: new Date(),
};

const BasicInfo = () => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const { register, control } = useFormContext();

  const handleMobileNoChange = useCallback(
    debounce(async (e: ChangeEvent<HTMLInputElement>) => {
      // const value = e.target.value;
      // if (!CommonService.isValidMobileNo(value)) {
      //   return;
      // }
      // const franResp = await FranchiseService.getFranchises({
      //   filter: {
      //     mobile: value,
      //   },
      // });
      // if (franResp?.data?.data?.length > 0) {
      //   appToast.show({
      //     msg: "Mobile number already exists in franchise",
      //     color: "warning",
      //   });
      //   return;
      // }
      // const manpowerResp = await FranchiseService.getFranSubUser({
      //   filter: {
      //     mobileNo: value,
      //   },
      //   select: "name,mobileNo",
      // });
      // if (manpowerResp?.data?.length > 0) {
      //   appToast.show({
      //     msg: "Mobile number already exists in manpower",
      //     color: "warning",
      //   });
      //   return;
      // }
    }, 1000),
    []
  );

  return (
    <AppCard title={t("basicInformation")} icon="user-plus">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
        <AppInput
          label={t("name")}
          register={register}
          name="name"
          placeholder={t("enterName")}
          isRequired
          size="sm"
        />
        <AppInput
          type="number"
          label={t("mobileNumber")}
          register={register}
          name="mobileNo"
          placeholder={t("enterMobileNumber")}
          isRequired
          maxLength={10}
          onChange={handleMobileNoChange}
          size="sm"
        />
        <AppInput
          label={t("email")}
          register={register}
          name="email"
          placeholder={t("enterEmail")}
          isRequired
          size="sm"
        />

        <Controller
          control={control}
          name="dob"
          render={({ field }) => (
            <AppDateInput
              label={t("dateOfBirth")}
              placeholder={t("selectDateOfBirth")}
              isRequired
              callback={field.onChange}
              value={field.value || undefined}
              size="sm"
              dateConfig={dobConfig}
            />
          )}
        />

        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <AppSelect
              label={t("gender")}
              value={field.value || ""}
              onChange={field.onChange}
              placeholder={t("selectGender")}
              options={getGenderOptions(t)}
              size="sm"
              inputClassName="tw:w-full"
              isRequired
            />
          )}
        />

      </div>
    </AppCard>
  );
};

export default BasicInfo;
