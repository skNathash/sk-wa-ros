import TintTile from "~/components/core/tint/TintTile";
import type { PaylaterCustomer } from "../helper";

/** Initials chip in front of the customer's name, tinted per party. */
const CustomerAvatar = ({ item }: { item: PaylaterCustomer }) => (
  <TintTile
    index={item._tintIndex}
    className="tw:h-9 tw:w-9 tw:shrink-0 tw:rounded-full tw:text-xs tw:font-bold"
  >
    {item._initials}
  </TintTile>
);

export default CustomerAvatar;
