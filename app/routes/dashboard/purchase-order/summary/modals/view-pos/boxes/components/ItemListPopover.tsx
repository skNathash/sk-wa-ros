import React from "react";
import Amount from "~/components/core/amount/Amount";

export interface ItemListPopoverProps {
  items: Array<{
    id: string | number;
    name: string;
    quantity: number;
    price?: number;
    mrp?: number;
  }>;
  title?: string;
}

const ItemListPopover: React.FC<ItemListPopoverProps> = ({ items, title }) => {
  if (!items.length) {
    return <div className="tw:p-2 tw:text-gray-400">No items</div>;
  }

  const heading = title ?? "Items";

  return (
    <div className="tw:p-2 tw:min-w-[240px]">
      <div className="tw:pb-2 tw:mb-2 tw:border-b tw:border-gray-100">
        <div className="tw:text-sm tw:font-medium tw:text-gray-700">
          {heading} ({items.length})
        </div>
      </div>
      <div className="tw:divide-y tw:divide-gray-100">
        {items.map((item) => {
          return (
            <div
              key={item.id}
              className="tw:py-1 tw:flex tw:items-center tw:justify-between"
            >
              <div className="tw:flex-1 tw:min-w-0">
                <div
                  className="tw:font-medium tw:text-sm tw:text-gray-800"
                  title={item.name}
                >
                  {item.name}
                </div>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <span className="tw:text-xs tw:text-gray-500 tw:line-through">
                    {item.mrp == null ? (
                      "-"
                    ) : (
                      <Amount value={item.mrp} decimalPlaces={2} className="" />
                    )}
                  </span>
                  <span className="tw:text-xs tw:text-emerald-600 tw:font-semibold">
                    {item.price == null ? (
                      "-"
                    ) : (
                      <Amount
                        value={item.price}
                        decimalPlaces={2}
                        className=""
                      />
                    )}
                  </span>
                </div>
              </div>
              <div className="tw:ml-3 tw:flex tw:items-center">
                <span
                  className="tw:text-xs tw:text-gray-600 tw:bg-gray-100 tw:px-2 tw:py-0.5 tw:rounded"
                  aria-label={`quantity-${item.id}`}
                >
                  x{item.quantity}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ItemListPopover;
