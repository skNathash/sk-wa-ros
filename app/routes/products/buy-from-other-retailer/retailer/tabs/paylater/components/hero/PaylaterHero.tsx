import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import clsx from "clsx";
import type { PaylaterWallet } from "../../helper";

type PaylaterHeroProps = {
  wallet: PaylaterWallet;
  /** Falls back to the seller name carried on the wallet. */
  sellerName?: string;
  className?: string;
};

const CircularProgress = ({
  percentage,
  size = 96,
  strokeWidth = 8,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="tw:relative tw:inline-flex tw:items-center tw:justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="tw:-rotate-90"
        aria-label={`${percentage}% utilised`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="tw:text-white/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="tw:text-white"
        />
      </svg>
      <div className="tw:absolute tw:inset-0 tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-white">
        <span className="tw:text-xl tw:font-bold tw:leading-none">
          {percentage}%
        </span>
        <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:opacity-80">
          utilised
        </span>
      </div>
    </div>
  );
};

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-white/20 tw:px-2.5 tw:py-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white">
    {children}
  </span>
);

/**
 * Wallet banner — the limit this seller extended, how much of it is still
 * available and the state of the wallet, read off the paylater request.
 */
const PaylaterHero = ({ wallet, sellerName, className }: PaylaterHeroProps) => {
  const seller = sellerName || wallet.sellerName || "this seller";

  return (
    <div
      className={clsx(
        "tw:relative tw:overflow-hidden tw:rounded-2xl tw:bg-linear-to-br tw:from-violet-600 tw:to-violet-800 tw:p-5 tw:text-white",
        className,
      )}
    >
      <div
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:-right-12 tw:-top-12 tw:h-56 tw:w-56 tw:rounded-full tw:bg-white/10"
      />

      <div className="tw:relative tw:flex tw:flex-col tw:gap-5 tw:md:flex-row tw:md:items-center tw:md:justify-between">
        <div className="tw:flex tw:items-center tw:gap-4">
          <CircularProgress percentage={wallet.utilisedPercentage} />

          <div>
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/80">
              Paylater · {wallet.statusLabel}
            </div>
            <div className="tw:mt-1 tw:flex tw:items-baseline tw:gap-1.5">
              <Amount
                value={wallet.creditAvailable}
                decimalPlaces={0}
                className="tw:text-3xl tw:font-bold tw:text-white"
              />
              <span className="tw:text-sm tw:font-medium tw:text-white/90">
                available
              </span>
            </div>
            <div className="tw:mt-0.5 tw:text-xs tw:text-white/80">
              of{" "}
              <Amount
                value={wallet.creditLimit}
                decimalPlaces={0}
                className="tw:text-white/90"
              />{" "}
              extended by {seller} · used{" "}
              <Amount
                value={wallet.creditUsed}
                decimalPlaces={0}
                className="tw:text-white/90"
              />
            </div>

            <div className="tw:mt-3 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              {wallet.validityPeriod ? (
                <Badge>Tenure · {wallet.validityPeriod}</Badge>
              ) : null}
              {wallet.kycStatus ? <Badge>KYC · {wallet.kycStatus}</Badge> : null}
              {wallet.expiryStatus ? <Badge>{wallet.expiryStatus}</Badge> : null}
            </div>
          </div>
        </div>

        {wallet.validityEndDate ? (
          <div className="tw:shrink-0 tw:rounded-xl tw:bg-white/15 tw:px-4 tw:py-3 tw:md:text-right">
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/70">
              Valid till
            </div>
            <div className="tw:mt-0.5 tw:text-lg tw:font-bold">
              <DateFormat
                value={wallet.validityEndDate}
                formatStr="dd MMM yyyy"
              />
            </div>
            {wallet.validityStartDate ? (
              <div className="tw:mt-0.5 tw:text-[11px] tw:text-white/70">
                from{" "}
                <DateFormat
                  value={wallet.validityStartDate}
                  formatStr="dd MMM yyyy"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PaylaterHero;
