import { ArrowRight, Package } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import { getOfferDescription, getSavings } from "../helper";

type OfferCardProps = {
  deal: any;
  onApply: (deal: any) => void;
};

/**
 * Promotional-deal card — cream header, savings row, primary CTA.
 * Matches the Offers tab mockup.
 */
const OfferCard = ({ deal, onApply }: OfferCardProps) => {
  const savings = getSavings(deal);
  const description = getOfferDescription(deal);

  return (
    <article className="tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
      <div className="tw:h-1.5 tw:bg-orange-500" aria-hidden="true" />

      <div className="tw:bg-orange-50/80 tw:px-4 tw:pt-3.5 tw:pb-3">
        <div className="tw:mb-2.5 tw:flex tw:items-center tw:gap-2">
          <span className="tw:inline-flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-white tw:shadow-sm tw:ring-1 tw:ring-orange-100">
            <Package className="tw:h-4 tw:w-4 tw:text-orange-500" />
          </span>
          <span className="tw:rounded-md tw:bg-orange-500 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-white">
            Mega
          </span>
        </div>
        <h3 className="tw:text-[0.9375rem] tw:font-bold tw:leading-snug tw:text-slate-900 tw:text-balance">
          {deal.name || "Promotional deal"}
        </h3>
      </div>

      <div className="tw:space-y-4 tw:px-4 tw:py-4">
        {description ? (
          <p className="tw:text-sm tw:leading-relaxed tw:text-slate-500">
            {description}
          </p>
        ) : null}

        {savings > 0 ? (
          <div>
            <p className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-slate-400">
              You save
            </p>
            <p className="tw:mt-0.5 tw:text-2xl tw:font-bold tw:leading-none tw:text-primary">
              <Amount value={savings} decimalPlaces={0} />
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => onApply(deal)}
          className="tw:inline-flex tw:w-full tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-full tw:bg-primary tw:px-4 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-primary-foreground tw:shadow-sm tw:transition-colors tw:hover:bg-primary-dark tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-primary/40 tw:active:scale-[0.99]"
        >
          Apply to order
          <ArrowRight className="tw:h-4 tw:w-4" />
        </button>
      </div>
    </article>
  );
};

export default OfferCard;
export type { OfferCardProps };
