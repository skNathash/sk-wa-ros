import clsx from "clsx";
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AuthService from "~/services/AuthService";
import PaylaterService from "~/services/PaylaterService";

interface PaylaterNetworkProps {
  /** Credit already consumed across every seller that extended PayLater. */
  used?: number;
  /** Total credit extended across those sellers. */
  extended?: number;
  /** How many sellers make up the extended credit. */
  sellerCount?: number;
  className?: string;
}

interface NetworkSummary {
  used: number;
  extended: number;
  sellerCount: number;
}

const EMPTY_SUMMARY: NetworkSummary = {
  used: 0,
  extended: 0,
  sellerCount: 0,
};

/**
 * Aggregate PayLater position for the logged-in user across every seller that
 * extended credit to them — `count` / `totalCreditLimit` / `totalCreditUsed`
 * from the count flavour of the requests API.
 */
const fetchSummary = async (): Promise<NetworkSummary> => {
  const userId = AuthService.getLoggedInUserId();
  if (!userId) return EMPTY_SUMMARY;

  const resp: any = await PaylaterService.getRequestCount({
    page: 1,
    count: 500,
    filter: { "userInfo.id": userId },
    sort: { createdAt: -1 },
  });

  const summary = resp?.data?.data ?? resp?.data ?? {};

  return {
    used: Number(summary?.totalCreditUsed) || 0,
    extended: Number(summary?.totalCreditLimit) || 0,
    sellerCount: Number(summary?.count) || 0,
  };
};

/**
 * Aggregate PayLater position across all sellers in the network — used vs
 * extended credit with a utilisation meter.
 *
 * Rendered in the retailer page side pane above the seller list. Self-fetches
 * unless the caller passes the numbers in.
 */
const PaylaterNetwork = ({
  used: usedProp,
  extended: extendedProp,
  sellerCount: sellerCountProp,
  className,
}: PaylaterNetworkProps) => {
  const hasProps = extendedProp != null && sellerCountProp != null;

  const [summary, setSummary] = useState<NetworkSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(!hasProps);

  useEffect(() => {
    if (hasProps) return;

    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const next = await fetchSummary();
        if (mounted) setSummary(next);
      } catch (err) {
        console.error("Error loading network paylater summary", err);
        if (mounted) setSummary(EMPTY_SUMMARY);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [hasProps]);

  const used = usedProp ?? summary.used;
  const extended = extendedProp ?? summary.extended;
  const sellerCount = sellerCountProp ?? summary.sellerCount;

  const free = Math.max(extended - used, 0);
  const utilised = extended > 0 ? Math.round((used / extended) * 100) : 0;
  // Keep a sliver of the bar visible even at 0% so the meter reads as a meter.
  const barWidth = Math.min(Math.max(utilised, 2), 100);

  // Nothing extended and nothing loading — the card would be all zeroes.
  if (!loading && sellerCount === 0 && extended === 0) return null;

  return (
    <section
      className={clsx(
        "tw:relative tw:overflow-hidden tw:rounded-2xl tw:bg-gradient-to-br tw:from-violet-600 tw:via-purple-600 tw:to-purple-700 tw:px-4 tw:py-3.5 tw:text-white tw:shadow-sm",
        className,
      )}
    >
      {/* Soft highlight so the flat gradient gets some depth. */}
      <span
        aria-hidden="true"
        className="tw:pointer-events-none tw:absolute tw:-right-10 tw:-top-14 tw:size-32 tw:rounded-full tw:bg-white/10 tw:blur-xl"
      />

      <div className="tw:relative tw:flex tw:items-center tw:justify-between tw:gap-2">
        <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
          <Wallet size={16} className="tw:shrink-0 tw:text-white/90" />
          <span className="tw:truncate tw:text-sm tw:font-bold">
            PayLater across sellers
          </span>
        </span>
        {loading ? (
          <span className="skeleton-loader tw:h-4 tw:w-16 tw:shrink-0 tw:rounded-md tw:bg-white/20" />
        ) : (
          <span className="tw:shrink-0 tw:rounded-md tw:bg-white/20 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-white">
            {sellerCount} {sellerCount === 1 ? "Seller" : "Sellers"}
          </span>
        )}
      </div>

      {loading ? (
        <span className="skeleton-loader tw:relative tw:mt-2.5 tw:block tw:h-6 tw:w-32 tw:rounded tw:bg-white/20" />
      ) : (
        <Amount
          value={used}
          decimalPlaces={0}
          className="tw:relative tw:mt-2.5 tw:block tw:text-2xl tw:font-extrabold tw:leading-none"
        />
      )}

      <p className="tw:relative tw:mt-1.5 tw:text-xs tw:text-white/70">
        used of{" "}
        <Amount value={extended} decimalPlaces={0} className="tw:font-semibold" />{" "}
        extended credit
      </p>

      <div
        className="tw:relative tw:mt-3 tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-white/25"
        role="progressbar"
        aria-valuenow={utilised}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Credit utilised"
      >
        <span
          className="tw:block tw:h-full tw:rounded-full tw:bg-white tw:transition-all"
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <div className="tw:relative tw:mt-2 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:text-[11px]">
        <span className="tw:text-white/70">
          {utilised}% utilised
        </span>
        <span className="tw:font-semibold tw:text-white">
          Free <Amount value={free} decimalPlaces={0} />
        </span>
      </div>
    </section>
  );
};

export default PaylaterNetwork;
