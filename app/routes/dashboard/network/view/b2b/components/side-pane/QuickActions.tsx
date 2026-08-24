import clsx from "clsx";
import {
  FileText,
  MessageCircle,
  Plus,
  Send,
  type LucideIcon,
} from "lucide-react";

/** The four things a seller does to a retailer from the pane. */
export type QuickActionKey = "ping" | "new-order" | "offer" | "statement";

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
    key: "new-order",
    icon: Plus,
    label: "New Order",
    toneClassName:
      "tw:bg-emerald-100 tw:text-emerald-700 tw:ring-1 tw:ring-emerald-200 tw:hover:bg-emerald-200",
  },
  {
    key: "offer",
    icon: Send,
    label: "Offer",
    toneClassName:
      "tw:bg-violet-100 tw:text-violet-700 tw:ring-1 tw:ring-violet-200 tw:hover:bg-violet-200",
  },
  {
    key: "statement",
    icon: FileText,
    label: "Statement",
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
 * Quick actions grid for the retailer pane. Every tile is a one-tap route into
 * the thing the seller wanted the retailer's page for: message them, book an
 * order, push an offer, or open what they owe.
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
