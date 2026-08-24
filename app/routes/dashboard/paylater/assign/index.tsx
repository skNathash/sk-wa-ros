import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import AppButton from "~/components/core/button/AppButton";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router";
import Steps from "./components/Steps";
import Customers from "./components/customers/Customers";
import KycStep from "~/shared/accounts/paylater/kyc-form/components/KycStep";
import DocumentsStep from "~/shared/accounts/paylater/kyc-form/components/DocumentsStep";
import NomineeStep from "~/shared/accounts/paylater/kyc-form/components/NomineeStep";
import Limit from "./components/limit/Limit";
import { Phone, MapPin, Hash, BadgeCheck } from "lucide-react";
import type { CustomerItem, CustomerType } from "./components/customers/helper";
import { fetchCustomerDetails } from "./components/customers/helper";
import PageLoader from "~/components/core/page-loader/PageLoader";
import AuthService from "~/services/AuthService";
import PaylaterService from "~/services/PaylaterService";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import PaylaterPane from "~/shared/accounts/components/paylater/paylater-pane/PaylaterPane";
import useAppToast from "~/hooks/useAppToast";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import SuccessModal from "./modals/SuccessModal";
import {
  buildKycPrefill,
  buildPaylaterKycPayload,
  getDefaultKycFormValues,
  type PaylaterKycFormData,
  type PaylaterStorePhoto,
} from "~/shared/accounts/paylater/kyc-form/helper";

const ALL_STEP_KEYS = [
  "customer",
  "kyc",
  "documents",
  "nominee",
  "limit",
] as const;
type StepKey = (typeof ALL_STEP_KEYS)[number];

const getBreadcrumbs = (
  type: CustomerType,
  isManpower: boolean,
): BreadcrumbItem[] => [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
    langKey: "dashboard",
  },
  {
    label: "PayLater",
    redirect: { path: `/dashboard/paylater/wallets/${type}` },
    langKey: "paylater",
  },
  {
    label: isManpower ? "Create PayLater Request" : "Assign PayLater",
  },
];

type FormData = PaylaterKycFormData & {
  // Selected customer
  customer: CustomerItem | null;
  customerType: CustomerType;
  // Limit
  approvalAmount: number | null;
  approvalValidity: string;
  approvalReason: string;
};

