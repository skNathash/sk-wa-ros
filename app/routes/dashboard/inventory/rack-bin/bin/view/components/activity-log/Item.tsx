import React from "react";
import DateFormat from "~/components/core/date/DateFormat";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";

interface ItemProps {
  data: any;
  callback: (a: { action: string; data: any }) => void;
}

const Item: React.FC<ItemProps> = ({ data, callback }) => {
  return (
    <div className="tw:flex tw:items-start tw:gap-4 tw:p-4  tw:border-l-4 tw:border-blue-300 tw:mb-4">
      <div className="tw:flex-1">
        <div className="tw:font-semibold tw:text-sm tw:text-gray-800 tw:flex tw:items-center tw:gap-2">
          {data.actionDescription || data.action}
          {data.action === "STOCK_MOVEMENT" && data?.toBin?.binId ? (
            <AppLink
              className="tw:text-xs tw:text-blue-500"
              href={`/dashboard/inventory/rack-bin/bin/view/${data?.toBin?.binId}`}
              asLink={true}
            >
              View Bin
            </AppLink>
          ) : null}
        </div>
        {(data.itemsAffected || []).map((item: any, idx: number) => (
          <div key={idx}>
            <div className="tw:text-gray-700 tw:text-sm tw:mt-1">
              <AppLink
                asLink
                href={`/dashboard/inventory/products/view/${item.dealId}`}
              >
                {item.dealName}
              </AppLink>
            </div>
            <div className="tw:text-gray-500 tw:text-sm tw:mt-1">
              <AppLink
                asLink
                href={`/dashboard/inventory/products/view/${item.dealId}`}
              >
                {item.dealRefId}
              </AppLink>
            </div>
            <AppBadge
              variant={data.changeType === "ADDED" ? "success" : "danger"}
              className="tw:mt-2"
            >
              {item.changeQtyBy} units
            </AppBadge>
          </div>
        ))}
      </div>
      <div className="tw:flex tw:flex-col tw:items-end tw:justify-between tw:min-w-[120px]">
        <div className="tw:text-xs tw:text-gray-400">
          <DateFormat value={data.createdAt} />
        </div>
        <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
          {data.createdBy?.name}
        </div>
      </div>
    </div>
  );
};

export default Item;
