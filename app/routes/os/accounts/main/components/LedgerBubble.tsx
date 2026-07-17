import { CheckCheck } from "lucide-react";
import { formatRupees, type LedgerEntry, type LedgerTag } from "../data";

/** Tag chip palette. Income tags sit on the green bubble, spend tags on white. */
const TAG_CLASS: Record<LedgerTag, string> = {
  B2C: "tw:bg-white/70 tw:text-[color:var(--wa-bubble-text)]",
  B2B: "tw:bg-white/70 tw:text-[color:var(--wa-bubble-text)]",
  VENDOR: "tw:bg-amber-100 tw:text-amber-800",
  EXPENSE: "tw:bg-amber-100 tw:text-amber-800",
};

/**
 * One money movement as a chat bubble — income arrives on the right as a
 * WhatsApp "sent" bubble (you received the money), spend on the left in white.
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
                : "tw:text-rose-800"
            }`}
          >
            {entry.title}
          </p>
        </div>

        <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-2">
          <p
            className={`wa-amount tw:text-base tw:font-bold tw:leading-tight ${
              isIn ? "tw:text-emerald-800" : "tw:text-rose-700"
            }`}
          >
            {isIn ? "+" : "−"}
            {formatRupees(entry.amount)}
          </p>
          <span
            className={`tw:rounded tw:px-1.5 tw:py-px tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide ${TAG_CLASS[entry.tag]}`}
          >
            {entry.tag}
          </span>
        </div>

        <p className="tw:mt-1 tw:text-xs tw:text-muted-foreground">
          {entry.detail}
        </p>

        {/* Timestamp + delivery ticks, right-aligned WhatsApp style. */}
        <div className="tw:mt-1 tw:flex tw:items-center tw:justify-end tw:gap-1 tw:text-[10px] tw:text-muted-foreground">
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
