import clsx from "clsx";
import { type CoinRewardChipKey } from "../helper";
import { TIER_PHILOSOPHY } from "./helper";

interface TierPhilosophyProps {
  /** Fired with the tapped tier — lets the pane filter to it. */
  onSelect?: (tier: CoinRewardChipKey) => void;
  className?: string;
}

/**
 * What each Coin Store tier is for, in one line apiece. Static copy — this is
 * the merchandising rule the catalogue is built to, not a number that moves.
 * Rows are tappable only when the pane hands down a selection handler.
 */
const TierPhilosophy = ({ onSelect, className }: TierPhilosophyProps) => {
  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-2", className)}>
      <p className="app-pane-label">
        Tier philosophy
      </p>

      {TIER_PHILOSOPHY.map((tier) => (
        <div
          key={tier.key}
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onClick={() => onSelect?.(tier.key)}
          onKeyDown={(event) => {
            if (!onSelect) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(tier.key);
            }
          }}
          className={clsx(
            "tw:rounded-xl tw:border-l-4 tw:px-3 tw:py-2.5",
            tier.toneClassName,
            onSelect && "tw:cursor-pointer",
          )}
        >
          <div className={clsx("tw:text-sm tw:font-bold", tier.labelClassName)}>
            {tier.label}
          </div>
          <div className="tw:mt-1 tw:text-xs tw:leading-snug tw:text-slate-600">
            {tier.hint}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TierPhilosophy;
