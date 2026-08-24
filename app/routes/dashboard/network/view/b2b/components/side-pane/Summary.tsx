import CommonService from "~/services/CommonService";

interface SummaryProps {
  /** Paylater credit still available to spend. */
  paylater?: number;
  /** Credit already drawn and not yet repaid. */
  dues?: number;
  /** Lifetime business booked with this retailer. */
  business?: number;
}

const tileClass =
  "tw:min-w-0 tw:flex-1 tw:rounded-lg tw:bg-white/10 tw:px-3 tw:py-2 tw:ring-1 tw:ring-inset tw:ring-white/15";

const labelClass =
  "tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/60";

const valueClass = "tw:mt-0.5 tw:truncate tw:text-lg tw:font-bold tw:text-white";

/**
 * The three numbers that decide what the seller does next on a retailer — what
 * they can still draw, what they owe, and what they are worth. Sits under
 * {@link RetailerInfo} on the pane's dark band, so the three tiles read as one
 * strip and none of them is tinted apart from the rest.
 */
const Summary = ({ paylater = 0, dues = 0, business = 0 }: SummaryProps) => (
  <div className="tw:mt-3 tw:flex tw:items-stretch tw:gap-2">
    <div className={tileClass}>
      <p className={labelClass}>Paylater</p>
      <p className={valueClass}>
        {CommonService.formatCompact(paylater, { style: "short" })}
      </p>
    </div>

    <div className={tileClass}>
      <p className={labelClass}>Dues</p>
      <p className={valueClass}>
        {CommonService.formatCompact(dues, { style: "short" })}
      </p>
    </div>

    <div className={tileClass}>
      <p className={labelClass}>Business</p>
      <p className={valueClass}>
        {CommonService.formatCompact(business, { style: "short" })}
      </p>
    </div>
  </div>
);

export default Summary;
