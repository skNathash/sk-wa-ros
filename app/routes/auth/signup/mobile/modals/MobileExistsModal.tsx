import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";

interface MobileExistsModalProps {
  show: boolean;
  mobile: string;
  onClose: () => void;
  onLogin: () => void;
}

const MobileExistsModal: React.FC<MobileExistsModalProps> = ({
  show,
  mobile,
  onClose,
  onLogin,
}) => {
  return (
    <AppModal show={show} callback={onClose} className="tw:max-w-md">
      <AppModal.Title onClose={onClose}>
        <div className="tw:text-lg tw:font-semibold">Account Already Exists</div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:space-y-3 tw:py-2">
          <p className="tw:text-sm tw:text-gray-700">
            The mobile number{" "}
            <span className="tw:font-semibold">+91 {mobile}</span> is already
            registered with us.
          </p>
          <p className="tw:text-sm tw:text-gray-600">
            Please login to continue or use a different mobile number to sign up.
          </p>
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:border-t tw:border-gray-200">
        <div className="tw:flex tw:gap-3 tw:justify-end tw:w-full">
          <AppButton fill="outline" onClick={onClose} className="tw:px-6">
            Cancel
          </AppButton>
          <AppButton onClick={onLogin} className="tw:px-6">
            Login
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default MobileExistsModal;
