import { CheckCheck } from "lucide-react";
import { formatRupees, type LedgerEntry } from "../data";

/**
 * One money movement as a chat bubble — income arrives on the right as a
 * WhatsApp "sent" bubble (you received the money), spend on the left in white.
 * Colours follow the theme-2 Accounts domain tokens (§2.4 design-system
 * guide): `--wa-domain-in` (green) for money in, `--wa-domain-out` (rust) for
 * money out, applied consistently to the amount, the channel/tag chip, and
 * the counterparty name — matching the handoff's `AfBubble` component.
 */
const LedgerBubble = ({ entry }: { entry: LedgerEntry }) => {
  const isIn = entry.direction === "in";

  return (
    <div className={`tw:flex ${isIn ? "tw:justify-end" : "tw:justify-start"}`}>
      <div
        className={`tw:relative tw:max-w-[85%] tw:rounded-lg tw:px-3 tw:py-2 tw:shadow-sm tw:sm:max-w-[70%] ${
          isIn
            ? "tw:rounded-tr-none tw:bg-[color:var(--wa-bubble)]"
            : "tw:rounded-tl-none tw:bg-card"
        }`}
      >
        <div className="tw:flex tw:items-baseline tw:gap-2">
          <p
            className={`tw:min-w-0 tw:flex-1 tw:truncate tw:text-[13px] tw:font-semibold ${
              isIn
                ? "tw:text-[color:var(--wa-bubble-text)]"
                : "tw:text-[color:var(--wa-domain-out)]"
            }`}
          >
            {entry.title}
          </p>
        </div>

        <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-2">
          <p
            className={`wa-amount tw:text-base tw:font-bold tw:leading-tight ${
              isIn
                ? "tw:text-[color:var(--wa-domain-in)]"
                : "tw:text-[color:var(--wa-domain-out)]"
            }`}
          >
            {isIn ? "+" : "−"}
            {formatRupees(entry.amount)}
          </p>
          <span className={`wa-tag ${isIn ? "wa-tag-in" : "wa-tag-out"}`}>
            {entry.tag}
          </span>
        </div>

        <p className="tw:mt-1 tw:text-xs tw:text-muted-foreground">
          {entry.detail}
        </p>

        {/* Timestamp + delivery ticks, right-aligned WhatsApp style. */}
        <div className="wa-mono tw:mt-1 tw:flex tw:items-center tw:justify-end tw:gap-1 tw:text-[10px] tw:text-muted-foreground">
          <span>{entry.time}</span>
          {entry.delivered && (
            <CheckCheck size={13} className="tw:text-sky-500" />
          )}
        </div>
      </div>
    </div>
  );
};

export default LedgerBubble;
