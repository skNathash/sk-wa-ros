import clsx from "clsx";
import { Eye, EyeOff, PhoneCall } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { redirect } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import Divider from "~/components/core/divider/Divider";
import { AppInput } from "~/components/core/form";
import ImgRender from "~/components/core/img/ImgRender";
import { OLD_APP, SUPPORT_WHATSAPP_NUMBER } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import OtpModal from "~/modals/core/otp-modal/OtpModal";
import UpgradeModal from "~/modals/upgrade/UpgradeModal";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import MiscService from "~/services/MiscService";
import StorageService from "~/services/StorageService";
import "./Login.css";

const MAX_BG_IMG_INDEX = 13;

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

  const [bgImgIndex, setBgImgIndex] = useState(1);
  const [isFading, setIsFading] = useState(false);

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

  const otpRef = useRef<number | null>(null);

  const mobileValue = useWatch({ control: control, name: "mobile" });

  // Autofill mobile from AuthService cache if available
  useEffect(() => {
    try {
      const cached = AuthService.getLastMobileNumber();
      if (cached) {
        setValue("mobile", cached);
      }
    } catch (e) {}
  }, [setValue]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setBgImgIndex((prev) => {
          const next = prev + 1;
          if (next > MAX_BG_IMG_INDEX) {
            return 1;
          }
          return next;
        });
        setIsFading(false);
      }, 1000);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

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
      appToast.show({ msg: "Please provide username", color: "danger" });
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

  const doLogin = async (data: LoginForm, noPassword: boolean = false) => {
    setIsForceLogin(false);

    otpRef.current = null;

    setLoading(true);
    const params: Record<string, any> = {
      mobileNo: data.mobile.toString(),
      userPlatformType: "RETAILER",
    };

    if (!noPassword) {
      params.password = data.password.toString()?.trim();
    }

    try {
      const resp = await AuthService.doLogin(params);
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
      appToast.show({ msg: "Please provide valid Mobile no.", color: "danger" });
      return;
    }

    setIsForceLogin(false);
    otpRef.current = null;
    setLoading(true);
    try {
      const resp = await AuthService.doLogin({
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
      appToast.show({ msg: e?.message || "Failed to send OTP", color: "danger" });
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
    try {
      if (isOtpLogin) {
        const params = {
          mobileNo: "" + getValues("mobile"),
          otpRequestId: loginRespRef.current.otpRequestId,
          externalUserId: loginRespRef.current.externalUserId,
          otp: "" + otp,
          loginWithOtp: true,
          userPlatformType: "RETAILER",
        };
        const resp = await AuthService.doLogin(params);
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
        redirect();
        return;
      }
      const params = {
        mobileNo: "" + getValues("mobile"),
        otpRequestId: loginRespRef.current.otpRequestId,
        otp: "" + otp,
        userPlatformType: "RETAILER",
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

        if (decodedForClone?.userType === "Manpower") {
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
        userPlatformType: "RETAILER",
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
      if (decodedToken?.userType === "Manpower") {
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

  const handleContactSupport = () => {
    const waUrl = CommonService.prepareWhatsappMessage(
      "hi",
      SUPPORT_WHATSAPP_NUMBER,
    );
    CommonService.windowOpenHandler(waUrl, () => {});
  };

  return (
    <>
      <div className="login-page app-page tw:min-h-screen">
        <div className=" tw:md:bg-blue-50 tw:min-h-screen tw:flex tw:md:items-center tw:md:justify-center">
          <div className="tw:md:py-12 tw:md:px-8 tw:bg-white tw:md:bg-[#FAF9FA] tw:rounded-lg tw:md:gap-4 tw:relative tw:md:shadow-xl tw:md:max-w-[1200px] tw:md:mx-auto tw:flex-1 tw:flex tw:flex-col tw:md:flex-row tw:md:items-center">
            <div className="tw:md:p-10 tw:p-6 tw:md:shadow-lg tw:md:rounded-lg tw:md:bg-gradient-to-br tw:md:from-blue-50 tw:md:to-white tw:bg-gradient-to-b tw:from-blue-100/80 tw:to-white/80 tw:md:w-[450px] tw:md:m-6 tw:relative tw:z-20">
              <div className="tw:text-2xl tw:font-bold tw:flex tw:items-center tw:gap-2 tw:justify-center">
                <span className="tw:font-bold tw:hidden">Welcome to</span>
                <ImgRender src="logo/logo.png" className="tw:h-10 tw:!hidden tw:md:!block" />
              </div>
              <div className="tw:text-xs tw:text-gray-700 tw:mb-10 tw:font-medium tw:text-center">
                Transform your store into an online supermarket.
              </div>

              <div className="tw:relative">
                <ImgRender
                  src="login/fly.png"
                  className="tw:absolute tw:-top-12 tw:md:-top-16 tw:right-0 tw:md:-right-3 tw:w-[160px] tw:md:w-[190px]"
                />
                <div className="tw:text-xl tw:font-bold tw:text-slate-700 tw:mb-4">
                  Sign in to your account
                </div>
                <div className="tw:text-xs tw:text-gray-700 tw:mt-2 tw:mb-6 tw:font-medium tw:hidden">
                  Log in to manage everything from your store.
                </div>
              </div>

              <div className="tw:md:w-11/12">
                <AppInput
                  name="mobile"
                  register={register}
                  placeholder="Mobile Number"
                  type="number"
                  error={errors.mobile?.message}
                  className="tw:mb-4"
                  inputClassName="tw:bg-white"
                  maxLength={10}
                />

                {showPwdInp && (
                  <div className="tw:relative">
                    <AppInput
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      register={register}
                      error={errors.password?.message as string}
                      className="tw:mb-4"
                      inputClassName="tw:bg-white"
                    />
                    <button
                      type="button"
                      onClick={togglePassword}
                      className="tw:absolute tw:cursor-pointer tw:inset-y-0 tw:right-2 tw:pr-3 tw:flex tw:items-center tw:text-sm tw:leading-5 tw:text-gray-400 hover:tw:text-gray-600 focus:tw:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="tw:h-5 tw:w-5" />
                      ) : (
                        <Eye className="tw:h-5 tw:w-5" />
                      )}
                    </button>
                  </div>
                )}

                <div className="tw:flex tw:justify-between tw:items-center tw:mb-3">
                  <button
                    type="button"
                    className="tw:text-blue-800 tw:text-xs tw:font-medium tw:cursor-pointer"
                    onClick={handleLoginWithOtp}
                  >
                    Login with OTP
                  </button>
                  <button
                    type="button"
                    className="tw:text-blue-800 tw:text-xs tw:font-medium tw:cursor-pointer"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="tw:flex tw:gap-3 tw:mb-8">
                  <AppButton
                    onClick={() => appNav.to("/auth/signup/intro")}
                    className="tw:flex-1 tw:uppercase"
                    fill="outline"
                  >
                    Sign Up
                  </AppButton>
                  <AppButton
                    type="submit"
                    onClick={handleSubmit(onSubmit)}
                    noShadow={true}
                    className="tw:flex-1 tw:uppercase"
                  >
                    Sign in
                  </AppButton>
                </div>

                <div className="tw:flex tw:justify-between tw:mt-4 tw:gap-2">
                  <div className="tw:flex tw:justify-center tw:items-center tw:gap-1 tw:text-xs tw:text-gray-600 tw:underline">
                    <button
                      onClick={() => {
                        CommonService.windowOpenHandler(
                          "https://www.instagram.com/clubonlinesupermarket/",
                          () => {},
                        );
                      }}
                      className="tw:cursor-pointer"
                    >
                      <ImgRender
                        src="/vendors/instagram-logo.svg"
                        className="tw:h-6 tw:w-6"
                      />
                    </button>

                    {/* <span>Know more</span>
                      <PlayCircle size={16} className="tw:text-blue-800" /> */}
                  </div>

                  <div className="tw:flex tw:items-start tw:gap-1">
                    {/* <div className="tw:text-xs tw:text-gray-600 tw:font-medium">
                      Need help?
                    </div> */}
                    <button
                      className="tw:text-blue-800 tw:text-xs tw:font-medium tw:cursor-pointer tw:underline tw:flex tw:items-center tw:gap-1"
                      onClick={handleContactSupport}
                    >
                      <PhoneCall size={16} />
                      Contact
                    </button>
                  </div>
                </div>

                <div className="tw:mb-6">
                  <Divider />
                </div>

                <div className="tw:flex tw:gap-2 tw:justify-center tw:items-center tw:text-xs tw:text-slate-500 tw:absolute tw:bottom-2 tw:md:bottom-4 tw:left-0 tw:right-0">
                  Powered by{" "}
                  <ImgRender
                    src="/ai/ai.gif"
                    className="tw:h-8 tw:inline-block tw:rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Desktop brain connector - hidden on mobile */}
            <ImgRender
              src="login/brain.jpg"
              className="tw:!hidden tw:md:!block tw:md:absolute tw:md:left-[410px] tw:md:top-1/2 tw:md:-translate-y-1/2 tw:md:w-[420px] tw:md:z-10 tw:md:pointer-events-none"
            />

            {/* Poster loop section - desktop right side, mobile bottom */}
            <div className="tw:order-first tw:md:order-none tw:md:flex-1 tw:md:flex tw:md:items-center tw:md:justify-end tw:md:p-6">
              <div className="tw:relative tw:w-full tw:md:w-[420px] tw:md:h-[420px] tw:aspect-square tw:md:rounded-lg tw:overflow-hidden tw:md:z-20 tw:md:shadow-2xl">
                <ImgRender
                  src={`category-posters/category-${bgImgIndex}.jpg`}
                  className={clsx(
                    "tw:w-full tw:h-full tw:object-cover tw:transition-all tw:duration-500",
                    isFading ? "tw:blur-xs tw:opacity-80" : "tw:opacity-100",
                  )}
                />
              </div>
            </div>
          </div>
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
