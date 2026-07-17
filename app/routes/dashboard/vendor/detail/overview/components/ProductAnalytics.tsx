import React from "react";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";

interface ProductAnalyticsProps {
  data?: {
    totalProducts?: number;
    activeProducts?: number;
    lowStockItems?: number;
    outOfStockItems?: number;
    outOfStock?: number;
    inventoryValue?: number | string;
  };
}

const ProductAnalytics: React.FC<ProductAnalyticsProps> = ({ data }) => {
  return (
    <AppCard
      title="Product Analytics"
      icon="package"
      iconClassName="tw:text-blue-500"
    >
      <div className="tw:flex tw:flex-col tw:gap-4 tw:text-sm">
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Total Products</span>
          <span className="tw:font-semibold">{data?.totalProducts ?? 0}</span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Active Products</span>
          <span className="tw:font-semibold tw:text-green-500">
            {data?.activeProducts ?? 0}
          </span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Low Stock Items</span>
          <span className="tw:font-semibold tw:text-red-500">
            {data?.lowStockItems ?? 0}
          </span>
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start">
          <span className="tw:text-slate-500">Out of Stock</span>
          <span className="tw:font-semibold tw:text-red-500">
            {data?.outOfStockItems ?? data?.outOfStock ?? 0}
          </span>
        </div>
      </div>
      <Divider />
      <div className="tw:flex tw:justify-between tw:gap-2 tw:items-start tw:text-sm">
        <span className="tw:text-slate-500 tw:font-medium">
          Inventory Value
        </span>
        <span className="tw:font-semibold tw:text-blue-500">
          {data?.inventoryValue ?? 0}
        </span>
      </div>
    </AppCard>
  );
};

export default ProductAnalytics;