const PaylaterAssignPage = () => {
  const { t } = useTranslation(["common", "menu"]);
  const navigate = useNavigate();
  const appToast = useAppToast();
  const [searchParams] = useSearchParams();
  const type = (searchParams.get("type") || "b2b") as CustomerType;
  const isManpower = AuthService.isManpowerLoggedIn();
  const actionLabel = isManpower
    ? "Create PayLater Request"
    : "Assign PayLater";
  const title = `${actionLabel} - ${type === "b2c" ? "B2C" : "B2B"} Customer`;
  const STEP_KEYS = React.useMemo<readonly StepKey[]>(
    () =>
      isManpower
        ? (["customer", "kyc", "documents", "nominee"] as const)
        : ALL_STEP_KEYS,
    [isManpower],
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [fetchingDetails, setFetchingDetails] = React.useState(false);
  const [storePhotos, setStorePhotos] = React.useState<PaylaterStorePhoto[]>(
    [],
  );
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  const methods = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      ...getDefaultKycFormValues(),
      customer: null,
      customerType: type,
      approvalAmount: null,
      approvalValidity: "",
      approvalReason: "",
    },
  });

  const [activeStep, setActiveStep] = React.useState<StepKey>("customer");

  const handleCustomerSelect = async (customer: CustomerItem) => {
    // Reset all form fields before populating new customer data
    methods.reset({
      ...getDefaultKycFormValues(),
      customer,
      customerType: type,
      approvalAmount: null,
      approvalValidity: "",
      approvalReason: "",
    });
    setStorePhotos([]);

    setFetchingDetails(true);
    try {
      const details = await fetchCustomerDetails(customer, type);
      const { values, storePhotos: photos } = buildKycPrefill(details, type);
      methods.setValue("kyc", values.kyc);
      methods.setValue("documents", values.documents);
      setStorePhotos(photos);
    } catch {
      // Continue even if fetch fails - user can fill manually
    } finally {
      setFetchingDetails(false);
    }
    setActiveStep("kyc");
  };

  const currentIndex = STEP_KEYS.indexOf(activeStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === STEP_KEYS.length - 1;

  const goNext = () => {
    if (!isLastStep) {
      if (activeStep === "kyc") {
        const name = (methods.getValues("kyc.name") || "").trim();
        if (!name) {
          appToast.show({ msg: "Name is required", color: "danger" });
          return;
        }
      }
      setActiveStep(STEP_KEYS[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    if (!isFirstStep) {
      setActiveStep(STEP_KEYS[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmitClick = () => {
    const formData = methods.getValues();
    if (!formData.customer) return;

    if (!isManpower) {
      if (!formData.approvalAmount) {
        appToast.show({ msg: "Credit limit is required", color: "danger" });
        return;
      }
      if (!formData.approvalValidity) {
        appToast.show({
          msg: "Credit valid till is required",
          color: "danger",
        });
        return;
      }
      if (!(formData.approvalReason || "").trim()) {
        appToast.show({ msg: "Remarks is required", color: "danger" });
        return;
      }
    }

    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    const formData = methods.getValues();
    const customer = formData.customer;
    if (!customer) return;

    const payload = buildPaylaterKycPayload(customer, type, formData, {
      approvalAmount: formData.approvalAmount,
      approvalValidity: formData.approvalValidity,
      approvalReason: formData.approvalReason,
    });

    setSubmitting(true);
    try {
      const resp: any = isManpower
        ? await PaylaterService.createRequest(payload)
        : await PaylaterService.enablePaylater("b2b", payload);
      if (resp.statusCode === 200) {
        setShowSuccessModal(true);
      } else {
        appToast.show({
          msg:
            resp.data?.message ||
            (isManpower
              ? "Failed to create PayLater request"
              : "Failed to assign PayLater"),
          color: "danger",
        });
      }
    } catch {
      appToast.show({
        msg: "Something went wrong. Please try again.",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCustomer = methods.watch("customer");

  const renderStepContent = () => {
    switch (activeStep) {
      case "customer":
        return <Customers type={type} onSelect={handleCustomerSelect} />;
      case "kyc":
        return <KycStep type={type} storePhotos={storePhotos} />;
      case "documents":
        return <DocumentsStep />;
      case "nominee":
        return <NomineeStep />;
      case "limit":
        return <Limit />;
    }
  };

  return (
    <FormProvider {...methods}>
      <AppHeader title={title} sectionKey="business" activeTab="paylater" />
      <div
        className={`app-page page-bg tw:p-4 ${activeStep !== "customer" ? "has-footer" : ""}`}
      >
        <div className="app-container">
          <div className="section-layout">
            {/* Desktop-only left rail — section side menu so the assign flow
                stays inside the PayLater section instead of reading as a
                detached page. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="business"
                  activeTab="paylater"
                  title={t("manageBusiness", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                {/* Main column spans the full grid — in theme-2 desktop the CSS
                    lifts the side pane out of it into the fixed list rail. */}
                <AppPaneMain className="tw:lg:col-span-12">
                  <AppBreadcrumbs
                    data={getBreadcrumbs(type, isManpower)}
                    className="tw:mb-4"
                  />

                  <Steps
                    activeKey={activeStep}
                    className="tw:mb-4"
                    hideLimit={isManpower}
                  />

                  {activeStep !== "customer" && selectedCustomer && (
                    <section
                      aria-label="Selected customer"
                      className="tw:bg-card tw:border tw:border-border tw:rounded-lg tw:p-4 tw:mb-4"
                    >
                      <div className="tw:flex tw:items-start tw:gap-3">
                        <div
                          aria-hidden="true"
                          className="tw:w-11 tw:h-11 tw:bg-primary tw:text-primary-foreground tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-semibold tw:shrink-0"
                        >
                          {selectedCustomer.initials ||
                            (selectedCustomer.name || "U")[0]?.toUpperCase()}
                        </div>
                        <div className="tw:min-w-0 tw:flex-1">
                          <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wider tw:text-muted-foreground tw:mb-0.5">
                            Selected Customer
                          </div>
                          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1.5">
                            <h3 className="tw:text-base tw:font-semibold tw:text-foreground tw:truncate">
                              {selectedCustomer.name || "-"}
                            </h3>
                            <span
                              aria-label={`Customer type ${type === "b2b" ? "B2B" : "B2C"}`}
                              className="tw:inline-flex tw:items-center tw:gap-1 tw:bg-emerald-50 tw:text-emerald-700 tw:text-[10px] tw:font-semibold tw:px-1.5 tw:py-0.5 tw:rounded tw:border tw:border-emerald-200 tw:shrink-0"
                            >
                              <BadgeCheck size={10} aria-hidden="true" />
                              {type === "b2b" ? "B2B" : "B2C"}
                            </span>
                          </div>
                          <dl className="tw:flex tw:items-center tw:gap-x-4 tw:gap-y-1 tw:flex-wrap tw:text-xs tw:text-muted-foreground">
                            <div className="tw:inline-flex tw:items-center tw:gap-1.5 tw:min-w-0">
                              <Phone
                                size={12}
                                aria-hidden="true"
                                className="tw:shrink-0 tw:opacity-70"
                              />
                              <dt className="sr-only">Mobile</dt>
                              <dd className="tw:truncate tw:tabular-nums">
                                {selectedCustomer.mobile || "-"}
                              </dd>
                            </div>
                            <div className="tw:inline-flex tw:items-center tw:gap-1.5 tw:min-w-0">
                              <Hash
                                size={12}
                                aria-hidden="true"
                                className="tw:shrink-0 tw:opacity-70"
                              />
                              <dt className="sr-only">
                                {type === "b2b"
                                  ? "Franchise ID"
                                  : "Reference ID"}
                              </dt>
                              <dd className="tw:font-mono tw:truncate">
                                {selectedCustomer.franchiseId ||
                                  selectedCustomer.refNo ||
                                  selectedCustomer.referenceId ||
                                  selectedCustomer._id ||
                                  "-"}
                              </dd>
                            </div>
                            {selectedCustomer.location && (
                              <div className="tw:inline-flex tw:items-center tw:gap-1.5 tw:min-w-0">
                                <MapPin
                                  size={12}
                                  aria-hidden="true"
                                  className="tw:shrink-0 tw:opacity-70"
                                />
                                <dt className="sr-only">Location</dt>
                                <dd className="tw:truncate">
                                  {selectedCustomer.location}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      </div>
                    </section>
                  )}

                  {fetchingDetails ? <PageLoader /> : renderStepContent()}
                </AppPaneMain>

                {/* Side column — theme-2 desktop only. The assign flow is a
                    focused workflow, so the pane keeps the section chips and
                    the approval queues; the period strip and nudge list are
                    dropped, they belong to the analytics landing. */}
                <AppPaneSide className="app-pane-only">
                  <PaylaterPane
                    title={t("paylater")}
                    showPeriodSummary={false}
                    showNudgeTargets={false}
                  />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeStep !== "customer" && (
        <div className="app-footer">
          <div className="app-container">
            <div className="tw:flex tw:justify-between">
              <AppButton
                color="secondary"
                onClick={goPrev}
                disabled={isFirstStep}
              >
                {t("back", "Back")}
              </AppButton>
              <AppButton
                color="primary"
                onClick={isLastStep ? handleSubmitClick : goNext}
                disabled={submitting}
              >
                {isLastStep
                  ? submitting
                    ? t("submitting", "Submitting...")
                    : t("submit", "Submit")
                  : t("next", "Next")}
              </AppButton>
            </div>
          </div>
        </div>
      )}
      <AppAlertDialog
        show={showConfirm}
        title="Confirm Submission"
        description={
          isManpower
            ? "Are you sure you want to create a PayLater request for this customer?"
            : "Are you sure you want to assign PayLater to this customer?"
        }
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      />

      <SuccessModal
        show={showSuccessModal}
        isManpower={isManpower}
        customerName={selectedCustomer?.name}
        parentRetailerName={AuthService.getLoggedInUser()?.name}
        onClose={() => {
          setShowSuccessModal(false);
          navigate(`/dashboard/paylater/wallets/${type}?tab=${type}-wallets`);
        }}
      />
    </FormProvider>
  );
};

export default PaylaterAssignPage;
