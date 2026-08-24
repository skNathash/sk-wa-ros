import { ChevronDown } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import NoData from "~/components/core/no-data/NoData";
import { detailRows, modeBadge } from "./DesktopView";
import type { Payment } from "./helper";

type MobileViewProps = {
  data: Payment[];
  expanded: string | null;
  toggle: (item: Payment) => void;
};

/**
 * Mobile payments feed: one white sheet bled to the screen edges
 * (`app-bleed-x`) with hairline-divided rows, so the payments read as a list
 * rather than a card. Date and reference fold under the vendor line; the right
 * rail carries the amount and what the payee is to the shop. Tapping a row
 * opens the ledger and instrument references behind the payment.
 */
const MobileView = ({ data, expanded, toggle }: MobileViewProps) => {
  /* The empty read keeps the sheet — white, bled and ruled like the rows it
     stands in for — so the block does not collapse to bare page background. */
  if (data.length === 0)
    return (
      <div className="app-bleed-x tw:border-y tw:border-gray-100 tw:bg-white">
        <NoData />
      </div>
    );

  return (
    <div className="app-bleed-x tw:divide-y tw:divide-gray-100 tw:border-y tw:border-gray-100 tw:bg-white">
      {data.map((item) => (
        <div key={item.id}>
          <div
            className="tw:flex tw:items-start tw:gap-2.5 tw:px-4 tw:py-3 tw:active:bg-slate-50"
            onClick={() => toggle(item)}
          >
            <div className="tw:min-w-0 tw:flex-1">
              <div className="tw:flex tw:items-center tw:gap-1.5">
                <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
                  {item.vendor}
                </span>
                {modeBadge(item)}
              </div>
              <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                {item.dateLabel} · {item.reference}
              </div>
            </div>
            <div className="tw:shrink-0 tw:text-right">
              <div className="tw:text-sm tw:font-bold tw:text-red-600">
                −<Amount value={item.amount} decimalPlaces={0} />
              </div>
              <div className="tw:text-[11px] tw:text-gray-500">
                {item.vendorTypeLabel}
              </div>
            </div>
            {/* The row is the only affordance for the detail block, so it
                carries a chevron that turns down once the payment is open. */}
            <ChevronDown
              size={16}
              className={`tw:mt-0.5 tw:shrink-0 tw:text-gray-400 tw:transition-transform ${
                expanded === item.id ? "tw:rotate-0" : "tw:-rotate-90"
              }`}
            />
          </div>

          {expanded === item.id && detailRows(item)}
        </div>
      ))}
    </div>
  );
};

export default MobileView;
