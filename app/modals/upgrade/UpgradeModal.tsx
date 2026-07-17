import React, { useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import MiscService from "~/services/MiscService";
import { OLD_APP } from "~/constants";
import UpgradeConfirm from "./components/UpgradeConfirm";
import UpgradeDetailsForm from "./components/UpgradeDetailsForm";
import UpgradeSuccess from "./components/UpgradeSuccess";

export type UpgradeStep = "confirm" | "details" | "success";

interface UpgradeModalProps {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  data?: any;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  show,
  callback,
  data,
}) => {
  const [currentStep, setCurrentStep] = useState<UpgradeStep>("confirm");
  const [upgradeData, setUpgradeData] = useState<any>({});
  const [showRedirectAlert, setShowRedirectAlert] = useState<boolean>(false);

  const handleClose = () => {
    callback({ action: "close" });
    setCurrentStep("confirm");
    setUpgradeData({});
  };

  const handleStepChange = (step: UpgradeStep, data?: Record<string, any>) => {
    setCurrentStep(step);
    if (data) {
      setUpgradeData({ ...upgradeData, ...data });
    }
  };

  const handleUpgradeComplete = (data: Record<string, any>) => {
    callback({ action: "upgrade_complete", data: { ...upgradeData, ...data } });
    setCurrentStep("confirm");
    setUpgradeData({});
  };

  const handleConfirmCallback = (data: Record<string, any>) => {
    if (data.action === "confirm") {
      handleStepChange("details", data);
    } else {
      if (data.action === "close") {
        setShowRedirectAlert(true);
      } else if (data.action === "dismiss") {
        handleClose();
      } else {
        callback({ action: data.action });
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "confirm":
        return <UpgradeConfirm callback={handleConfirmCallback} />;
      case "details":
        return (
          <UpgradeDetailsForm
            onNext={(data) => handleStepChange("success", data)}
            onBack={() => setCurrentStep("confirm")}
            onClose={handleClose}
            data={data}
          />
        );
      case "success":
        return (
          <UpgradeSuccess
            onComplete={handleUpgradeComplete}
            onClose={handleClose}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:bg-gradient-to-br tw:from-blue-50 tw:to-white tw:md:bg-blue-50"
      backdropDismiss={false}
    >
      {renderStep()}
      <AppAlertDialog
        show={showRedirectAlert}
        type="confirm"
        title="Continue in classic app"
        description="We'll take you to the classic version now. You can return here anytime."
        okText="Continue"
        cancelText="Stay here"
        onConfirm={() => {
          setShowRedirectAlert(false);
          try {
            let url = OLD_APP;
            if (url) {
              if (MiscService.hasCordova()) {
                url += url.includes("?") ? "&inj_cordova=1" : "?inj_cordova=1";
              }
              window.location.href = url;
            } else {
              callback({ action: "close" });
              setCurrentStep("confirm");
              setUpgradeData({});
            }
          } catch (e) {
            callback({ action: "close" });
            setCurrentStep("confirm");
            setUpgradeData({});
          }
        }}
        onCancel={() => {
          setShowRedirectAlert(false);
        }}
      />
    </AppModal>
  );
};

export default UpgradeModal;
