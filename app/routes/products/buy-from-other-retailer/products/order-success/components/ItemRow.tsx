import Amount from "~/components/core/amount/Amount";
import type { OrderItem } from "../helper";

interface Props {
  item: OrderItem;
}

const ItemRow = ({ item }: Props) => (
  <div className="tw:flex tw:items-center tw:gap-3 tw:py-2.5">
    <div className="tw:min-w-0 tw:flex-1">
      <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:truncate">
        {item.dealName}
      </div>
      <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
        Qty: {item.quantity || 0} {item.uom || ""} ×{" "}
        <Amount value={item.price || 0} />
      </div>
    </div>
    <Amount
      value={item.finalPrice || 0}
      className="tw:text-sm tw:font-semibold tw:text-gray-800 tw:whitespace-nowrap"
    />
  </div>
);

export default ItemRow;
