import clsx from "clsx";
import { Settings } from "lucide-react";
import React from "react";
import CommonService from "~/services/CommonService";
import InlinePriceEdit, {
  type InlinePriceResult,
} from "~/shared/catalog/components/inline-price-edit/InlinePriceEdit";
import type { NetworkGroupPrice, SellerDeal } from "~/types/CommonTypes";
import type { PriceGroupColumn } from "../helper";
import { groupTone } from "./GroupPriceCell";

export interface GroupPriceChipsProps {
  deal: SellerDeal;
  /** Buyer groups to show a price for — the same columns the sheet renders. */
  groups: PriceGroupColumn[];
  /** Opens the price config modal scoped to that group. */
  onEdit: (group: PriceGroupColumn) => void;
  /** Outcome of an inline group-price save. */
  onPriceResult?: (result: InlinePriceResult) => void;
  className?: string;
}

/**
 * Margin caption colour — the same banding and thresholds the row's own
 * "% mgn" badge runs on, so a margin reads as the same health here as it does
 * up on the deal. Deliberately not the group's tone: the card, dot and price
 * already carry that, and colouring the margin by group makes an identical
 * number look like it means different things across the run.
 */
const marginToneClass = (marginPct: number) =>
  marginPct >= 20
    ? "tw:text-emerald-700"
    : marginPct >= 10
      ? "tw:text-amber-600"
      : "tw:text-red-600";

const findGroupPrice = (
  deal: SellerDeal,
  groupId: string,
): NetworkGroupPrice | undefined =>
  (deal.networkGroupPrices || []).find((group) => group.id === groupId);

/**
 * Buyer-group prices for one deal — the mobile counterpart of the sheet's group
 * price columns. Each group is a tinted card carrying its price, the margin it
 * runs at and the way into that group's price config; a group with no price of
 * its own stays grey on the deal price, so a glance across the row shows which
 * groups have actually been priced.
 *
 * The price itself is the shared {@link InlinePriceEdit} handed the group, so
 * it is edited in place and written straight to that group's price; the gear
 * beside the field opens the full config modal.
 *
 * Colours come from the shared `groupTone` by position, so a group reads the
 * same here as in its desktop column.
 */
const GroupPriceChips: React.FC<GroupPriceChipsProps> = ({
  deal,
  groups,
  onEdit,
  onPriceResult,
  className,
}) => {
  if (!groups.length) return null;

  return (
    <div
      // Bled into the row's gutter so the first card lines up with the text
      // above it while the rest of the run scrolls past the edge.
      className={clsx(
        "tw:-mx-1 tw:flex tw:gap-2 tw:overflow-x-auto tw:px-1 tw:pb-0.5 hide-scrollbar",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {groups.map((group, index) => {
        const tone = groupTone(group.toneIndex ?? index);
        const groupPrice = findGroupPrice(deal, group.id);
        const configured = !!groupPrice?.price;
        const price = groupPrice?.price || deal.b2bPrice || 0;

        const isFixed = groupPrice?.discountType === "Fixed";
        const marginPct = CommonService.roundedByDecimalPlace(
          groupPrice?.discount || 0,
          2,
        );
        // A fixed price is not run off a margin, so it says so instead.
        const marginLabel = isFixed ? "Fixed price" : `${marginPct}% margin`;

        return (
          <div
            key={group.id}
            title={
              configured
                ? `Edit the ${group.name} price`
                : `${group.name} inherits the deal price — tap to set its own`
            }
            className={clsx(
              "tw:flex tw:w-32 tw:shrink-0 tw:flex-col tw:items-center tw:gap-1.5 tw:rounded-xl tw:border tw:px-2.5 tw:py-2",
              configured ? tone.card : "tw:border-slate-200 tw:bg-slate-50/70",
            )}
          >
            <span className="tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-1.5">
              <span
                className={clsx(
                  "tw:h-1.5 tw:w-1.5 tw:shrink-0 tw:rounded-full",
                  configured ? tone.dot : "tw:bg-slate-300",
                )}
              />
              <span
                className={clsx(
                  "tw:truncate tw:text-[10px] tw:font-bold tw:tracking-wider tw:uppercase",
                  configured ? tone.header : "tw:text-slate-500",
                )}
              >
                {group.name}
              </span>
            </span>

            {/* Price and the way into its config sit side by side: the field
                keeps the group's colour, the gear rides outside it so the
                dashed box reads as the editable value alone. */}
            <span className="tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-1">
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
                className="tw:min-w-0 tw:flex-1"
                fieldClassName={
                  configured
                    ? tone.field
                    : "tw:border-dashed tw:border-slate-300 tw:bg-white/70"
                }
                textClassName={configured ? tone.price : "tw:text-slate-600"}
                inputClassName="tw:text-center tw:text-[13px]"
              />

              <button
                type="button"
                aria-label={`${group.name} price settings`}
                title={`${group.name} price settings`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(group);
                }}
                className={clsx(
                  "tw:inline-flex tw:h-6 tw:w-6 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:bg-white/80 tw:transition-opacity hover:tw:opacity-70",
                  configured ? tone.header : "tw:text-slate-400",
                )}
              >
                <Settings size={13} />
              </button>
            </span>

            {/* The margin badge that used to ride next to the price is gone —
                this caption already states it, in the margin banding rather
                than the group's tone (see `marginToneClass`). */}
            <span
              className={clsx(
                "tw:w-full tw:truncate tw:text-center tw:text-[10px] tw:font-semibold",
                !configured
                  ? "tw:text-slate-400"
                  : // A fixed price is not run off a margin, so it gets no
                    // traffic light.
                    isFixed
                    ? "tw:text-slate-500"
                    : marginToneClass(marginPct),
              )}
            >
              {configured ? marginLabel : "deal price"}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default GroupPriceChips;
