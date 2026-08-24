import { Crown } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import SKSellerInfoModal from "../../modals/SKSellerInfoModal";

interface SellerUpgradeCardProps {
  /** Fired once an upgrade request is submitted. */
  onSuccess?: () => void;
}

/**
 * The SK Seller pitch, as the compact card the theme-2 overview shows beside
 * the profile. Once a request exists the card reports its status instead of
 * asking again.
 */
const SellerUpgradeCard: React.FC<SellerUpgradeCardProps> = ({ onSuccess }) => {
  const toast = useAppToast();
  const { t } = useTranslation(["common"]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [requestDetails, setRequestDetails] = useState<any>(null);

  const fetchJoinRequests = async () => {
    setLoading(true);
    const resp = await FranchiseService.getSkSellerJoinRequests(
      AuthService.getLoggedInUserId(),
    );
    setRequestDetails(resp?.data?.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchJoinRequests();
  }, []);

  const handleUpgrade = () => {
    // A master login is impersonating the store, so it must not be able to
    // raise an upgrade request on the owner's behalf.
    if (AuthService.isMasterLogin()) {
      toast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    setShowModal(true);
  };

  if (loading) return null;

  return (
    <>
      <div className="tw:flex tw:items-start tw:gap-3 tw:rounded-2xl tw:bg-violet-100 tw:p-4">
        <span className="tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-white tw:text-violet-600">
          <Crown className="tw:h-5 tw:w-5" />
        </span>
        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:text-sm tw:font-bold tw:text-violet-900">
            Upgrade to SK Seller
          </div>
          <p className="tw:mt-0.5 tw:text-xs tw:text-violet-900/80">
            Approved · unlocks catalog reselling + B2B credit line
          </p>
        </div>
        {requestDetails ? (
          <span className="tw:shrink-0 tw:rounded-lg tw:bg-white tw:px-2.5 tw:py-1 tw:text-xs tw:font-bold tw:capitalize tw:text-violet-700">
            {requestDetails.status || "Pending"}
          </span>
        ) : (
          <button
            type="button"
            onClick={handleUpgrade}
            className="tw:shrink-0 tw:cursor-pointer tw:rounded-lg tw:bg-violet-600 tw:px-3 tw:py-2 tw:text-xs tw:font-bold tw:text-white tw:hover:bg-violet-700"
          >
            Upgrade
          </button>
        )}
      </div>

      <SKSellerInfoModal
        show={showModal}
        onClose={(result) => {
          setShowModal(false);
          if (result.action === "submit") {
            fetchJoinRequests();
            onSuccess?.();
          }
        }}
      />
    </>
  );
};

export default SellerUpgradeCard;
