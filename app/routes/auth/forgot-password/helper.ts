import AuthService from "~/services/AuthService";

export const verifyOtp = async (
  isManpower: boolean,
  params: {
    otpId?: string;
    otp?: number;
    mobileNo?: string;
  }
) => {
  if (isManpower) {
    const resp = await AuthService.verifyOtpForgotPasswordv2({
      otpRequestId: params.otpId,
      otp: params.otp?.toString(),
      mobileNo: params.mobileNo,
    });
    return {
      statusCode: resp.statusCode,
      data: resp.data?.data,
      msg: resp.data?.message,
    };
  }
  const resp = await AuthService.verifyOtpForgotPassword({
    id: params.otpId,
    otp: params.otp,
    mobileNo: params.mobileNo,
  });
  return {
    statusCode: resp.statusCode,
    data: resp.data?.data,
    msg: resp.data?.message,
  };
};
