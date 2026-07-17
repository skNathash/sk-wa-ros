import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Store, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import { isDate, orderBy } from "lodash";
import CommonService from "~/services/CommonService";
import AuthService from "~/services/AuthService";
import { format, set } from "date-fns";

interface UpdateStoreInformationModalProps {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  data?: {
    storeName: string;
    storeOpenTime: string;
    storeCloseTime: string;
    primaryBusiness?: string;
    secondaryBusiness?: string;
    primaryBusinessId?: string;
    secondaryBusinessId?: string;
    storeSize: string;
    deliveryRadius: number;
    monthlyTurnover?: string;
    yearsOfExperience?: string;
    latitude?: number;
    longitude?: number;
  };
}

interface FormValues {
  storeName: string;
  storeOpenTime: string;
  storeCloseTime: string;
  primaryBusiness: string;
  secondaryBusiness?: string;
  storeSize: string;
  deliveryRadius: number;
  monthlyTurnover: string;
  yearsOfExperience: string;
}

interface BusinessTypeOption {
  value: string;
  label: string;
}

const createValidationSchema = (t?: any, isSkSeller: boolean = false) =>
  yup.object({
    storeName: yup
      .string()
      .required(t("pleaseProvideStoreName"))
      .min(2, t("pleaseProvideValidStoreName")),
    storeOpenTime: yup
      .string()
      .required(t("pleaseProvideStoreOpenTime"))
      .matches(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        t("pleaseProvideValidTimeFormat"),
      ),
    storeCloseTime: yup
      .string()
      .required(t("pleaseProvideStoreCloseTime"))
      .matches(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        t("pleaseProvideValidTimeFormat"),
      )
      .test(
        "is-after-open-time",
        t("closingTimeMustBeAfterOpeningTime"),
        function (value) {
          const { storeOpenTime } = this.parent;
          if (!value || !storeOpenTime) return true;

          const openTime = new Date(`2000-01-01T${storeOpenTime}:00`);
          const closeTime = new Date(`2000-01-01T${value}:00`);

          return closeTime > openTime;
        },
      ),
    primaryBusiness: yup.string().required(t("pleaseSelectPrimaryBusiness")),
    secondaryBusiness: yup.string().optional(),
    storeSize: yup
      .string()
      .required(t("pleaseProvideStoreSize"))
      .min(1, t("pleaseProvideValidStoreSize")),
    deliveryRadius: yup
      .number()
      .required(t("pleaseProvideDeliveryRadius"))
      .min(0.1, t("pleaseProvideValidDeliveryRadius"))
      .typeError(t("pleaseProvideValidDeliveryRadius")),
    monthlyTurnover: yup
      .string()
      .required(t("pleaseProvideMonthlyTurnover"))
      .test(
        "not-choose",
        t("pleaseProvideMonthlyTurnover"),
        (val) => !!val && val !== "choose",
      ),
    yearsOfExperience: yup
      .string()
      .required(t("pleaseProvideYearsOfExperience"))
      .test(
        "not-choose",
        t("pleaseProvideYearsOfExperience"),
        (val) => !!val && val !== "choose",
      ),
  });

const UpdateStoreInformationModal: React.FC<
  UpdateStoreInformationModalProps
