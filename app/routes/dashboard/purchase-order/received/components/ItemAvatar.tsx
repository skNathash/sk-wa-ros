import TintTile from "~/components/core/tint/TintTile";
import { tintIndexFor } from "~/components/core/tint/tints";

type Props = {
  /** Seed the tint off the product so a deal keeps its colour across both rails. */
  seed: string;
  isOwn?: boolean;
};

/** The round SKU / OWN chip that fronts every product row on this screen. */
const ItemAvatar = ({ seed, isOwn = false }: Props) => (
  <TintTile
    index={tintIndexFor(seed)}
    className="tw:h-7 tw:w-7 tw:shrink-0 tw:rounded-full"
  >
    <span className="tw:text-[8px] tw:font-bold tw:uppercase tw:tracking-wide">
      {isOwn ? "OWN" : "SKU"}
    </span>
  </TintTile>
);

export default ItemAvatar;
