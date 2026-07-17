import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  data: Array<{
    _id: string;
    dealName: string;
    quantity: number;
    _totalValue: number;
    images: string[];
    price: number;
    mrp: number;
  }>;
};

const Items = ({ data }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalValue = data.reduce((sum, item) => sum + item._totalValue, 0);
  const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);

  const renderItemContent = (item: (typeof data)[0]) => {
    const discount =
      item.mrp && item.mrp > item.price
        ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
        : 0;

    return (
      <div className="tw:flex tw:items-start tw:gap-4 tw:py-4 tw:px-4 hover:tw:bg-gray-50 tw:transition-colors">
        {/* <div className="tw:flex-shrink-0">
          <ImgRender
            assetId={item.images?.[0]}
            alt={item.dealName}
            className="tw:w-16 tw:h-16 tw:object-contain tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white"
          />
        </div> */}

        <div className="tw:flex-1 tw:min-w-0">
          <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-1 tw:line-clamp-2 tw:leading-tight">
            {item.dealName}
          </div>

          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1">
            <div className="tw:text-[10px] tw:font-bold tw:text-gray-500 tw:bg-gray-100 tw:px-2 tw:py-0.5 tw:rounded tw:uppercase">
              Qty: {item.quantity}
            </div>

            <div className="tw:flex tw:items-baseline tw:gap-1.5">
              <div className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase">
                B2B Price:
              </div>
              <Amount
                value={item.price}
                className="tw:text-sm tw:font-bold tw:text-green-600"
              />
              {item.mrp && item.mrp > item.price && (
                <Amount
                  value={item.mrp}
                  className="tw:text-xs tw:text-gray-400 tw:line-through"
                />
              )}
            </div>

            {discount > 0 && (
              <div className="tw:text-[10px] tw:font-bold tw:text-red-500 tw:bg-red-50 tw:px-1.5 tw:py-0.5 tw:rounded tw:border tw:border-red-100">
                {discount}% OFF
              </div>
            )}
          </div>
        </div>

        <div className="tw:text-right tw:flex-shrink-0">
          <div className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-wider tw:mb-0.5">
            Total
          </div>
          <Amount
            value={item._totalValue}
            className="tw:text-sm tw:font-bold tw:text-gray-900"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:overflow-hidden">
        {/* Accordion Header - Summary */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="tw:w-full tw:flex tw:items-center tw:justify-between tw:py-3 tw:px-4 tw:bg-white hover:tw:bg-gray-50 tw:transition-colors"
        >
          <div className="tw:flex tw:items-center tw:gap-4 tw:text-left">
            <div>
              <div className="tw:text-xs tw:font-bold tw:text-gray-500 tw:uppercase tw:mb-0.5">
                Items
              </div>
              <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                {data.length} {data.length === 1 ? "item" : "items"}
              </div>
            </div>
            <div className="tw:h-8 tw:w-px tw:bg-gray-200"></div>
            <div>
              <div className="tw:text-xs tw:font-bold tw:text-gray-500 tw:uppercase tw:mb-0.5">
                Total Qty
              </div>
              <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                {totalQuantity}
              </div>
            </div>
            <div className="tw:h-8 tw:w-px tw:bg-gray-200"></div>
            <div>
              <div className="tw:text-xs tw:font-bold tw:text-gray-500 tw:uppercase tw:mb-0.5">
                Total Value
              </div>
              <Amount
                value={totalValue}
                className="tw:text-sm tw:font-bold tw:text-gray-900"
              />
            </div>
          </div>
          <ChevronDown
            className={`tw:w-5 tw:h-5 tw:text-gray-400 tw:transition-transform tw:duration-300 tw:flex-shrink-0 tw:ml-2 ${
              isExpanded ? "tw:rotate-180" : ""
            }`}
          />
        </button>

        {/* Accordion Content - All Items */}
        <div
          className={`tw:overflow-hidden tw:transition-all tw:duration-300 ${
            isExpanded ? "tw:max-h-96" : "tw:max-h-0"
          }`}
        >
          <div className="tw:divide-y tw:divide-gray-100 tw:bg-gray-50 tw:border-t tw:border-gray-100">
            {data.map((item) => (
              <div key={item._id}>{renderItemContent(item)}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Items;
