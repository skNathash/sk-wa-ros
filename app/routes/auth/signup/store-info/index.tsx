import { useState, useMemo, useEffect, useRef } from "react";
import { redirect } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import ImgRender from "~/components/core/img/ImgRender";
import useAppToast from "~/hooks/useAppToast";
import useAppNav from "~/hooks/useAppNav";
import FranchiseService from "~/services/FranchiseService";
import CommonService from "~/services/CommonService";
import { orderBy } from "lodash";
import SignupStepPill from "../components/SignupStepPill";

const monthlyTurnoverOptions = CommonService.getMonthyTurnoverOptions();
const yearsOfExperienceOptions = CommonService.getYearsOfExperienceOptions();

monthlyTurnoverOptions.unshift({
  label: "Select Monthly Turnover",
  value: "choose",
  langKey: "choose",
});
yearsOfExperienceOptions.unshift({
  label: "Select Years of Experience",
  value: "choose",
  langKey: "choose",
});

type FormValues = {
  storeName: string;
  storeSize?: number;
  storeOpenTime?: string;
  storeCloseTime?: string;
  primaryBusiness?: string;
  secondaryBusiness?: string;
  monthlyTurnOver?: string;
  yearsOfExperience?: string;
};

const StoreInfo = () => {
  const signupTemp = FranchiseService.getSignupTemp();
  const { register, handleSubmit, control, reset } = useForm<FormValues>({
    defaultValues: {
      storeName: signupTemp.storeName || "",
      storeSize: signupTemp.storeSize
        ? Number(signupTemp.storeSize)
        : undefined,
      storeOpenTime: signupTemp.storeOpenTime || "08:00",
      storeCloseTime: signupTemp.storeCloseTime || "22:00",
      primaryBusiness: signupTemp.primaryBusinessId || "choose",
      secondaryBusiness: signupTemp.secondaryBusinessId || "choose",
      monthlyTurnOver: signupTemp.monthlyTurnOver || "choose",
      yearsOfExperience: signupTemp.yearsOfExperience || "choose",
    },
  });

  useEffect(() => {
    const temp = FranchiseService.getSignupTemp();
    reset({
      storeName: temp.storeName || "",
      storeSize: temp.storeSize ? Number(temp.storeSize) : undefined,
      storeOpenTime: temp.storeOpenTime || "08:00",
      storeCloseTime: temp.storeCloseTime || "22:00",
      primaryBusiness: temp.primaryBusinessId || "choose",
      secondaryBusiness: temp.secondaryBusinessId || "choose",
      monthlyTurnOver: temp.monthlyTurnOver || "choose",
      yearsOfExperience: temp.yearsOfExperience || "choose",
    });
  }, [reset]);

  const timeOptions = useMemo(() => FranchiseService.generateTimeOptions(), []);

  const { t } = useTranslation(["signup"]);
  const appToast = useAppToast();
  const [submitting, setSubmitting] = useState(false);
  const appNav = useAppNav();
  const [loadingBusinessTypes, setLoadingBusinessTypes] = useState(false);
  const [businessTypeOptions, setBusinessTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [secondaryBusinessTypeOptions, setSecondaryBusinessTypeOptions] =
    useState<{ value: string; label: string }[]>([]);

  const businessDataRef = useRef<Array<any>>([]);

  useEffect(() => {
    const loadBusinessTypes = async () => {
      setLoadingBusinessTypes(true);
      try {
        let options = businessDataRef.current;
        if (!options || options.length === 0) {
          const res = await CommonService.getBusinessCategories({
            filter: {
              isActive: true,
            },
            page: 1,
            limit: 100,
          });
          options = res?.data?.data || [];
          businessDataRef.current = options;
        }

        const businessOptions = orderBy(options, "name", "asc").map(
          (item: any) => ({
            value: item.oldSystemRefId || item._id,
            label: item.name,
          }),
        );

        businessOptions.unshift({
          value: "choose",
          label: "Choose",
        });

        setBusinessTypeOptions(businessOptions);

        const temp = FranchiseService.getSignupTemp();
        setSecondaryBusinessTypeOptions(businessOptions);
      } catch (e) {
        console.error("Error fetching business categories", e);
      } finally {
        setLoadingBusinessTypes(false);
      }
    };

    loadBusinessTypes();
  }, []);

  // Render helper for primary business select to keep JSX clean
  const handlePrimaryBusinessChange = (
    val: string,
    onChangeFn: (v: any) => void,
  ) => {
    onChangeFn(val);
  };

  const onSubmit = (data: FormValues) => {
    if (!data.storeName?.trim()) {
      appToast.show({
        msg: t("register.validation.storeNameRequired"),
        color: "danger",
      });
      return;
    }

    if (!data.storeSize || isNaN(Number(data.storeSize))) {
      appToast.show({
        msg: t("register.validation.storeSizeRequired"),
        color: "danger",
      });
      return;
    }

    if (!data.storeOpenTime || !data.storeCloseTime) {
      appToast.show({
        msg: t("register.validation.timingsRequired"),
        color: "danger",
      });
      return;
    }

    try {
      const open = new Date(`2000-01-01T${data.storeOpenTime}:00`);
      const close = new Date(`2000-01-01T${data.storeCloseTime}:00`);
      if (!(close > open)) {
        appToast.show({
          msg: t("register.validation.closingAfterOpening"),
          color: "danger",
        });
        return;
      }
    } catch (e) {
      // ignore parse errors, previous regex should catch format
    }

    if (!data.monthlyTurnOver || data.monthlyTurnOver === "choose") {
      appToast.show({
        msg: t("register.validation.monthlyTurnOverRequired"),
        color: "danger",
      });
      return;
    }

    if (!data.yearsOfExperience || data.yearsOfExperience === "choose") {
      appToast.show({
        msg: t("register.validation.yearsOfExperienceRequired"),
        color: "danger",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Persist store info into signup temp storage
      const primaryCat = businessDataRef.current.find(
        (b) =>
          b._id === (data.primaryBusiness as any) ||
          b.oldSystemRefId === (data.primaryBusiness as any),
      );
      const secondaryCat = (businessDataRef.current || []).find(
        (b: any) =>
          b._id === (data.secondaryBusiness as any) ||
          b.oldSystemRefId === (data.secondaryBusiness as any),
      );

      const primaryBusinessId =
        data.primaryBusiness === "choose" ? "" : data.primaryBusiness || "";
      const primaryBusiness =
        data.primaryBusiness === "choose" ? "" : primaryCat?.name || "";
      const secondaryBusinessId =
        data.secondaryBusiness === "choose" ? "" : data.secondaryBusiness || "";
      const secondaryBusiness =
        data.secondaryBusiness === "choose" ? "" : secondaryCat?.name || "";

      FranchiseService.updateSignupTemp({
        storeName: data.storeName,
        storeSize: data.storeSize ? data.storeSize.toString() : "",
        storeOpenTime: data.storeOpenTime,
        storeCloseTime: data.storeCloseTime,
        primaryBusinessId: primaryBusinessId,
        primaryBusiness: primaryBusiness,
        secondaryBusinessId: secondaryBusinessId,
        secondaryBusiness: secondaryBusiness,
        monthlyTurnOver: data.monthlyTurnOver,
        yearsOfExperience: data.yearsOfExperience,
      });

      // Navigate to personal info step using router helper (no params needed)
      appNav.to("/auth/signup/store-location");
    } finally {
      setSubmitting(false);
    }
  };

  const viewPersonalInfo = () => {
    appNav.to("/auth/signup/personal-info");
  };

  return (
    <>
      <AppSimpleHeader title={t("register.pageTitle")} />

      <div className="app-page tw:min-h-screen signup-bg-2">
        <div className="tw:max-w-md tw:mx-auto">
          <div className="tw:z-10 tw:px-6 tw:pt-6 tw:md:px-0 tw:pb-10">
            {/* Register pill header (attached UI) */}
            <div className="tw:relative tw:z-10">
              <SignupStepPill
                title={t("register.steps.personalInfo")}
                onClick={viewPersonalInfo}
              />
            </div>

            <div className="tw:-mt-4 tw:text-center">
              <ImgRender
                src="signup/store.jpg"
                className="signup-page-img tw:mx-auto tw:inline-block tw:object-cover tw:mix-blend-multiply"
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="tw:bg-white tw:rounded-lg tw:shadow-md tw:p-5">
                <h2 className="tw:font-semibold tw:text-lg">
                  {t("register.store.title")}
                </h2>

                <AppInput
                  label={t("register.store.storeName.label")}
                  placeholder={t("register.store.storeName.placeholder")}
                  register={register}
                  name="storeName"
                  className="tw:mt-4"
                  inputClassName="tw:bg-white"
                  isRequired={true}
                />

                <AppInput
                  label={t("register.store.storeSize.label")}
                  placeholder={t("register.store.storeSize.placeholder")}
                  register={register}
                  name="storeSize"
                  type="number"
                  className="tw:mt-4"
                  inputClassName="tw:bg-white"
                  isRequired={true}
                />

                <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:mt-4">
                  <Controller
                    name="primaryBusiness"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        loading={loadingBusinessTypes}
                        label={t("register.store.primaryBusiness.label")}
                        options={businessTypeOptions}
                        placeholder={t(
                          "register.store.primaryBusiness.placeholder",
                        )}
                        onChange={(val: string) =>
                          handlePrimaryBusinessChange(val, field.onChange)
                        }
                        value={field.value}
                        isRequired={true}
                        inputClassName="tw:w-full"
                      />
                    )}
                  />

                  <Controller
                    name="secondaryBusiness"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        loading={loadingBusinessTypes}
                        label={t("register.store.secondaryBusiness.label")}
                        options={secondaryBusinessTypeOptions}
                        placeholder={t(
                          "register.store.secondaryBusiness.placeholder",
                        )}
                        onChange={field.onChange}
                        value={field.value}
                        inputClassName="tw:w-full"
                      />
                    )}
                  />
                </div>

                <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:mt-4 tw:mb-4">
                  <Controller
                    name="storeOpenTime"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        label={t("register.store.timings.openTime.label")}
                        options={timeOptions}
                        placeholder={t(
                          "register.store.timings.openTime.placeholder",
                        )}
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
                          "register.store.timings.closeTime.placeholder",
                        )}
                        onChange={field.onChange}
                        value={field.value}
                        isRequired={true}
                        inputClassName="tw:w-full"
                      />
                    )}
                  />
                </div>

                <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:mt-4 tw:mb-4">
                  <Controller
                    name="monthlyTurnOver"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        label={t("register.monthlyTurnover")}
                        options={monthlyTurnoverOptions}
                        onChange={field.onChange}
                        value={field.value}
                        isRequired={true}
                        inputClassName="tw:w-full"
                      />
                    )}
                  />
                  <Controller
                    name="yearsOfExperience"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        label={t("register.yearsOfExperience")}
                        options={yearsOfExperienceOptions}
                        onChange={field.onChange}
                        value={field.value}
                        isRequired={true}
                        inputClassName="tw:w-full"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="tw:mt-6 tw:text-right">
                <AppButton
                  color="primary"
                  className="tw:px-6 tw:py-3 tw:font-semibold tw:text-base"
                  type="submit"
                  disabled={submitting}
                >
                  {t("register.submit.next")}
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default StoreInfo;

export async function clientLoader() {
  // If there's no temporary signup data, redirect to mobile registration step
  const has = FranchiseService.hasTempSignupData();
  if (!has) {
    throw redirect("/auth/signup/mobile");
  }
  return null;
}
