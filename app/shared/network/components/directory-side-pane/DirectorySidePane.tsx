import clsx from "clsx";
import DirectoryPaneChips, {
  type DirectoryChipCounts,
  type DirectoryChipKey,
  type DirectoryNavChipKey,
} from "./DirectoryPaneChips";
import NewlyAdded from "./newly-added/NewlyAdded";
import QuickAdd, { type QuickAddKey } from "./QuickAdd";
import type { DirectoryNetwork } from "./recent-activity/helper";
import RecentActivity from "./recent-activity/RecentActivity";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

export interface DirectorySidePaneProps {
  /** Pane header title (e.g. "Customers", "Retailers"). */
  title: string;
  /** Which side of the network the data blocks read — b2c customers (default)
   *  or b2b retailers. */
  network?: DirectoryNetwork;
  /** Small muted label beside the title (e.g. "247 in book"). */
  scopeLabel?: string;

  /** Render the segment chip strip (all/loyal/silent/paylater). Defaults to
   *  true; the create flows turn it off — they have no list to filter — and
   *  keep the nav strip. */
  showChips?: boolean;
  /** Which segment chip reads as active. */
  activeChipKey?: DirectoryChipKey;
  /** Trailing counts on the chips. */
  chipCounts?: DirectoryChipCounts;
  /** Fired on chip tap — the page owns the filtering. */
  onChipSelect?: (key: DirectoryChipKey) => void;
  /** Render the section/action nav chips (joining request, B2C, B2B, create
   *  routes) above the segments. Defaults to true. */
  showNavChips?: boolean;
  /** Intercept a nav chip; without it the chip navigates itself. */
  onNavChipSelect?: (key: DirectoryNavChipKey) => void;

  /** Render the newly-added customers list. Defaults to true. */
  showNewlyAdded?: boolean;
  /** How many newly-added rows to show. */
  newlyAddedLimit?: number;

  /** Render the quick-add panel. Defaults to true. */
  showQuickAdd?: boolean;
  /** Intercept a quick-add row; without it the row navigates itself. */
  onQuickAddSelect?: (key: QuickAddKey) => void;

  /** Render the recent-activity feed. Defaults to true. */
  showRecentActivity?: boolean;
  /** How many activity rows to show. */
  recentActivityLimit?: number;

  className?: string;
}

/**
 * Reusable side-pane contents for the network directory views (B2C customers,
 * B2B retailers) in theme-2 desktop. Bundles the pane header, the segment chips
 * and the quick-add routes so every directory page renders the same pane
 * without duplicating the layout — the counterpart of `CatalogSidePane` on the
 * inventory side.
 */
const DirectorySidePane = ({
  title,
  network = "b2c",
  scopeLabel,
  showChips = true,
  activeChipKey,
  chipCounts,
  onChipSelect,
  showNavChips = true,
  onNavChipSelect,
  showNewlyAdded = true,
  newlyAddedLimit = 5,
  showQuickAdd = true,
  onQuickAddSelect,
  showRecentActivity = true,
  recentActivityLimit = 6,
  className,
}: DirectorySidePaneProps) => {
  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + how big the book is. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
        <PaneTitle title={title} />
        {/* Scope label removed — the pane header carries the title alone.
        {scopeLabel && (
          <span className="tw:shrink-0 tw:text-sm tw:text-slate-400">
            {scopeLabel}
          </span>
        )}
        */}
      </div>

      {/* Where in the network we are, and which slice of the book we're looking
          at. The two strips are independent — a create page keeps the section
          jumps with the segments switched off. */}
      {(showChips || showNavChips) && (
        <DirectoryPaneChips
          activeKey={activeChipKey}
          counts={chipCounts}
          onSelect={onChipSelect}
          showSegmentChips={showChips}
          showNavChips={showNavChips}
          onNavSelect={onNavChipSelect}
        />
      )}

      {/* Who joined the book most recently. */}
      {showNewlyAdded && (
        <NewlyAdded limit={newlyAddedLimit} network={network} />
      )}

      {/* The form-free ways to add the next one. */}
      {showQuickAdd && <QuickAdd onSelect={onQuickAddSelect} />}

      {/* What the book has been doing lately. */}
      {showRecentActivity && (
        <RecentActivity
          limit={recentActivityLimit}
          network={network}
          className="tw:mb-4"
        />
      )}
    </div>
  );
};

export default DirectorySidePane;
