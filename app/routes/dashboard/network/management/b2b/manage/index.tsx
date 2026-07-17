import { useRef, useState, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppHeader from "~/components/core/header/AppHeader";
import AppSteps from "~/components/core/steps/AppSteps";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import FranchiseService from "~/services/FranchiseService";
import CommonService from "~/services/CommonService";
import { orderBy } from "lodash";
import PageAccessService from "~/services/PageAccessService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import StoreAddress from "./components/StoreAddress";
import StoreDetails from "./components/StoreDetails";
import StoreTimings from "./components/StoreTimings";
import Success from "./components/Success";
import { prepareB2bRetailerPayload, validateB2bRetailerForm } from "./helper";

const defaultValues = {
  storeName: "",
  mobile: "",
  email: "",
  ownerName: "",
  primaryBusiness: "choose",
  gstNumber: "",
  pincode: "",
  pincodeData: {
    city: "",
    state: "",
    district: "",
  },
  state: "",
  district: "",
  town: "",
  door_no: "",
  street: "",
  storeOpenTime: "08:00",
  storeCloseTime: "22:00",
};

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
      path: "/dashboard/network/management/b2b-retailers?tab=b2b-retailers",
    },
  },
  {
    label: "Create B2B Retailer",
    langKey: "createB2bRetailer",
  },
];

export async function clientLoader() {
  return PageAccessService.canAccessPage([], {
    blockForMasterLogin: true,
  });
}

const steps = [
  {
    title: "Store Details",
    key: "store-details",
    description: "Enter store details",
  },
  {
    title: "Timings",
    key: "timings",
    description: "Enter timings",
  },
  {
    title: "Store Address",
    key: "store-address",
    description: "Enter store address",
  },
  {
    title: "Success",
    key: "success",
    description: "B2B retailer created successfully",
  },
];

