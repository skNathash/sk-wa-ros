import AppModal from "~/components/core/modal/AppModal";
import TintTile from "~/components/core/tint/TintTile";
import PriceEvents from "~/shared/inventory/components/price-events/PriceEvents";
import InAndAround from "../../components/in-and-around/InAndAround";
import type { TrendDeal } from "../../components/deal-list/helper";

export interface TrendDetailModalProps {
  show: boolean;
  /** Deal the trend is charted for; the sheet renders nothing without one. */
  deal: TrendDeal | null;
  /** Pricing channel the listed prices are read on. */
  type: "network" | "customer";
  callback: (payload: { action: string; data?: any }) => void;
}

/**
 * Trend detail sheet — the mobile stand-in for the trend screen's right column.
 *
 * On mobile the picker takes the whole width, so the detail that sits beside it
 * on desktop is raised in a bottom sheet by tapping a SKU. The sheet stacks the
 * same two components the desktop column renders, in the same order.
 */
const TrendDetailModal = ({
  show,
  deal,
  type,
  callback,
}: TrendDetailModalProps) => {
  const close = () => callback({ action: "close" });

  if (!deal) return null;

  return (
    <AppModal
      show={show}
      callback={callback}
      noPadding
      className="tw:!max-h-[92vh]"
    >
      <AppModal.Title onClose={close}>
        <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2.5">
          <TintTile
            index={deal.tintIndex}
            className="tw:size-9 tw:shrink-0 tw:rounded-full tw:text-[11px] tw:font-bold"
          >
            {deal.initials}
          </TintTile>

          <span className="tw:min-w-0">
            <span className="tw:flex tw:items-center tw:gap-1.5">
              <span className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
                {deal.name}
              </span>
              {deal.isElectronics && (
                <span className="tw:shrink-0 tw:rounded tw:bg-amber-100 tw:px-1 tw:text-[9px] tw:font-bold tw:tracking-wide tw:text-amber-700 tw:uppercase">
                  Elec
                </span>
              )}
            </span>
            <span className="tw:mt-0.5 tw:block tw:truncate tw:text-[11px] tw:font-normal tw:text-slate-500">
              {deal.subLabel} · price trend
            </span>
          </span>
        </div>
      </AppModal.Title>

      <AppModal.Content noPadding className="tw:bg-slate-50">
        {/* The sheet's gutter is 1rem, the bleed `app-bleed-x` cancels, so both
            panels run to the screen edges with square corners and no side
            borders. */}
        <div className="tw:flex tw:flex-col tw:gap-3 tw:p-4">
          {/* Keyed on the SKU so a fresh pick starts from an empty chart
              instead of the previous SKU's dots. */}
          <InAndAround
            key={deal._id}
            dealId={deal._id}
            sellerDealObjId={deal.raw?.sellerDealObjId}
            pricingType={type === "network" ? "b2b" : "b2c"}
            className="app-bleed-x"
          />

          {/* The radius matches the chart above, so the peer moves listed are
              the peers plotted. */}
          <PriceEvents
            key={`events-${deal._id}`}
            dealId={deal._id}
            sellerDealObjId={deal.raw?.sellerDealObjId}
            distance="1000km"
            className="app-bleed-x"
          />
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default TrendDetailModal;
