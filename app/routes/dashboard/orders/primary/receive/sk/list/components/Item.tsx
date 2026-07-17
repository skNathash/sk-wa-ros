import { Box, Dot } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";

const Item = ({ data }: { data: Record<string, any> }) => {
  return (
    <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4">
      <div className="tw:flex tw:gap-2 tw:items-center tw:mb-2">
        <Box />
        <div className="tw:text-sm tw:font-medium">{data.packageRefNo}</div>
      </div>
      <div className="tw:flex tw:gap-2 tw:items-center tw:mb-2">
        <DateFormat
          value={data.createdAt}
          className="tw:text-xs tw:text-gray-500"
        />

        <Dot />

        <div className="tw:text-xs tw:text-gray-500">
          {data.items?.length} items
        </div>

        <Dot />

        <AppBadge variant={data._statusColor}>{data._statusDisplay}</AppBadge>
      </div>

      <div>
        {data.items.slice(0, 1).map((item: Record<string, any>) => (
          <div
            key={item._id}
            className="tw:flex tw:gap-2 tw:items-center tw:justify-between"
          >
            <div className="tw:text-xs tw:text-gray-600">{item.dealName}</div>
            <span className="tw:text-xs tw:text-gray-600 tw:bg-gray-100 tw:px-2 tw:py-1 tw:rounded-full">
              {item.qty}
            </span>
          </div>
        ))}

        {data.items.length > 1 && (
          <div className="tw:text-xs tw:text-gray-500 tw:cursor-pointer">
            +{data.items.length - 1} more
          </div>
        )}
      </div>
    </div>
  );
};

export default Item;
