import React, { useEffect, useState } from "react";
import PaylaterService from "~/services/PaylaterService";
import AuthService from "~/services/AuthService";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import PaylaterApplyCard from "./PaylaterApplyCard";
import PaylaterStatusCard from "./PaylaterStatusCard";

const PaylaterRequestCard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<Record<string, any> | null>(null);

  const userId = AuthService.getLoggedInUserId();
  const isBuyer = AuthService.isBuyerUser();

  useEffect(() => {
    if (!userId || !isBuyer) return;

    const fetchRequest = async () => {
      try {
        setLoading(true);
        const parentId = AuthService.getLoggedInUser()?.linkedFranchise?.id;
        const resp = await PaylaterService.getRequests({
          filter: {
            "userInfo.id": userId,
            "franchiseInfo.id": parentId,
          },
        });

        const d = resp.data?.data?.[0] || null;
        setRequest(d);
      } catch (err) {
        // swallow - parent can show errors, keep UI simple here
        setRequest(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [userId, isBuyer]);

  if (!isBuyer) {
    return null;
  }

  if (!userId) {
    return (
      <div className="tw-w-full">
        <NoData />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-py-6">
        <AppSpinner />
      </div>
    );
  }

  // If there is an existing request, show a small summary. If none, show the Apply card.
  if (!request) {
    return (
      <div>
        <PaylaterApplyCard />
      </div>
    );
  }

  // Derive props for PaylaterStatusCard with safe fallbacks
  const status = request.status || "";
  const requestId = request.refId || "";
  const rawRequestId = request._id || request.id || "";
  const retailerName = request.franchiseInfo?.name || "";

  if (status === "Approved") {
    return null;
  }

  return (
    <div>
      <PaylaterStatusCard
        status={status}
        requestId={requestId}
        retailerName={retailerName}
        rawRequestId={rawRequestId}
      />
    </div>
  );
};

export default PaylaterRequestCard;
