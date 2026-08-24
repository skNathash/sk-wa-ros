import clsx from "clsx";
import React from "react";
import InlinePriceEdit, {
  type InlinePriceResult,
} from "~/shared/catalog/components/inline-price-edit/InlinePriceEdit";

/**
 * One colour per buyer-group column, cycled when there are more groups. The
 * desktop sheet uses `header` / `chip`; the mobile block additionally tints the
 * whole group card (`card`, `dot`, `badge`) and its price field (`field`,
 * `price`) — same index, so a group keeps its colour across both views.
 */
export const GROUP_TONES = [
  {
    header: "tw:text-emerald-700",
    chip: "tw:border-emerald-300 tw:bg-emerald-50/70 tw:text-emerald-700 hover:tw:bg-emerald-100",
    card: "tw:border-emerald-100 tw:bg-emerald-50/60",
    dot: "tw:bg-emerald-500",
    badge: "tw:bg-emerald-700 tw:text-white",
    field: "tw:border-dashed tw:border-emerald-400 tw:bg-white/70",
    price: "tw:text-emerald-700",
  },
  {
    header: "tw:text-violet-700",
    chip: "tw:border-violet-300 tw:bg-violet-50/70 tw:text-violet-700 hover:tw:bg-violet-100",
    card: "tw:border-violet-100 tw:bg-violet-50/60",
    dot: "tw:bg-violet-500",
    badge: "tw:bg-violet-700 tw:text-white",
    field: "tw:border-dashed tw:border-violet-400 tw:bg-white/70",
    price: "tw:text-violet-700",
  },
  {
    header: "tw:text-amber-700",
    chip: "tw:border-amber-300 tw:bg-amber-50/70 tw:text-amber-700 hover:tw:bg-amber-100",
    card: "tw:border-amber-100 tw:bg-amber-50/60",
    dot: "tw:bg-amber-500",
    badge: "tw:bg-amber-700 tw:text-white",
    field: "tw:border-dashed tw:border-amber-400 tw:bg-white/70",
    price: "tw:text-amber-700",
  },
  {
    header: "tw:text-sky-700",
    chip: "tw:border-sky-300 tw:bg-sky-50/70 tw:text-sky-700 hover:tw:bg-sky-100",
    card: "tw:border-sky-100 tw:bg-sky-50/60",
    dot: "tw:bg-sky-500",
    badge: "tw:bg-sky-700 tw:text-white",
    field: "tw:border-dashed tw:border-sky-400 tw:bg-white/70",
    price: "tw:text-sky-700",
  },
  {
    header: "tw:text-rose-700",
    chip: "tw:border-rose-300 tw:bg-rose-50/70 tw:text-rose-700 hover:tw:bg-rose-100",
    card: "tw:border-rose-100 tw:bg-rose-50/60",
    dot: "tw:bg-rose-500",
    badge: "tw:bg-rose-700 tw:text-white",
    field: "tw:border-dashed tw:border-rose-400 tw:bg-white/70",
    price: "tw:text-rose-700",
  },
];

export const groupTone = (index: number) =>
  GROUP_TONES[index % GROUP_TONES.length];

export interface GroupPriceCellProps {
  /** Deal the price belongs to — `_id` from the price-comparison response. */
  dealId: string;
  /** Seller-deal document id — what the group price endpoint is keyed on. */
  sellerDealObjId: string;
  /** Buyer group this column prices. */
  group: { id: string; name?: string };
  /** Group price when configured; the deal's own B2B price otherwise. */
  price: number;
  /** False when the group inherits the deal price. */
  configured: boolean;
  /** "%  off" line under the field — only for a configured, non-fixed price. */
  discountLabel?: string;
  toneIndex: number;
  /** Opens the full price config modal scoped to this group. */
  onEdit: () => void;
  /** Outcome of the inline save, so the host can refresh the row. */
  onPriceResult?: (result: InlinePriceResult) => void;
}

/**
 * A buyer group's B2B price, edited in place. The field is the shared
 * {@link InlinePriceEdit} handed the group, so typing writes that group's fixed
 * price straight to the seller-deal endpoint; the pencil still opens the full
 * config modal for margin mode.
 *
 * The caption below carries the column's colour when the group has a price of
 * its own and stays grey when it inherits the deal price, so a glance down the
 * column shows which groups have actually been priced.
 */
const GroupPriceCell: React.FC<GroupPriceCellProps> = ({
  dealId,
  sellerDealObjId,
  group,
  price,
  configured,
  discountLabel,
  toneIndex,
  onEdit,
  onPriceResult,
}) => {
  const tone = groupTone(toneIndex);

  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:gap-0.5">
      <InlinePriceEdit
        dealId={dealId}
        type="b2b"
        price={price}
        group={{ id: group.id, name: group.name, sellerDealObjId }}
        callback={onPriceResult}
        onEdit={onEdit}
        aria-label={`${group.name || "Group"} price`}
        className="tw:w-[120px]"
        inputClassName="tw:text-center"
      />

      <span
        className={clsx(
          "tw:text-[10px] tw:font-medium",
          configured ? tone.header : "tw:text-slate-400",
        )}
      >
        {configured ? discountLabel : "deal price"}
      </span>
    </div>
  );
};

export default GroupPriceCell;
