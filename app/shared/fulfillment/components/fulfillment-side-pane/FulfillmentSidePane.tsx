import clsx from "clsx";
import { useEffect, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import OrderSearchInput from "~/shared/orders/order-search/OrderSearchInput";
import FulfillmentPaneChips from "./FulfillmentPaneChips";
import FulfillmentStages from "./FulfillmentStages";
import {
  formatFulfillmentSummary,
  FULFILLMENT_LIST_URL,
  getFulfillmentStageCounts,
  type FulfillmentChipType,
  type FulfillmentStageCounts,
  type FulfillmentTypeKey,
} from "./helper";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

export interface FulfillmentSidePaneProps {
  /** Pane header title. Defaults to "Orders". */
  title?: string;
  /** Overrides the derived "6 live · 22 orders" scope label. */
  subtitle?: string;

  /** Search box value + handler. The box is dropped without a handler. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /**
   * Which order chips the pane shows: the board's `order-type` filter (needs
   * `onTypeChange`) or the `order-channel` strip, which resolves its own
   * selection and destination. Omit to drop the chips entirely.
   */
  chipType?: FulfillmentChipType;
  /** Order type currently filtered on — `order-type` chips only. */
  type?: FulfillmentTypeKey;
  onTypeChange?: (key: FulfillmentTypeKey) => void;

  /**
   * Shows the pipeline list. Defaults to on — a page with a board of its own
   * passes `onStageChange` and the counts it already resolved; anywhere else
   * the pane loads its own counts and a tap opens the board on that stage.
   */
  showStages?: boolean;
  activeStage?: string;
  stageCounts?: FulfillmentStageCounts;
  stageCountsLoading?: boolean;
  onStageChange?: (key: string) => void;

  className?: string;
}

/**
 * Side-pane contents for the fulfilment views in theme-2 desktop. Bundles the
 * pane header, the order search, the order-type chips and the pipeline stage
 * list, so every fulfilment page renders the same pane without duplicating the
 * layout. Mirrors `PricingSidePane` / `VendorSidePane`.
 *
 * A page with a board of its own drives the pane: it already resolves the
 * stage counts for its lanes, so it hands them down and takes the selection
 * back. Anywhere else the pane fends for itself — it loads its own counts and
 * a stage row navigates to the board.
 */
const FulfillmentSidePane = ({
  title = "Orders",
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Order #, customer, product…",
  chipType,
  type,
  onTypeChange,
  showStages = true,
  activeStage,
  stageCounts,
  stageCountsLoading,
  onStageChange,
  className,
}: FulfillmentSidePaneProps) => {
  const appNav = useAppNav();
  // A page that only wires up `onTypeChange` still gets the type chips.
  const chips = chipType ?? (onTypeChange ? "order-type" : undefined);

  // Counts the pane resolves for itself, for pages that carry no board.
  const ownsCounts = showStages && !stageCounts;
  const [ownCounts, setOwnCounts] = useState<FulfillmentStageCounts>();

  useEffect(() => {
    if (!ownsCounts) return;
    let cancelled = false;

    getFulfillmentStageCounts()
      .then((counts) => {
        if (!cancelled) setOwnCounts(counts);
      })
      .catch(() => {
        if (!cancelled) setOwnCounts({});
      });

    return () => {
      cancelled = true;
    };
  }, [ownsCounts]);

  const counts = stageCounts ?? ownCounts;
  const countsLoading = stageCounts ? stageCountsLoading : !ownCounts;
  const scopeLabel = subtitle ?? formatFulfillmentSummary(counts);

  // Without a board on the page, a stage row opens the fulfilment board on
  // that stage — `forceTab` keeps the board from auto-switching lanes.
  const handleStageSelect = (key: string) => {
    if (onStageChange) {
      onStageChange(key);
      return;
    }
    appNav.to(FULFILLMENT_LIST_URL, { tab: key, forceTab: "1" });
  };

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + how much work is in flight. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
        <PaneTitle title={title} />
        {/* Scope label removed — the pane header carries the title alone.
        {scopeLabel && (
          <span className="tw:shrink-0 tw:text-xs tw:text-slate-400">
            {scopeLabel}
          </span>
        )}
        */}
      </div>

      {onSearchChange && (
        <OrderSearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
      )}

      {/* What the page filters on beside the pipeline — order types on the
          board, order channels on the list. */}
      {chips && (
        <div>
          {chips === "order-channel" && (
            <p className="app-pane-label">
              Channels
            </p>
          )}
          <FulfillmentPaneChips
            chipType={chips}
            value={type}
            onChange={onTypeChange}
            className={chips === "order-channel" ? "tw:mt-1.5" : undefined}
          />
        </div>
      )}

      {/* Where every open order currently sits. */}
      {showStages && (
        <div>
          <p className="app-pane-label">
            Stages
          </p>
          <FulfillmentStages
            activeKey={activeStage}
            counts={counts}
            loading={countsLoading}
            onSelect={handleStageSelect}
            className="tw:mt-1.5"
          />
        </div>
      )}
    </div>
  );
};

export default FulfillmentSidePane;
