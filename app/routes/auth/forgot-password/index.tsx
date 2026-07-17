import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import OtpModal from "~/modals/core/otp-modal/OtpModal";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import "./ForgotPassword.css";
import { verifyOtp } from "./helper";

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

  return (
    <>
      <div className="app-page tw:min-h-screen">
        <div className=" tw:md:bg-blue-50 tw:min-h-screen tw:flex tw:md:items-center tw:md:justify-center">
          <div className="tw:md:py-12 tw:md:px-8 tw:bg-white tw:rounded-lg tw:md:gap-4 tw:relative tw:md:shadow-xl tw:md:max-w-[1200px] tw:md:mx-auto tw:flex-1">
            <ImgRender
              src="logo/logo.png"
              className="tw:h-10 tw:!hidden tw:md:!block tw:md:absolute tw:md:top-4 tw:md:right-10 tw:mt-4 tw:ml-4"
            />
            <div className="tw:md:p-10 tw:p-6 tw:md:shadow-lg tw:md:rounded-lg tw:md:bg-gradient-to-br tw:md:from-blue-50 tw:md:to-white tw:bg-gradient-to-b tw:from-blue-100/80 tw:to-white/80 tw:md:w-[450px] tw:md:m-6 tw:relative tw:z-20">
              <div className="tw:text-2xl tw:font-bold tw:flex tw:items-center tw:gap-2">
                <span>Welcome to</span>
                <ImgRender
                  src="logo/logo.png"
                  className="tw:h-10 tw:md:hidden"
                />
                <span className="tw:hidden tw:md:inline">StoreKing</span>
              </div>
              <div className="tw:text-xs tw:text-gray-700 tw:mb-10">
                Transform your store into an online supermarket.
              </div>

              <div className="tw:relative">
                <ImgRender
                  src="login/fly.png"
                  className="tw:absolute tw:-top-12 tw:md:-top-16 tw:right-0 tw:w-[160px] tw:md:w-[190px]"
                />
                <div className="tw:text-xl tw:font-bold">Forgot Password</div>
                <div className="tw:text-xs tw:text-gray-700 tw:mt-2 tw:mb-6">
                  Enter your registered mobile number to reset your password
                </div>
              </div>

              <div className="tw:md:w-11/12">
                <form
                  className="tw:mt-8 tw:space-y-6"
                  onSubmit={handleSubmit(onSubmit)}
                >
                  <div className="tw:mb-4">
                    <AppInput
                      name="mobile"
                      type="number"
                      placeholder="Mobile number"
                      register={register}
                      error={errors.mobile?.message as string}
                      className="tw:bg-white"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <AppButton type="submit" className="tw:w-full">
                      Submit
                    </AppButton>
                  </div>
                </form>

                <div className="tw:text-xs tw:text-gray-500 tw:mt-4 tw:text-center">
                  <Link to="/auth/login" className="tw:text-blue-800">
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>

            {/* Desktop background - only visible on md and above */}
            <div className="tw:hidden tw:md:absolute tw:md:bottom-0 tw:md:right-0 tw:md:top-0 tw:md:left-0 tw:md:z-0 tw:md:block tw:md:rounded-lg">
              <ImgRender
                src="login/bg-2.jpg"
                className="tw:w-full tw:h-full tw:object-cover tw:md:rounded-lg"
              />
            </div>

            {/* Feature blocks - only visible on desktop */}
            <div className="tw:hidden tw:md:flex tw:md:absolute tw:md:bottom-4 tw:md:right-4 tw:md:z-10 tw:md:gap-2">
              {[
                "POS",
                "Inventory",
                "Orders",
                "Fulfillment",
                "Delivery",
                "Analytics",
              ].map((block, index) => (
                <div
                  key={index}
                  className="tw:rounded tw:py-1 tw:px-2 tw:text-center tw:shadow-md tw:border tw:border-[#E0A935]/60 tw:min-w-[60px] tw:backdrop-blur-sm"
                  style={{
                    background: "linear-gradient(to bottom, #E8AF3B, #E0A935)",
                    opacity: 0.8,
                  }}
                >
                  <span className="tw:text-white tw:font-medium tw:text-xs tw:tracking-wide">
                    {block}
                  </span>
                </div>
              ))}
            </div>

            {/* Mobile background - only visible below md, positioned at bottom */}
            <div className="tw:md:hidden tw:absolute tw:bottom-0 tw:left-0 tw:right-0 tw:z-0">
              <ImgRender
                src="login/mobile-bg.jpg"
                className="tw:w-full tw:h-auto tw:object-cover"
              />
            </div>
          </div>
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
