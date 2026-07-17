import React from "react";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";

interface PaymentStatusProps {
  data?: {
    unpaidOrders?: number;
    overdueOrders?: number;
    outstandingAmount?: number | string;
    // Pending Credits and Debits are not in the prop, so default to 0
    pendingCredits?: number;
    pendingDebits?: number;
  };
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({ data }) => {
  return (
    <AppCard
      title="Payment Status"
      icon="credit-card"
      iconClassName="tw:text-purple-500"
    >
      <div className="tw:flex tw:flex-col tw:gap-4 tw:text-sm">
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Unpaid Orders</span>
          <span className="tw:font-semibold">{data?.unpaidOrders ?? 0}</span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Overdue Orders</span>
          <span className="tw:font-semibold tw:text-red-500">
            {data?.overdueOrders ?? 0}
          </span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Pending Credits</span>
          <span className="tw:font-semibold tw:text-green-500">
            {data?.pendingCredits ?? 0}
          </span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Pending Debits</span>
          <span className="tw:font-semibold tw:text-yellow-500">
            {data?.pendingDebits ?? 0}
          </span>
        </div>
      </div>
      <Divider />
      <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start tw:text-sm">
        <span className="tw:text-slate-500 tw:font-medium">
          Outstanding Amount
        </span>
        <span className="tw:font-semibold tw:text-blue-500">
          {data?.outstandingAmount ?? 0}
        </span>
      </div>
    </AppCard>
  );
};

export default PaymentStatus;
