import React from "react";
import AppCard from "~/components/core/card/AppCard";
import { Package } from "lucide-react";
import ItemPackItem from "./ItemPackItem";

interface DealItem {
  _id?: string;
  dealId?: string;
  dealDetails?: {
    name?: string;
    [key: string]: any;
  };
  quantity?: number;
  scannedQty?: number;
  scannedQuantity?: number;
  scannedData?: any[];
  scannedResultData?: any[];
  [key: string]: any;
}

interface ItemPackListProps {
  deals: DealItem[];
  className?: string;
}

const ItemPackList: React.FC<ItemPackListProps> = ({
  deals = [],
  className = "",
}) => {
  return (
    <AppCard className={className}>
      <div className="tw:flex tw:items-center tw:gap-3 tw:mb-4">
        <Package className="tw:w-5 tw:h-5 tw:text-primary" />
        <div className="tw:text-lg tw:font-semibold tw:text-gray-800">
          Items to Pack
        </div>
      </div>

      <div className="tw:space-y-3">
        {deals.length === 0 ? (
          <div className="tw:text-center tw:text-gray-500 tw:py-4">
            No items to pack
          </div>
        ) : (
          deals.map((item, index) => (
            <ItemPackItem key={item._id || index} item={item} index={index} />
          ))
        )}
      </div>
    </AppCard>
  );
};

export default ItemPackList;
