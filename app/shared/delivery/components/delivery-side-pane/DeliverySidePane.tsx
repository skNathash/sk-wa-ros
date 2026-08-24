import clsx from "clsx";
import { useEffect, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
// import DeliveryCountTiles from "./DeliveryCountTiles";
// import DeliveryRecentList from "./DeliveryRecentList";
import DeliveryRunnerLoad from "./DeliveryRunnerLoad";
import DeliveryStatusCards from "./delivery-status-cards/DeliveryStatusCards";
import PendingHandoverCard from "./PendingHandoverCard";
import { getDeliveryStageCounts, type DeliveryStageCounts } from "./helper";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";
import DeliveryPaneChips from "./DeliveryPaneChips";
import DeliveryNavChips from "./DeliveryNavChips";

interface DeliverySidePaneProps {
  /** Pane header title. Defaults to "Delivery". */
  title?: string;
  /** Overrides the derived "12 to dispatch" scope label. */
  subtitle?: string;
  /** Key of the delivery view on screen (dispatch, in-transit, …). */
  activeKey?: string;
  className?: string;
  activeNavKey?: string;
}

/**
 * Side-pane contents for the delivery views in theme-2 desktop: the pane
 * header, the today/B2B/B2C filter chips, the screenshot-style status cards,
 * the delivery stage chips (Dispatch / In Transit / COD) and the recent
 * handover/collection lists.
 */
const DeliverySidePane = ({
  title = "Delivery",
  subtitle,
  activeKey = "dispatch",
  className,
  activeNavKey,
}: DeliverySidePaneProps) => {
  const appNav = useAppNav();

  const [counts, setCounts] = useState<DeliveryStageCounts>();

  useEffect(() => {
    let cancelled = false;

    getDeliveryStageCounts()
      .then((result) => {
        if (!cancelled) setCounts(result);
      })
      .catch(() => {
        if (!cancelled) setCounts({});
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const scopeLabel =
    subtitle ?? (counts?.dispatch ? `${counts.dispatch} to dispatch` : "");

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + how much work is waiting. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
        <PaneTitle title={title} />
      </div>

      <DeliveryNavChips activeKey={activeNavKey} />

      {/* Quick filters — today, B2B and B2C. The wrapper bleeds past the pane
          gutter so the rule under the chips runs edge to edge. */}
      <div className="app-bleed-x tw:border-b tw:border-slate-200 tw:pb-4">
        <DeliveryPaneChips className="tw:px-5" />
      </div>

      {/* Status snapshot — how many orders sit at each delivery stage right
          now. A tap selects the stage in the pane. */}
      <div>
        <p className="app-pane-label">Status</p>
        <DeliveryStatusCards className="tw:mt-1.5" />
      </div>

      {/* Runner load, live — who is on the road right now and how full
          their bag is against what they can carry. */}
      <div>
        <DeliveryRunnerLoad className="tw:mt-1.5" />
      </div>

      {/* Workload tiles — hidden for now; the runner load above takes over.
      <div>
        <p className="app-pane-label">Workload</p>
        <DeliveryCountTiles
          counts={counts}
          loading={!counts}
          activeKey={activeKey}
          onSelect={(key) =>
            appNav.to(`/dashboard/delivery/${key}`, { tab: key })
          }
          className="tw:mt-1.5"
        />
      </div>
      */}

      {/* Cash still with the riders — the one number that has to come back. */}
      <div>
        <p className="app-pane-label">Collections</p>
        <PendingHandoverCard className="tw:mt-1.5" />
      </div>

      {/* Recent lists — hidden for now.
      <DeliveryRecentList type="dispatch" />
      <DeliveryRecentList type="in-transit" />
      */}
    </div>
  );
};

export default DeliverySidePane;