> = ({ show, callback, data }) => {
  const { t } = useTranslation(["common", "profile"]);
  const isSkSeller = AuthService.isSkSeller();

  const methods = useForm({
    resolver: yupResolver(createValidationSchema(t, isSkSeller)) as any,
    defaultValues: {
      storeName: "",
      storeOpenTime: "",
      storeCloseTime: "",
      primaryBusiness: "",
      secondaryBusiness: "",
      storeSize: "",
      deliveryRadius: 0,
      monthlyTurnover: "choose",
      yearsOfExperience: "choose",
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors },
  } = methods;

  const [submitting, setSubmitting] = useState(false);
  const [loadingBusinessTypes, setLoadingBusinessTypes] = useState(false);
  const [businessTypeOptions, setBusinessTypeOptions] = useState<
    BusinessTypeOption[]
  >([]);

  const [secondaryBusinessTypeOptions, setSecondaryBusinessTypeOptions] =
    useState<BusinessTypeOption[]>([]);

  const [timeOptions] = useState(FranchiseService.generateTimeOptions());
  const monthlyTurnoverOptions = CommonService.getMonthyTurnoverOptions();
  monthlyTurnoverOptions.unshift({
    label: "Select Monthly Turnover",
    value: "choose",
    langKey: "choose",
  });

  const yearsOfExperienceOptions = CommonService.getYearsOfExperienceOptions();
  yearsOfExperienceOptions.unshift({
    label: "Select Years of Experience",
    value: "choose",
    langKey: "choose",
  });
  const toast = useAppToast();

  const businessDataRef = useRef<Array<any>>([]);

  // Load business type data
  // useEffect(() => {
  //   const loadBusinessTypes = async () => {
  //     if (show) {
  //       setLoadingBusinessTypes(true);
  //       try {
  //         const response = await FranchiseService.getDocs("businessType");
  //         if (response && response.statusCode === 200 && response.data) {
  //           const options = orderBy(response.data, "name", "asc").map(
  //             (item: any) => ({
  //               value: item.name,
  //               label: item.name,
  //             }),
  //           );
  //           setBusinessTypeOptions(options);
  //         } else {
  //           console.error("Failed to load business types:", response);
  //         }
  //       } catch (error) {
  //         console.error("Error loading business types:", error);
  //       } finally {
  //         setLoadingBusinessTypes(false);
  //       }
  //     }
  //   };

  //   loadBusinessTypes();
  // }, [show]);

  // Reset form when modal opens
  useEffect(() => {
    if (show && data) {
      const fetchData = async () => {
        let openTime =
          typeof data.storeOpenTime === "string"
            ? data.storeOpenTime.split(":")
            : "";
        let closeTime =
          typeof data.storeCloseTime === "string"
            ? data.storeCloseTime.split(":")
            : "";

        let finalOpenTime: Date | string =
          data.storeOpenTime && isDate(new Date(data.storeOpenTime))
            ? new Date(data.storeOpenTime)
            : set(new Date(), { hours: 9, minutes: 0 });
        let finalCloseTime: Date | string =
          data.storeCloseTime && isDate(new Date(data.storeCloseTime))
            ? new Date(data.storeCloseTime)
            : set(new Date(), { hours: 22, minutes: 0 });

        if (openTime.length === 2 && closeTime.length === 2) {
          finalOpenTime = set(new Date(), {
            hours: Number(openTime[0]),
            minutes: Number(openTime[1]),
          });
          finalCloseTime = set(new Date(), {
            hours: Number(closeTime[0]),
            minutes: Number(closeTime[1]),
          });
        }

        // Default times to 09:00 - 22:00 when not provided
        const defaultOpen = format(finalOpenTime, "HH:mm");
        const defaultClose = format(finalCloseTime, "HH:mm");

        setLoadingBusinessTypes(true);
        try {
          // Use cached business data when available to avoid refetching
          let options = businessDataRef.current;
          if (!options || options.length === 0) {
            const business = await CommonService.getBusinessCategories({
              page: 1,
              count: 100,
              filter: {
                isActive: true,
              },
            });
            options = business.data?.data || [];
            businessDataRef.current = options;
          }

          const mappedOptions = orderBy(options, "name", "asc").map(
            (item: any) => ({
              value: item.oldSystemRefId || item._id,
              label: item.name,
            }),
          );

          // Use same options for primary and secondary business
          setBusinessTypeOptions(mappedOptions);
          setSecondaryBusinessTypeOptions(mappedOptions);

          reset({
            storeName: data.storeName || "",
            storeOpenTime: defaultOpen,
            storeCloseTime: defaultClose,
            primaryBusiness:
              (data.primaryBusinessId as any) || data.primaryBusiness || "",
            secondaryBusiness:
              (data.secondaryBusinessId as any) || data.secondaryBusiness || "",
            storeSize: data.storeSize || "",
            deliveryRadius: data.deliveryRadius || 0,
            monthlyTurnover: data.monthlyTurnover || "choose",
            yearsOfExperience: data.yearsOfExperience || "choose",
          } as any);
        } catch (error) {
          console.error("Error fetching business categories:", error);
        } finally {
          setLoadingBusinessTypes(false);
        }
      };

      fetchData();
    }
  }, [show, data, reset]);

  // Clear secondary options when modal is closed to avoid stale values
  useEffect(() => {
    if (!show) {
      setSecondaryBusinessTypeOptions([]);
    }
  }, [show]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const primaryCat = businessDataRef.current.find(
        (item) =>
          item.oldSystemRefId === values.primaryBusiness ||
          item._id === values.primaryBusiness,
      );

      // if (!primaryCat) {
      //   toast.show({
      //     msg: t("pleaseSelectValidPrimaryBusiness"),
      //     color: "danger",
      //   });
      //   setSubmitting(false);
      //   return;
      // }

      // Secondary uses same options as primary; find from global business list
      const secondaryCat = businessDataRef.current.find(
        (item: any) =>
          item.oldSystemRefId === values.secondaryBusiness ||
          item._id === values.secondaryBusiness,
      );

      const today = format(new Date(), "yyyy-MM-dd");
      const openTime = new Date(`${today}T${values.storeOpenTime}:00`);
      const closeTime = new Date(`${today}T${values.storeCloseTime}:00`);

      const payload: any = {
        // name: values.storeName,
        storeSize: values.storeSize,
        operatingHours: {
          openTime: openTime.toISOString(),
          closeTime: closeTime.toISOString(),
        },
        // primaryBusiness: primaryCat?.name,
        // secondaryBusiness: secondaryCat?.name,
        // primaryBusinessId: primaryCat?.oldSystemRefId || primaryCat?._id,
        // secondaryBusinessId: secondaryCat?.oldSystemRefId || secondaryCat?._id,
        deliveryRadius: values.deliveryRadius,
      };

      // include turnover and experience when provided
      if (values.monthlyTurnover) {
        payload.monthlyTurnOver = values.monthlyTurnover;
      }

      if (values.yearsOfExperience) {
        payload.yearsOfExperience = values.yearsOfExperience;
      }

      // Include latitude and longitude if available
      if (data?.latitude && data?.longitude) {
        payload.latitude = data.latitude;
        payload.longitude = data.longitude;
      }

      const response = await FranchiseService.updateFranchise(payload);

      if (response && response.statusCode === 200) {
        toast.show({
          msg: t("storeInformationUpdatedSuccessfully"),
          color: "success",
        });
        callback({ action: "submit", data: values });
      } else {
        toast.show({
          msg: response?.data?.message || t("failedToUpdateStoreInformation"),
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error updating store information:", error);
      toast.show({
        msg: t("failedToUpdateStoreInformationTryAgain"),
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onPrimaryBusinessChange = (chngFn: any) => (value: string) => {
    chngFn(value);
    // Secondary uses same options as primary; keep options unchanged
  };

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:h-[90vh] tw:max-w-2xl"
    >
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:font-semibold">{t("updateStoreInformation")}</div>
        <p className="tw:md:text-xs tw:text-xs tw:text-gray-600 tw:mt-1 tw:font-normal">
          {t("updateStoreInformationDescription")}
        </p>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[80vh]">
        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="tw:p-1 tw:space-y-6"
          >
            {/* Store Identity Section */}
            <div className="tw:bg-gray-50 tw:p-4 tw:rounded-xl tw:border tw:border-gray-100">
              <h3 className="tw:text-sm tw:font-semibold tw:text-gray-800 tw:mb-4 tw:flex tw:items-center tw:gap-2">
                <Store className="tw:w-4 tw:h-4 tw:text-blue-600" />
                {t("profile:storeIdentity")}
              </h3>
              <div className="tw:grid tw:grid-cols-2 tw:gap-4">
                <AppInput
                  label={`${t("storeSize")} (sq ft)`}
                  name="storeSize"
                  type="text"
                  register={register}
                  error={errors.storeSize?.message}
                  className="tw:mb-0"
                  isRequired
                  placeholder={t("enterStoreSize")}
                  inputClassName="tw:bg-white"
                />
                <Controller
                  name="monthlyTurnover"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      label={t("monthlyTurnover")}
                      options={monthlyTurnoverOptions}
                      placeholder={t("choose")}
                      onChange={field.onChange}
                      value={field.value}
                      inputClassName="tw:w-full tw:bg-white"
                      className="tw:mb-0"
                      isRequired
                      error={errors.monthlyTurnover?.message}
                    />
                  )}
                />

                <Controller
                  name="yearsOfExperience"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      label={t("yearsOfExperience")}
                      options={yearsOfExperienceOptions}
                      placeholder={t("choose")}
                      onChange={field.onChange}
                      value={field.value}
                      inputClassName="tw:w-full tw:bg-white"
                      className="tw:mb-0"
                      isRequired
                      error={errors.yearsOfExperience?.message}
                    />
                  )}
                />
                {/* <Controller
                  name="primaryBusiness"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      loading={loadingBusinessTypes}
                      label={t("primaryBusiness")}
                      options={businessTypeOptions}
                      placeholder={
                        loadingBusinessTypes
                          ? t("loading")
                          : t("selectPrimaryBusiness")
                      }
                      onChange={onPrimaryBusinessChange(field.onChange)}
                      value={field.value}
                      error={errors.primaryBusiness?.message}
                      isRequired
                      disabled={loadingBusinessTypes}
                      inputClassName="tw:w-full tw:bg-white"
                      className="tw:mb-0 tw:col-span-2"
                    />
                  )}
                /> */}

                {/* <Controller
                  name="secondaryBusiness"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      loading={loadingBusinessTypes}
                      label={t("secondaryBusiness")}
                      options={secondaryBusinessTypeOptions}
                      placeholder={
                        loadingBusinessTypes
                          ? t("loading")
                          : t("selectSecondaryBusiness")
                      }
                      onChange={field.onChange}
                      value={field.value}
                      error={errors.secondaryBusiness?.message}
                      disabled={loadingBusinessTypes}
                      inputClassName="tw:w-full tw:bg-white"
                      className="tw:mb-0 tw:col-span-2"
                    />
                  )}
                /> */}
              </div>
            </div>

            {/* Store Timings and Service Area */}
            <div className="tw:bg-gray-50 tw:p-4 tw:rounded-xl tw:border tw:border-gray-100">
              <h3 className="tw:text-sm tw:font-semibold tw:text-gray-800 tw:mb-4 tw:flex tw:items-center tw:gap-2">
                <Clock className="tw:w-4 tw:h-4 tw:text-orange-500" />
                {t("profile:timingsAndService")}
              </h3>
              <div className="tw:grid tw:grid-cols-1 tw:gap-4">
                <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                  <Controller
                    name="storeOpenTime"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        label={t("profile:openTime")}
                        options={timeOptions}
                        placeholder={t("select")}
                        onChange={field.onChange}
                        value={field.value}
                        error={errors.storeOpenTime?.message}
                        isRequired
                        inputClassName="tw:w-full tw:bg-white"
                      />
                    )}
                  />
                  <Controller
                    name="storeCloseTime"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        label={t("profile:closeTime")}
                        options={timeOptions}
                        placeholder={t("select")}
                        onChange={field.onChange}
                        value={field.value}
                        error={errors.storeCloseTime?.message}
                        isRequired
                        inputClassName="tw:w-full tw:bg-white"
                      />
                    )}
                  />
                </div>
                <div>
                  <AppInput
                    label={`${t("deliveryRadius")} (km)`}
                    name="deliveryRadius"
                    type="number"
                    register={register}
                    error={errors.deliveryRadius?.message}
                    className="tw:mb-0 tw:w-full"
                    isRequired
                    placeholder={t("profile:enterRadius")}
                    inputClassName="tw:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Business Information Section REMOVED (Primary moved up, Secondary removed) */}
          </form>
        </FormProvider>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton
            type="button"
            color="light"
            fill="outline"
            onClick={() => callback({ action: "close" })}
            disabled={submitting}
          >
            {t("cancel")}
          </AppButton>
          <AppButton
            type="submit"
            color="dark"
            onClick={handleSubmit(onSubmit)}
            isLoading={submitting}
            disabled={submitting || loadingBusinessTypes}
          >
            {t("update")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default UpdateStoreInformationModal;
