import React, { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import SKSellerInfoModal from "../modals/SKSellerInfoModal";
import FranchiseService from "~/services/FranchiseService";
import AuthService from "~/services/AuthService";
import AppButton from "~/components/core/button/AppButton";
import { useTranslation } from "react-i18next";
import useAppToast from "~/hooks/useAppToast";

type UpgradeToSKSellerProps = {
  onUpgradeClick: () => void;
  onSuccess?: () => void;
};

const UpgradeToSKSeller: React.FC<UpgradeToSKSellerProps> = ({
  onUpgradeClick,
  onSuccess,
}) => {
  const appToast = useAppToast();
  const { t } = useTranslation(["common"]);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [requestDetails, setRequestDetails] = useState<any>(null);

  const fetchSkSellerJoinRequests = async () => {
    setLoading(true);
    const resp = await FranchiseService.getSkSellerJoinRequests(
      AuthService.getLoggedInUserId()
    );
    setRequestDetails(resp?.data?.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSkSellerJoinRequests();
  }, []);

  const handleUpgradeClick = () => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    setShowModal(true);
  };

  if (loading) {
    return null;
  }

  return (
    <div className="tw:mb-4">
      <div
        className="tw:w-full tw:flex tw:items-center tw:gap-3 tw:rounded-md tw:border tw:border-blue-500 tw:bg-blue-50 tw:px-3 tw:py-3 hover:tw:bg-blue-100 tw:cursor-pointer"
        role="button"
        tabIndex={0}
      >
        <div className="tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-full tw:bg-blue-100">
          <Crown className="tw:w-5 tw:h-5 tw:text-blue-600" />
        </div>
        <div className="tw:text-left tw:flex-1">
          <div className="tw:font-semibold tw:text-blue-900">
            {t("upgradeThisAccount")}
          </div>
          <div className="tw:text-sm tw:text-blue-900">
            {requestDetails ? (
              <div className="tw:flex tw:items-center tw:gap-2">
                <span className="tw:text-blue-900">
                  {t("requestStatusLabel")}
                </span>
                <span className="tw:capitalize tw:font-semibold tw:px-3 tw:py-1 tw:rounded-full tw:bg-blue-100 tw:text-blue-800 tw:border tw:border-blue-300">
                  {requestDetails.status || "Pending"}
                </span>
              </div>
            ) : (
              t("tapToSeeBenefits")
            )}
          </div>
        </div>
        {!requestDetails && (
          <AppButton onClick={handleUpgradeClick}>{t("upgrade")}</AppButton>
        )}
      </div>
      <SKSellerInfoModal
        show={showModal}
        onClose={(result) => {
          setShowModal(false);
          if (result.action === "submit") {
            // Refetch request status after successful submission
            fetchSkSellerJoinRequests();
            // Trigger success modal
            onSuccess?.();
          }
        }}
      />
    </div>
  );
};

export default UpgradeToSKSeller;
