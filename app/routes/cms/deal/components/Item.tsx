import React from "react";

import AppBadge from "~/components/core/badge/AppBadge";
import Divider from "~/components/core/divider/Divider";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";

interface ItemProps {
  data: any;
  onAction?: (payload: { action: string; data: any }) => void;
}

const Item: React.FC<ItemProps> = ({ data, onAction }) => {
  return (
    <div className="tw:border tw:border-gray-200 tw:rounded tw:mb-4 tw:p-4 tw:bg-white">
      {/* Header: Name & ID, Active & Type */}
      <div className="tw:flex tw:justify-between tw:items-center">
        <div>
          <div className="tw:text-base tw:font-semibold">{data.name}</div>
          <div className="tw:text-xs tw:text-slate-400">ID: {data.id}</div>
        </div>
        <div className="tw:flex tw:gap-2 tw:items-center">
          <AppBadge variant={data.active ? "success" : "danger"}>
            {data.active ? "Active" : "Inactive"}
          </AppBadge>
          <AppBadge variant="primary">{data.type}</AppBadge>
        </div>
      </div>

      {/* Divider */}
      <Divider />

      {/* Grid: Sales 10/20/30 days */}
      <div className="tw:grid tw:grid-cols-3 tw:text-center tw:gap-2 tw:mb-2">
        <div>
          <div className="tw:text-lg tw:font-semibold">
            <Amount value={data.sales10d} />
          </div>
          <div className="tw:text-xs tw:text-slate-400">10 Days Sales</div>
        </div>
        <div>
          <div className="tw:text-lg tw:font-semibold">
            <Amount value={data.sales20d} />
          </div>
          <div className="tw:text-xs tw:text-slate-400">20 Days Sales</div>
        </div>
        <div>
          <div className="tw:text-lg tw:font-semibold">
            <Amount value={data.sales30d} />
          </div>
          <div className="tw:text-xs tw:text-slate-400">30 Days Sales</div>
        </div>
      </div>

      {/* Divider */}
      <Divider />

      {/* Flex: Total Products & Total Items */}
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:text-xs tw:text-slate-500">Total Products</div>
          <div className="tw:text-sm tw:font-medium">{data.totalProducts}</div>
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:text-xs tw:text-slate-500">Total Items</div>
          <div className="tw:text-sm tw:font-medium">{data.totalItems}</div>
        </div>
      </div>

      {/* Flex: Revenue & Units Sold */}
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:text-xs tw:text-slate-500">Revenue</div>
          <div className="tw:text-sm tw:font-medium tw:text-green-600">
            <Amount value={data.revenue} />
          </div>
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:text-xs tw:text-slate-500">Units Sold</div>
          <div className="tw:text-sm tw:font-medium">{data.unitsSold}</div>
        </div>
      </div>

      {/* Divider */}
      <Divider />

      {/* Grid: B2C Price, B2B Price, Actions */}
      <div className="tw:grid tw:grid-cols-3 tw:text-center tw:gap-2">
        <div>
          <div className="tw:text-xs tw:text-slate-400">B2C Price</div>
          <div className="tw:text-lg tw:font-semibold tw:text-green-600">
            <Amount value={data.b2cPrice} />
          </div>
        </div>
        <div>
          <div className="tw:text-xs tw:text-slate-400">B2B Price</div>
          <div className="tw:text-lg tw:font-semibold">
            <Amount value={data.b2bPrice} />
          </div>
        </div>
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-1">
          <AppButton
            className="tw:mb-1 tw:w-full"
            onClick={() => onAction && onAction({ action: "view", data })}
            size="small"
            color="light"
            fill="outline"
          >
            Edit
          </AppButton>
          <AppButton
            className="tw:w-full"
            onClick={() => onAction && onAction({ action: "manage", data })}
            size="small"
            color="primary"
          >
            View
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default Item;
