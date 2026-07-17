import React from "react";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import AppBadge from "~/components/core/badge/AppBadge";

interface DamageAnalyticsProps {
  data?: {
    ordersWithDamage?: number;
    damageRate?: number | string;
    damagedQuantity?: number;
    damageValue?: number | string;
  };
}

const DamageAnalytics: React.FC<DamageAnalyticsProps> = ({ data }) => {
  return (
    <AppCard
      title="Damage Analytics"
      icon="alert-triangle"
      iconClassName="tw:text-red-500"
    >
      <div className="tw:flex tw:flex-col tw:gap-4 tw:text-sm">
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Orders with Damage</span>
          <span className="tw:font-semibold tw:text-red-500">
            {data?.ordersWithDamage ?? 0}
          </span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Damage Rate</span>
          <AppBadge variant="danger">{data?.damageRate ?? 0}</AppBadge>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Damaged Qty</span>
          <span className="tw:font-semibold">{data?.damagedQuantity ?? 0}</span>
        </div>
      </div>
      <Divider />
      <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start tw:text-sm">
        <span className="tw:text-slate-500 tw:font-medium">Damage Value</span>
        <span className="tw:font-semibold tw:text-red-500">
          {data?.damageValue ?? 0}
        </span>
      </div>
    </AppCard>
  );
};

export default DamageAnalytics;
