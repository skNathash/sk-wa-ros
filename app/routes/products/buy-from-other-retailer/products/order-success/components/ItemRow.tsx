import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import type { OrderItem } from "../helper";

interface Props {
  item: OrderItem;
}

// A simple, scannable item row for the order summary.
const ItemRow = ({ item }: Props) => (
  <div className="tw:flex tw:items-center tw:gap-3 tw:bg-white tw:px-4 tw:py-2.5">
    <div className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-lg tw:border tw:border-gray-200 tw:bg-slate-50">
      {item.images?.length ? (
        <ImgRender
          assetId={item.images[0]}
          alt={item.dealName || ""}
          className="tw:h-full tw:w-full tw:object-contain tw:p-0.5"
        />
      ) : (
        <span className="tw:text-center tw:text-[9px] tw:leading-tight tw:text-gray-400">
          No
          <br />
          Image
        </span>
      )}
    </div>

    <div className="tw:min-w-0 tw:flex-1">
      <div className="tw:truncate tw:text-[13px] tw:font-medium tw:leading-snug tw:text-gray-900">
        {item.dealName}
      </div>
      <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
        {item.quantity || 0} {item.uom || ""} ×{" "}
        <Amount value={item.price || 0} />
      </div>
    </div>

    <Amount
      value={item.finalPrice || 0}
      className="tw:whitespace-nowrap tw:text-sm tw:font-semibold tw:text-gray-800"
    />
  </div>
);

export default ItemRow;
