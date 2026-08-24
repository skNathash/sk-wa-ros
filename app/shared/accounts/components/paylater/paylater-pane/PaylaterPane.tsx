import clsx from "clsx";
import { useState } from "react";
import PayLaterPaneChips, {
  type PayLaterChipCounts,
  type PayLaterChipKey,
} from "../paylater-pane-chips/PayLaterPaneChips";
import PaylaterApprovals from "./PaylaterApprovals";
import PaylaterHealthSnapshot, {
  type PaylaterHealthTotals,
} from "./PaylaterHealthSnapshot";
import PaylaterNudgeTargets from "./PaylaterNudgeTargets";
import PaylaterOverdueList from "./PaylaterOverdueList";
import PaylaterPeriodSummary from "./PaylaterPeriodSummary";
import type { PaylaterSummaryPeriod } from "./helper";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

interface PaylaterPaneProps {
  /** Pane header title. */
  title: string;
  /**
   * Small muted label beside the title. Defaults to the live wallet count +
   * health score once the snapshot resolves.
   */
  subtitle?: string;

  /** Render the section chip strip. Defaults to true. */
  showChips?: boolean;
  /** Force which chip reads as active; otherwise derived from the URL. */
  activeChipKey?: PayLaterChipKey;
  /** Trailing counts on the chips. */
  chipCounts?: PayLaterChipCounts;
  /** Intercept a chip tap; without it the chip navigates. */
  onChipSelect?: (key: PayLaterChipKey) => void;

  /** Render the health snapshot card. Defaults to true. */
  showHealthSnapshot?: boolean;

  /** Render the approvals lists — pending and recently approved. Defaults to true. */
  showApprovals?: boolean;
  /** Rows shown in the pending list. */
  approvalsLimit?: number;
  /** Rows shown in the recently-approved list. */
  approvedLimit?: number;

  /** Render the period summary strip. Defaults to true. */
  showPeriodSummary?: boolean;
  /** Which window the summary strip reads. Defaults to the current week. */
  summaryPeriod?: PaylaterSummaryPeriod;

  /** Render the paginated nudge-target list. Defaults to true. */
  showNudgeTargets?: boolean;
  /** Nudge targets fetched per page. */
  nudgePageSize?: number;

  /**
   * Render the legacy overdue list. Off by default — the nudge-target list
   * covers the same wallets off the insights feed, with a total and paging.
   */
  showOverdue?: boolean;
  /** How many overdue rows to show. */
  overdueLimit?: number;

  className?: string;
}

/**
 * Reusable side-pane contents for the PayLater section in theme-2 desktop:
 * the pane header, the section chips, the health snapshot of the whole book
 * and the overdue wallets waiting on a nudge — the paylater counterpart of
 * `SupplyCatalogPane` / `DirectorySidePane`.
 */
const PaylaterPane = ({
  title,
  subtitle,
  showChips = true,
  activeChipKey,
  chipCounts,
  onChipSelect,
  showHealthSnapshot = true,
  showApprovals = true,
  approvalsLimit = 5,
  approvedLimit = 6,
  showPeriodSummary = true,
  summaryPeriod = "week",
  showNudgeTargets = true,
  nudgePageSize = 10,
  showOverdue = false,
  overdueLimit = 4,
  className,
}: PaylaterPaneProps) => {
  // The snapshot owns the fetch; the header just reads its totals back.
  const [totals, setTotals] = useState<PaylaterHealthTotals | null>(null);

  const resolvedSubtitle =
    subtitle ?? (totals ? `${totals.wallets} wallets` : undefined);

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4", className)}>
      {/* Pane header — section title + how big the book is. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
        <PaneTitle title={title} />
        {resolvedSubtitle && (
          <span className="tw:shrink-0 tw:text-sm tw:text-slate-400">
            {resolvedSubtitle}
          </span>
        )}
      </div>

      {/* Which slice of the book we're looking at. */}
      {showChips && (
        <PayLaterPaneChips
          activeKey={activeChipKey}
          counts={chipCounts}
          onSelect={onChipSelect}
        />
      )}

      {/* What the book looks like right now. */}
      {showHealthSnapshot && <PaylaterHealthSnapshot onTotals={setTotals} />}

      {/* What is waiting on a decision, and what just cleared — two blocks,
          the queue to work first and the recent decisions under it. */}
      {showApprovals && (
        <>
          <PaylaterApprovals kind="pending" limit={approvalsLimit} />
          <PaylaterApprovals
            kind="approved"
            limit={approvedLimit}
            showSeeAll={false}
          />
        </>
      )}

      {/* What the book did this week. */}
      {showPeriodSummary && <PaylaterPeriodSummary period={summaryPeriod} />}

      {/* Who to chase first. */}
      {showNudgeTargets && (
        <PaylaterNudgeTargets pageSize={nudgePageSize} className="tw:mb-4" />
      )}

      {/* Who is already late. */}
      {showOverdue && (
        <PaylaterOverdueList limit={overdueLimit} className="tw:mb-4" />
      )}
    </div>
  );
};

export default PaylaterPane;
