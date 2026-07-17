import React, { useEffect, useState } from "react";
import PaylaterService from "~/services/PaylaterService";
import AuthService from "~/services/AuthService";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaylaterApplyCard from "~/shared/accounts/components/paylater/paylater-req-card/PaylaterApplyCard";

const BuyerPaylaterApply: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [showApplyCard, setShowApplyCard] = useState(false);

  useEffect(() => {
    const checkAndShow = async () => {
      try {
        setLoading(true);

        // Check if user is buyer
        const isBuyer = AuthService.isBuyerUser();
        if (!isBuyer) {
          setShowApplyCard(false);
          return;
        }

        // Check if paylater request already exists
        const userId = AuthService.getLoggedInUserId();
        if (!userId) {
          setShowApplyCard(false);
          return;
        }

        const parentId = AuthService.getLoggedInUser()?.linkedFranchise?.id;
        const resp = await PaylaterService.getRequests({
          filter: {
            "userInfo.id": userId,
            "franchiseInfo.id": parentId,
          },
        });

        const existingRequest = resp.data?.data?.[0] || null;

        // Show apply card only if no request exists
        setShowApplyCard(!existingRequest);
      } catch (err) {
        console.error("Error checking paylater request:", err);
        setShowApplyCard(false);
      } finally {
        setLoading(false);
      }
    };

    checkAndShow();
  }, []);

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-py-6">
        <AppSpinner />
      </div>
    );
  }

  if (!showApplyCard) {
    return null;
  }

  return (
    <div className="tw:mb-4">
      <PaylaterApplyCard />
    </div>
  );
};

export default BuyerPaylaterApply;
