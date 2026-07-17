import React from "react";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import AppBadge from "~/components/core/badge/AppBadge";

interface FinancialSummaryProps {
  data?: {
    totalRevenue?: number | string;
    totalOrders?: number;
    pendingOrders?: number;
    averageOrderValue?: number | string;
    recentOrders30d?: number;
    orderFrequency?: number | string;
    pendingTransactions?: number;
    riskAssessment?: string;
  };
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ data }) => {
  return (
    <AppCard
      title="Financial Summary"
      icon="activity"
      iconClassName="tw:text-emerald-500"
    >
      <div className="tw:flex tw:flex-col tw:gap-4 tw:text-sm">
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Average Order Value</span>
          <span className="tw:font-semibold">
            {data?.averageOrderValue ?? 0}
          </span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Recent Orders (30d)</span>
          <span className="tw:font-semibold tw:text-blue-500">
            {data?.recentOrders30d ?? 0}
          </span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Order Frequency</span>
          <span className="tw:font-semibold">
            {data?.orderFrequency ?? 0} / month
          </span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Pending Transactions</span>
          <span className="tw:font-semibold tw:text-orange-500">
            {data?.pendingTransactions ?? 0}
          </span>
        </div>
      </div>
      <Divider />
      <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start tw:text-sm">
        <span className="tw:text-slate-500">Risk Assessment</span>
        <AppBadge
          variant={
            data?.riskAssessment === "High"
              ? "danger"
              : data?.riskAssessment === "Medium"
              ? "warning"
              : data?.riskAssessment === "Low"
              ? "success"
              : "secondary"
          }
        >
          {data?.riskAssessment ?? ""}
        </AppBadge>
      </div>
    </AppCard>
  );
};

export default FinancialSummary;
