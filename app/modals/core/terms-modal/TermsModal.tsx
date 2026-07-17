import { useCallback, useEffect, useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import TermsContent from "~/components/core/terms-content/TermsContent";
import { ALERT_DISMISS_TIME } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";

type Props = {
  code: string;
  show: boolean;
  title?: string;
  version?: string;
  callback: (a: { action: string; data?: any }) => void;
  canUpdate?: boolean;
  noCancelButton?: boolean;
};

const TermsModal = ({
  code,
  show = false,
  title = "Terms & Conditions",
  version,
  callback,
  canUpdate = false,
  noCancelButton = false,
}: Props) => {
  const appToast = useAppToast();

  const [submitting, setSubmitting] = useState(false);

  const [alertDailog, setAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    action: string;
  }>({
    show: false,
    title: "",
    description: "",
    action: "",
  });

  useEffect(() => {
    if (show) {
      setSubmitting(false);
    }
  }, [show]);

  const handleClose = useCallback(() => {
    callback({ action: "close" });
  }, [callback]);

  const handleTermsCallback = useCallback(
    (e: { action: string; data?: any }) => {},
    [callback],
  );

  const showAlert = ({
    title,
    description,
    action,
  }: {
    title: string;
    description: string;
    action: string;
  }) => {
    setAlertDialog({
      show: true,
      title,
      description,
      action,
    });
  };

  const handleIAgree = async () => {
    setSubmitting(true);

    const user = AuthService.getLoggedInUser();
    const terms = (user?.termAndConditions || []).map((t: any) => ({
      code: t.code,
      version: t.version,
      status: t.status,
      isAgree: t.isAgree,
    }));

    const existingTermIndex = terms.findIndex((t: any) => t.code === code);
    const newTerm = {
      code,
      version,
      status: "Agreed",
      isAgree: true,
    };

    if (existingTermIndex !== -1) {
      terms[existingTermIndex] = newTerm;
    } else {
      terms.push(newTerm);
    }

    const r = await FranchiseService.updateFranchise({
      termAndConditions: terms,
    });
    if (r.statusCode === 200) {
      appToast.show({
        msg: "Terms and conditions agreed successfully",
        color: "success",
      });
      callback({ action: "agree" });
    } else {
      appToast.show({
        msg: r.data.message,
        color: "danger",
      });
      setSubmitting(false);
    }
  };

  const alertConfirmCb = async () => {
    const action = alertDailog.action;

    setAlertDialog((prev) => ({ ...prev, show: false }));

    await new Promise((resolve) => setTimeout(resolve, ALERT_DISMISS_TIME));

    if (action === "agree") {
      handleIAgree();
    }
  };

  const alertCancelCb = () => {
    setAlertDialog((prev) => ({ ...prev, show: false }));
  };

  return (
    <>
      <AppModal
        show={show}
        callback={callback}
        className="tw:h-[90vh] tw:md:max-w-3xl!"
      >
        <AppModal.Title onClose={handleClose} hideCloseBtns={noCancelButton}>
          <div className="tw:font-semibold">{title}</div>
        </AppModal.Title>
        <AppModal.Content className="tw:max-h-[90vh]">
          <TermsContent
            termsKey={code}
            version={version}
            callback={handleTermsCallback}
          />
        </AppModal.Content>
        <AppModal.Footer className="tw:border-t tw:border-gray-200 tw:w-full">
          {canUpdate ? (
            <div className="tw:flex tw:justify-end tw:w-full">
              <div className="tw:flex tw:gap-3 tw:justify-end">
                {!noCancelButton && (
                  <AppButton onClick={handleClose} color="light" fill="outline">
                    Cancel
                  </AppButton>
                )}
                <AppButton
                  onClick={() => {
                    showAlert({
                      title: "Are you sure?",
                      description:
                        "Are you sure you want to agree to the terms and conditions?",
                      action: "agree",
                    });
                  }}
                  color="primary"
                  isLoading={submitting}
                  disabled={submitting}
                >
                  I Agree
                </AppButton>
              </div>
            </div>
          ) : (
            <div className="tw:flex tw:gap-3 tw:justify-end tw:w-full">
              <AppButton onClick={handleClose} color="light" fill="outline">
                Got it
              </AppButton>
            </div>
          )}
        </AppModal.Footer>
      </AppModal>

      <AppAlertDialog
        show={alertDailog.show}
        title={alertDailog.title}
        description={alertDailog.description}
        onConfirm={alertConfirmCb}
        onCancel={alertCancelCb}
      />
    </>
  );
};

export default TermsModal;
