import { useForm } from "react-hook-form";
import AppHeader from "~/components/core/header/AppHeader";
import { AppPasswordInput } from "~/components/core/form/AppPasswordInput";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import CommonService from "~/services/CommonService";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import { useState } from "react";
import useAppNav from "~/hooks/useAppNav";

const ResetPassword = () => {
  const appToast = useAppToast();
  const appNav = useAppNav();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm();

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (data: any) => {
    const { status, msg } = validate();
    if (!status) {
      appToast.show({
        msg: msg,
        color: "danger",
      });
      return;
    }

    handleChangePassword();
  };

  const validate = () => {
    const formData = getValues();
    let msg = "";
    const { newPassword, confirmPassword } = formData;

    const pwdCharValid = CommonService.isValidPasswordCharacters(
      newPassword,
      AuthService.getLoggedInUser()?.OwnerMobileNo
    );

    if (!newPassword || !confirmPassword) {
      msg = "Both new and confirm passwords are required.";
    } else if (newPassword !== confirmPassword) {
      msg = "New and confirm passwords do not match.";
    } else if (!pwdCharValid.status) {
      msg = pwdCharValid.msg;
    }

    return {
      status: !msg,
      msg,
    };
  };

  const handleChangePassword = async () => {
    setSubmitting(true);
    const formData = getValues();
    const payload = {
      userType: "Franchise",
      newPassword: formData["newPassword"],
      confirmNewPassword: formData["confirmPassword"],
      appType: "Retailer",
    };
    const resp = await AuthService.changePassword(
      AuthService.getLoggedInUser()?.OwnerMobileNo,
      payload
    );

    setSubmitting(false);

    if (resp.statusCode === 200) {
      appToast.show({
        msg: "Password changed successfully",
        color: "success",
      });
      appNav.replace("/auth/logout");
    } else {
      appToast.show({
        msg: resp.data?.message || "Failed to change password",
        color: "danger",
      });
    }
  };

  return (
    <>
      <AppHeader title="Reset Password" hideMenu={true} />
      <div className="app-page page-bg">
        <div className="app-container">
          <div className="tw:max-w-md tw:mx-auto tw:mt-8">
            <AppCard>
              <InfoBlock size="sm" className="tw:mb-4" bordered>
                <div className="tw:text-sm tw:text-gray-500">
                  New password must be at least 8 characters long.
                </div>
              </InfoBlock>
              <form onSubmit={handleSubmit(onSubmit)} className="tw:space-y-4">
                <AppPasswordInput
                  name="newPassword"
                  label="New Password"
                  placeholder="Enter your new password"
                  register={register}
                  isRequired
                />
                <AppPasswordInput
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Confirm your new password"
                  register={register}
                  isRequired
                />
                <AppButton type="submit" expand="block" isLoading={submitting}>
                  Reset Password
                </AppButton>
                <div className="tw:text-xs tw:text-gray-500 tw:mt-2">
                  For security reasons you will be logged out after the password
                  has been changed.
                </div>
              </form>
            </AppCard>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
