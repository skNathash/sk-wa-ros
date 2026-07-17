import React, { useCallback, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import TermsContent from "~/components/core/terms-content/TermsContent";
import { AppCheckbox } from "~/components/core/form/AppCheckbox";

interface SignupAgreementModalProps {
  show: boolean;
  callback: (data: {
    action: string;
    agreed?: boolean;
    termsData?: {
      version: string;
      name: string;
      code: string;
      content: string;
    };
  }) => void;
  showAgree: boolean;
  agreed: boolean;
}

const SignupAgreementModal: React.FC<SignupAgreementModalProps> = ({
  show,
  callback,
  showAgree,
  agreed,
}) => {
  const [isAgreed, setIsAgreed] = useState(agreed);
  const [termsData, setTermsData] = useState<{
    version: string;
    name: string;
    code: string;
    content: string;
  } | null>(null);

  const handleAgreeChange = (checked: boolean) => {
    setIsAgreed(checked);
  };

  const handleSubmit = () => {
    if (showAgree && !isAgreed) {
      return; // Don't submit if agreement is required but not checked
    }
    callback({
      action: "submit",
      agreed: isAgreed,
      termsData: termsData || undefined,
    });
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleTermsCallback = useCallback(
    (data: {
      action: string;
      data?: { version: string; name: string; code: string; content: string };
    }) => {
      if (data.action === "success" && data.data) {
        setTermsData(data.data);
      }
    },
    []
  );

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-4xl">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold">
          Terms & Conditions / Agreement
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-96 tw:overflow-y-auto">
        <div className="tw:space-y-4">
          <TermsContent
            termsKey="SK_SELLER_ONBOARD"
            className="tw:prose tw:prose-sm tw:max-w-none"
            callback={handleTermsCallback}
          />
        </div>
      </AppModal.Content>

      {showAgree && (
        <AppModal.Footer className="tw:border-t tw:border-gray-200">
          <div className="tw:space-y-4 tw:w-full">
            <AppCheckbox
              name="agreement"
              label="I agree to the Terms & Conditions"
              value={isAgreed}
              onChange={handleAgreeChange}
              className="tw:flex tw:items-center tw:gap-2"
            />

            <div className="tw:flex tw:gap-3 tw:justify-end">
              <AppButton
                fill="outline"
                onClick={handleClose}
                className="tw:px-6"
              >
                Cancel
              </AppButton>
              <AppButton
                onClick={handleSubmit}
                disabled={!isAgreed}
                className="tw:px-6"
              >
                Agree & Continue
              </AppButton>
            </div>
          </div>
        </AppModal.Footer>
      )}

      {!showAgree && (
        <AppModal.Footer className="tw:border-t tw:border-gray-200">
          <div className="tw:flex tw:gap-3 tw:justify-end">
            <AppButton fill="outline" onClick={handleClose} className="tw:px-6">
              Close
            </AppButton>
          </div>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default SignupAgreementModal;
