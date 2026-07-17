import { ChevronDown, MapPin, Save, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppPincodeInput, AppSelect } from "~/components/core/form";
import AppHeader from "~/components/core/header/AppHeader";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CustomerService from "~/services/CustomerService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import { defaultFormData, preparePayload, validateForm } from "./helper";
import CustomerCreatedSuccessModal from "./modals/CustomerCreatedSuccessModal";
import LinkCustomerRetailerModal from "~/shared/users/modals/link-customer-retailer/LinkCustomerRetailerModal";
import PageAccessService from "~/services/PageAccessService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";

const breadcrumbData: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Customer Management",
    langKey: "networkManagement",
    redirect: {
      path: "/dashboard/network/management/b2c-customers?tab=b2c-customers",
    },
  },
  {
    label: "Manage B2C Customer",
    langKey: "manageB2cCustomer",
  },
];

export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    blockForMasterLogin: true,
  });
}

const ManageB2c = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appToast = useAppToast();
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const sourcePage = searchParams.get("sourcePage");
  const customerType = searchParams.get("customerType");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: {
      ...defaultFormData,
    },
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdMobile, setCreatedMobile] = useState("");
  const [showAdditional, setShowAdditional] = useState(false);
  const [linkModal, setLinkModal] = useState({ show: false, cid: "" });

  // Gender options
  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ];

  const [state, district, town] = useWatch({
    control,
    name: ["state", "district", "town"],
  });

  useEffect(() => {
    const user = AuthService.getLoggedInUser();
    setValue("pincode", user.pincode);
    setValue("state", user?.state);
    setValue("district", user?.district);
    setValue("town", user?.city || user?.town);
  }, [setValue]);

  // Handle pincode change
  const handlePincodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const pincode = event.target.value;
    setValue("pincode", pincode);
  };

  // Handle name change - only allow alphabetic characters and spaces
  const handleNameChange = () => {
    const newValue = getValues("name");

    // Filter out any characters that are not alphabetic or spaces
    const filteredValue = newValue.replace(/[^A-Za-z\s]/g, "");

    setValue("name", filteredValue);
  };

  // Handle mobile change - only allow numeric characters
  const handleMobileChange = () => {
    const newValue = getValues("mobile");

    // Filter out any characters that are not numeric
    const filteredValue = newValue.replace(/[^0-9]/g, "");

    setValue("mobile", filteredValue);
  };

  // Handle pincode data callback
  const handlePincodeDataCallback = (data: any) => {
    if (data.state) {
      setValue("state", data.state);
    }
    if (data.district) {
      setValue("district", data.district);
    }
    if (data.city) {
      setValue("town", data.city);
    }
  };

  // Handle location change from SdtLocation component
  const handleLocationChange = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "state_change") {
      setValue("state", data.state);
      setValue("district", data.district);
      setValue("town", data.town);
    } else if (action === "district_change") {
      setValue("district", data.district);
      setValue("town", data.town);
    } else if (action === "town_change") {
      setValue("town", data.town);
    }
  };

  // Form submission
  const onSubmit = async () => {
    try {
      const data = getValues();

      // Validate all form data
      const validation = validateForm(data, t);
      if (!validation.status) {
        appToast.show({ msg: validation.msg, color: "danger" });
        return;
      }

      setSubmitting(true);

      // Check if customer already exists by mobile number
      const checkResp = await CustomerService.getCustomers({
        filter: { mobile: data.mobile },
        page: 1,
        count: 1,
      });

      // const existingCustomer = checkResp?.data?.data?.[0];

      // if (existingCustomer?._id) {
      //   const loggedInUserId = AuthService.getLoggedInUserId();
      //   console.log(loggedInUserId);
      //   if (existingCustomer?.franchiseInfo?.id === loggedInUserId) {
      //     appToast.show({
      //       msg: t("customerAlreadyRegistered"),
      //       color: "danger",
      //     });
      //   } else {
      //     setLinkModal({ show: true, cid: existingCustomer._id });
      //   }
      //   return;
      // }

      // Prepare payload
      const payload = preparePayload(data);

      // Call API
      const response = await CustomerService.createCustomer(payload);

      if (response?.statusCode === 200) {
        appToast.show({
          msg: t("customerCreatedSuccessfully"),
          color: "success",
        });
        setCreatedMobile(data.mobile || "");
        setShowSuccessModal(true);
        // Reset form to default values (do not auto-fill location/gender/pincode)
        reset({ ...defaultFormData });
      } else {
        appToast.show({
          msg: response?.data?.message || t("errorCreatingCustomer"),
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error creating customer:", error);
      appToast.show({
        msg: error?.response?.data?.message || t("errorCreatingCustomer"),
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppHeader title={t("manageB2cCustomer")} />
      <LinkCustomerRetailerModal
        show={linkModal.show}
        cid={linkModal.cid}
        callback={({ action }) => {
          setLinkModal({ show: false, cid: "" });
          if (action === "success") {
            appToast.show({
              msg: t("customerLinkedSuccessfully"),
              color: "success",
            });
            reset({ ...defaultFormData });
            appNav.to("/dashboard/network/management/b2c-customers", {
              tab: "b2c-customers",
            });
          }
        }}
      />
      <CustomerCreatedSuccessModal
        show={showSuccessModal}
        hideAddAnother={sourcePage === "paylater-assign"}
        callback={({ action }) => {
          if (action === "close") {
            setShowSuccessModal(false);
            if (sourcePage === "paylater-assign") {
              appNav.to(
                `/dashboard/paylater/assign?type=${customerType || "b2c"}&mobile=${createdMobile}`,
              );
            } else {
              appNav.to("/dashboard/network/management/b2c-customers", {
                tab: "b2c-customers",
              });
            }
          } else if (action === "add_other") {
            setShowSuccessModal(false);
          }
        }}
      />
      <div className="app-page page-bg page-padding tw:min-h-screen">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
          <SectionTabs
            sectionKey="business"
            activeTab="customers"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="customers"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="theme-2-mobile-only tw:h-4" />
              <div className="tw:max-w-3xl tw:mx-auto tw:space-y-5">
                <AppBreadcrumbs data={breadcrumbData} />

          {/* Hero Banner */}
          <div className="tw:bg-linear-to-br tw:from-blue-600 tw:via-indigo-600 tw:to-purple-700 tw:rounded-2xl tw:p-6 tw:md:p-8 tw:text-white tw:shadow-xl tw:relative tw:overflow-hidden">
            <div className="tw:absolute tw:inset-0 tw:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="tw:absolute tw:-right-8 tw:-bottom-8 tw:w-32 tw:h-32 tw:bg-white/5 tw:rounded-full" />
            <div className="tw:absolute tw:right-12 tw:-top-4 tw:w-20 tw:h-20 tw:bg-white/5 tw:rounded-full" />
            <div className="tw:flex tw:items-center tw:gap-4 tw:relative">
              <div className="tw:bg-white/15 tw:backdrop-blur-sm tw:rounded-xl tw:p-3 tw:ring-1 tw:ring-white/20">
                <UserPlus size={26} />
              </div>
              <div>
                <h2 className="tw:text-xl tw:font-bold tw:tracking-tight">
                  {t("createB2cCustomer")}
                </h2>
                <p className="tw:text-blue-100 tw:text-sm tw:mt-1">
                  {t("manageB2cCustomerBasicInfo")}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-5">
            {/* Basic Information Card */}
            <div className="tw:bg-white tw:rounded-2xl tw:shadow-sm tw:border tw:border-gray-100 tw:overflow-hidden hover:tw:shadow-md tw:transition-shadow tw:duration-300">
              <div className="tw:border-b tw:border-gray-100 tw:px-6 tw:py-5 tw:flex tw:items-center tw:gap-3 tw:bg-gradient-to-r tw:from-gray-50/80 tw:to-white">
                <div className="tw:bg-blue-100 tw:text-blue-600 tw:rounded-xl tw:p-2.5">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="tw:font-semibold tw:text-gray-800">
                    {t("basicInformation")}
                  </h3>
                  <p className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                    {t("fillCustomerDetails")}
                  </p>
                </div>
              </div>
              <div className="tw:p-6 tw:md:p-8">
                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
                  <AppInput
                    label="Name"
                    name="name"
                    type="text"
                    placeholder="Enter customer name"
                    register={register}
                    onChange={handleNameChange}
                    className="tw:w-full"
                    error={errors.name?.message}
                    isRequired
                    maxLength={50}
                  />

                  <AppInput
                    register={register}
                    label="Mobile"
                    name="mobile"
                    type="tel"
                    maxLength={10}
                    placeholder="Enter mobile"
                    onChange={handleMobileChange}
                    className="tw:w-full"
                    error={errors.mobile?.message}
                    isRequired
                  />

                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        label="Gender"
                        options={genderOptions}
                        placeholder="Select gender"
                        onChange={field.onChange}
                        value={field.value}
                        inputClassName="tw:w-full"
                        error={errors.gender?.message}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="tw:bg-white tw:rounded-2xl tw:shadow-sm tw:border tw:border-gray-100 tw:overflow-hidden hover:tw:shadow-md tw:transition-shadow tw:duration-300">
              <button
                type="button"
                onClick={() => setShowAdditional(!showAdditional)}
                className="tw:w-full tw:flex tw:justify-between tw:items-center tw:px-6 tw:py-5 tw:cursor-pointer hover:tw:bg-gray-50/80 tw:transition-colors tw:duration-200"
              >
                <div className="tw:flex tw:items-center tw:gap-3">
                  <div className="tw:bg-purple-100 tw:text-purple-600 tw:rounded-xl tw:p-2.5">
                    <MapPin size={18} />
                  </div>
                  <div className="tw:text-start">
                    <span className="tw:text-gray-800 tw:font-semibold tw:block tw:text-sm">
                      {t("additionalInfo")}{" "}
                      <span className="tw:text-xs tw:font-normal tw:text-gray-400 tw:ml-1">
                        ({t("optional")})
                      </span>
                    </span>
                    <span className="tw:text-xs tw:text-gray-400 tw:block tw:mt-0.5">
                      {t("addEmailAndLocationDetails")}
                    </span>
                  </div>
                </div>
                <div
                  className={`tw:text-gray-400 tw:transition-transform tw:duration-300 ${
                    showAdditional ? "tw:rotate-180" : ""
                  }`}
                >
                  <ChevronDown size={20} />
                </div>
              </button>

              {showAdditional && (
                <div className="tw:border-t tw:border-gray-100 tw:p-6 tw:md:p-8 tw:animate-in tw:fade-in tw:duration-200">
                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
                    <AppPincodeInput
                      label="Pincode"
                      name="pincode"
                      placeholder="Enter pincode"
                      register={register}
                      onChange={handlePincodeChange}
                      onPincodeSelect={({ data }) => {
                        if (data) {
                          handlePincodeDataCallback({
                            city: data.city || "",
                            state: data.state || "",
                            district: data.district || "",
                          });
                        }
                      }}
                      className="tw:w-full"
                      error={errors.pincode?.message}
                    />

                    <SdtLocation
                      state={state}
                      district={district}
                      town={town}
                      callback={handleLocationChange}
                    />

                    <AppInput
                      label="Email"
                      name="email"
                      type="email"
                      placeholder="Enter email"
                      register={register}
                      className="tw:w-full"
                      error={errors.email?.message}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="tw:flex tw:justify-end tw:pt-4">
              <AppButton
                type="submit"
                color="primary"
                size="large"
                isLoading={submitting}
                disabled={submitting}
              >
                <Save />
                {t("createCustomer")}
              </AppButton>
            </div>
              </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManageB2c;
