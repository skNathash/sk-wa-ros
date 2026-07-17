import React from "react";

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

interface ItemPackItemProps {
  item: DealItem;
  index: number;
}

const ItemPackItem: React.FC<ItemPackItemProps> = ({ item, index }) => {
  const isCompleted = (item.scannedQty || 0) >= (item.quantity || 0);

  return (
    <div
      className={`tw:rounded-lg tw:p-4 tw:border tw:border-gray-200 ${
        isCompleted ? "tw:bg-green-50 tw:border-green-200" : "tw:bg-white"
      }`}
    >
      <div className="tw:flex tw:items-center tw:justify-between">
        <div className="tw:flex-1">
          <div className="tw:font-semibold tw:text-gray-900 tw:mb-1">
            {item.dealName}
          </div>
          <div className="tw:text-sm tw:text-gray-500">{item.dealRefId}</div>
        </div>
        <div className="tw:ml-4">
          <div className="tw:bg-gray-100 tw:px-3 tw:py-1 tw:rounded-full tw:text-sm tw:font-medium tw:text-gray-700">
            {item.scannedQty || 0}/{item.pickedQty || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemPackItem;
