import Amount from "~/components/core/amount/Amount";
import type { PaylaterCustomer } from "../helper";

/** Drawn amount over a fill bar of how much of the limit it takes up. */
const UsedBar = ({ item }: { item: PaylaterCustomer }) => (
  <div className="tw:ml-auto tw:w-28">
    <div className="tw:text-right tw:text-sm tw:font-bold tw:text-gray-900">
      <Amount value={item.used} decimalPlaces={0} />
    </div>
    <div className="tw:mt-1 tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-gray-200">
      <div
        className="tw:h-full tw:rounded-full tw:bg-emerald-700"
        style={{ width: `${item.usedPercent}%` }}
      />
    </div>
  </div>
);

export default UsedBar;
