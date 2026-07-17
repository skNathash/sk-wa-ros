import React from "react";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import useScreenView from "~/hooks/useScreenView";
import { getCouponLogs } from "./helpers";
import MobileView from "./MobileView";
import DesktopView from "./DesktopView";

interface CouponAuditLogsProps {
  coupon: any;
}

const CouponAuditLogs: React.FC<CouponAuditLogsProps> = ({ coupon }) => {
  const { isMobile } = useScreenView();

  const logs = getCouponLogs(coupon);

  if (logs.length === 0) {
    return (
      <AppCard>
        <NoData>
          <h5 className="tw-mb-2">No logs available</h5>
          <p className="tw:text-sm tw:text-gray-500">
            No activity has been recorded for this coupon.
          </p>
        </NoData>
      </AppCard>
    );
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      {isMobile ? <MobileView logs={logs} /> : <DesktopView logs={logs} />}
    </div>
  );
};

export default CouponAuditLogs;
