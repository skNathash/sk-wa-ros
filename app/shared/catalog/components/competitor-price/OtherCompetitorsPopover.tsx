import clsx from "clsx";
import { Store } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppPopover from "~/components/core/popover/AppPopover";
import CommonService from "~/services/CommonService";
import { colorFor, Monogram } from "./CompetitorPrice";

export interface OtherCompetitor {
  name: string;
  price: number;
  isLowest?: boolean;
  url?: string;
}

/**
 * Compact trigger that opens a popover listing every competitor outside the
 * fixed Flipkart/Amazon columns. Renders nothing when there are no "other"
 * competitors, so callers can drop it inline without guarding themselves.
 */
const OtherCompetitorsPopover = ({
  others,
}: {
  others?: OtherCompetitor[];
}) => {
  if (!others?.length) return null;

  // Cheapest first — the most competitive "other" offer is the one the retailer
  // most needs to react to, so surface it at the top of the list.
  const sorted = [...others].sort((a, b) => Number(a.price) - Number(b.price));

  return (
    <AppPopover
      align="center"
      side="bottom"
      triggerContent={
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          title={`${others.length} more competitor${
            others.length > 1 ? "s" : ""
          }`}
          className="tw:inline-flex tw:items-center tw:gap-1 tw:whitespace-nowrap tw:rounded tw:px-1 tw:py-0.5 tw:text-[11px] tw:font-medium tw:text-gray-400 tw:transition-colors hover:tw:text-gray-600 hover:tw:underline tw:cursor-pointer"
        >
          <Store size={10} />+{others.length} more
        </button>
      }
    >
      <div className="tw:mb-2 tw:text-xs tw:font-semibold tw:text-gray-900">
        Other competitors
      </div>
      <div className="tw:flex tw:flex-col tw:gap-1.5">
        {sorted.map((c) => {
          const nameLabel = (
            <span className="tw:inline-flex tw:items-center tw:gap-1.5">
              <Monogram label={c.name} color={colorFor(c.name)} />
              <span className="tw:text-xs tw:font-medium tw:text-gray-600">
                {c.name}
              </span>
              {c.isLowest && (
                <span className="tw:rounded tw:bg-green-100 tw:px-1.5 tw:py-px tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-green-700">
                  Lowest
                </span>
              )}
            </span>
          );

          return (
            <div
              key={c.name}
              className="tw:flex tw:items-center tw:justify-between tw:gap-4"
            >
              {c.url ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    CommonService.openInNewWindow(c.url);
                  }}
                  className="tw:cursor-pointer tw:transition-opacity hover:tw:opacity-70"
                >
                  {nameLabel}
                </button>
              ) : (
                nameLabel
              )}
              <Amount
                value={c.price}
                className={clsx(
                  "tw:whitespace-nowrap tw:tabular-nums tw:text-xs",
                  c.isLowest
                    ? "tw:font-bold tw:text-green-700"
                    : "tw:font-semibold tw:text-gray-700",
                )}
              />
            </div>
          );
        })}
      </div>
    </AppPopover>
  );
};

export default OtherCompetitorsPopover;
