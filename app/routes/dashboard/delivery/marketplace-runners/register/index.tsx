import { ArrowLeft, ArrowRight, SaveIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import AppSteps from "~/components/core/steps/AppSteps";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import OtpModal from "~/modals/core/otp-modal/OtpModal";
import CommonService from "~/services/CommonService";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";
import PageAccessService from "~/services/PageAccessService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { SectionTab } from "~/types/CommonTypes";
import BasicInfo from "./components/BasicInfo";
import KycInfo from "./components/KycInfo";
import PendingInvites from "./components/PendingInvites";
import PreviewInfo from "./components/PreviewInfo";
import RegisterSidePane from "./components/side-pane/RegisterSidePane";
import VehicleInfo from "./components/VehicleInfo";
import {
  DEFAULT_FORM,
  STEPS,
  getCreatePayload,
  validateStep,
  type RunnerForm,
} from "./helper";

const LIST_PATH = "/dashboard/delivery/marketplace-runners";

/** Toggle between inviting a new runner and picking up pending sign-ups. */
const REGISTER_TABS: SectionTab[] = [
  { label: "Invite", key: "invite" },
  { label: "Pending", key: "pending" },
];

export async function clientLoader() {
  return PageAccessService.canAccessPage(["DELIVERY.DISPATCH"]);
}

/**
 * Register a marketplace runner across three steps. The identity is proved
 * with an OTP up front; the collected answers live in the form until the final
 * save opens the runner in one create call. There is no update endpoint, so a
 * half-finished registration is simply lost if the screen is left.
 */
const MarketplaceRunnerRegister = () => {
  const appToast = useAppToast();
  const appNav = useAppNav();
  const { isMobile } = useScreenView();

  const formMethods = useForm<RunnerForm>({ defaultValues: DEFAULT_FORM });
  const { getValues, setValue, control } = formMethods;
  const mobile = useWatch({ control, name: "mobile" });

  const [activeStep, setActiveStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otpModal, setOtpModal] = useState({ show: false, verifying: false });
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [view, setView] = useState<string>("invite");
  const [mobileStatus, setMobileStatus] = useState<
    "idle" | "checking" | "valid" | "invalid"
  >("idle");

  /** Set once the mobile has cleared the OTP — the create call keys off it. */
  const otpRequestIdRef = useRef<string>("");

  const handleViewTab = (tab: SectionTab) => setView(tab.key);

  /** Confirm the mobile is not already tied to another runner, debounced. */
  const checkMobile = useDebouncedCallback(async (value: string) => {
    if (!/^\d{10}$/.test(value)) {
      setMobileStatus("idle");
      return;
    }

    setMobileStatus("checking");
    const resp = await MarketplaceRunnerService.checkMobile(value);

    if (resp?.statusCode !== 200) {
      setMobileStatus("invalid");
      failed(resp);
      return;
    }

    // A `_id` back means the mobile is already taken — clear it so the user
    // re-enters, and let the inline hint explain why.
    if (resp?.data?.data?._id) {
      setValue("mobile", "");
      setMobileStatus("invalid");
      appToast.show({
        msg: "This mobile number is already registered to another runner",
        color: "danger",
      });
      return;
    }

    setMobileStatus("valid");
  }, 500);

  /** Reset the mobile check whenever the number changes. */
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileStatus("idle");
    checkMobile.cancel();
    if (/^\d{10}$/.test(value)) {
      checkMobile(value);
    }
  };

  const goTo = (step: number) => {
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const failed = (resp: any) =>
    appToast.show({
      msg: resp?.data?.message || "Something went wrong",
      color: "danger",
    });

  const requestOtp = useCallback(async () => {
    const { name, mobile } = getValues();
    const resp = await MarketplaceRunnerService.requestOtp({
      name: name.trim(),
      mobile: mobile.toString().trim(),
    });

    if (resp?.statusCode !== 200 && resp?.statusCode !== 201) {
      failed(resp);
      return false;
    }

    otpRequestIdRef.current = resp?.data?.data?.otpRequestId;
    return true;
  }, []);

  /** Step one — prove the mobile with an OTP before anything else opens. */
  const submitBasic = async () => {
    setBusy(true);
    const sent = await requestOtp();
    setBusy(false);

    if (sent) {
      setOtpModal({ show: true, verifying: false });
    }
  };

  /** Step two — vehicle is kept in the form, no call yet. */
  const submitVehicle = async () => {
    goTo(2);
  };

  /** Step three — the runner is opened once, with every collected field. */
  const submitKyc = async () => {
    setBusy(true);
    const resp = await MarketplaceRunnerService.createRunner({
      otpRequestId: otpRequestIdRef.current,
      ...getCreatePayload(getValues()),
    });
    setBusy(false);

    if (resp?.statusCode !== 200 && resp?.statusCode !== 201) {
      failed(resp);
      return;
    }

    appToast.show({ msg: "Runner registered successfully", color: "success" });
    appNav.replace(LIST_PATH);
  };

  const handleNext = () => {
    const key = STEPS[activeStep].key;
    const { msg } = validateStep(key, getValues());

    if (msg) {
      appToast.show({ msg, color: "danger" });
      return;
    }

    if (key === "basic") {
      // Block until the mobile has cleared the availability check.
      if (mobileStatus === "checking") {
        appToast.show({
          msg: "Please wait while we verify the mobile number",
          color: "danger",
        });
        return;
      }
      if (mobileStatus === "invalid") {
        appToast.show({
          msg: "This mobile number is already registered to another runner",
          color: "danger",
        });
        return;
      }
      // Already proved — the identity is locked, so there is nothing to resend.
      if (verified) {
        goTo(1);
        return;
      }
      submitBasic();
      return;
    }

    if (key === "vehicle") {
      submitVehicle();
    }

    if (key === "kyc") {
      goTo(3);
    }
  };

  const handleBack = () => goTo(Math.max(activeStep - 1, 0));

  const handleSave = () => {
    const { msg } = validateStep("preview", getValues());

    if (msg) {
      appToast.show({ msg, color: "danger" });
      return;
    }

    setShowConfirmSubmit(true);
  };

  const confirmSubmit = () => {
    setShowConfirmSubmit(false);
    submitKyc();
  };

  const verifyOtp = async ({ otp }: { otp: number }) => {
    setOtpModal({ show: true, verifying: true });

    const resp = await MarketplaceRunnerService.verifyOtp({
      otpRequestId: otpRequestIdRef.current,
      otp: otp.toString(),
    });

    if (resp?.statusCode !== 200 && resp?.statusCode !== 201) {
      setOtpModal({ show: true, verifying: false });
      failed(resp);
      return;
    }

    setOtpModal({ show: false, verifying: false });
    setVerified(true);
    appToast.show({ msg: "Mobile verified", color: "success" });
    goTo(1);
  };

  const resendOtp = async () => {
    if (await requestOtp()) {
      appToast.show({ msg: "OTP sent successfully", color: "success" });
    }
  };

  const activeKey = STEPS[activeStep].key;
  const isLastStep = activeStep === STEPS.length - 1;

  return (
    <>
      <AppHeader
        title="Register Runner"
        sectionKey="bill"
        activeTab="logistics"
        mobileLead="back"
      />

      <div className="app-page page-bg page-padding">
        {/* Invite / Pending — switch between a fresh runner and unfinished
            sign-ups. */}
        <SectionTabs
          tabs={REGISTER_TABS}
          activeTab={view}
          onTabChange={handleViewTab}
          noShadow
          sticky
        />

        {/* Capped and centred so the form doesn't stretch across a wide desktop. */}
        <div className="section-layout section-layout--tight tw:xl:max-w-7xl tw:xl:mx-auto">
          {/* Desktop-only left rail — bill section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="bill"
                activeTab="logistics"
                title="Bill"
              />
            </div>
          </aside>

          <div className="section-content">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              <AppPaneMain className="tw:lg:col-span-12">
                {view === "pending" ? (
                  <PendingInvites />
                ) : (
                  <div>
                    <AppSteps
                      steps={STEPS}
                      activeKey={activeKey}
                      borderMinWidth={isMobile ? 20 : 120}
                      className="app-bleed-x"
                    />

                    <FormProvider {...formMethods}>
                      {/* Kept mounted so a step's answers survive going back. */}
                      <div
                        style={{
                          display: activeKey === "basic" ? "block" : "none",
                        }}
                      >
                        <BasicInfo
                          verified={verified}
                          mobileStatus={mobileStatus}
                          onMobileChange={handleMobileChange}
                        />
                      </div>
                      <div
                        style={{
                          display: activeKey === "vehicle" ? "block" : "none",
                        }}
                      >
                        <VehicleInfo />
                      </div>
                      <div
                        style={{
                          display: activeKey === "kyc" ? "block" : "none",
                        }}
                      >
                        <KycInfo />
                      </div>
                      <div
                        style={{
                          display:
                            activeKey === "preview" ? "block" : "none",
                        }}
                      >
                        <PreviewInfo />
                      </div>
                    </FormProvider>
                  </div>
                )}
              </AppPaneMain>

              {/* Runner summary — theme-2 desktop split layout only. */}
              <AppPaneSide className="app-pane-only">
                <RegisterSidePane />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      <div className="app-footer tw:px-4 tw:py-3 tw:bg-white tw:border-t tw:flex tw:justify-between tw:gap-2">
        {view === "invite" && (
          <>
            <div className="tw:flex-1">
              {activeStep > 0 && (
                <AppButton fill="outline" color="secondary" onClick={handleBack}>
                  <ArrowLeft className="tw:text-xl" />
                  Back
                </AppButton>
              )}
            </div>

            <div className="tw:flex tw:justify-end">
              {isLastStep ? (
                <AppButton onClick={handleSave}>
                  <SaveIcon className="tw:text-xl" />
                  Save
                </AppButton>
              ) : (
                <AppButton
                  onClick={handleNext}
                  disabled={mobileStatus === "checking"}
                >
                  Next
                  <ArrowRight className="tw:text-xl" />
                </AppButton>
              )}
            </div>
          </>
        )}
      </div>

      <BusyLoader show={busy} />

      <OtpModal
        show={otpModal.show}
        close={() => setOtpModal({ show: false, verifying: false })}
        mobile={mobile}
        verify={verifyOtp}
        resend={resendOtp}
        validating={otpModal.verifying}
      />

      <AppAlertDialog
        title="Confirm runner registration"
        description="Are you sure you want to register this runner? Please review the details before submitting."
        show={showConfirmSubmit}
        okText="Confirm"
        cancelText="Cancel"
        onConfirm={confirmSubmit}
        onCancel={() => setShowConfirmSubmit(false)}
      />
    </>
  );
};

export default MarketplaceRunnerRegister;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Register Runner"),
    },
  ];
}
