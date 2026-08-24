import {
  ArrowRight,
  Globe,
  KeyRound,
  Lock,
  LogIn,
  MessageCircle,
  Phone,
  Store,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { redirect } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import ImgRender from "~/components/core/img/ImgRender";
import {
  MISSED_CALL_NUMBER,
  OLD_APP,
  SUPPORT_WHATSAPP_NUMBER,
} from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import OtpModal from "~/modals/core/otp-modal/OtpModal";
import UpgradeModal from "~/modals/upgrade/UpgradeModal";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";
import MiscService from "~/services/MiscService";
import StorageService from "~/services/StorageService";

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

export async function clientLoader() {
  if (AuthService.isMasterLogin()) {
    return redirect("/auth/master/stores");
  }

  if (AuthService.isLoggedIn()) {
    if (!MiscService.isJwtExpired(AuthService.getLoggedInToken())) {
      return redirect("/auth/init");
    }
  }
  return;
}

declare global {
  interface Window {
    loggedInUserType?: { isPos?: boolean };
    imeiNumber?: string;
  }
}

interface LoginForm {
  mobile: string;
  password: string;
  rememberMe: boolean;
}

const PREFERRED_LANGUAGES = ["English", "हिन्दी", "ಕನ್ನಡ", "தமிழ்", "తెలుగు"];

const Login = () => {
  const appToast = useAppToast();
  const appNav = useAppNav();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    getValues,
  } = useForm<LoginForm>({
    defaultValues: { mobile: "", password: "", rememberMe: false },
  });

  const [showPwdInp, setShowPwdInp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [otpMobile, setOtpMobile] = useState("");
  const [otpValidating, setOtpValidating] = useState(false);
  const [otpResending, setOtpResending] = useState(false);

  const [isForceLogin, setIsForceLogin] = useState(false);
  const [isOtpLogin, setIsOtpLogin] = useState(false);
  const [validatingMobile, setValidatingMobile] = useState(false);
  const [loginType, setLoginType] = useState("retailer");

  const [upgradeModal, setUpgradeModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    successCb: () => void;
    cancelCb: () => void;
    type?: "alert" | "confirm";
    okText?: string;
    cancelText?: string;
  }>({
    show: false,
    title: "",
    description: "",
    successCb: () => {},
    cancelCb: () => {},
    type: "confirm",
    okText: "Continue",
    cancelText: "Cancel",
  });

  const loginRespRef = useRef<any>(null);
  const userTypeRef = useRef<string>("");

  const otpRef = useRef<number | null>(null);

  const mobileValue = useWatch({ control: control, name: "mobile" });
  const passwordValue = useWatch({ control: control, name: "password" });

  // Autofill mobile from AuthService cache if available
  useEffect(() => {
    try {
      const cached = AuthService.getLastMobileNumber();
      if (cached) {
        setValue("mobile", cached);
      }
    } catch (e) {}
  }, [setValue]);

  // Hide password input when mobile number changes
  useEffect(() => {
    if (showPwdInp) {
      setShowPwdInp(false);
      setValue("password", ""); // Clear password field when hiding
    }
  }, [mobileValue, setValue]);

  const validateMobileNo = async (mobile: string) => {
    let showPwdInp = false;
    let msg = "";
    let type = "";
    let showUpgrade = false;
    let shouldRedirectToOldApp = false;
    try {
      const resp = await AuthService.validateNumber(mobile + "");
      const data = resp.data;
      userTypeRef.current = data.type || "";

      if (data.hasAccount === false) {
        return {
          showPwdInp: false,
          msg: data.message,
          type: "",
          showUpgrade: false,
          shouldRedirectToOldApp: false,
        };
      }

      // Check for platform migration flags
      if (
        data.enableNewPlatformMigration === true &&
        data.readyToMigrateToNewPlatform === false
      ) {
        showUpgrade = true;
        return {
          showPwdInp: false,
          msg: "",
          type: "",
          showUpgrade: true,
          franchise: data?.franchise,
        };
      }

      // Flag to redirect to old app if enableNewPlatformMigration is false
      if (data.enableNewPlatformMigration === false) {
        shouldRedirectToOldApp = true;
        return {
          showPwdInp: false,
          msg: "",
          type: "",
          showUpgrade: false,
          shouldRedirectToOldApp,
        } as any;
      }

      if (data.notFound) {
        msg = "Invalid number";
        showPwdInp = true;
      } else if (data.isFranchise) {
        showPwdInp = true;
      } else if (data.isManpower) {
        showPwdInp = false;
      }
    } catch (e: any) {
      msg = e?.message || "Failed to validate the number, please try again";
      // Show password input when there's an exception
      showPwdInp = true;
    }

    return {
      showPwdInp,
      msg,
      type,
      showUpgrade,
      shouldRedirectToOldApp,
    };
  };

  const confirmAndRedirectToOldApp = () => {
    setAppAlertDialog({
      show: true,
      title: "Redirect to Old App",
      description: "You will be redirected to the " + OLD_APP,
      type: "alert",
      okText: "OK",
      successCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        try {
          let url = OLD_APP;
          if (url) {
            if (MiscService.hasCordova()) {
              url += url.includes("?") ? "&inj_cordova=1" : "?inj_cordova=1";
            }
            window.location.href = url;
          }
        } catch (e) {
          console.error("Failed to redirect to old app:", e);
          appToast.show({
            msg: "Failed to redirect to the legacy platform",
            color: "danger",
          });
        }
      },
      cancelCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        setShowPwdInp(true);
      },
    });
  };

  const onSubmit = async (data: LoginForm) => {
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

    // Only validate mobile number when password input is hidden
    if (!showPwdInp) {
      const validateResp = await validateMobileNo(data.mobile);

      // If validateMobileNo indicates redirect to old app, trigger confirmation flow
      if ((validateResp as any)?.shouldRedirectToOldApp) {
        confirmAndRedirectToOldApp();
        return;
      }

      // If upgrade modal should be shown, set the state and do not proceed further
      if (validateResp.showUpgrade) {
        setUpgradeModal({
          show: true,
          data: { ...validateResp.franchise, mobile: data.mobile },
        });
        return;
      }

      // If password input was not visible before but now should be visible
      const wasPwdInpHidden = !showPwdInp;
      setShowPwdInp(validateResp.showPwdInp);

      if (validateResp.msg) {
        // If password input just became visible due to error, don't show error message
        // and don't clear the mobile field - let user try with password
        if (!wasPwdInpHidden || !validateResp.showPwdInp) {
          appToast.show({
            msg: validateResp.msg,
            color: "danger",
          });
          setValue("mobile", "");
          return;
        }
        // If password input became visible due to error, continue to password validation
      }

      if (!validateResp.showPwdInp) {
        doLogin(data, true);
        return;
      }

      // Only check for password if password input was already visible
      if (wasPwdInpHidden && !data.password) {
        // Password input just became visible, don't show error yet
        return;
      }
    }

    if (!data.password) {
      appToast.show({ msg: "Please provide password", color: "danger" });
      return;
    }

    doLogin(data, false);
  };

  const updateLocalStorage = (resp: any) => {
    const decodedToken = MiscService.decodeJwt(resp["token"]);
    StorageService.set("_u", resp);
    StorageService.set("_t", resp["token"]);
    StorageService.set("_mob", decodedToken.username);
  };

  const fetchAndStoreRunnerDetails = async () => {
    try {
      const decodedToken = MiscService.decodeJwt(
        loginRespRef.current["token"],
      );
      const referenceId = decodedToken?.referenceId;
      if (!referenceId) {
        return;
      }
      const resp = await MarketplaceRunnerService.getRunners({
        filter: { _id: referenceId },
      });
      const runnerDetails = resp?.data?.data?.[0] || null;
      if (runnerDetails) {
        StorageService.set("_runner", runnerDetails);
      }
    } catch (e) {
      // Runner details are optional; do not block login on failure
    }
  };

  const doLogin = async (data: LoginForm, noPassword: boolean = false) => {
    setIsForceLogin(false);

    otpRef.current = null;

    setLoading(true);
    const isRunner = userTypeRef.current === "Runner";
    const params: Record<string, any> = {
      mobileNo: data.mobile.toString(),
      userPlatformType: isRunner ? "RUNNER" : "RETAILER",
    };

    if (!noPassword) {
      params.password = data.password.toString()?.trim();
    }

    try {
      const resp = isRunner
        ? await AuthService.otpLogin({ mobileNo: data.mobile.toString() })
        : await AuthService.doLogin(params);
      if (resp.statusCode !== 200) {
        if (resp.data?.hasActiveSession) {
          setAppAlertDialog({
            show: true,
            title: "Active Session Found",
            description: resp.data.message,
            successCb: () => {
              setAppAlertDialog((prev) => ({ ...prev, show: false }));
              loginRespRef.current = resp.data;
              forceLoginGenOtp();
            },
            cancelCb: () => {
              setAppAlertDialog((prev) => ({ ...prev, show: false }));
            },
          });
        } else {
          appToast.show({
            msg: resp.data?.message || "Failed to login",
            color: "danger",
          });
        }
        return;
      }

      loginRespRef.current = resp.data?.data || {};

      // Runner OTP login: OTP is sent by the server, open the OTP modal directly
      if (isRunner) {
        setIsOtpLogin(true);
        setOtpMobile(data.mobile);
        setOtpModal(true);
        setLoading(false);
        return;
      }

      if (loginRespRef.current.otpRequired) {
        setOtpModal(true);
        setOtpMobile(data.mobile);
        setLoading(false);
        return;
      }

      updateLocalStorage(resp.data);

      if (0 && resp.data.resetPassword) {
        appNav.replace("auth/reset-password");
      } else if (resp.data.enableOtp) {
        setOtpMobile(data.mobile);
        setOtpModal(true);
      } else {
        // Clear any cached/stored mobile number after successful login
        try {
          AuthService.setLastMobileNumber(null);
        } catch (e) {}
        redirect();
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to login",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithOtp = async () => {
    const mobile = getValues("mobile");
    if (!mobile) {
      appToast.show({ msg: "Please provide mobile number", color: "danger" });
      return;
    }
    if (!CommonService.isValidMobileNo(mobile)) {
      appToast.show({
        msg: "Please provide valid Mobile no.",
        color: "danger",
      });
      return;
    }

    setIsForceLogin(false);
    otpRef.current = null;
    setLoading(true);
    const isRunner = userTypeRef.current === "Runner";
    try {
      const resp = isRunner
        ? await AuthService.otpLogin({ mobileNo: mobile.toString() })
        : await AuthService.doLogin({
            mobileNo: mobile.toString(),
            loginWithOtp: true,
            userPlatformType: "RETAILER",
          });
      if (resp.statusCode !== 200) {
        appToast.show({
          msg: resp.data?.message || "Failed to send OTP",
          color: "danger",
        });
        return;
      }
      const otpData = resp.data?.data || resp.data || {};
      loginRespRef.current = {
        ...otpData,
        otpRequestId: otpData.otpRequestId || otpData._id,
        externalUserId: otpData.externalUserId || otpData.userId,
      };
      setIsOtpLogin(true);
      setOtpMobile(mobile);
      setOtpModal(true);
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to send OTP",
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
    const isRunner = userTypeRef.current === "Runner";
    try {
      if (isOtpLogin) {
        const params = {
          mobileNo: "" + getValues("mobile"),
          otpRequestId: loginRespRef.current.otpRequestId,
          externalUserId: loginRespRef.current.externalUserId,
          otp: "" + otp,
          loginWithOtp: true,
          userPlatformType: isRunner ? "RUNNER" : "RETAILER",
        };
        const resp = isRunner
          ? await AuthService.verifyOtpLogin({
              mobileNo: "" + getValues("mobile"),
              otpRequestId: loginRespRef.current.otpRequestId,
              otp: "" + otp,
              userPlatformType: "RUNNER",
            })
          : await AuthService.doLogin(params);
        if (resp.statusCode !== 200) {
          appToast.show({
            msg: resp.data?.message || "Failed to login",
            color: "danger",
          });
          return;
        }
        loginRespRef.current = resp.data?.data || resp.data || {};
        updateLocalStorage(resp.data?.data || resp.data);
        setOtpModal(false);
        setIsOtpLogin(false);
        try {
          AuthService.setLastMobileNumber(null);
        } catch (e) {}

        if (isRunner) {
          await fetchAndStoreRunnerDetails();
        }

        redirect();
        return;
      }
      const params = {
        mobileNo: "" + getValues("mobile"),
        otpRequestId: loginRespRef.current.otpRequestId,
        otp: "" + otp,
        userPlatformType: isRunner ? "RUNNER" : "RETAILER",
      };
      const resp = await AuthService.verifyOtpLogin(params);
      if (resp.statusCode !== 200) {
        appToast.show({
          msg: resp.data?.message || "Failed to fetch user",
          color: "danger",
        });
        return;
      }

      loginRespRef.current = resp.data?.data || {};

      updateLocalStorage(resp.data?.data);

      setOtpModal(false);

      // Clear any cached/stored mobile number after successful OTP login
      try {
        AuthService.setLastMobileNumber(null);
      } catch (e) {}

      // Attempt to clone daily delivery time slots before redirecting.
      // Resolve franchiseId from token; if user is Manpower, fetch sub-user
      // details and use the franchiseInfo.id. Errors should not block redirect.
      setLoading(true);
      try {
        const decodedForClone = MiscService.decodeJwt(
          loginRespRef.current["token"],
        );
        let franchiseId = decodedForClone?.franchise || "";

        if (
          decodedForClone?.userType === "Manpower" &&
          decodedForClone?.userType !== "Runner"
        ) {
          try {
            const manpowerResp = await FranchiseService.getFranSubUserById(
              decodedForClone.referenceId,
            );
            if (manpowerResp.statusCode === 200 && manpowerResp.data) {
              const manpowerDetails = manpowerResp.data.data;
              if (manpowerDetails?.franchiseInfo?.id) {
                franchiseId = manpowerDetails.franchiseInfo.id;
              }
            }
          } catch (e) {
            // ignore and fallback to franchise from token (if any)
          }
        }

        if (franchiseId) {
          await CommonService.cloneDailyDeliveryTimeSlot({ franchiseId });
        }
      } catch (err: any) {
        appToast.show({
          msg: err?.message || "Failed to clone delivery time slots",
          color: "danger",
        });
      } finally {
        setLoading(false);
      }

      redirect();
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to fetch user",
        color: "danger",
      });
    } finally {
      setOtpValidating(false);
    }
  };

  const forceLoginGenOtp = async () => {
    setLoading(true);
    try {
      const resp = await AuthService.generateForceLoginOtp(
        loginRespRef.current.id,
        {},
      );
      if (resp.statusCode !== 200) {
        appToast.show({
          msg: resp.data?.message || "Failed to generate OTP",
          color: "danger",
        });
        return;
      }
      setIsForceLogin(true);
      loginRespRef.current.otpId = resp.data.otpId;
      setOtpModal(true);
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to generate OTP",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpResend = async () => {
    setOtpResending(true);
    try {
      if (isForceLogin) {
        await resendForceLoginOtp();
        return;
      }
      const params: Record<string, any> = {
        mobileNo: "" + getValues("mobile"),
        userPlatformType: userTypeRef.current === "Runner" ? "RUNNER" : "RETAILER",
        otpRequestId: loginRespRef.current.otpRequestId,
      };
      if (isOtpLogin) {
        params.externalUserId = loginRespRef.current.externalUserId;
        params.loginWithOtp = true;
      }
      const resp = await AuthService.resendOtp(params);
      if (resp.statusCode !== 200) {
        appToast.show({
          msg: resp.data?.message || "Failed to send OTP",
          color: "danger",
        });
        return;
      }

      // Save the new otpRequestId from the resend OTP response
      const respData = resp.data?.data || resp.data;
      const newOtpReqId = respData?.otpRequestId || respData?._id;
      const newExtUserId = respData?.externalUserId || respData?.userId;
      if (newOtpReqId) {
        loginRespRef.current.otpRequestId = newOtpReqId;
      }
      if (newExtUserId) {
        loginRespRef.current.externalUserId = newExtUserId;
      }

      appToast.show({ msg: "OTP sent successfully", color: "success" });
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to send OTP",
        color: "danger",
      });
    } finally {
      setOtpResending(false);
    }
  };

  const resendForceLoginOtp = async () => {
    setOtpResending(true);
    try {
      const params = {
        userid: loginRespRef.current.id,
        id: loginRespRef.current.otpId,
        userPlatformType: "RETAILER",
      };
      const resp = await AuthService.resendForceLoginOtp(params);
      if (resp.statusCode !== 200) {
        appToast.show({
          msg: resp.data?.message || "Failed to generate OTP",
          color: "danger",
        });
        return;
      }
      appToast.show({ msg: "OTP sent successfully", color: "success" });
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to generate OTP",
        color: "danger",
      });
    } finally {
      setOtpResending(false);
    }
  };

  const redirect = async () => {
    setLoading(true);
    try {
      const decodedToken = MiscService.decodeJwt(loginRespRef.current["token"]);
      let franchiseId = decodedToken?.franchise;

      let manpowerDetails: Record<string, any> = {};
      if (decodedToken?.userType === "Runner") {
        // Runner login does not need the franchise/manpower profile fetch
      } else if (decodedToken?.userType === "Manpower") {
        const manpowerResp = await FranchiseService.getFranSubUserById(
          decodedToken.referenceId,
        );
        if (manpowerResp.statusCode === 200 && manpowerResp.data) {
          manpowerDetails = manpowerResp.data.data;
          if (manpowerDetails?.franchiseInfo?.id) {
            franchiseId = manpowerDetails?.franchiseInfo?.id || "";
            const franchiseResp =
              await FranchiseService.getFranchise(franchiseId);
            if (franchiseResp.statusCode === 200 && franchiseResp.data) {
              StorageService.set("_f", franchiseResp.data?.data);
            }
          }
          StorageService.set("_m", manpowerDetails);
        }
      } else {
        const franchiseResp = await AuthService.getLoggedInFranchiseDetails();
        if (franchiseResp.statusCode === 200 && franchiseResp.data) {
          StorageService.set("_f", franchiseResp.data?.data);
        }
      }

      // If there was a stored redirect query (from /auth/rd), forward to rd handler
      try {
        const stored = StorageService.get<string>("auth_rd_search");
        if (stored) {
          appNav.replace("/auth/rd" + stored);
          return;
        }
      } catch (e) {
        // ignore and continue
      }
      appNav.replace("/auth/init");
    } catch (error) {
      appNav.replace("/auth/init");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    try {
      const mob = getValues("mobile");
      if (mob) {
        AuthService.setLastMobileNumber(mob);
      }
    } catch (e) {}
    appNav.to("/auth/forgot-password", { type: loginType });
  };

  const togglePassword = () => {
    setShowPassword((v) => !v);
  };

  const handleUpgradeModalCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    switch (action) {
      case "close":
        setUpgradeModal({
          show: false,
          data: null,
        });
        setValue("mobile", "");
        setShowPwdInp(true);
        break;
      case "upgrade_complete":
        setUpgradeModal({
          show: false,
          data: null,
        });

        break;
      default:
        setUpgradeModal({
          show: false,
          data: null,
        });
        // Show password input when modal is closed for any other reason
        setShowPwdInp(true);
        break;
    }
  };

  const handleMissedCall = () => {
    // dial without the country code
    const dialNumber =
      MISSED_CALL_NUMBER.length > 10
        ? MISSED_CALL_NUMBER.replace(/^91/, "")
        : MISSED_CALL_NUMBER;
    CommonService.windowOpenHandler(`tel:${dialNumber}`, () => {});
  };

  const handleDirectSignup = () => {
    appNav.to("/auth/signup/intro");
  };

  const handleContactSupport = () => {
    const waUrl = CommonService.prepareWhatsappMessage(
      "hi",
      SUPPORT_WHATSAPP_NUMBER,
    );
    CommonService.windowOpenHandler(waUrl, () => {});
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
              <span className="sk-eyebrow">Retailer login</span>
              <h1 className="sk-h1">
                Log in to <em>your shop</em>.
              </h1>
              <p className="sk-sub">
                Manage the <strong>online shop</strong> you already created with
                StoreKing.
              </p>
            </div>

            <form className="sk-card" onSubmit={handleSubmit(onSubmit)}>
              <div className="sk-field">
                <div className="sk-field-label">
                  <span>Mobile number</span>
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
                    {errors.mobile.message}
                  </span>
                )}
              </div>

              {showPwdInp && (
                <div className="sk-field">
                  <div className="sk-field-label">
                    <span>Password</span>
                  </div>
                  <label className="sk-input-wrap">
                    <span className="sk-input-icon">
                      <Lock size={18} />
                    </span>
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="sk-input-toggle"
                      onClick={togglePassword}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </label>
                  {errors.password?.message && (
                    <span className="sk-field-error">
                      {errors.password.message as string}
                    </span>
                  )}
                </div>
              )}

              <button type="submit" className="sk-btn-primary">
                <span className="sk-btn-primary-left">
                  <span className="sk-btn-primary-icon">
                    <LogIn size={18} strokeWidth={2.2} />
                  </span>
                  <span>
                    <span className="sk-btn-primary-main">
                      {showPwdInp ? "Log in to my shop" : "Continue"}
                    </span>
                    <span className="sk-btn-primary-sub">
                      {showPwdInp
                        ? "Mobile number + password"
                        : "We'll check your mobile number first"}
                    </span>
                  </span>
                </span>
                <span className="sk-btn-primary-arrow">
                  <ArrowRight size={20} strokeWidth={2.4} />
                </span>
              </button>

              <div className="sk-btn-row">
                <button
                  type="button"
                  className="sk-btn-ghost"
                  onClick={handleLoginWithOtp}
                >
                  <KeyRound size={16} />
                  Login with OTP
                </button>
                <button
                  type="button"
                  className="sk-btn-ghost"
                  onClick={handleForgotPassword}
                >
                  <Lock size={15} />
                  Forgot password
                </button>
              </div>
            </form>

            {/* New retailer */}
            <div className="sk-new-card">
              <div className="sk-new-card-inner">
                <span className="sk-new-card-eyebrow">
                  Don&apos;t have a shop yet?
                </span>
                <div className="sk-new-card-title">
                  Create your online shop in <em>5 minutes</em>.
                </div>
                <button
                  type="button"
                  className="sk-new-card-cta"
                  onClick={handleMissedCall}
                >
                  <span className="sk-new-card-cta-left">
                    <span className="sk-new-card-cta-icon">
                      <Phone size={16} strokeWidth={2.2} />
                    </span>
                    <span>
                      <span className="sk-new-card-cta-label">
                        Give a free missed call
                      </span>
                      <span className="sk-new-card-cta-sub">
                        {formatSupportNumber(MISSED_CALL_NUMBER)}
                      </span>
                    </span>
                  </span>
                  <ArrowRight size={18} strokeWidth={2.4} />
                </button>

                <div className="sk-new-card-alt">
                  <span>or</span>
                  <button type="button" onClick={handleDirectSignup}>
                    Sign up yourself
                    <ArrowRight size={13} strokeWidth={2.6} />
                  </button>
                </div>
              </div>
            </div>

            <div className="sk-foot">
              <button
                type="button"
                className="sk-foot-link"
                onClick={handleContactSupport}
              >
                <MessageCircle size={15} />
                Trouble logging in? Talk to us
              </button>
              <button
                type="button"
                className="sk-foot-link"
                onClick={() => {
                  CommonService.windowOpenHandler(
                    "https://www.instagram.com/storekingindia",
                    () => {},
                  );
                }}
              >
                <ImgRender
                  src="/vendors/instagram-logo.svg"
                  className="tw:h-4 tw:w-4"
                />
                Instagram
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

      <BusyLoader show={loading || validatingMobile} />

      <OtpModal
        show={otpModal}
        verify={handleOtpVerify}
        resend={handleOtpResend}
        close={() => {
          setOtpModal(false);
          setIsOtpLogin(false);
        }}
        mobile={otpMobile}
        validating={otpValidating}
        resending={otpResending}
      />

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        type={appAlertDialog.type}
        okText={appAlertDialog.okText}
        cancelText={appAlertDialog.cancelText}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />

      <UpgradeModal
        show={upgradeModal.show}
        data={upgradeModal.data}
        callback={handleUpgradeModalCallback}
      />
    </>
  );
};

export default Login;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Login"),
    },
  ];
}
