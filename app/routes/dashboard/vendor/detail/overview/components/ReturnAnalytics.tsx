import React from "react";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import AppBadge from "~/components/core/badge/AppBadge";

interface ReturnAnalyticsProps {
  data?: {
    totalReturns?: number;
    activeReturns?: number;
    pendingApproval?: number;
    returnRate?: number | string;
    returnValue?: number | string;
  };
}

const ReturnAnalytics: React.FC<ReturnAnalyticsProps> = ({ data }) => {
  return (
    <AppCard
      title="Return Analytics"
      icon="refresh-cw"
      iconClassName="tw:text-yellow-500"
    >
      <div className="tw:flex tw:flex-col tw:gap-4 tw:text-sm">
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Total Returns</span>
          <span className="tw:font-semibold">{data?.totalReturns ?? 0}</span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Active Returns</span>
          <span className="tw:font-semibold tw:text-green-500">
            {data?.activeReturns ?? 0}
          </span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Pending Approval</span>
          <span className="tw:font-semibold tw:text-orange-500">
            {data?.pendingApproval ?? 0}
          </span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Return Rate</span>
          <AppBadge variant="warning">{data?.returnRate ?? 0}</AppBadge>
        </div>
      </div>
      <Divider />
      <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start tw:text-sm">
        <span className="tw:text-slate-500 tw:font-medium">Return Value</span>
        <span className="tw:font-semibold tw:text-yellow-500">
          {data?.returnValue ?? 0}
        </span>
      </div>
    </AppCard>
  );
};

export default ReturnAnalytics;
