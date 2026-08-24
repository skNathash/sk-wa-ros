import CommonService from "~/services/CommonService";

interface SummaryProps {
  /** King Coins available to redeem — from the loyalty API. */
  coins?: number;
  /** Paylater credit still available to spend. */
  paylater?: number;
  /** Lifetime value. */
  ltv?: number;
}

const tileClass =
  "tw:min-w-0 tw:flex-1 tw:rounded-lg tw:bg-white/10 tw:px-3 tw:py-2 tw:ring-1 tw:ring-inset tw:ring-white/15";

const labelClass =
  "tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/60";

const valueClass = "tw:mt-0.5 tw:truncate tw:text-lg tw:font-bold tw:text-white";

/**
 * The three numbers that decide what the seller does next — coins to spend,
 * credit left to spend on paylater, and how much the customer is worth. Sits
 * under {@link CustomerInfo} on the pane's dark band — the three tiles read as
 * one strip, so none of them is tinted apart from the rest.
 */
const Summary = ({ coins = 0, paylater = 0, ltv = 0 }: SummaryProps) => (
  <div className="tw:mt-3 tw:flex tw:items-stretch tw:gap-2">
    <div className={tileClass}>
      <p className={labelClass}>Coins</p>
      <p className={valueClass}>{coins}</p>
    </div>

    <div className={tileClass}>
      <p className={labelClass}>Paylater</p>
      <p className={valueClass}>
        {CommonService.formatCompact(paylater, { style: "short" })}
      </p>
    </div>

    <div className={tileClass}>
      <p className={labelClass}>LTV</p>
      <p className={valueClass}>
        {CommonService.formatCompact(ltv, { style: "short" })}
      </p>
    </div>
  </div>
);

export default Summary;
