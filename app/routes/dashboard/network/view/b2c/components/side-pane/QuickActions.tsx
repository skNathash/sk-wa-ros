import clsx from "clsx";
import { Gift, MessageCircle, Plus, Send, type LucideIcon } from "lucide-react";

/** The four things a seller does to a customer from the pane. */
export type QuickActionKey = "ping" | "coin-store" | "offer" | "new-bill";

interface QuickAction {
  key: QuickActionKey;
  icon: LucideIcon;
  label: string;
  /** Tile fill + text/icon colour — each action carries its own tint. */
  toneClassName: string;
}

const ACTIONS: QuickAction[] = [
  {
    key: "ping",
    icon: MessageCircle,
    label: "Ping",
    // The one solid tile — messaging is what the pane is opened for.
    toneClassName: "tw:bg-primary tw:text-white tw:hover:bg-primary/90",
  },
  {
    key: "coin-store",
    icon: Gift,
    label: "Coin Store",
    toneClassName:
      "tw:bg-amber-100 tw:text-amber-700 tw:ring-1 tw:ring-amber-200 tw:hover:bg-amber-200",
  },
  {
    key: "offer",
    icon: Send,
    label: "Offer",
    toneClassName:
      "tw:bg-violet-100 tw:text-violet-700 tw:ring-1 tw:ring-violet-200 tw:hover:bg-violet-200",
  },
  {
    key: "new-bill",
    icon: Plus,
    label: "New Bill",
    toneClassName:
      "tw:bg-white tw:text-slate-700 tw:ring-1 tw:ring-slate-200 tw:hover:bg-slate-50",
  },
];

interface QuickActionsProps {
  /** Fired with the tapped action — the pane owns what each one does. */
  callback: (args: { action: QuickActionKey }) => void;
  className?: string;
}

/**
 * Quick actions grid for the customer pane. Every tile is a one-tap route into
 * the thing the seller wanted the customer's page for: message them, spend
 * their coins, push an offer, or start billing them.
 */
const QuickActions = ({ callback, className }: QuickActionsProps) => (
  <div className={className}>
    <p className="tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
      Quick Actions
    </p>

    <div className="tw:mt-2 tw:grid tw:grid-cols-2 tw:gap-2">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.key}
            type="button"
            onClick={() => callback({ action: action.key })}
            className={clsx(
              "tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-lg tw:px-3 tw:py-2.5 tw:text-sm tw:font-semibold tw:transition-colors",
              action.toneClassName,
            )}
          >
            {/* Icon rides the tile's text colour — the tint is the tile. */}
            <Icon size={16} className="tw:shrink-0" />
            <span className="tw:truncate">{action.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export default QuickActions;
