import { FileText, Split } from "lucide-react";
import React, { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import useAppNav from "~/hooks/useAppNav";
import OmsService from "~/services/OmsService";

interface Props {
  orderId?: string | number;
  canDoSplitOrder?: boolean;
  callback: (data: { action: string; data?: any }) => void;
  className?: string;
  isMyOrder?: boolean;
}

const SplitOrder: React.FC<Props> = ({
  orderId,
  canDoSplitOrder = false,
  callback,
  className,
  isMyOrder,
}) => {
  const appNav = useAppNav();
  const [openRequests, setOpenRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (!canDoSplitOrder || !orderId) {
      setOpenRequests([]);
      return;
    }
    let mounted = true;
    const fetchRequests = async () => {
      setLoadingRequests(true);
      try {
        const response = await OmsService.getOrderSplitRequests(
          String(orderId),
        );
        const list = response?.data?.data ?? [];
        if (mounted) setOpenRequests(Array.isArray(list) ? list : []);
      } catch {
        if (mounted) setOpenRequests([]);
      } finally {
        if (mounted) setLoadingRequests(false);
      }
    };
    fetchRequests();
    return () => {
      mounted = false;
    };
  }, [orderId, canDoSplitOrder]);

  const openCreate = () => {
    const base = "/dashboard/orders/partial-order-request/create";
    appNav.to(base, { orderId });
  };

  const openView = (requestId: string) => {
    appNav.to("/dashboard/orders/partial-order-request/view", {
      id: requestId,
    });
  };

  if (!canDoSplitOrder) return null;

  const hasOpenRequests = openRequests.length > 0;
  const firstRequest = hasOpenRequests ? openRequests[0] : null;
  const requestId = firstRequest?._id ?? firstRequest?.requestId ?? "";

  if (loadingRequests) {
    return null;
  }

  // Hide the entire block when there are no previous requests
  // and the order does not belong to the current user.
  if (!loadingRequests && !hasOpenRequests && !isMyOrder) return null;

  return (
    <AppCard
      className={`tw:bg-amber-50 tw:border tw:border-amber-100 ${className || ""}`}
      noPadding
    >
      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-start tw:sm:items-center tw:justify-between tw:gap-2 tw:sm:gap-3 tw:p-2 tw:sm:p-3">
        <div className="tw:flex tw:items-start tw:gap-2 tw:flex-1 tw:min-w-0 tw:w-full">
          <div className="tw:mt-0.5 tw:text-primary">
            {hasOpenRequests ? (
              <FileText className="tw:w-4 tw:h-4" />
            ) : (
              <Split className="tw:w-4 tw:h-4" />
            )}
          </div>
          <div className="tw:flex-1 tw:min-w-0">
            {loadingRequests ? (
              <div className="tw:text-sm tw:text-muted-foreground">
                Loading...
              </div>
            ) : hasOpenRequests ? (
              <>
                <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:gap-1 tw:sm:gap-2 tw:mb-0.5">
                  <div className="tw:text-xs tw:sm:text-sm tw:font-medium">
                    Already have a separate reservation request
                  </div>
                  {firstRequest?.status ? (
                    <AppBadge
                      variant={OmsService.getSplitRequestStatusColor(
                        firstRequest.status,
                      )}
                    >
                      {firstRequest.status}
                    </AppBadge>
                  ) : null}
                </div>
                {firstRequest?.childOrderId ? (
                  <p className="tw:text-xs tw:text-muted-foreground tw:leading-snug tw:m-0">
                    New Order ID:{" "}
                    <AppLink
                      asLink
                      href={`/dashboard/orders/view/${firstRequest.childOrderId}`}
                      showLinkColor
                      className="tw:font-medium"
                    >
                      {firstRequest.childOrderRefNo}
                    </AppLink>
                  </p>
                ) : (
                  <p className="tw:text-xs tw:text-muted-foreground tw:leading-snug tw:m-0">
                    View request details.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="tw:text-xs tw:sm:text-sm tw:font-medium tw:mb-0.5">
                  Create Separate Order
                </div>
                <p className="tw:text-xs tw:text-muted-foreground tw:leading-snug tw:m-0">
                  Move reserve items from this order into a new order so they
                  can be processed separately.
                </p>
              </>
            )}
          </div>
        </div>
        {!loadingRequests &&
          (hasOpenRequests ? (
            <AppButton
              color="primary"
              size="small"
              onClick={() => openView(requestId)}
              className="tw:shrink-0 tw:w-full tw:sm:w-auto"
            >
              View Request
            </AppButton>
          ) : isMyOrder ? (
            <AppButton
              color="primary"
              size="small"
              onClick={openCreate}
              className="tw:shrink-0 tw:w-full tw:sm:w-auto"
            >
              Create Separate Order
            </AppButton>
          ) : null)}
      </div>
    </AppCard>
  );
};

export default SplitOrder;
