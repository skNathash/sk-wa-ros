import { TrendingDown, TrendingUp } from "lucide-react";
import { accountsSummary, formatRupees } from "../data";

/**
 * Three-up money in / money out / net strip pinned under the header, sitting on
 * white so it reads as a fixed ledger summary rather than part of the chat.
 */
const SummaryStrip = () => {
  const {
    moneyIn,
    moneyInCount,
    moneyOut,
    moneyOutCount,
    net,
    netDeltaLabel,
    netDeltaUp,
  } = accountsSummary;

  const DeltaIcon = netDeltaUp ? TrendingUp : TrendingDown;

  return (
    <div className="tw:shrink-0 tw:bg-card tw:shadow-sm">
      <div className="tw:grid tw:grid-cols-3 tw:divide-x tw:divide-border">
        <Cell
          label="Money in"
          value={formatRupees(moneyIn)}
          valueClassName="tw:text-[color:var(--wa-domain-in)]"
          hint={`${moneyInCount} txns`}
        />
        <Cell
          label="Money out"
          value={formatRupees(moneyOut)}
          valueClassName="tw:text-[color:var(--wa-domain-out)]"
          hint={`${moneyOutCount} txns`}
        />
        <Cell
          label="Net"
          value={`${net >= 0 ? "+" : "−"} ${formatRupees(net)}`}
          valueClassName="tw:text-foreground"
          hint={
            <span
              className={`tw:inline-flex tw:items-center tw:gap-0.5 ${
                netDeltaUp
                  ? "tw:text-[color:var(--wa-domain-in)]"
                  : "tw:text-[color:var(--wa-domain-out)]"
              }`}
            >
              <DeltaIcon size={12} />
              {netDeltaLabel}
            </span>
          }
        />
      </div>
    </div>
  );
};

const Cell = ({
  label,
  value,
  valueClassName,
  hint,
}: {
  label: string;
  value: string;
  valueClassName: string;
  hint: React.ReactNode;
}) => (
  <div className="tw:px-3 tw:py-2.5">
    <p className="wa-section-label">{label}</p>
    <p
      className={`wa-amount tw:mt-0.5 tw:text-base tw:font-bold tw:leading-tight ${valueClassName}`}
    >
      {value}
    </p>
    <p className="wa-mono tw:mt-0.5 tw:text-[11px] tw:text-muted-foreground">
      {hint}
    </p>
  </div>
);

export default SummaryStrip;
