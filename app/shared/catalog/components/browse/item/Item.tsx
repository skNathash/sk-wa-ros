import React from "react";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";

type CallbackPayload = { action: string; data?: any };

type ItemProps = {
  id?: string;
  image?: string;
  name: string;
  totalDeals?: number;
  totalCategories?: number;
  totalBrands?: number;
  selected?: boolean;
  callback: (payload: CallbackPayload) => void;
};

const Item: React.FC<ItemProps> = ({
  id,
  image,
  name,
  totalDeals = 0,
  totalCategories = 0,
  totalBrands = 0,
  selected = false,
  callback,
}) => {
  const onTap = () => {
    // Mirror Brand.tsx behavior: emit a 'view' action with item data and optional sortType
    callback({
      action: "view",
      data: { _id: id, name, image, totalDeals, totalCategories, totalBrands },
    });
  };

  return (
    <div
      onClick={onTap}
      role="button"
      tabIndex={0}
      className={clsx(
        "tw:border tw:rounded-md tw:p-2 tw:mb-2 tw:flex tw:gap-2 tw:items-center tw:cursor-pointer",
        {
          "tw:border-blue-500 tw:bg-blue-50": selected,
          "tw:border-gray-200": !selected,
        }
      )}
    >
      <div className="tw:flex-1">
        <div className="tw:text-sm tw:font-medium tw:mb-1">{name}</div>
        <div className="tw:text-xs tw:text-gray-500">
          {totalDeals || 0} deals
        </div>
      </div>

      <div>
        <ChevronRight size={16} aria-hidden />
      </div>
    </div>
  );
};

export default Item;