const ManageB2b = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { isMobile } = useScreenView();

  const appToast = useAppToast();
  const [searchParams] = useSearchParams();
  const sourcePage = searchParams.get("sourcePage");
  const customerType = searchParams.get("customerType");
  const appNav = useAppNav();
  const formMethods = useForm({
    defaultValues,
  });

  const [activeStep, setActiveStep] = useState(0);

  const [primaryBusinessOptions, setPrimaryBusinessOptions] = useState<any[]>(
    [],
  );
  const businessMapRef = useRef<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [busyLoader, setBusyLoader] = useState({ show: false, msg: "" });
  const [retailerData, setRetailerData] = useState<{
    name?: string;
    mobile?: string;
    storeName?: string;
    ownerName?: string;
    displayType?: { name: string; type: string } | null;
  }>({});
  // OTP refs removed — calling create API directly

  const onSubmit = async (data: any) => {
    setSubmitting(true);

    try {
      // Validate form fields one at a time
      const validation = validateB2bRetailerForm(data);
      if (!validation.status) {
        appToast.show({
          msg: t(validation.msg),
          color: "danger",
        });
        return;
      }

      // Check if mobile number already exists
      const checkMobileResponse = await FranchiseService.searchFranchise({
        mobile: parseInt(data.mobile),
      });

      if (
        checkMobileResponse?.statusCode === 200 &&
        checkMobileResponse?.data?.exists
      ) {
        appToast.show({
          msg: t("mobileNumberAlreadyExists"),
          color: "danger",
        });
        return;
      }

      // Prepare payload and call create API directly (OTP flow removed)
      const payload = prepareB2bRetailerPayload(data, businessMapRef.current);

      const createResponse = await FranchiseService.createSkRetailer(payload);

      if (
        createResponse?.statusCode === 200 ||
        createResponse?.statusCode === 201
      ) {
        const formData = formMethods.getValues();
        const createdFran = createResponse?.data?.data || {};
        const displayType = FranchiseService.getDisplaySubType(
          createdFran?.subType || "",
          createdFran?.networkType || "",
        );

        setRetailerData({
          name: formData.ownerName || formData.storeName || "",
          mobile: formData.mobile || "",
          storeName: formData.storeName || "",
          ownerName: formData.ownerName || "",
          displayType: displayType || null,
        });

        setActiveStep(3);
        formMethods.reset(defaultValues);
      } else {
        appToast.show({
          msg: createResponse?.data?.message || t("somethingWentWrong"),
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error in onSubmit:", error);
      appToast.show({
        msg: error?.response?.data?.message || t("somethingWentWrong"),
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // OTP verification removed — create happens directly in submit/step handlers

  const handleStoreAddressActiveStep = async (step: number) => {
    if (step !== 3) {
      setActiveStep(step);
      return;
    }
    const formData = formMethods.getValues();

    const validation = validateB2bRetailerForm(formData);
    if (!validation.status) {
      appToast.show({ msg: t(validation.msg), color: "danger" });
      return;
    }

    try {
      setBusyLoader({ show: true, msg: "Creating retailer..." });

      // Check if mobile number already exists
      const checkMobileResponse = await FranchiseService.searchFranchise({
        mobile: parseInt(formData.mobile),
      });

      if (
        checkMobileResponse?.statusCode === 200 &&
        checkMobileResponse?.data?.exists
      ) {
        appToast.show({ msg: t("mobileNumberAlreadyExists"), color: "danger" });
        setBusyLoader({ show: false, msg: "" });
        return;
      }

      // Prepare payload and create directly
      const payload = prepareB2bRetailerPayload(
        formData,
        businessMapRef.current,
      );

      const createResponse = await FranchiseService.createSkRetailer(payload);

      if (
        createResponse?.statusCode === 200 ||
        createResponse?.statusCode === 201
      ) {
        const createdFran = createResponse?.data || {};
        const displayType = FranchiseService.getDisplaySubType(
          createdFran?.sk_franchise_details?.franchise_sub_type || "",
          createdFran?.networkType || "",
        );

        setRetailerData({
          name: formData.ownerName || formData.storeName || "",
          mobile: formData.mobile || "",
          storeName: formData.storeName || "",
          ownerName: formData.ownerName || "",
          displayType: displayType || null,
        });

        setActiveStep(3);
        formMethods.reset(defaultValues);
      } else {
        appToast.show({
          msg: createResponse?.data?.message || t("somethingWentWrong"),
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error creating retailer:", error);
      appToast.show({
        msg: error?.response?.data?.message || t("somethingWentWrong"),
        color: "danger",
      });
    } finally {
      setBusyLoader({ show: false, msg: "" });
    }
  };

  // Fetch primary business options on mount and format them
  useEffect(() => {
    const fetchPrimaryBusiness = async () => {
      try {
        const resp = await CommonService.getBusinessCategories();
        const options = resp?.data?.data || [];
        const ordered = orderBy(options, "name", "asc");
        const mapped = ordered.map((item: any) => {
          businessMapRef.current[item._id] = item.name;
          return { value: item._id, label: item.name };
        });

        mapped.unshift({ value: "choose", label: "Choose" });

        setPrimaryBusinessOptions(mapped);
      } catch (e) {
        console.error("Error loading business options:", e);
      }
    };

    fetchPrimaryBusiness();
  }, []);

  // OTP resend/close removed as flow is no longer used

  const handleSuccessDone = () => {
    // After showing the success component, navigate if caller requested
    if (sourcePage === "paylater-assign") {
      const mobile = retailerData?.mobile || "";
      appNav.to(
        `/dashboard/paylater/assign?type=${customerType || "b2b"}&mobile=${mobile}`,
      );
    } else if (sourcePage === "pos") {
      appNav.to("/pos/billing");
    } else {
      // reset to first step
      setActiveStep(0);
      setRetailerData({});
    }
  };

  return (
    <>
      <AppHeader title={t("createB2bRetailer")} />
      <div className="app-page page-bg page-padding">
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

            <div className="section-content tw:space-y-4">
              <div className="theme-2-mobile-only tw:h-4" />
              <AppBreadcrumbs data={breadcrumbData} className="tw:mb-2" />
              <div className="tw:text-xs tw:text-gray-500">
                Create and manage B2B retailers to expand your business network.
              </div>
              <FormProvider {...formMethods}>
            <form
              onSubmit={formMethods.handleSubmit(onSubmit)}
              className="tw:space-y-6"
            >
              <div className="tw:text-center">
                <AppSteps
                  steps={steps}
                  activeKey={steps[activeStep].key}
                  isCompleted={activeStep === steps.length - 1}
                  borderMinWidth={isMobile ? 20 : 150}
                />
              </div>

              {activeStep === 0 && (
                <StoreDetails
                  setActiveStep={setActiveStep}
                  primaryBusinessOptions={primaryBusinessOptions}
                />
              )}

              {activeStep === 1 && (
                <StoreTimings setActiveStep={setActiveStep} />
              )}

              {/* {activeStep === 2 && (
                <StoreBasicInfo setActiveStep={setActiveStep} />
              )} */}

              {activeStep === 2 && (
                <StoreAddress setActiveStep={handleStoreAddressActiveStep} />
              )}

              {activeStep === 3 && (
                <Success
                  retailerData={retailerData}
                  displayTypeLabel={retailerData?.displayType?.name}
                  onDone={handleSuccessDone}
                />
              )}

              {/* <div className="tw:mt-6 tw:flex tw:justify-end tw:gap-2">
                <AppButton
                  type="submit"
                  isLoading={submitting}
                  disabled={submitting}
                >
                  <SaveIcon className="tw:text-xl" />
                  {t("create")}
                </AppButton>
              </div> */}
            </form>
              </FormProvider>
            </div>
          </div>
        </div>
      </div>

      <BusyLoader show={busyLoader.show} message={busyLoader.msg} />
    </>
  );
};

export default ManageB2b;
