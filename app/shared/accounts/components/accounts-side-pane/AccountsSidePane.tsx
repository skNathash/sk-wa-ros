import { ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import { useLocation, useSearchParams } from "react-router";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";
import { AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import ExpenseCategories from "./expense-categories/ExpenseCategories";
import RecentEvents from "./recent-events/RecentEvents";
import PartyList from "./parties/PartyList";
import RecentExpenses from "~/shared/expense/components/recent-expenses/RecentExpenses";
import AccountsPaneSummary from "./summary/AccountsPaneSummary";
import AccountsSkipToSummary from "./skip-to-summary/AccountsSkipToSummary";
import {
  defaultPaneView,
  getPaneView,
  getPaneViewByPath,
  paneViews,
  resolveMonthRange,
  resolvePaneRange,
  type AccountsPaneView,
  type PaneBlock,
  type PaneViewConfig,
} from "./helper";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

interface AccountsSidePaneProps {
  /** Extra classes merged onto the underlying {@link AppPaneSide}. */
  className?: string;
  hideBlocks?: PaneBlock[];
  hideCta?: boolean;
  hideSummary?: boolean;
}

/**
 * Side column for the accounts section. Only rendered inside the theme-2 split
 * layout — the accounts tab bar is hidden there, so this pane carries the
 * section's own navigation and its at-a-glance blocks.
 *
 * The chip row is the section's navigation: picking a chip takes the main
 * column to that view's page and re-stacks the pane's blocks for it. Where each
 * chip goes and what it shows lives in {@link paneViews}.
 */
const AccountsSidePane = ({
  className = "",
  hideBlocks,
  hideCta,
  hideSummary,
}: AccountsSidePaneProps) => {
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<AccountsPaneView>(
    () => getPaneViewByPath(location.pathname) || defaultPaneView,
  );

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  // Keeps the active chip honest when the page changes from outside the pane —
  // the menu, a deep link, or the back button.
  useEffect(() => {
    const routeView = getPaneViewByPath(location.pathname);
    if (routeView) setView(routeView);
  }, [location.pathname]);

  // Recomputed only when the header date picker moves — the child blocks key
  // their fetches off these strings.
  const range = useMemo(
    () => resolvePaneRange(dateFrom, dateTo),
    [dateFrom, dateTo],
  );

  const monthRange = useMemo(
    () => resolveMonthRange(month, year),
    [month, year],
  );

  const config: PaneViewConfig = getPaneView(view);

  // The expense views are filtered by their own month picker (the hero owns the
  // `month` / `year` params), so their blocks read that month instead of the
  // accounts header range.
  const blockRange = config.periodSource === "month" ? monthRange : range;

  const visibleBlocks = hideBlocks?.length
    ? config.blocks.filter((block) => !hideBlocks.includes(block))
    : config.blocks;

  const chips: PaneChipItem[] = paneViews.map((item) => ({
    key: item.key,
    label: item.label,
    active: item.key === view,
  }));

  const handleChipSelect = ({ data }: PaneChipsAction) => {
    const next = getPaneView(data.key);
    setView(next.key);
    appNav.to(next.path, {
      ...next.params,
      // Only the pages driven by the header picker want the range carried over;
      // the rest would just be left with dead params in the URL.
      ...(next.carryRange
        ? {
            dateFrom: dateFrom || range.startDate,
            dateTo: dateTo || range.endDate,
          }
        : {}),
    });
  };

  const renderBlock = (block: PaneBlock) => {
    switch (block) {
      case "summary":
        return hideSummary ? null : (
          <AccountsPaneSummary
            key="summary"
            view={config.summaryView || "overview"}
            range={range}
          />
        );
      case "skip-to":
        return <AccountsSkipToSummary key="skip-to" />;
      case "parties":
        return <PartyList key="parties" variant="payers" />;
      case "vendors":
        return <PartyList key="vendors" variant="vendors" />;
      case "categories":
        return <ExpenseCategories key="categories" range={blockRange} />;
      case "recent-expenses":
        return <RecentExpenses key="recent-expenses" limit={5} />;
      case "events":
        // Reads the header date range straight off the URL, like the pane does.
        return <RecentEvents key="events" direction={config.eventsDirection} />;
      case "link":
        return config.link ? (
          <button
            key="link"
            type="button"
            onClick={() => appNav.to(config.link!.path, config.link!.params)}
            className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-2xl tw:bg-white tw:px-4 tw:py-3 tw:text-left tw:ring-1 tw:ring-slate-200/70 tw:transition-shadow tw:hover:shadow-sm"
          >
            <div className="tw:min-w-0 tw:flex-1">
              <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                {config.link.label}
              </div>
              <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                {config.link.note}
              </div>
            </div>
            <ChevronRight size={16} className="tw:shrink-0 tw:text-gray-400" />
          </button>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <AppPaneSide className={`app-pane-only ${className}`}>
      {/* Pane header — section title. */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2 tw:px-1">
        <PaneTitle title="Accounts" />
      </div>

      <PaneChips data={chips} callback={handleChipSelect} className="tw:px-1" />

      {/* View-owned action — the page's own header CTA is hidden in the split
          layout, so the pane carries it (e.g. Add Expense). */}
      {config.cta && !hideCta && (
        <AppButton
          className="tw:w-full"
          onClick={() => appNav.to(config.cta!.path, config.cta!.params)}
        >
          <Plus />
          {config.cta.label}
        </AppButton>
      )}

      {visibleBlocks.map(renderBlock)}
    </AppPaneSide>
  );
};

export default AccountsSidePane;
