import { HelpCircle } from "lucide-react";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import DeclarationAgreementModal from "~/shared/store/declaration-agreement/DeclarationAgreementModal";

interface DeclarationFormProps {
  mobile: string;
  id?: string; // optional id to be used for resend/verify (vendor id or user id)
  onVerified?: () => void;
  acceptedAt?: Date;
}

const DeclarationForm: React.FC<DeclarationFormProps> = ({
  mobile,
  id,
  onVerified,
  acceptedAt,
}) => {
  const toast = useAppToast();
  const { t } = useTranslation(["common"]);

  const [busyLoader, setBusyLoader] = useState({
    show: false,
    message: "",
  });

  const [alertDialog, setAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const [agreed, setAgreed] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  const verifyDeclaration = async () => {
    if (AuthService.isManpowerLoggedIn() || AuthService.isMasterLogin()) {
      toast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }

    if (!agreed) {
      toast.show({
        msg: "Please agree to the declaration form",
        color: "danger",
      });
      return;
    }

    setAlertDialog({
      show: true,
      title: "Confirm Declaration",
      description: "Are you sure you want to agree to the declaration form?",
      onConfirm: async () => {
        setAlertDialog((prev) => ({ ...prev, show: false }));

        await new Promise((resolve) => setTimeout(resolve, 800));

        setBusyLoader({ show: true, message: "Verifying declaration..." });

        try {
          const resp = await FranchiseService.updateFranchise({
            declaration: {
              code: "RETAIL_OS_DECLARATION",
              version: "1.0",
            },
          });
          if (resp && resp.statusCode === 200) {
            toast.show({ msg: "Declaration verified", color: "success" });
            onVerified && onVerified();
          } else {
            toast.show({
              msg: "Failed to verify declaration",
              color: "danger",
            });
          }
        } catch (err: any) {
          toast.show({ msg: "Failed to verify declaration", color: "danger" });
        } finally {
          setBusyLoader({ show: false, message: "" });
        }
      },
      onCancel: () => {
        setAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  return (
    <>
      <div>
        <div className="tw:text-lg tw:font-medium tw:mb-2">
          Declaration Form
        </div>
        <div className="tw:text-sm tw:text-gray-600 tw:mb-3">
          The declaration form confirms that you agree to the terms and
          conditions required to complete your sign-up. By agreeing, you confirm
          the accuracy of the information you provided and accept the
          responsibilities listed below.
        </div>
      </div>
      <div className="tw:flex tw:items-start tw:gap-4">
        <div className="tw:flex-1">
          <ul className="tw:list-disc tw:pl-5 tw:text-sm tw:text-gray-600 tw:mb-3">
            <li>
              All information provided is true and correct to the best of your
              knowledge.
            </li>
            <li>
              You consent to verification of provided documents and contact
              details.
            </li>
            <li>
              You agree to comply with platform policies and operational rules.
            </li>
          </ul>

          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
            <input
              id="declaration-agree"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="tw:w-4 tw:h-4"
            />
            <label
              htmlFor="declaration-agree"
              className="tw:text-sm tw:text-gray-800"
            >
              I have read and agree to the declaration form
            </label>
            <button
              type="button"
              onClick={() => setShowAgreement(true)}
              className="tw:ml-2 tw:text-xs tw:text-blue-600 tw:underline tw:font-medium tw:cursor-pointer"
            >
              View Agreement
            </button>
          </div>

          <div className="tw:mt-2">
            <AppButton
              onClick={verifyDeclaration}
              disabled={
                AuthService.isManpowerLoggedIn &&
                AuthService.isManpowerLoggedIn()
              }
            >
              Verify & Continue
            </AppButton>
          </div>
        </div>
      </div>

      <BusyLoader show={busyLoader.show} message={busyLoader.message} />

      <DeclarationAgreementModal
        show={showAgreement}
        acceptedAt={acceptedAt}
        callback={({ action }) => {
          if (action === "close") setShowAgreement(false);
          if (action === "agree") {
            setAgreed(true);
            setShowAgreement(false);
          }
        }}
      />

      <AppAlertDialog
        show={alertDialog.show}
        title={alertDialog.title}
        description={alertDialog.description}
        onConfirm={alertDialog.onConfirm}
        onCancel={alertDialog.onCancel}
        type="confirm"
        okText="Yes, Continue"
        cancelText="Cancel"
      />
    </>
  );
};

export default DeclarationForm;
