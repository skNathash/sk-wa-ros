import React from "react";

type ShelfLife = {
  expired: number;
  expiresSoon: number;
  fresh: number;
};

const ShelfLifeSummary: React.FC<{ shelfLife?: ShelfLife }> = ({
  shelfLife = { expired: 0, expiresSoon: 0, fresh: 0 },
}) => {
  const { expired, expiresSoon, fresh } = shelfLife;
  return (
    <div className="tw:border-green-300 tw:border tw:rounded-lg tw:p-4 tw:mb-4">
      <div className="tw:text-sm tw:font-medium tw:mb-2 tw:text-gray-800">
        Shelf Life Summary
      </div>
      <div className="tw:grid tw:grid-cols-3 tw:gap-4">
        <div className="tw:flex tw:flex-col">
          <div className="tw:text-xs tw:text-green-500 tw:mb-1 tw:min-h-8 tw:md:min-h-0">
            Fresh (30+ days)
          </div>
          <div className="tw:text-lg tw:font-semibold tw:text-green-700">
            {fresh}
          </div>
        </div>

        <div className="tw:flex tw:flex-col tw:items-center">
          <div className="tw:text-xs tw:text-red-500 tw:mb-1 tw:min-h-8 tw:md:min-h-0">
            Expires Soon (&lt; 30 days)
          </div>
          <div className="tw:text-lg tw:font-semibold tw:text-red-700">
            {expiresSoon}
          </div>
        </div>

        <div className="tw:flex tw:flex-col tw:items-end">
          <div className="tw:text-xs tw:text-red-500 tw:mb-1 tw:min-h-8 tw:md:min-h-0">
            Expired
          </div>
          <div className="tw:text-lg tw:font-semibold tw:text-red-700">
            {expired}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelfLifeSummary;
