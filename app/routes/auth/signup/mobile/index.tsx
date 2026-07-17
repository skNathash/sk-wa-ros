import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import AppCard from "~/components/core/card/AppCard";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import ImgRender from "~/components/core/img/ImgRender";
import useAppToast from "~/hooks/useAppToast";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import OtpModal from "~/modals/core/otp-modal/OtpModal";
import MobileExistsModal from "./modals/MobileExistsModal";
import FranchiseService from "~/services/FranchiseService";
import CommonService from "~/services/CommonService";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import { ALERT_DISMISS_TIME } from "~/constants";

const SignupMobile = () => {
  const signupTemp = FranchiseService.getSignupTemp();
  const { register, getValues } = useForm({
    defaultValues: {
      mobile: signupTemp.mobile || "",
    },
  });

  const appToast = useAppToast();

  const [otpModal, setOtpModal] = useState({
    mobile: "",
    show: false,
    validating: false,
    resending: false,
  });

  const [mobileExistsModal, setMobileExistsModal] = useState({
    show: false,
    mobile: "",
  });

  const otpRespRef = useRef<any>({});
  const [busyLoading, setBusyLoading] = useState({ show: false, message: "" });
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const { t } = useTranslation(["signup"]);

  const submit = async () => {
    // read mobile from form input via DOM is not ideal; react-hook-form useForm here
    // provides register only; use a quick query to get value
    const mobile = (getValues as any)("mobile") || "";

    if (!mobile) {
      appToast.show({
        msg: t("register.validation.mobileRequired"),
        color: "danger",
      });
      return;
    }

    if (!CommonService.isValidMobileNo(mobile)) {
      appToast.show({
        msg: t("register.validation.invalidMobile"),
        color: "danger",
      });
      return;
    }

    // Check if mobile already exists
    try {
      setBusyLoading({ show: true, message: t("register.otp.checkingMobile") });
      const checkMobileResponse = await FranchiseService.searchFranchise({
        mobile: parseInt(mobile),
      });
      setBusyLoading({
        show: false,
        message: t("register.otp.checkingMobile"),
      });

      if (
        checkMobileResponse.statusCode === 200 &&
        checkMobileResponse.data &&
        checkMobileResponse.data.exists
      ) {
        setMobileExistsModal({ show: true, mobile });
        return;
      }

      // Clear busy after mobile check; subsequent calls don't use BusyLoader
      setBusyLoading({ show: false, message: "" });

      // Send OTP for registration
      const r = await FranchiseService.sendOtpForRegistration(mobile);
      if (r.statusCode === 200) {
        otpRespRef.current = r.data;
        // persist mobile and otp response in temporary signup storage
        FranchiseService.updateSignupTemp({ mobile, otpResp: r.data });

        setOtpModal({
          mobile: mobile,
          show: true,
          validating: false,
          resending: false,
        });
        appToast.show({ msg: t("register.otp.sent"), color: "success" });
      } else {
        appToast.show({
          msg: r.data?.message || "Something went wrong",
          color: "danger",
        });
      }
    } catch (e: any) {
      setBusyLoading({ show: false, message: "" });
      appToast.show({
        msg: e?.message || "Failed to send OTP",
        color: "danger",
      });
    }
  };

  const verifyOtp = async ({ otp }: { otp: number | null }) => {
    if (!otp) {
      appToast.show({ msg: t("register.otp.enter"), color: "danger" });
      return;
    }

    const mobile = (getValues as any)("mobile") || otpModal.mobile;

    setOtpModal({ ...otpModal, validating: true });

    try {
      const r = await FranchiseService.verifyOtpForRegistration(
        otpRespRef.current._id,
        otp,
        mobile,
      );

      if (r.statusCode === 200) {
        setOtpModal({
          show: false,
          mobile: "",
          validating: false,
          resending: false,
        });
        appToast.show({
          msg: t("register.otp.verified"),
          color: "success",
        });
        // After verify, store verified mobile in FranchiseService temp and navigate
        try {
          FranchiseService.updateSignupTemp({ mobile });
          appNav.to("/auth/signup/personal-info");
        } catch (e) {}
      } else {
        FranchiseService.updateSignupTemp({ mobile });
        setOtpModal({ ...otpModal, validating: false });
        appToast.show({
          msg: r.data?.message || "Failed to verify OTP",
          color: "danger",
        });
      }
    } catch (e: any) {
      setOtpModal({ ...otpModal, validating: false });
      appToast.show({
        msg: e?.message || "Failed to verify OTP",
        color: "danger",
      });
    }
  };

  const resendOtp = async () => {
    setOtpModal({ ...otpModal, resending: true });
    try {
      const r = await FranchiseService.resendOtpForRegistration(
        otpRespRef.current._id,
      );
      setOtpModal({ ...otpModal, resending: false });
      if (r.statusCode === 200) {
        appToast.show({ msg: t("register.otp.resent"), color: "success" });
      } else {
        appToast.show({
          msg: r.data?.message || t("register.otp.resendFailed"),
          color: "danger",
        });
      }
    } catch (e: any) {
      setOtpModal({ ...otpModal, resending: false });
      appToast.show({
        msg: e?.message || t("register.otp.resendFailed"),
        color: "danger",
      });
    }
  };

  return (
    <>
      <AppSimpleHeader title={t("register.pageTitle")} />
      <div className="app-page signup-bg tw:bg-gray-50 tw:min-h-screen">
        <div className="tw:max-w-md tw:mx-auto signup-otp-bg tw:px-4 tw:pt-8">
          <AppCard className="tw:z-10">
            <h1 className="tw:text-xl tw:font-semibold tw:text-gray-900">
              {t("register.headingTitle")}
            </h1>
            <p className="tw:mt-1 tw:text-xs tw:text-gray-600">
              {t("register.headingSubtitle")}
            </p>

            <h2 className="tw:mt-5 tw:text-base tw:font-semibold tw:text-black">
              {t("register.otp.title")}
            </h2>
            <p className="tw:mt-1 tw:text-xs tw:text-gray-600">
              {t("register.otp.subtitle")}
            </p>

            <AppInput
              type="tel"
              placeholder={t("register.contact.mobile.placeholder")}
              register={register}
              name="mobile"
              inputClassName="tw:bg-white tw:text-sm tw:h-11 tw:px-3 tw:ps-12"
              className="tw:mt-3"
              leftIcon={"+91"}
              maxLength={10}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                e.target.value = (e.target.value || "")
                  .replace(/\D+/g, "")
                  .slice(0, 10);
              }}
            />

            <div className="tw:mt-4 tw:flex tw:items-center tw:justify-between">
              <p className="tw:text-xs tw:text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => appNav.to("/auth/login")}
                  className="tw:font-semibold tw:text-orange-600 tw:hover:text-orange-700 tw:underline"
                >
                  Login
                </button>
              </p>
              <AppButton
                color="primary"
                className="tw:py-2.5 tw:font-semibold tw:text-sm"
                onClick={submit}
              >
                {t("register.submit.continue")}
              </AppButton>
            </div>
          </AppCard>

          <div className="tw:max-w-sm tw:mx-auto tw:mt-2 tw:mix-blend-multiply">
            <ImgRender src="signup/otp-bg.jpg" />
          </div>
          <BusyLoader show={busyLoading.show} message={busyLoading.message} />
          <MobileExistsModal
            show={mobileExistsModal.show}
            mobile={mobileExistsModal.mobile}
            onClose={() => setMobileExistsModal({ show: false, mobile: "" })}
            onLogin={() => {
              setMobileExistsModal({ show: false, mobile: "" });
              appNav.to("/auth/login");
            }}
          />
          <OtpModal
            mobile={otpModal.mobile}
            resend={resendOtp}
            show={otpModal.show}
            verify={verifyOtp}
            validating={otpModal.validating}
            resending={otpModal.resending}
            close={() => setOtpModal({ ...otpModal, show: false })}
          />
        </div>
      </div>
    </>
  );
};

export default SignupMobile;
