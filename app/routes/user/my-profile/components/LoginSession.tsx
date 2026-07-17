import React from "react";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";

interface LoginSessionProps {
  lastLogin: string;
  onChangePassword: () => void;
}

const LoginSession: React.FC<LoginSessionProps> = ({
  lastLogin,
  onChangePassword,
}) => {
  return (
    <div className="tw:bg-white tw:rounded-lg tw:shadow-sm tw:p-6 tw:mb-4">
      <div className="tw:font-bold tw:text-lg tw:mb-2">Login Session</div>
      <div className="tw:text-gray-500 tw:text-sm tw:mb-4">
        Last Login: <DateFormat value={lastLogin} />
      </div>
      <div className="tw:flex tw:justify-end">
        <AppButton size="small" fill="clear" onClick={onChangePassword}>
          Change Password
        </AppButton>
      </div>
    </div>
  );
};

export default LoginSession;
