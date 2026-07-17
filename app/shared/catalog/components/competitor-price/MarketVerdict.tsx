import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppPopover from "~/components/core/popover/AppPopover";
import CommonService from "~/services/CommonService";
import type { SellerDeal } from "~/types/CommonTypes";

/**
 * Above/below-market indicator for the price column. Built for at-a-glance,
 * low-literacy reading: a solid colour-coded circle (green = you're cheaper,
 * red = you're pricier, grey = same) holding the direction arrow, the gap
 * amount beside it, and an info icon whose popover spells out the comparison in
 * plain language. The verdict itself is computed in
 * `CommonService.getMarketPriceComparison`.
 */
const TONE: Record<
  "low" | "high" | "exact",
  { dot: string; text: string; Icon: typeof ArrowDownRight }
> = {
  low: { dot: "tw:bg-green-500", text: "tw:text-green-600", Icon: ArrowDownRight },
  high: { dot: "tw:bg-red-500", text: "tw:text-red-600", Icon: ArrowUpRight },
  exact: { dot: "tw:bg-gray-400", text: "tw:text-gray-500", Icon: Minus },
};

const MarketVerdict: React.FC<{
  partnerPriceData: SellerDeal["partnerPriceData"];
  price: number;
}> = ({ partnerPriceData, price }) => {
  const verdict = CommonService.getMarketPriceComparison(partnerPriceData, price);
  if (!verdict) return null;

  const tone = TONE[verdict.type];
  const { Icon } = tone;

  return (
    <span className="tw:inline-flex tw:items-center tw:justify-center tw:gap-1 tw:whitespace-nowrap">
      <span
        className={clsx(
          "tw:inline-flex tw:h-4 tw:w-4 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-white",
          tone.dot,
        )}
      >
        <Icon size={9} strokeWidth={3} />
      </span>
      {verdict.type !== "exact" && (
        <span className={clsx("tw:text-xs tw:font-bold tw:tabular-nums", tone.text)}>
          <Amount value={verdict.value} />
        </span>
      )}
      <AppPopover
        side="top"
        align="center"
        triggerContent={
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            title="What does this mean?"
            className="tw:inline-flex tw:shrink-0 tw:items-center tw:justify-center tw:text-gray-400 tw:transition-colors hover:tw:text-gray-600 tw:cursor-pointer"
          >
            <Info size={13} />
          </button>
        }
      >
        <div className="tw:max-w-[220px] tw:text-xs tw:leading-relaxed tw:text-gray-700">
          {verdict.type === "exact" ? (
            <>
              Your price matches the cheapest online price (
              <Amount value={verdict.lowest} /> on {verdict.lowestName}).
            </>
          ) : (
            <>
              Your price is{" "}
              <span className={clsx("tw:font-bold", tone.text)}>
                <Amount value={verdict.value} /> {verdict.msg}
              </span>{" "}
              than the cheapest online price (<Amount value={verdict.lowest} /> on{" "}
              {verdict.lowestName}).
            </>
          )}
        </div>
      </AppPopover>
    </span>
  );
};

export default MarketVerdict;
