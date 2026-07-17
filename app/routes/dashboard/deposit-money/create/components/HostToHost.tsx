import { ArrowRight, Zap } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import HostToHostModal from "../modals/HostToHostModal";
import { useState } from "react";

const HostToHost = ({ hostData }: { hostData: any }) => {
  if (!hostData) return null;

  const [showModal, setShowModal] = useState(false);

  const handleModalCallback = (a: { action: string; data?: any }) => {
    if (a.action === "close") {
      setShowModal(false);
    }
  };

  return (
    <>
      <div className="tw:bg-linear-to-r tw:from-green-50 tw:to-green-100 tw:border tw:border-green-200 tw:rounded-lg tw:p-4 tw:mb-4 tw:shadow-sm">
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center">
            <Zap className="tw:text-green-600 tw:mr-3 tw:w-6 tw:h-6" />
            <div>
              <div className="tw:text-lg tw:font-semibold tw:text-gray-800">
                Express Deposit
              </div>
              <div className="tw:text-sm tw:text-gray-600">
                Deposit 24x7 instantly
              </div>
            </div>
          </div>
          <AppButton
            size="small"
            color="primary"
            noShadow={true}
            onClick={() => setShowModal(true)}
          >
            View Details
            <ArrowRight className="tw:ml-2 tw:w-4 tw:h-4" />
          </AppButton>
        </div>
      </div>

      <HostToHostModal
        show={showModal}
        callback={handleModalCallback}
        hostData={hostData}
      />
    </>
  );
};

export default HostToHost;
