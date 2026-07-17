import React, { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import { AppInput } from "~/components/core/form/AppInput";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";

type ChangePasswordForm = {
  newPassword: string;
  confirmPassword: string;
};

type Props = {
  show: boolean;
  username: string; // mobile or username
  callback?: (a: { action: string; data?: any }) => void;
};

const ChangePasswordModal: React.FC<Props> = ({ show, username, callback }) => {
  const { register, handleSubmit, getValues, reset } =
    useForm<ChangePasswordForm>({
      defaultValues: {
        newPassword: "",
        confirmPassword: "",
      },
    });

  const toast = useAppToast();
  const [submitting, setSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleClose = () => {
    if (callback) callback({ action: "close", data: {} });
    reset();
  };

  const validate = (): { msg: string } => {
    const { newPassword, confirmPassword } = getValues();

    if (!newPassword || !confirmPassword) {
      return { msg: "Both new and confirm passwords are required." };
    }
    if (newPassword.length < 6) {
      return { msg: "New password must be at least 6 characters long." };
    }
    if (newPassword !== confirmPassword) {
      return { msg: "New and confirm passwords do not match." };
    }
    return { msg: "" };
  };

  const onSubmit = async () => {
    const { msg } = validate();
    if (msg) {
      toast.show({ msg, color: "danger" });
      return;
    }

    try {
      setSubmitting(true);
      const { newPassword, confirmPassword } = getValues();
      const resp = await AuthService.franchiseChangePassword({
        newPassword,
        confirmNewPassword: confirmPassword,
        username,
      } as any);

      if (resp?.statusCode === 200) {
        toast.show({ msg: "Password changed successfully", color: "success" });
        // Inform parent so it can take appropriate action (e.g., force logout)
        if (callback) {
          callback({ action: "passwordChanged", data: { username } });
        }
        reset();
      } else {
        toast.show({
          msg: resp?.data?.message || "Failed to change password",
          color: "danger",
        });
      }
    } catch (e: any) {
      toast.show({
        msg: e?.message || "Failed to change password",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-start tw:gap-2">
          <div className="tw:mt-0.5 tw:text-primary-600">
            <Lock size={18} />
          </div>
          <div>
            <div className="tw:font-semibold">Change Password</div>
            <div className="tw:text-xs tw:text-gray-500">
              Update your password to keep your account secure.
            </div>
          </div>
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="tw:flex tw:flex-col tw:gap-3"
        >
          <div className="tw:text-[13px] tw:text-gray-700 tw:bg-yellow-50 tw:border tw:border-yellow-200 tw:rounded tw:px-3 tw:py-2">
            For your security, you will be signed out after your password is
            updated. Please sign in again with your new password.
          </div>
          <AppInput
            name="newPassword"
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            placeholder="Enter new password"
            register={register}
            isRequired
            rightIcon={
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="tw:text-gray-500 hover:tw:text-gray-700 tw:p-1 tw:-mr-1"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
          <AppInput
            name="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            register={register}
            isRequired
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="tw:text-gray-500 hover:tw:text-gray-700 tw:p-1 tw:-mr-1"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="tw:flex tw:items-center tw:justify-end tw:gap-2 tw:mt-2">
            <AppButton fill="clear" onClick={handleClose} type="button">
              Cancel
            </AppButton>
            <AppButton type="submit" isLoading={submitting} color="primary">
              Update Password
            </AppButton>
          </div>
        </form>
      </AppModal.Content>
    </AppModal>
  );
};

export default ChangePasswordModal;
