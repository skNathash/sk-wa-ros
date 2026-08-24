import {
  ArrowLeft,
  ArrowRight,
  Globe,
  MessageCircle,
  Send,
  Store,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import ImgRender from "~/components/core/img/ImgRender";
import { MISSED_CALL_NUMBER, SUPPORT_WHATSAPP_NUMBER } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import OtpModal from "~/modals/core/otp-modal/OtpModal";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import { verifyOtp } from "./helper";

const HERO_IMG = "login/hero-retailer.jpg";

const OS_MODULES = [
  "Storefront",
  "Orders",
  "Catalogue",
  "Billing",
  "PayLater",
  "King Coins",
];

// "9606980465" / "919606980465" -> "+91 96069 80465"
const formatSupportNumber = (num: string) => {
  const local = num.length > 10 ? num.replace(/^91/, "") : num;
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`.trim();
};

interface ForgotForm {
  mobile: string;
}

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [otpMobile, setOtpMobile] = useState("");
  const [otpValidating, setOtpValidating] = useState(false);
  const [otpResending, setOtpResending] = useState(false);
  const [isManpower, setIsManpower] = useState(false);

  const forgotRespRef = useRef<any>(null);

  const appToast = useAppToast();
  const appNav = useAppNav();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ForgotForm>({
    defaultValues: { mobile: "" },
  });

  // Autofill mobile number from AuthService cache if available
  useEffect(() => {
    try {
      const cached = AuthService.getLastMobileNumber();
      if (cached) {
        setValue("mobile", cached);
      }
    } catch (e) {}
  }, [setValue]);

  const onSubmit = async (data: ForgotForm) => {
    if (!data.mobile) {
      appToast.show({ msg: "Please provide mobile number", color: "danger" });
      return;
    }

    if (!CommonService.isValidMobileNo(data.mobile)) {
      appToast.show({
        msg: "Please provide valid Mobile no.",
        color: "danger",
      });
      return;
    }

    setLoading(true);

    const validateResp = await AuthService.validateNumber(data.mobile);
    const isManpower = validateResp.data.isManpower;
    setIsManpower(isManpower);

    try {
      const p = {
        mobileNo: "" + data.mobile,
        userPlatformType: "RETAILER",
      };
      const resp = await AuthService.forgotPassword(p);
      if (resp.statusCode !== 200) {
        appToast.show({
          msg: resp.data?.message || "Failed to process request",
          color: "danger",
        });
        return;
      }
      // Store the mobile number in AuthService for later auto-fill
      AuthService.setLastMobileNumber(data.mobile);
      forgotRespRef.current = resp.data?.data;
      if (resp.data?.data?.otpRequired) {
        setOtpMobile(data.mobile);
        setOtpModal(true);
      } else {
        appToast.show({
          msg: resp.data?.message || "Password reset link sent",
          color: "success",
        });
        appNav.replace("/auth/login");
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to process request",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async ({ otp }: { otp: number | null }) => {
    if (!otp) {
      appToast.show({ msg: "Please provide otp", color: "danger" });
      return;
    }
    setOtpValidating(true);

    const resp = await verifyOtp(isManpower, {
      otpId: forgotRespRef.current?.otpRequestId,
      otp: Number(otp),
      mobileNo: otpMobile,
    });

    setOtpValidating(false);

    if (resp.statusCode === 200) {
      appToast.show({
        msg: resp.msg || "OTP verified. Please reset your password.",
        color: "success",
      });
      // Persist the verified mobile for auto-fill on login
      AuthService.setLastMobileNumber(otpMobile);
      appNav.replace("/auth/login");
      return;
    } else {
      appToast.show({
        msg: resp.msg || "Failed to verify OTP",
        color: "danger",
      });
    }
  };

  const handleOtpResend = async () => {
    setOtpResending(true);
    try {
      const params = {
        id: forgotRespRef.current?._id,
        mobileNo: otpMobile,
      };
      const resp = await AuthService.resendOtp(params);
      if (resp.statusCode !== 200) {
        appToast.show({
          msg: resp.data?.message || "Failed to resend OTP",
          color: "danger",
        });
        return;
      }
      appToast.show({ msg: "OTP sent successfully", color: "success" });
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to resend OTP",
        color: "danger",
      });
    } finally {
      setOtpResending(false);
    }
  };

  const handleContactSupport = () => {
    const waUrl = CommonService.prepareWhatsappMessage(
      "hi",
      SUPPORT_WHATSAPP_NUMBER,
    );
    CommonService.windowOpenHandler(waUrl, () => {});
  };

  const handleHelperCall = () => {
    // dial without the country code
    const dialNumber =
      MISSED_CALL_NUMBER.length > 10
        ? MISSED_CALL_NUMBER.replace(/^91/, "")
        : MISSED_CALL_NUMBER;
    CommonService.windowOpenHandler(`tel:${dialNumber}`, () => {});
  };

  const mobileField = register("mobile");

  return (
    <>
      <div className="login-page app-page">
        <nav className="sk-nav">
          <div className="sk-nav-inner">
            <div className="sk-logo">
              <ImgRender src="logo/logo.png" alt="StoreKing" />
            </div>
            <button
              type="button"
              className="sk-nav-help"
              onClick={handleContactSupport}
            >
              <span className="sk-nav-help-icon">
                <MessageCircle size={13} />
              </span>
              Need help? Chat on{" "}
              <span className="sk-nav-help-num">
                {formatSupportNumber(SUPPORT_WHATSAPP_NUMBER)}
              </span>
            </button>
          </div>
        </nav>

        <div className="sk-shell">
          {/* ---------- Branded panel ---------- */}
          <aside className="sk-brand">
            <div className="sk-brand-photo-frame">
              <ImgRender src={HERO_IMG} className="sk-brand-photo" />
            </div>

            <div className="sk-brand-content">
              <div>
                <span className="sk-os-badge">
                  <span className="sk-os-badge-mark">
                    <Store size={12} strokeWidth={2.4} />
                  </span>
                  StoreKing <strong>Retail OS</strong>
                </span>

                <h2 className="sk-brand-headline">
                  Welcome back, <em>King</em>. <br />
                  Your town is waiting.
                </h2>
                <p className="sk-brand-sub">
                  Log in to manage your online storefront, orders, catalogue,
                  King Coins and PayLater — all from one place.
                </p>
              </div>

              <div className="sk-brand-storefront">
                <span className="sk-brand-storefront-icon">
                  <Globe size={16} strokeWidth={2.2} />
                </span>
                <span className="sk-brand-storefront-body">
                  <span className="sk-brand-storefront-label">
                    Your live storefront
                  </span>
                  <span className="sk-brand-storefront-url">
                    storeking.in/your-mobile
                  </span>
                </span>
              </div>

              <div className="sk-brand-modules">
                <div className="sk-brand-modules-label">
                  What&apos;s inside your OS
                </div>
                <div className="sk-module-chips">
                  {OS_MODULES.map((m) => (
                    <span className="sk-module-chip" key={m}>
                      {m}
                    </span>
                  ))}
                </div>
                <div className="sk-module-chips sk-module-chips-stat">
                  <span className="sk-module-chip">
                    <strong>20,000+</strong> retailers signed in today
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* ---------- Form ---------- */}
          <main className="sk-canvas">
            <div className="sk-head">
              <span className="sk-eyebrow">Reset password</span>
              <h1 className="sk-h1">
                Send me a <em>reset code</em>.
              </h1>
              <p className="sk-sub">
                We&apos;ll send a 6-digit code to your{" "}
                <strong>registered mobile number</strong>.
              </p>
            </div>

            <form className="sk-card" onSubmit={handleSubmit(onSubmit)}>
              <Link to="/auth/login" className="sk-back-link">
                <ArrowLeft size={16} />
                Back to login
              </Link>

              <div className="sk-field">
                <div className="sk-field-label">
                  <span>Confirm your mobile number</span>
                </div>
                <label className="sk-input-wrap sk-phone-input">
                  <span className="sk-phone-cc">
                    <span className="sk-flag" aria-hidden="true" />
                    +91
                  </span>
                  <input
                    {...mobileField}
                    onChange={(e) => {
                      e.target.value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      mobileField.onChange(e);
                    }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel-national"
                    placeholder="98765 43210"
                  />
                </label>
                {errors.mobile?.message && (
                  <span className="sk-field-error">
                    {errors.mobile.message as string}
                  </span>
                )}
              </div>

              <button type="submit" className="sk-btn-primary">
                <span className="sk-btn-primary-left">
                  <span className="sk-btn-primary-icon">
                    <Send size={18} strokeWidth={2.2} />
                  </span>
                  <span>
                    <span className="sk-btn-primary-main">
                      Send my reset code
                    </span>
                    <span className="sk-btn-primary-sub">
                      A 6-digit code on your registered number
                    </span>
                  </span>
                </span>
                <span className="sk-btn-primary-arrow">
                  <ArrowRight size={20} strokeWidth={2.4} />
                </span>
              </button>
            </form>

            <div className="sk-helper-note">
              Number changed?{" "}
              <button type="button" onClick={handleHelperCall}>
                Call our helper on {formatSupportNumber(MISSED_CALL_NUMBER)}
              </button>
            </div>

            <div className="sk-foot">
              <button
                type="button"
                className="sk-foot-link"
                onClick={handleContactSupport}
              >
                <MessageCircle size={15} />
                Trouble resetting? Talk to us
              </button>
            </div>

            <div className="sk-powered">
              Powered by
              <ImgRender
                src="/ai/ai.gif"
                className="tw:h-7 tw:inline-block tw:rounded-full"
              />
            </div>
          </main>
        </div>
      </div>

      <BusyLoader show={loading} />
      <OtpModal
        show={otpModal}
        verify={handleOtpVerify}
        resend={handleOtpResend}
        close={() => setOtpModal(false)}
        mobile={otpMobile}
        validating={otpValidating}
        resending={otpResending}
      />
    </>
  );
};

export default ForgotPassword;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Forgot Password"),
    },
  ];
}
