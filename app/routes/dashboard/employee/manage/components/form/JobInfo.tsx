import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppSelect } from "~/components/core/form";
import { useFormContext, Controller } from "react-hook-form";
import AppDateInput from "~/components/core/form/AppDateInput";
import UserService from "~/services/UserService";
import { useTranslation } from "react-i18next";

const getSystemRoleOptions = (t: any) => [
  { label: t("user"), value: "User" },
  { label: t("admin"), value: "Admin" },
];

const positionOptions = UserService.getPositionOptions();

const JobInfo = () => {
  const { t } = useTranslation(["common"]);
  const { register, control } = useFormContext();

  return (
    <AppCard title={t("jobInformation")} icon="briefcase">
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
        <Controller
          control={control}
          name="position"
          render={({ field }) => (
            <AppSelect
              label={t("position")}
              value={field.value || ""}
              onChange={field.onChange}
              placeholder={t("selectPosition")}
              options={positionOptions}
              size="sm"
              inputClassName="tw:w-full"
              isRequired
            />
          )}
        />
        <Controller
          control={control}
          name="dateOfJoining"
          render={({ field }) => (
            <AppDateInput
              label={t("dateOfJoining")}
              placeholder={t("selectDateOfJoining")}
              isRequired
              callback={field.onChange}
              value={field.value || undefined}
              size="sm"
            />
          )}
        />
        <Controller
          control={control}
          name="systemRole"
          render={({ field }) => (
            <AppSelect
              label={t("systemRole")}
              value={field.value || ""}
              onChange={field.onChange}
              placeholder={t("selectSystemRole")}
              options={getSystemRoleOptions(t)}
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

export default JobInfo;
