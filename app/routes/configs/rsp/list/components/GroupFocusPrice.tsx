import clsx from "clsx";
import { Settings } from "lucide-react";
import React from "react";
import InlinePriceEdit, {
  type InlinePriceResult,
} from "~/shared/catalog/components/inline-price-edit/InlinePriceEdit";
import type { NetworkGroupPrice, SellerDeal } from "~/types/CommonTypes";
import type { PriceGroupColumn } from "../helper";
import { groupTone } from "./GroupPriceCell";

export interface GroupFocusPriceProps {
  deal: SellerDeal;
  /** The one buyer group the sheet is filtered to. */
  group: PriceGroupColumn;
  /** Opens the price config modal scoped to that group. */
  onEdit: (group: PriceGroupColumn) => void;
  onPriceResult?: (result: InlinePriceResult) => void;
  className?: string;
}

/**
 * One buyer group's price as a single pill — what a mobile row carries once the
 * group filter has narrowed the sheet to that group.
 *
 * With one group in view there is nothing to compare across, so the run of
 * group cards collapses into the price itself: the inline field in the group's
 * colour, the margin it runs at beside it, and the gear into the full config.
 * A group with no price of its own stays grey and says so, exactly as its card
 * does.
 */
const GroupFocusPrice: React.FC<GroupFocusPriceProps> = ({
  deal,
  group,
  onEdit,
  onPriceResult,
  className,
}) => {
  const tone = groupTone(group.toneIndex);

  const groupPrice: NetworkGroupPrice | undefined = (
    deal.networkGroupPrices || []
  ).find((entry) => entry.id === group.id);

  const configured = !!groupPrice?.price;
  const price = groupPrice?.price || deal.b2bPrice || 0;

  return (
    <span
      onClick={(e) => e.stopPropagation()}
      title={
        configured
          ? `Edit the ${group.name} price`
          : `${group.name} inherits the deal price — tap to set its own`
      }
      className={clsx(
        "tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-full tw:border tw:border-dashed tw:py-0.5 tw:pr-1 tw:pl-0.5",
        configured ? tone.card : "tw:border-slate-300 tw:bg-slate-50",
        className,
      )}
    >
      {/* The field carries no box of its own here — the pill around it is the
          border, so the price, its margin and the gear read as one control. */}
      <InlinePriceEdit
        dealId={deal._id || (deal.id as string)}
        type="b2b"
        price={price}
        group={{
          id: group.id,
          name: group.name,
          sellerDealObjId: (deal as any).sellerDealObjId || "",
        }}
        callback={onPriceResult}
        showEdit={false}
        aria-label={`${group.name} price`}
        className="tw:w-[72px]"
        fieldClassName="tw:border-transparent tw:bg-transparent"
        textClassName={configured ? tone.price : "tw:text-slate-700"}
        inputClassName="tw:text-[13px]"
      />

      {/* A group with no price of its own is worth saying out loud; the margin
          it runs at is not — the caption under the pill already carries it. */}
      {!configured && (
        <span className="tw:rounded-full tw:bg-slate-200 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:whitespace-nowrap tw:text-slate-600">
          deal price
        </span>
      )}

      <button
        type="button"
        aria-label={`${group.name} price settings`}
        onClick={(e) => {
          e.stopPropagation();
          onEdit(group);
        }}
        className={clsx(
          "tw:inline-flex tw:size-5 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:transition-opacity hover:tw:opacity-70",
          configured ? tone.header : "tw:text-slate-400",
        )}
      >
        <Settings size={13} />
      </button>
    </span>
  );
};

export default GroupFocusPrice;
