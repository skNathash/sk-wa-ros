import clsx from "clsx";
import {
  ChartNoAxesColumn,
  ChevronRight,
  Gift,
  ListOrdered,
  Settings,
} from "lucide-react";
import { useLocation, useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import MiscService from "~/services/MiscService";

/** The routes the coin pane can start from. */
export type CoinQuickActionKey =
  | "dashboard"
  | "coin-store"
  | "broadcast"
  | "transactions"
  | "config";

interface QuickActionOption {
  key: CoinQuickActionKey;
  icon: typeof Gift;
  title: string;
  hint: string;
  /** Where the row lands. Omitted for rows that open a modal instead. */
  path?: string;
  params?: Record<string, string>;
}

const OPTIONS: QuickActionOption[] = [
  {
    key: "dashboard",
    icon: ChartNoAxesColumn,
    title: "Dashboard",
    hint: "How the coin economy is doing",
    path: "/products/coin-economy",
  },
  {
    key: "coin-store",
    icon: Gift,
    title: "Manage Coin Store",
    hint: "Rewards customers can redeem",
    path: "/products/coin-store-deals",
  },
  // Parked until the broadcast flow is ready.
  // {
  //   key: "broadcast",
  //   icon: Radio,
  //   title: "Broadcast to holders",
  //   hint: "Invite them to spend their coins",
  // },
  {
    key: "transactions",
    icon: ListOrdered,
    title: "Coin transactions",
    hint: "Every earn and redeem",
    path: "/dashboard/points/list",
    params: { tab: "transactions" },
  },
  {
    key: "config",
    icon: Settings,
    title: "Coin config",
    hint: "Earn and redeem rules",
    path: "/dashboard/points/list",
    params: { tab: "config" },
  },
];

interface CoinPaneQuickActionsProps {
  /**
   * Handle the tap yourself. When omitted a row navigates to its own
   * destination, and the broadcast row opens the invite modal.
   */
  onSelect?: (key: CoinQuickActionKey) => void;
  /** Section heading. Pass null to drop it. */
  title?: string | null;
  /** Restrict/reorder the rows; defaults to all four. */
  keys?: CoinQuickActionKey[];
  className?: string;
}

/**
 * "Quick actions" in the King Coins pane — stocking the Coin Store, pushing
 * holders towards it, and the two coin settings pages behind them.
 *
 * Rows are self-navigating so the panel can be dropped into any coin pane;
 * pass `onSelect` to intercept instead.
 */
const CoinPaneQuickActions = ({
  onSelect,
  title = "Quick actions",
  keys,
  className,
}: CoinPaneQuickActionsProps) => {
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Config and transactions share one route and differ only by `tab`, so that
  // query decides between them; the rest match on pathname alone.
  const isActive = (option: QuickActionOption) => {
    if (!option.path || !location.pathname.startsWith(option.path)) return false;

    const wanted = option.params?.tab;
    return wanted ? wanted === (searchParams.get("tab") || "config") : true;
  };

  const options = keys
    ? (keys
        .map((key) => OPTIONS.find((option) => option.key === key))
        .filter(Boolean) as QuickActionOption[])
    : OPTIONS;

  const handleSelect = (option: QuickActionOption) => {
    if (onSelect) {
      onSelect(option.key);
      return;
    }

    if (option.path) {
      appNav.to(option.path, option.params);
      return;
    }

    // The broadcast row has no page of its own — it opens the invite modal the
    // side menu owns, the same event the Coin Store page fires.
    MiscService.createEvent("showInviteModal", null);
  };

  return (
    <div className={className}>
      {title ? (
        <p className="app-pane-label">
          {title}
        </p>
      ) : null}

      <div
        className={clsx(
          "tw:flex tw:flex-col tw:gap-2 tw:rounded-xl tw:bg-white tw:p-2 tw:ring-1 tw:ring-slate-100",
          title && "tw:mt-2",
        )}
      >
        {options.map((option) => {
          const Icon = option.icon;
          const active = isActive(option);

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => handleSelect(option)}
              className={clsx(
                "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-lg tw:p-2.5 tw:text-left tw:transition-colors",
                active
                  ? "tw:bg-primary tw:text-white tw:hover:opacity-90"
                  : "tw:bg-slate-50 tw:hover:bg-slate-100",
              )}
            >
              <span
                className={clsx(
                  "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg",
                  active
                    ? "tw:bg-white/20 tw:text-white"
                    : "tw:bg-white tw:text-slate-600",
                )}
              >
                <Icon size={18} />
              </span>

              <span className="tw:min-w-0 tw:flex-1">
                <span className="tw:block tw:truncate tw:text-sm tw:font-semibold">
                  {option.title}
                </span>
                <span
                  className={clsx(
                    "tw:block tw:truncate tw:text-xs",
                    active ? "tw:text-white/80" : "tw:text-slate-500",
                  )}
                >
                  {option.hint}
                </span>
              </span>

              <ChevronRight
                size={16}
                className={clsx(
                  "tw:shrink-0",
                  active ? "tw:text-white/80" : "tw:text-slate-400",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CoinPaneQuickActions;
